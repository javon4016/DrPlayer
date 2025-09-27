/**
 * API模块统一入口
 * 提供所有业务接口的统一导出
 */

// 基础配置和工具
export { default as request } from './request'
export { default as config } from './config'

// 业务服务
export { default as siteService } from './services/site'
export { default as videoService } from './services/video'
export { default as configService } from './services/config'

// 业务接口模块
export { default as moduleApi } from './modules/module'
export { default as proxyApi } from './modules/proxy'
export { default as parseApi } from './modules/parse'

// 便捷导出常用接口
export {
  getHomeData,
  getCategoryData,
  getVideoDetail,
  searchVideos,
  refreshModule
} from './modules/module'

export {
  proxyRequest
} from './modules/proxy'

export {
  parseVideo
} from './modules/parse'