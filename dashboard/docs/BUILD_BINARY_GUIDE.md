# DrPlayer 二进制打包指南

## 概述

本指南介绍如何将 DrPlayer Dashboard 打包为跨平台的独立可执行文件。

## 主要改进

### 1. 端口配置优化
- **默认端口**: 从 8008 改为 9978
- **智能端口检测**: 如果端口被占用，自动尝试下一个端口 (9979, 9980, ...)
- **最大尝试次数**: 100个端口，确保能找到可用端口

### 2. PKG 兼容性优化
- **环境检测**: 自动检测是否在 PKG 环境中运行
- **路径处理**: PKG 环境中使用 `process.cwd()` 而非 `__dirname`
- **构建跳过**: PKG 环境中跳过前端构建步骤
- **错误处理**: PKG 环境中更宽松的错误处理

## 打包方法

### 方法一：使用自动化脚本 (推荐)

#### Windows PowerShell
```powershell
# 运行 PowerShell 脚本
pnpm run build:binary:win

# 或直接运行
powershell -ExecutionPolicy Bypass -File build-binary.ps1
```

#### Node.js 脚本 (跨平台)
```bash
# 运行 Node.js 脚本
pnpm run build:binary

# 或直接运行
node build-binary.js
```

### 方法二：手动打包

#### 1. 安装 PKG
```bash
npm install -g pkg
```

#### 2. 构建前端资源
```bash
pnpm build:fastify
```

#### 3. 打包指定平台
```bash
# Windows x64
pnpm run pkg:win

# Linux x64
pnpm run pkg:linux

# macOS x64
pnpm run pkg:macos

# 所有平台
pnpm run pkg:all
```

### 方法三：自定义打包
```bash
# 基本命令
pkg production-server.js --target node18-win-x64 --output drplayer-server.exe

# 带压缩
pkg production-server.js --target node18-win-x64 --output drplayer-server.exe --compress Brotli

# 多平台
pkg production-server.js --targets node18-win-x64,node18-linux-x64,node18-macos-x64
```

## 支持的平台

| 平台 | 架构 | 输出文件名 |
|------|------|------------|
| Windows | x64 | drplayer-server-win-x64.exe |
| Linux | x64 | drplayer-server-linux-x64 |
| macOS | x64 | drplayer-server-macos-x64 |
| macOS | ARM64 | drplayer-server-macos-arm64 |

## 输出文件结构

```
dist-binary/
├── drplayer-server-win-x64.exe      # Windows 可执行文件
├── drplayer-server-linux-x64        # Linux 可执行文件
├── drplayer-server-macos-x64        # macOS Intel 可执行文件
├── drplayer-server-macos-arm64      # macOS Apple Silicon 可执行文件
├── start-windows.bat                # Windows 启动脚本
├── start-linux.sh                   # Linux 启动脚本
├── start-macos.sh                   # macOS 启动脚本
└── README.md                        # 使用说明
```

## 使用方法

### Windows
```cmd
# 方法1: 双击运行
start-windows.bat

# 方法2: 直接运行
drplayer-server-win-x64.exe
```

### Linux
```bash
# 添加执行权限
chmod +x drplayer-server-linux-x64
chmod +x start-linux.sh

# 运行
./start-linux.sh
# 或
./drplayer-server-linux-x64
```

### macOS
```bash
# 添加执行权限
chmod +x drplayer-server-macos-x64
chmod +x start-macos.sh

# 运行
./start-macos.sh
# 或
./drplayer-server-macos-x64
```

## 访问地址

服务器启动后，访问地址为：
- **主页**: http://localhost:9978/
- **应用**: http://localhost:9978/apps/drplayer/
- **健康检查**: http://localhost:9978/health

如果端口 9978 被占用，服务器会自动尝试下一个可用端口。

## 注意事项

### 1. 文件依赖
- 二进制文件包含了所有 Node.js 依赖
- 静态文件（HTML、CSS、JS）需要在运行时存在
- 首次运行会在当前目录创建 `apps` 文件夹

### 2. 权限要求
- Linux/macOS 需要执行权限
- Windows 可能需要管理员权限（取决于安装位置）

### 3. 防火墙设置
- 确保防火墙允许对应端口的访问
- 默认绑定到 `0.0.0.0`，支持外部访问

### 4. 性能优化
- 使用 Brotli 压缩减小文件大小
- 二进制文件启动速度比 Node.js 脚本稍慢

## 故障排除

### 1. 端口占用
```
🔍 正在查找可用端口，起始端口: 9978
端口 9978 已被占用，尝试下一个端口...
端口 9979 已被占用，尝试下一个端口...
✅ 找到可用端口: 9980
```

### 2. 文件缺失
```
⚠️ dist目录不存在，跳过文件复制
📦 pkg环境中，请确保静态文件已正确打包
```

### 3. 构建失败
```
⚠️ 构建命令执行失败，可能是在打包环境中运行
📦 跳过构建步骤，使用预构建的文件
```

## 开发建议

### 1. 预构建资源
在打包前确保运行：
```bash
pnpm build:fastify
```

### 2. 测试环境
在不同平台测试二进制文件：
```bash
# 测试启动
./drplayer-server-linux-x64

# 测试健康检查
curl http://localhost:9978/health
```

### 3. 自动化部署
可以将打包脚本集成到 CI/CD 流程中：
```yaml
# GitHub Actions 示例
- name: Build Binary
  run: |
    npm install -g pkg
    pnpm build:fastify
    pnpm run pkg:all
```

## 版本信息

- **Node.js 版本**: 18
- **PKG 目标**: node18-*
- **压缩算法**: Brotli
- **默认端口**: 9978

## 更新日志

### v1.0.0
- 初始版本
- 支持跨平台打包
- 智能端口检测
- PKG 环境优化