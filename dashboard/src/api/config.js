/**
 * API配置文件
 * 定义接口相关的配置信息和常量
 */

/**
 * 获取API超时时间（毫秒）
 * 从设置中读取，如果没有设置则使用默认值30秒
 */
export const getApiTimeout = () => {
  try {
    const addressSettings = JSON.parse(localStorage.getItem('addressSettings') || '{}')
    const timeoutSeconds = addressSettings.apiTimeout || 30
    return timeoutSeconds * 1000 // 转换为毫秒
  } catch (error) {
    console.warn('Failed to get API timeout from settings, using default:', error)
    return 30000 // 默认30秒
  }
}

/**
 * 获取Action接口超时时间（毫秒）
 * Action接口通常需要更长的超时时间，默认100秒
 */
export const getActionTimeout = () => {
  try {
    const addressSettings = JSON.parse(localStorage.getItem('addressSettings') || '{}')
    const apiTimeoutSeconds = addressSettings.apiTimeout || 30
    // Action接口超时时间为普通接口的3倍，但最少100秒
    const actionTimeoutSeconds = Math.max(apiTimeoutSeconds * 3, 100)
    return actionTimeoutSeconds * 1000 // 转换为毫秒
  } catch (error) {
    console.warn('Failed to get Action timeout from settings, using default:', error)
    return 100000 // 默认100秒
  }
}

// 基础配置
export const API_CONFIG = {
  // 基础URL配置
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5707',
  
  // 超时配置（动态获取）
  get TIMEOUT() {
    return getApiTimeout()
  },
  
  // 请求头配置
  HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
}

// 接口路径常量
export const API_PATHS = {
  // 模块数据接口
  MODULE: '/api',
  
  // 代理接口
  PROXY: '/proxy',
  
  // 解析接口
  PARSE: '/parse'
}

// 模块功能类型
export const MODULE_ACTIONS = {
  PLAY: 'play',           // 播放接口
  CATEGORY: 'category',   // 分类接口
  DETAIL: 'detail',       // 详情接口
  ACTION: 'action',       // 动作接口
  SEARCH: 'search',       // 搜索接口
  REFRESH: 'refresh',     // 刷新接口
  HOME: 'home'           // 首页接口（默认）
}

// 响应状态码
export const RESPONSE_CODES = {
  SUCCESS: 200,
  NOT_FOUND: 404,
  SERVER_ERROR: 500
}

// 默认分页配置
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 20
}

export default {
  API_CONFIG,
  API_PATHS,
  MODULE_ACTIONS,
  RESPONSE_CODES,
  PAGINATION
}