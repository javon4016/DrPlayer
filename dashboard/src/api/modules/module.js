/**
 * 模块数据接口 (T4接口)
 * 封装 /api/:module 相关的所有接口调用
 */

import { get, post } from '../request'
import { API_PATHS, MODULE_ACTIONS, PAGINATION } from '../config'
import axios from 'axios'

/**
 * 构建模块接口URL
 * @param {string} module - 模块名称
 * @returns {string} 完整的接口URL
 */
const buildModuleUrl = (module) => {
  // 对模块名称进行URL编码以支持中文字符
  const encodedModule = encodeURIComponent(module)
  return `${API_PATHS.MODULE}/${encodedModule}`
}

/**
 * 直接调用站点API
 * @param {string} apiUrl - 站点API地址
 * @param {object} params - 请求参数
 * @returns {Promise} API响应
 */
const directApiCall = async (apiUrl, params = {}) => {
  try {
    const response = await axios.get(apiUrl, {
      params,
      timeout: 30000,
      headers: {
        'Accept': 'application/json'
      }
    })
    
    return response.data
  } catch (error) {
    console.error('直接API调用失败:', error)
    throw error
  }
}

/**
 * 获取首页数据（默认接口）
 * @param {string} module - 模块名称
 * @param {object} options - 选项参数
 * @param {number} options.filter - 过滤条件（1表示启用，默认启用）
 * @param {string} options.extend - 接口数据扩展参数
 * @param {string} options.apiUrl - 站点API地址（可选，如果提供则直接使用）
 * @returns {Promise} 首页数据
 */
export const getHomeData = async (module, options = {}) => {
  const { filter = 1, extend, apiUrl } = options
  const params = { filter }
  
  if (extend) {
    params.extend = extend
  }
  
  // 如果提供了apiUrl，直接使用站点的API地址
  if (apiUrl) {
    return directApiCall(apiUrl, params)
  }
  
  // 否则使用原来的代理方式
  return get(buildModuleUrl(module), params)
}

/**
 * 获取分类数据
 * @param {string} module - 模块名称
 * @param {object} params - 分类参数
 * @param {string} params.ac - 固定值 "category"
 * @param {string} params.t - 分类ID
 * @param {number} params.pg - 页码（从1开始）
 * @param {string} params.ext - base64编码的筛选条件JSON字符串
 * @param {string} params.extend - 接口数据扩展参数
 * @param {string} params.apiUrl - 可选的直接API地址
 * @returns {Promise} 分类数据
 */
export const getCategoryData = async (module, params) => {
  const {
    t: typeId,
    pg = PAGINATION.DEFAULT_PAGE,
    ext,
    extend,
    apiUrl
  } = params
  
  const requestParams = {
    ac: MODULE_ACTIONS.CATEGORY,
    t: typeId,
    pg
  }
  
  if (ext) {
    requestParams.ext = ext
  }
  
  if (extend) {
    requestParams.extend = extend
  }
  
  // 如果提供了apiUrl，直接使用站点的API地址
  if (apiUrl) {
    return directApiCall(apiUrl, requestParams)
  }
  
  // 否则使用原来的代理方式
  return get(buildModuleUrl(module), requestParams)
}

/**
 * 获取视频详情
 * @param {string} module - 模块名称
 * @param {object} params - 详情参数
 * @param {string} params.ids - 视频ID
 * @param {string} params.extend - 接口数据扩展参数
 * @param {string} params.apiUrl - 可选的直接API地址
 * @returns {Promise} 视频详情数据
 */
export const getVideoDetail = async (module, params) => {
  const { ids, extend, apiUrl } = params
  
  const requestParams = {
    ac: MODULE_ACTIONS.DETAIL,
    ids
  }
  
  if (extend) {
    requestParams.extend = extend
  }
  
  // 如果提供了apiUrl，直接使用站点的API地址
  if (apiUrl) {
    return directApiCall(apiUrl, requestParams)
  }
  
  // 否则使用原来的代理方式
  return get(buildModuleUrl(module), requestParams)
}

