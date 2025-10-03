# 🎬 DrPlayer - 新一代智能视频播放器

<div align="center">

![DrPlayer Logo](https://img.shields.io/badge/DrPlayer-2.0-blue?style=for-the-badge&logo=play&logoColor=white)
[![Vue 3](https://img.shields.io/badge/Vue-3.x-4FC08D?style=for-the-badge&logo=vue.js&logoColor=white)](https://vuejs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

**一款功能强大、智能化的现代视频播放器，支持多格式播放、智能跳过、直播功能等特色功能**

[🚀 在线演示](https://drplayer.playdreamer.cn/) | [📖 文档](https://hipy.playdreamer.cn/) | [🐛 问题反馈](https://github.com/your-repo/issues)

</div>

## ✨ 核心特色

### 🎯 智能播放体验
- **🔄 双播放器引擎**：原生HTML5播放器 + ArtPlayer高级播放器，智能切换最佳播放方案
- **🎬 智能跳过功能**：可配置的片头片尾自动跳过，告别重复内容，直达精彩部分
- **⚡ 自动连播**：智能识别剧集，支持自动播放下一集，可自定义倒计时提醒
- **📍 断点续播**：自动记录播放进度，随时随地继续观看

### 🌐 强大的兼容性
- **📹 多格式支持**：完美支持 HLS (m3u8)、FLV、DASH (mpd)、MP4 等主流视频格式
- **🛡️ CSP绕过技术**：智能绕过内容安全策略限制，大幅提升视频播放成功率
- **🔍 智能格式检测**：自动识别视频格式并选择最佳播放策略
- **📱 响应式设计**：完美适配桌面端、平板和移动设备

### 📺 丰富的直播功能
- **🌍 海量直播源**：内置丰富的直播频道资源，包含4K频道、体育赛事、新闻资讯等
- **📋 智能分组管理**：支持频道分类管理，快速定位想看的内容
- **🔧 多格式解析**：支持 M3U8、M3U、TXT 等多种直播源格式

### ⚙️ 专业级功能
- **🎛️ 多倍速播放**：支持 0.5x - 5x 多档位播放速度调节
- **🎨 现代化UI**：基于 Arco Design 的精美界面设计
- **🔧 高度可配置**：丰富的设置选项，满足不同用户需求
- **🚀 性能优化**：基于 Vue 3 + Vite 的现代化架构，启动快速，运行流畅

## 🛠️ 技术栈

### 前端框架
- **Vue 3** - 渐进式 JavaScript 框架
- **Vite** - 下一代前端构建工具
- **Pinia** - Vue 3 状态管理库
- **Vue Router** - 官方路由管理器

### UI 组件库
- **Arco Design Vue** - 企业级设计语言和组件库
- **ECharts** - 数据可视化图表库

### 播放器技术
- **ArtPlayer** - 现代化 HTML5 播放器
- **HLS.js** - HLS 流媒体播放支持
- **FLV.js** - FLV 格式播放支持
- **Shaka Player** - DASH 流媒体播放支持

### 开发工具
- **TypeScript** - 类型安全的 JavaScript
- **ESLint** - 代码质量检查
- **Prettier** - 代码格式化工具

## 🚀 快速开始

### 环境要求
- Node.js >= 16.0.0
- pnpm >= 7.0.0 (推荐) 或 npm >= 8.0.0

### 安装依赖

```bash
# 使用 pnpm (推荐)
pnpm install

# 或使用 npm
npm install
```

### 开发环境

```bash
# 启动开发服务器
pnpm dev

# 或使用 npm
npm run dev
```

访问 `http://localhost:5173` 即可看到应用运行效果。

### 生产构建

```bash
# 构建生产版本
pnpm build

# 预览生产构建
pnpm preview
```

## 📦 部署指南

### Vercel 部署 (推荐)
1. Fork 本项目到你的 GitHub
2. 在 [Vercel](https://vercel.com) 中导入项目
3. 自动部署完成

### Nginx 部署
```bash
# 构建项目
pnpm build

# 将 dist 目录部署到 Nginx 服务器
# 配置 Nginx 支持 SPA 路由
```

详细部署教程请参考：[部署指南](https://juejin.cn/post/7301193497247727652)

### 解决刷新404问题
参考：[解决vercel项目刷新404问题](https://juejin.cn/post/7358336719165554740)

## 🎮 使用说明

### 基本播放
1. 在播放器中输入视频链接
2. 选择播放器类型（默认播放器 或 ArtPlayer）
3. 点击播放即可开始观看

### 智能跳过设置
1. 点击播放器设置按钮
2. 配置片头跳过时长（默认90秒）
3. 配置片尾跳过时长（默认90秒）
4. 保存设置后自动生效

### 直播功能
1. 点击直播选项卡
2. 选择频道分组
3. 点击频道即可开始观看直播

## 🔧 配置说明

### 播放器配置
```javascript
// 播放器选项配置
const playerOptions = {
  hls: {
    maxBufferLength: 600,
    liveSyncDurationCount: 10,
  },
  flv: {
    enableWorker: false,
    enableStashBuffer: false,
    autoCleanupSourceBuffer: true,
  }
}
```

### CSP 绕过配置
```javascript
// CSP绕过配置
export const CSP_BYPASS_CONFIG = {
  enabled: true,
  referrerPolicy: 'no-referrer',
  autoBypass: true,
  autoRetry: true
}
```

## 🤝 贡献指南

我们欢迎所有形式的贡献！请查看 [贡献指南](CONTRIBUTING.md) 了解详细信息。

### 开发流程
1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📄 许可证

本项目基于 MIT 许可证开源 - 查看 [LICENSE](LICENSE) 文件了解详细信息。

## 🙏 致谢

- [Vue.js](https://vuejs.org/) - 渐进式 JavaScript 框架
- [ArtPlayer](https://artplayer.org/) - 现代化 HTML5 播放器
- [Arco Design](https://arco.design/) - 企业级设计语言
- [Vite](https://vitejs.dev/) - 下一代前端构建工具

## 📞 联系我们

- 项目主页：[https://drplayer.playdreamer.cn/](https://drplayer.playdreamer.cn/)
- 文档站点：[https://hipy.playdreamer.cn/](https://hipy.playdreamer.cn/)
- 问题反馈：[GitHub Issues](https://github.com/your-repo/issues)

---

<div align="center">

**如果这个项目对你有帮助，请给它一个 ⭐️**

Made with ❤️ by DrPlayer Team

</div>

---

## 📚 原始开发笔记

以下是项目开发过程中的技术笔记和参考资料：

### 依赖安装记录
```shell
pnpm create vite
pnpm add primevue primeicons
pnpm add unplugin-vue-components
pnpm add @primevue/auto-import-resolver
pnpm add @primevue/themes
pnpm add primeflex

pnpm add vue-router
pnpm add pinia

pnpm remove primevue primeicons @primevue/auto-import-resolver primeflex @primevue/themes
pnpm add --save-dev @arco-design/web-vue
pnpm add json-server
pnpm add axios
```

### 技术参考
- [Vue 3 组合式 API 指南](https://juejin.cn/post/7387581121519812617)
- [Arco Design Vue 组件库](https://arco.design/vue/component/layout)

### 注意事项
- package.json 需要注意：如果有 `type:'module'` 需要删除
- json-server版本号只能 `^0.17.4`，不然不支持middleware

### 实用脚本
图标全选加购脚本：
```javascript
var span = document.querySelectorAll('.icon-cover');
for (var i = 0, len = span.length; i < len; i++) {
     console.log(span[i].querySelector('span').click());
}
```

### 部署相关
- [部署教程](https://juejin.cn/post/7301193497247727652)
- [解决vercel项目刷新404问题](https://juejin.cn/post/7358336719165554740)

### 演示地址
- 主站：[https://drplayer.playdreamer.cn/](https://drplayer.playdreamer.cn/)
- 文档：[https://hipy.playdreamer.cn/](https://hipy.playdreamer.cn/)

### AI 服务
[AI加量包购买](https://www.trae.ai/account-setting?purchase=1#usage)