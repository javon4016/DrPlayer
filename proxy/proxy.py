import asyncio
import gc
import logging
import psutil
import time
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, Request, HTTPException, UploadFile
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import httpx

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 全局配置
class ProxyConfig:
    # 连接池配置
    MAX_CONNECTIONS = 100  # 最大连接数
    MAX_KEEPALIVE_CONNECTIONS = 20  # 最大保持连接数
    KEEPALIVE_EXPIRY = 30.0  # 连接保持时间（秒）
    
    # 超时配置
    CONNECT_TIMEOUT = 10.0  # 连接超时
    READ_TIMEOUT = 60.0     # 读取超时
    WRITE_TIMEOUT = 10.0    # 写入超时
    POOL_TIMEOUT = 5.0      # 连接池超时
    
    # 内存监控配置
    MEMORY_CHECK_INTERVAL = 30  # 内存检查间隔（秒）
    MAX_MEMORY_USAGE = 500      # 最大内存使用（MB）
    CLEANUP_THRESHOLD = 400     # 清理阈值（MB）

# 全局变量
http_client: Optional[httpx.AsyncClient] = None
memory_monitor_task: Optional[asyncio.Task] = None

class MemoryMonitor:
    """内存监控器"""
    
    @staticmethod
    def get_memory_usage() -> float:
        """获取当前进程内存使用量（MB）"""
        process = psutil.Process()
        return process.memory_info().rss / 1024 / 1024
    
    @staticmethod
    async def cleanup_resources():
        """清理资源"""
        logger.info("开始清理资源...")
        
        # 强制垃圾回收
        collected = gc.collect()
        logger.info(f"垃圾回收清理了 {collected} 个对象")
        
        # 如果内存使用仍然过高，重新创建HTTP客户端
        current_memory = MemoryMonitor.get_memory_usage()
        if current_memory > ProxyConfig.CLEANUP_THRESHOLD:
            await recreate_http_client()
            logger.info("重新创建HTTP客户端以释放内存")
    
    @staticmethod
    async def monitor_memory():
        """内存监控循环"""
        while True:
            try:
                current_memory = MemoryMonitor.get_memory_usage()
                logger.info(f"当前内存使用: {current_memory:.2f} MB")
                
                if current_memory > ProxyConfig.MAX_MEMORY_USAGE:
                    logger.warning(f"内存使用过高: {current_memory:.2f} MB，开始清理")
                    await MemoryMonitor.cleanup_resources()
                elif current_memory > ProxyConfig.CLEANUP_THRESHOLD:
                    logger.info("内存使用接近阈值，执行轻量级清理")
                    gc.collect()
                
                await asyncio.sleep(ProxyConfig.MEMORY_CHECK_INTERVAL)
            except Exception as e:
                logger.error(f"内存监控出错: {e}")
                await asyncio.sleep(ProxyConfig.MEMORY_CHECK_INTERVAL)

async def create_http_client() -> httpx.AsyncClient:
    """创建HTTP客户端"""
    limits = httpx.Limits(
        max_connections=ProxyConfig.MAX_CONNECTIONS,
        max_keepalive_connections=ProxyConfig.MAX_KEEPALIVE_CONNECTIONS,
        keepalive_expiry=ProxyConfig.KEEPALIVE_EXPIRY
    )
    
    timeout = httpx.Timeout(
        connect=ProxyConfig.CONNECT_TIMEOUT,
        read=ProxyConfig.READ_TIMEOUT,
        write=ProxyConfig.WRITE_TIMEOUT,
        pool=ProxyConfig.POOL_TIMEOUT
    )
    
    return httpx.AsyncClient(
        limits=limits,
        timeout=timeout,
        follow_redirects=True,
        verify=False  # 忽略SSL验证，避免某些网站的证书问题
    )

async def recreate_http_client():
    """重新创建HTTP客户端"""
    global http_client
    
    if http_client:
        await http_client.aclose()
        logger.info("已关闭旧的HTTP客户端")
    
    http_client = await create_http_client()
    logger.info("已创建新的HTTP客户端")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    global http_client, memory_monitor_task
    
    # 启动时初始化
    logger.info("正在启动代理服务器...")
    http_client = await create_http_client()
    
    # 启动内存监控
    memory_monitor_task = asyncio.create_task(MemoryMonitor.monitor_memory())
    logger.info("内存监控已启动")
    
    yield
    
    # 关闭时清理
    logger.info("正在关闭代理服务器...")
    
    if memory_monitor_task:
        memory_monitor_task.cancel()
        try:
            await memory_monitor_task
        except asyncio.CancelledError:
            pass
    
    if http_client:
        await http_client.aclose()
        logger.info("HTTP客户端已关闭")

# 创建FastAPI应用
app = FastAPI(lifespan=lifespan)