/**
 * 播放接口
 * @param {string} module - 模块名称
 * @param {object} params - 播放参数
 * @param {string} params.play - 播放地址或ID
 * @param {string} params.extend - 接口数据扩展参数
 * @param {string} params.apiUrl - 可选的直接API地址
 * @returns {Promise} 播放数据
 */
export const getPlayData = async (module, params) => {
  const { play, extend, apiUrl } = params
  
  const requestParams = {
    ac: MODULE_ACTIONS.PLAY,
    play
  }
  
  if (extend) {
    requestParams.extend = extend
  }
  
  // 如果提供了apiUrl，直接使用站点的API地址
  if (apiUrl) {
    return directApiCall(apiUrl, requestParams)
  }
  
  // 否则使用原来的代理方式
  return get(buildModuleUrl(module), requestParams)
}

/**
 * 搜索接口
 * @param {string} module - 模块名称
 * @param {object} params - 搜索参数
 * @param {string} params.wd - 搜索关键词
 * @param {number} params.pg - 页码（从1开始）
 * @param {string} params.extend - 接口数据扩展参数
 * @param {string} params.apiUrl - 可选的直接API地址
 * @returns {Promise} 搜索结果
 */
export const searchVideos = async (module, params) => {
  const {
    wd: keyword,
    pg = PAGINATION.DEFAULT_PAGE,
    extend,
    apiUrl
  } = params
  
  const requestParams = {
    wd: keyword,
    pg
  }
  
  if (extend) {
    requestParams.extend = extend
  }
  
  // 如果提供了apiUrl，直接使用站点的API地址
  if (apiUrl) {
    return directApiCall(apiUrl, requestParams)
  }
  
  // 否则使用原来的代理方式
  return get(buildModuleUrl(module), requestParams)
}

/**
 * 动作接口（POST请求）
 * @param {string} module - 模块名称
 * @param {object} data - 动作数据
 * @param {string} data.action - 动作类型
 * @param {string} data.extend - 接口数据扩展参数
 * @param {string} data.apiUrl - 可选的直接API地址
 * @returns {Promise} 动作执行结果
 */
export const executeAction = async (module, data) => {
  const { action, extend, apiUrl, ...otherData } = data
  
  const requestData = {
    ac: MODULE_ACTIONS.ACTION,
    action,
    ...otherData
  }
  
  if (extend) {
    requestData.extend = extend
  }
  
  // 如果提供了apiUrl，直接使用站点的API地址（POST请求需要特殊处理）
  if (apiUrl) {
    // 对于POST请求，我们需要使用axios直接调用
    const axios = (await import('axios')).default
    const response = await axios.post(apiUrl, requestData, {
      timeout: 30000,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    })
    return response.data
  }
  
  // 否则使用原来的代理方式
  return post(buildModuleUrl(module), requestData)
}

/**
 * 刷新模块数据
 * @param {string} module - 模块名称
 * @param {string} extend - 接口数据扩展参数
 * @param {string} apiUrl - 可选的直接API地址
 * @returns {Promise} 刷新结果
 */
export const refreshModule = async (module, extend, apiUrl) => {
  const params = {
    refresh: '1'
  }
  
  if (extend) {
    params.extend = extend
  }
  
  // 如果提供了apiUrl，直接使用站点的API地址
  if (apiUrl) {
    return directApiCall(apiUrl, params)
  }
  
  // 否则使用原来的代理方式
  return get(buildModuleUrl(module), params)
}

/**
 * 通用模块接口调用
 * @param {string} module - 模块名称
 * @param {object} params - 请求参数
 * @param {string} method - 请求方法 ('GET' | 'POST')
 * @returns {Promise} 接口响应
 */
export const callModuleApi = async (module, params = {}, method = 'GET') => {
  const url = buildModuleUrl(module)
  
  if (method.toUpperCase() === 'POST') {
    return post(url, params)
  } else {
    return get(url, params)
  }
}

// 默认导出所有接口
export default {
  getHomeData,
  getCategoryData,
  getVideoDetail,
  getPlayData,
  searchVideos,
  executeAction,
  refreshModule,
  callModuleApi
}