#!/usr/bin/env python3
"""
代理服务器启动脚本
提供配置管理和监控功能
"""

import argparse
import asyncio
import logging
import signal
import sys
from pathlib import Path

import uvicorn

# 添加当前目录到Python路径
sys.path.insert(0, str(Path(__file__).parent))

from proxy import app, MemoryMonitor

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('proxy.log')
    ]
)

logger = logging.getLogger(__name__)

class ProxyServer:
    """代理服务器管理器"""
    
    def __init__(self, host="0.0.0.0", port=8000, workers=1):
        self.host = host
        self.port = port
        self.workers = workers
        self.server = None
        
    async def start(self):
        """启动服务器"""
        logger.info(f"启动代理服务器: {self.host}:{self.port}")
        
        config = uvicorn.Config(
            app,
            host=self.host,
            port=self.port,
            workers=self.workers,
            log_level="info",
            access_log=True,
            reload=False
        )
        
        self.server = uvicorn.Server(config)
        
        # 设置信号处理
        signal.signal(signal.SIGINT, self._signal_handler)
        signal.signal(signal.SIGTERM, self._signal_handler)
        
        try:
            await self.server.serve()
        except KeyboardInterrupt:
            logger.info("收到中断信号，正在关闭服务器...")
        except Exception as e:
            logger.error(f"服务器启动失败: {e}")
            raise
    
    def _signal_handler(self, signum, frame):
        """信号处理器"""
        logger.info(f"收到信号 {signum}，准备关闭服务器...")
        if self.server:
            self.server.should_exit = True
    
    async def stop(self):
        """停止服务器"""
        if self.server:
            self.server.should_exit = True
            logger.info("服务器已停止")

def main():
    """主函数"""
    parser = argparse.ArgumentParser(description="代理服务器")
    parser.add_argument("--host", default="0.0.0.0", help="绑定主机地址")
    parser.add_argument("--port", type=int, default=8000, help="绑定端口")
    parser.add_argument("--workers", type=int, default=1, help="工作进程数")
    parser.add_argument("--debug", action="store_true", help="启用调试模式")
    
    args = parser.parse_args()
    
    if args.debug:
        logging.getLogger().setLevel(logging.DEBUG)
    
    # 创建并启动服务器
    server = ProxyServer(args.host, args.port, args.workers)
    
    try:
        asyncio.run(server.start())
    except KeyboardInterrupt:
        logger.info("服务器已停止")
    except Exception as e:
        logger.error(f"服务器运行出错: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()