# 设置跨域支持
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ProxyStreamingResponse(StreamingResponse):
    """自定义流式响应，确保资源正确释放"""
    
    def __init__(self, content, **kwargs):
        super().__init__(content, **kwargs)
        self._content_consumed = False
    
    async def __call__(self, scope, receive, send):
        try:
            await super().__call__(scope, receive, send)
        finally:
            # 确保内容被完全消费
            if hasattr(self, 'body_iterator') and not self._content_consumed:
                try:
                    async for _ in self.body_iterator:
                        pass
                except Exception:
                    pass
                self._content_consumed = True

async def stream_response_with_cleanup(response: httpx.Response):
    """带清理功能的流式响应生成器"""
    try:
        async for chunk in response.aiter_bytes(chunk_size=8192):
            yield chunk
    except Exception as e:
        logger.error(f"流式传输出错: {e}")
        raise
    finally:
        # 确保响应被正确关闭
        if not response.is_closed:
            await response.aclose()

@app.api_route('/proxy/{full_url:path}', methods=['GET', 'POST', 'PUT', 'DELETE'])
async def proxy(request: Request, full_url: str):
    """代理请求处理"""
    global http_client
    
    if not http_client:
        raise HTTPException(status_code=503, detail="HTTP客户端未初始化")
    
    target_url = full_url if full_url.startswith("http") else f"http://{full_url}"
    
    # 记录请求信息
    logger.info(f"代理请求: {request.method} {target_url}")
    
    try:
        # 准备请求头（移除可能导致问题的头部）
        headers = dict(request.headers)
        headers.pop('host', None)
        headers.pop('content-length', None)
        
        response = None
        
        # 处理不同的HTTP方法
        if request.method == "GET":
            response = await http_client.get(
                target_url, 
                headers=headers, 
                params=request.query_params
            )
        
        elif request.method == "POST":
            content_type = request.headers.get('content-type', '')
            
            if 'application/json' in content_type:
                json_data = await request.json()
                response = await http_client.post(
                    target_url, 
                    json=json_data, 
                    headers=headers
                )
            elif 'application/x-www-form-urlencoded' in content_type:
                form_data = dict(await request.form())
                response = await http_client.post(
                    target_url, 
                    data=form_data, 
                    headers=headers
                )
            elif 'multipart/form-data' in content_type:
                form = await request.form()
                files = {}
                fields = {}
                
                for key in form:
                    if isinstance(form[key], UploadFile):
                        files[key] = (form[key].filename, await form[key].read())
                    else:
                        fields[key] = form[key]
                
                response = await http_client.post(
                    target_url, 
                    data=fields, 
                    files=files, 
                    headers=headers
                )
            else:
                # 处理原始数据
                body = await request.body()
                response = await http_client.post(
                    target_url, 
                    content=body, 
                    headers=headers
                )
        
        elif request.method == "PUT":
            body = await request.body()
            response = await http_client.put(
                target_url, 
                content=body, 
                headers=headers
            )
        
        elif request.method == "DELETE":
            response = await http_client.delete(
                target_url, 
                headers=headers
            )
        
        else:
            raise HTTPException(status_code=405, detail="不支持的HTTP方法")
        
        # 准备响应头
        response_headers = dict(response.headers)
        # 移除可能导致问题的响应头
        response_headers.pop('content-encoding', None)
        response_headers.pop('transfer-encoding', None)
        
        # 返回流式响应
        return ProxyStreamingResponse(
            stream_response_with_cleanup(response),
            status_code=response.status_code,
            headers=response_headers,
            media_type=response_headers.get('content-type', 'application/octet-stream')
        )
        
    except httpx.TimeoutException:
        logger.error(f"请求超时: {target_url}")
        raise HTTPException(status_code=504, detail="请求超时")
    except httpx.ConnectError:
        logger.error(f"连接失败: {target_url}")
        raise HTTPException(status_code=502, detail="无法连接到目标服务器")
    except httpx.RequestError as e:
        logger.error(f"请求错误: {e}")
        raise HTTPException(status_code=500, detail=f"请求失败: {str(e)}")
    except Exception as e:
        logger.error(f"未知错误: {e}")
        raise HTTPException(status_code=500, detail=f"服务器内部错误: {str(e)}")

@app.get("/health")
async def health_check():
    """健康检查端点"""
    memory_usage = MemoryMonitor.get_memory_usage()
    return {
        "status": "healthy",
        "memory_usage_mb": round(memory_usage, 2),
        "timestamp": time.time()
    }

@app.post("/admin/cleanup")
async def manual_cleanup():
    """手动触发清理"""
    await MemoryMonitor.cleanup_resources()
    memory_usage = MemoryMonitor.get_memory_usage()
    return {
        "message": "清理完成",
        "memory_usage_mb": round(memory_usage, 2)
    }

if __name__ == "__main__":
    import uvicorn
    
    # 启动服务器
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=8000,
        log_level="info",
        access_log=True
    )
