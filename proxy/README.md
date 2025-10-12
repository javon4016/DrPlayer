# 代理服务器优化版本

## 🚀 优化内容

### 内存泄漏问题解决

1. **连接池管理**
   - 实现了全局HTTP客户端单例，避免重复创建
   - 配置连接池限制：最大100个连接，保持20个活跃连接
   - 设置连接过期时间：30秒自动清理空闲连接

2. **资源自动释放**
   - 自定义`ProxyStreamingResponse`确保流式响应正确关闭
   - 实现`stream_response_with_cleanup`自动清理响应资源
   - 应用生命周期管理，启动和关闭时正确初始化和清理资源

3. **内存监控系统**
   - 实时监控内存使用情况（每30秒检查一次）
   - 内存使用超过500MB时自动触发清理
   - 内存使用超过400MB时执行轻量级垃圾回收
   - 提供手动清理接口：`POST /admin/cleanup`

4. **超时和错误处理**
   - 连接超时：10秒
   - 读取超时：60秒
   - 写入超时：10秒
   - 连接池超时：5秒
   - 详细的错误分类和处理

## 📊 性能提升

- **内存使用优化**：解决了无限内存增长问题
- **连接复用**：减少连接建立开销
- **自动清理**：防止资源泄漏
- **监控告警**：实时掌握服务器状态

## 🛠️ 安装和使用

### 1. 安装依赖

```bash
cd proxy
pip install -r requirements.txt
```

### 2. 启动服务器

#### 方式一：直接启动
```bash
python proxy.py
```

#### 方式二：使用启动脚本（推荐）
```bash
python start_proxy.py --host 0.0.0.0 --port 8000
```

#### 方式三：使用环境变量配置
```bash
export PROXY_HOST=0.0.0.0
export PROXY_PORT=8000
export PROXY_MAX_MEMORY_USAGE=300
python proxy.py
```

### 3. 健康检查

访问 `http://localhost:8000/health` 查看服务器状态和内存使用情况。

### 4. 手动清理内存

```bash
curl -X POST http://localhost:8000/admin/cleanup
```

## ⚙️ 配置选项

### 环境变量配置

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `PROXY_HOST` | 0.0.0.0 | 绑定主机地址 |
| `PROXY_PORT` | 8000 | 绑定端口 |
| `PROXY_MAX_CONNECTIONS` | 100 | 最大连接数 |
| `PROXY_MAX_KEEPALIVE_CONNECTIONS` | 20 | 最大保持连接数 |
| `PROXY_KEEPALIVE_EXPIRY` | 30.0 | 连接保持时间（秒） |
| `PROXY_CONNECT_TIMEOUT` | 10.0 | 连接超时（秒） |
| `PROXY_READ_TIMEOUT` | 60.0 | 读取超时（秒） |
| `PROXY_WRITE_TIMEOUT` | 10.0 | 写入超时（秒） |
| `PROXY_MEMORY_CHECK_INTERVAL` | 30 | 内存检查间隔（秒） |
| `PROXY_MAX_MEMORY_USAGE` | 500 | 最大内存使用（MB） |
| `PROXY_CLEANUP_THRESHOLD` | 400 | 清理阈值（MB） |

### 配置文件

创建 `proxy_config.json` 文件：

```json
{
  "host": "0.0.0.0",
  "port": 8000,
  "max_connections": 100,
  "max_keepalive_connections": 20,
  "keepalive_expiry": 30.0,
  "connect_timeout": 10.0,
  "read_timeout": 60.0,
  "write_timeout": 10.0,
  "memory_check_interval": 30,
  "max_memory_usage": 500,
  "cleanup_threshold": 400
}
```

## 📈 监控和日志

### 日志文件

服务器运行日志保存在 `proxy.log` 文件中，包含：
- 请求日志
- 内存使用情况
- 错误信息
- 清理操作记录

### 监控接口

- `GET /health` - 健康检查和内存使用情况
- `POST /admin/cleanup` - 手动触发内存清理

### 示例监控脚本

```bash
#!/bin/bash
# monitor.sh - 监控脚本示例

while true; do
    response=$(curl -s http://localhost:8000/health)
    memory=$(echo $response | jq -r '.memory_usage_mb')
    
    echo "$(date): 内存使用 ${memory}MB"
    
    if (( $(echo "$memory > 400" | bc -l) )); then
        echo "内存使用过高，触发清理..."
        curl -X POST http://localhost:8000/admin/cleanup
    fi
    
    sleep 60
done
```

## 🔧 故障排除

### 常见问题

1. **内存使用仍然很高**
   - 检查 `PROXY_MAX_MEMORY_USAGE` 和 `PROXY_CLEANUP_THRESHOLD` 设置
   - 查看日志文件确认清理操作是否正常执行
   - 考虑降低 `PROXY_MAX_CONNECTIONS` 值

2. **连接超时**
   - 调整 `PROXY_CONNECT_TIMEOUT` 和 `PROXY_READ_TIMEOUT`
   - 检查目标服务器的响应时间

3. **服务器无响应**
   - 检查端口是否被占用
   - 查看日志文件中的错误信息
   - 尝试重启服务器

### 性能调优建议

1. **根据服务器配置调整连接数**：
   - 低配置服务器：`MAX_CONNECTIONS=50`
   - 高配置服务器：`MAX_CONNECTIONS=200`

2. **根据网络环境调整超时**：
   - 内网环境：较短的超时时间
   - 外网环境：较长的超时时间

3. **根据内存大小调整阈值**：
   - 小内存服务器：降低 `MAX_MEMORY_USAGE`
   - 大内存服务器：可以适当提高阈值

## 📝 更新日志

### v2.0.0 (当前版本)
- ✅ 解决内存泄漏问题
- ✅ 添加连接池管理
- ✅ 实现内存监控系统
- ✅ 优化资源释放机制
- ✅ 添加健康检查接口
- ✅ 完善错误处理
- ✅ 添加配置管理

### v1.0.0 (原始版本)
- ❌ 存在内存泄漏问题
- ❌ 缺乏资源管理
- ❌ 无监控机制