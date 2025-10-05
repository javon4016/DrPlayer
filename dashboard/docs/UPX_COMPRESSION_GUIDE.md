# UPX压缩优化指南

## 概述

UPX (Ultimate Packer for eXecutables) 是一个高性能的可执行文件压缩工具，可以将pkg生成的二进制文件体积减少50%-70%。

## 当前优化效果

- **原始pkg打包**: ~45.70 MB
- **pkg优化选项**: 预计减少10-20%
- **UPX压缩**: 预计额外减少50-70%
- **最终预期大小**: ~10-20 MB

## UPX安装

### Windows

1. **下载UPX**
   - 访问 https://upx.github.io/
   - 下载最新版本的Windows版本
   - 解压到任意目录（如 `C:\tools\upx`）

2. **添加到PATH环境变量**
   ```cmd
   # 方法1: 通过系统设置
   # 控制面板 > 系统 > 高级系统设置 > 环境变量
   # 在PATH中添加UPX解压目录
   
   # 方法2: 通过PowerShell临时添加
   $env:PATH += ";C:\tools\upx"
   ```

3. **验证安装**
   ```cmd
   upx --version
   ```

### 使用Chocolatey安装（推荐）

```powershell
# 安装Chocolatey（如果未安装）
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# 安装UPX
choco install upx
```

### 使用Scoop安装

```powershell
# 安装Scoop（如果未安装）
iwr -useb get.scoop.sh | iex

# 安装UPX
scoop install upx
```

## 使用方法

### 1. 基础优化构建

```bash
# 使用pkg内置优化选项
pnpm build:binary:optimized
```

### 2. 手动UPX压缩

```bash
# 先进行常规构建
pnpm build:binary

# 然后手动压缩
upx --best dist-binary/drplayer-server-win.exe
```

### 3. 不同压缩级别

```bash
# 快速压缩（压缩率较低，速度快）
upx --fast dist-binary/drplayer-server-win.exe

# 更好的压缩（平衡压缩率和速度）
upx --better dist-binary/drplayer-server-win.exe

# 最佳压缩（压缩率最高，速度慢）
upx --best dist-binary/drplayer-server-win.exe

# 极限压缩（尝试所有方法，非常慢）
upx --best --ultra-brute dist-binary/drplayer-server-win.exe
```

## PKG优化选项说明

### 1. 压缩选项
- `--compress Brotli`: 使用Brotli算法压缩文件存储
- `--compress GZip`: 使用GZip算法压缩（兼容性更好）

### 2. 公共包选项
- `--public-packages "*"`: 将所有包标记为公共，减少重复代码
- `--public`: 加速打包并公开顶级项目源码

### 3. 字节码选项
- `--no-bytecode`: 跳过字节码生成，包含源文件作为纯JS
- 优点：减少体积，加快打包速度
- 缺点：源码可见（如果这是问题的话）

### 4. Node.js选项
- `--options "max-old-space-size=512"`: 限制内存使用
- `--options "expose-gc"`: 暴露垃圾回收接口

## 性能影响

### UPX压缩的影响
- **启动时间**: 增加200-400ms（解压缩时间）
- **运行时性能**: 无影响（解压后在内存中运行）
- **内存使用**: 无额外开销

### 优化建议
1. **开发环境**: 使用常规构建（快速）
2. **测试环境**: 使用pkg优化选项
3. **生产环境**: 使用完整优化（pkg + UPX）

## 故障排除

### UPX压缩失败
```bash
# 如果UPX压缩失败，可能的原因：
# 1. 文件被杀毒软件锁定
# 2. 文件正在使用中
# 3. 文件格式不支持

# 解决方案：
# 1. 临时关闭杀毒软件
# 2. 确保没有运行该程序
# 3. 使用 --force 选项强制压缩
upx --best --force dist-binary/drplayer-server-win.exe
```

### 压缩后程序无法运行
```bash
# 如果压缩后程序无法运行：
# 1. 尝试解压缩
upx -d dist-binary/drplayer-server-win.exe

# 2. 使用较低的压缩级别
upx --fast dist-binary/drplayer-server-win.exe

# 3. 检查是否与杀毒软件冲突
```

## 自动化脚本配置

在 `build-binary-optimized.js` 中可以调整以下配置：

```javascript
const config = {
  pkg: {
    compress: 'Brotli',        // 'Brotli' | 'GZip' | null
    publicPackages: '*',       // '*' | 'package1,package2' | null
    noBytecode: true,          // true | false
    options: 'max-old-space-size=512' // Node.js选项
  },
  upx: {
    enabled: true,             // 是否启用UPX压缩
    level: 'best',             // 'fast' | 'better' | 'best'
    backup: true               // 是否保留原始文件备份
  }
};
```

## 最佳实践

1. **渐进式优化**: 先应用pkg优化，再考虑UPX
2. **测试兼容性**: 在目标环境中测试压缩后的程序
3. **备份原文件**: 始终保留未压缩的版本作为备份
4. **监控性能**: 测量启动时间影响是否可接受
5. **CI/CD集成**: 在构建流水线中自动化压缩过程

## 预期效果

| 优化方案 | 文件大小 | 压缩率 | 启动时间影响 |
|---------|---------|--------|-------------|
| 原始pkg | 45.70 MB | - | 基准 |
| pkg优化 | ~36-40 MB | 10-20% | 无 |
| pkg+UPX | ~10-20 MB | 50-70% | +200-400ms |

通过这些优化，你的二进制文件大小可以从45MB+减少到10-20MB，大幅降低分发成本和下载时间。