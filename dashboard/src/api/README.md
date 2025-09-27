# API 封装使用说明

本项目已将所有API调用封装为统一的服务模块，便于维护和使用。

## 目录结构

```
src/api/
├── index.js          # 统一入口文件
├── config.js         # API配置和常量
├── request.js        # Axios封装和拦截器
├── modules/          # 基础API模块
│   ├── module.js     # T4模块数据接口
│   ├── proxy.js      # 模块代理接口
│   └── parse.js      # 解析接口
├── services/         # 业务服务层
│   ├── index.js      # 服务统一入口
│   ├── video.js      # 视频相关业务逻辑
│   └── site.js       # 站点管理业务逻辑
├── utils/            # 工具函数
│   └── index.js      # 数据处理和验证工具
└── types/            # 数据类型定义
    └── index.js      # 类型定义和工厂函数
```

## 快速开始

### 1. 导入服务

```javascript
// 导入所有服务
import { videoService, siteService } from '@/api/services'

// 或者单独导入
import { videoService } from '@/api/services/video'
import { siteService } from '@/api/services/site'
```

### 2. 站点管理

```javascript
// 获取所有站点
const sites = siteService.getAllSites()

// 设置当前站点
siteService.setCurrentSite('site_key')

// 获取当前站点
const currentSite = siteService.getCurrentSite()

// 添加新站点
siteService.addSite({
  key: 'new_site',
  name: '新站点',
  api: 'https://api.example.com',
  ext: 'some_extension'
})
```

### 3. 视频数据获取

```javascript
// 获取推荐视频
const homeData = await videoService.getRecommendVideos('site_key', {
  extend: 'extension_data'
})

// 获取分类视频
const categoryData = await videoService.getCategoryVideos('site_key', {
  t: 'category_id',
  pg: 1,
  extend: 'extension_data'
})

// 搜索视频
const searchResult = await videoService.searchVideo('site_key', {
  wd: '搜索关键词',
  pg: 1,
  extend: 'extension_data'
})

// 获取视频详情
const videoDetail = await videoService.getVideoDetails('site_key', {
  ids: 'video_id',
  extend: 'extension_data'
})

// 获取播放地址
const playData = await videoService.getPlayUrl('site_key', {
  play: 'play_data',
  extend: 'extension_data'
})
```

### 4. 视频解析

```javascript
// 解析视频URL
const parseResult = await videoService.parseVideoUrl('jx_key', {
  url: 'video_url'
})
```

## 在Vue组件中使用

### 基本用法

```vue
<template>
  <div>
    <div v-for="video in videos" :key="video.vod_id">
      {{ video.vod_name }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { videoService, siteService } from '@/api/services'

const videos = ref([])

const loadVideos = async () => {
  try {
    const currentSite = siteService.getCurrentSite()
    if (!currentSite) {
      console.error('未选择数据源')
      return
    }

    const result = await videoService.getRecommendVideos(currentSite.key, {
      extend: currentSite.ext
    })
    
    videos.value = result.videos || []
  } catch (error) {
    console.error('加载视频失败:', error)
  }
}

onMounted(() => {
  loadVideos()
})
</script>
```

### 错误处理

所有API调用都包含了错误处理，会返回统一的错误格式：

```javascript
try {
  const result = await videoService.getRecommendVideos('site_key')
} catch (error) {
  // error.code - 错误代码
  // error.message - 错误信息
  // error.data - 额外错误数据
  console.error('API调用失败:', error.message)
}
```

### 缓存机制

视频服务包含5分钟的缓存机制，相同的请求在5分钟内会返回缓存结果，提高性能。

## 配置说明

### API配置 (config.js)

```javascript
// 基础配置
export const BASE_URL = process.env.VUE_APP_API_BASE_URL || ''
export const TIMEOUT = 10000

// API路径
export const API_PATHS = {
  MODULE: '/api',      // T4模块接口
  PROXY: '/proxy',     // 代理接口  
  PARSE: '/parse'      // 解析接口
}
```

### 请求拦截器

请求会自动添加：
- Authorization token（如果存在）
- Cache-Control: no-cache
- 统一的错误处理

## 迁移指南

### 从旧的req方式迁移

**旧方式：**
```javascript
import req from '@/utils/req'

// 获取数据
const response = await req.get('/home')
const data = response.data
```

**新方式：**
```javascript
import { videoService, siteService } from '@/api/services'

// 获取数据
const currentSite = siteService.getCurrentSite()
const data = await videoService.getRecommendVideos(currentSite.key, {
  extend: currentSite.ext
})
```

### 主要变化

1. **统一的服务接口**：不再直接调用HTTP方法，而是调用语义化的业务方法
2. **自动错误处理**：统一的错误格式和处理机制
3. **数据格式化**：返回的数据已经过格式化处理
4. **缓存支持**：自动缓存机制提高性能
5. **类型安全**：完整的类型定义和验证

## 注意事项

1. 所有API调用都需要先设置当前站点
2. 确保传入正确的extend参数
3. 处理好异步操作的错误情况
4. 合理使用缓存机制，避免频繁请求