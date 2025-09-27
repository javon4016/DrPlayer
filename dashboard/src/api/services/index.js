/**
 * 业务服务统一入口
 * 导出所有业务服务模块
 */

import videoService from './video'
import siteService from './site'

// 导出所有服务
export {
  videoService,
  siteService
}

// 默认导出服务集合
export default {
  video: videoService,
  site: siteService
}