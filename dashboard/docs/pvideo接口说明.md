# MediaTool 参数说明和示例

## 1. 命令行支持的参数

### 可通过命令行传递的参数

| 参数 | 命令行标志 | 默认值 | 说明 | 示例 |
|------|------------|--------|------|------|
| config | `-config` | `"config.json"` | 配置文件路径 | `./pvideo -config myconfig.json` |
| port | `-port` | `"2525"` | 服务器端口 | `./pvideo -port 8080` |
| site | `-site` | `""` | 反代域名 | `./pvideo -site https://mydomain.com` |
| proxy | `-proxy` | `""` | 代理地址 | `./pvideo -proxy socks5://127.0.0.1:1080` |
| debug | `-debug` | `false` | 调试模式 | `./pvideo -debug` |
| dns | `-dns` | `""` | DNS服务器 | `./pvideo -dns 8.8.8.8` |

### 只能通过配置文件设置的参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| localUrl | string | `""` | 本地服务URL，用于生成代理链接 |
| connect | int64 | `32` | 最大并发连接数 |
| ssl | object | `null` | SSL证书配置（cert, key） |

### 命令行使用示例

```bash
# 基本启动
./pvideo

# 指定端口和调试模式
./pvideo -port 8080 -debug

# 使用SOCKS5代理
./pvideo -proxy socks5://127.0.0.1:1080 -dns 8.8.8.8

# 完整参数示例
./pvideo -config config.json -port 7777 -site https://mydomain.com -proxy http://proxy.example.com:8080 -debug -dns 8.8.8.8
```

## 2. 多线程代理参数和示例

### 多线程代理支持的URL参数

| 参数 | 必需 | 说明 | 示例值 |
|------|------|------|--------|
| url | ✅ | 目标文件URL | `https://example.com/video.mp4` |
| form | ❌ | 编码格式 | `base64`（URL和header使用base64编码） |
| header | ❌ | 自定义请求头 | JSON格式的请求头 |
| thread | ❌ | 线程数 | `4`（默认根据文件大小自动计算） |
| size | ❌ | 分块大小 | `128K`（默认）, `256K`, `1M`, `2M`, `512B`, `1024` |
| limit | ❌ | 限制条件 | `30S`（时间限制）, `100C`（次数限制） |
| single | ❌ | 单线程模式 | `true`, `false` |
| mark | ❌ | 缓存标记 | 自定义缓存标识 |

### 多线程代理使用示例（也可以不需要带proxy路径：http://localhost:7777?url=https://example.com/video.mp4）

#### 基本用法
```
http://localhost:7777/proxy?url=https://example.com/video.mp4
```

#### 自定义线程数和分块大小
```
http://localhost:7777/proxy?url=https://example.com/video.mp4&thread=8&size=256K
```

#### 使用自定义请求头
```
http://localhost:7777/proxy?url=https://example.com/video.mp4&header={"User-Agent":"Custom-Agent","Referer":"https://example.com"}
```

#### 使用base64编码（避免URL编码问题）
```
http://localhost:7777/proxy?url=aHR0cHM6Ly9leGFtcGxlLmNvbS92aWRlby5tcDQ=&form=base64&header=eyJVc2VyLUFnZW50IjoiQ3VzdG9tLUFnZW50In0=
```

#### 设置时间限制（30秒后重新获取真实URL）
```
http://localhost:7777/proxy?url=https://example.com/video.mp4&limit=30S
```

#### 设置次数限制（100次请求后重新获取真实URL）
```
http://localhost:7777/proxy?url=https://example.com/video.mp4&limit=100C
```

#### 单线程模式（适用于例如网页请求）
```
http://localhost:7777/proxy?single=true&url=https://example.com/small-file.jpg
```

#### 使用缓存标记（mark参数）
```
# 任务1：普通下载
http://localhost:7777/proxy?url=https://example.com/video.mp4&mark=normal_download

# 任务2：带认证的下载（相同URL，不同处理方式）
http://localhost:7777/proxy?url=https://example.com/video.mp4&mark=auth_download&header={"Authorization":"Bearer token123"}

# 任务3：移动端下载（相同URL，不同User-Agent）
http://localhost:7777/proxy?url=https://example.com/video.mp4&mark=mobile_download&header={"User-Agent":"Mobile-App/1.0"}
```

### 缓存标记（mark）说明

`mark` 参数是一个**缓存标识符**，用于区分和管理不同的下载任务：

**主要作用**：
1. **缓存隔离**: 相同URL的不同任务使用独立缓存
2. **连接复用**: 相同mark的请求复用HTTP连接
3. **任务标识**: 便于调试和日志追踪

**使用场景**：

#### 场景1: 相同文件的不同下载方式
```
# 高清版本
http://localhost:7777/proxy?url=https://cdn.example.com/video.mp4&mark=hd_version&size=1M

# 标清版本（相同URL，不同处理参数）
http://localhost:7777/proxy?url=https://cdn.example.com/video.mp4&mark=sd_version&size=256K
```

#### 场景2: 不同用户的相同资源
```
# 用户A下载
http://localhost:7777/proxy?url=https://example.com/file.zip&mark=user_a&header={"Cookie":"session=abc123"}

# 用户B下载
http://localhost:7777/proxy?url=https://example.com/file.zip&mark=user_b&header={"Cookie":"session=def456"}
```

#### 场景3: 不同平台的相同内容
```
# PC端下载
http://localhost:7777/proxy?url=https://example.com/app.apk&mark=pc_client

# 移动端下载
http://localhost:7777/proxy?url=https://example.com/app.apk&mark=mobile_client
```

**默认行为**：
- 如果不指定 `mark` 参数，系统会使用完整的 `url` 作为缓存标记
- 建议在有多种下载需求时主动设置 `mark` 参数



## 3. M3U8参数和示例

### M3U8支持的URL参数

| 参数 | 必需 | 说明 | 示例值 |
|------|------|------|--------|
| url | ✅ | M3U8播放列表URL | `https://example.com/playlist.m3u8` |
| form | ❌ | 编码格式 | `base64`（URL和header使用base64编码） |
| header | ❌ | 自定义请求头 | JSON格式的请求头 |
| type | ❌ | 文件类型标识 | `m3u8` |

### M3U8使用示例

#### 基本用法
```
http://localhost:7777/m3u8?url=https://example.com/playlist.m3u8
```

#### 使用自定义请求头
```
http://localhost:7777/m3u8?url=https://example.com/playlist.m3u8&header={"User-Agent":"Mozilla/5.0","Referer":"https://example.com"}
```

#### 使用base64编码
```
http://localhost:7777/m3u8?url=aHR0cHM6Ly9leGFtcGxlLmNvbS9wbGF5bGlzdC5tM3U4&form=base64&header=eyJVc2VyLUFnZW50IjoiTW96aWxsYS81LjAifQ==
```

#### 指定类型标识
```
http://localhost:7777/m3u8?url=https://example.com/playlist.m3u8&type=m3u8
```

### M3U8处理说明

1. **自动转换**: M3U8文件中的相对路径会自动转换为完整URL
2. **代理重写**: 所有媒体文件URL会被重写为通过本地代理访问
3. **嵌套支持**: 支持嵌套的M3U8文件（主播放列表包含子播放列表）
4. **加密支持**: 支持AES加密的M3U8流，密钥URL也会被代理
5. **Base64编码**: 当使用`form=base64`时，输出的代理URL也会使用base64编码
