/**
 * 模块数据接口 (T4接口)
 * 封装 /api/:module 相关的所有接口调用
 */

import { get, post } from '../request'
import { API_PATHS, MODULE_ACTIONS, PAGINATION, API_CONFIG } from '../config'
import { processExtendParam } from '@/utils/apiUtils'
import axios from 'axios'

/**
 * 解析headers字段，支持对象和JSON字符串格式
 * @param {Object|string} headers - headers字段
 * @returns {Object} 解析后的headers对象
 */
const parseHeaders = (headers) => {
  if (!headers) {
    console.log('🔍 [Headers解析] 输入为空，返回空对象')
    return {}
  }
  
  console.log('🔍 [Headers解析] 输入数据:', headers, '类型:', typeof headers)
  
  // 如果已经是对象，直接返回
  if (typeof headers === 'object' && headers !== null) {
    console.log('🔍 [Headers解析] 已是对象，直接返回:', headers)
    return headers
  }
  
  // 如果是字符串，尝试解析为JSON
  if (typeof headers === 'string') {
    try {
      const parsed = JSON.parse(headers)
      // 确保解析结果是对象
      const result = typeof parsed === 'object' && parsed !== null ? parsed : {}
      console.log('🔍 [Headers解析] JSON字符串解析成功:', result)
      return result
    } catch (error) {
      console.warn('🔍 [Headers解析] JSON字符串解析失败:', error, '原始数据:', headers)
      return {}
    }
  }
  
  console.log('🔍 [Headers解析] 未知类型，返回空对象')
  return {}
}



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
      timeout: API_CONFIG.TIMEOUT,
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
 * @param {string|object} options.extend - 接口数据扩展参数（对象类型会自动转换为JSON字符串）
 * @param {string} options.apiUrl - 站点API地址（可选，如果提供则直接使用）
 * @returns {Promise} 首页数据
 */
export const getHomeData = async (module, options = {}) => {
  const { filter = 1, extend, apiUrl } = options
  const params = { filter }
  
  const processedExtend = processExtendParam(extend)
  if (processedExtend) {
    params.extend = processedExtend
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
 * @param {string|object} params.extend - 接口数据扩展参数（对象类型会自动转换为JSON字符串）
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
  
  const processedExtend = processExtendParam(extend)
  if (processedExtend) {
    requestParams.extend = processedExtend
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
 * @param {string|object} params.extend - 接口数据扩展参数（对象类型会自动转换为JSON字符串）
 * @param {string} params.apiUrl - 可选的直接API地址
 * @returns {Promise} 视频详情数据
 */
export const getVideoDetail = async (module, params) => {
  const { ids, extend, apiUrl } = params
  
  const requestParams = {
    ac: MODULE_ACTIONS.DETAIL,
    ids
  }
  
  const processedExtend = processExtendParam(extend)
  if (processedExtend) {
    requestParams.extend = processedExtend
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
 * @param {string} params.flag - 源标识（线路名称）
 * @param {string|object} params.extend - 接口数据扩展参数（对象类型会自动转换为JSON字符串）
 * @param {string} params.apiUrl - 可选的直接API地址
 * @returns {Promise} 播放数据
 */
export const getPlayData = async (module, params) => {
  const { play, flag, extend, apiUrl } = params
  
  const requestParams = {
    ac: MODULE_ACTIONS.PLAY,
    play
  }
  
  // 添加flag参数支持
  if (flag) {
    requestParams.flag = flag
  }
  
  const processedExtend = processExtendParam(extend)
  if (processedExtend) {
    requestParams.extend = processedExtend
  }
  
  // 如果提供了apiUrl，直接使用站点的API地址
  if (apiUrl) {
    return directApiCall(apiUrl, requestParams)
  }
  
  // 否则使用原来的代理方式
  return get(buildModuleUrl(module), requestParams)
}

/**
 * 播放解析接口 - 专门用于选集播放解析
 * @param {string} module - 模块名称
 * @param {object} params - 播放参数
 * @param {string} params.play - 播放地址或ID（选集链接）
 * @param {string} params.flag - 源标识（线路名称）
 * @param {string|object} params.extend - 接口数据扩展参数
 * @param {string} params.apiUrl - 可选的直接API地址
 * @returns {Promise} 播放解析结果
 */
export const parsePlayUrl = async (module, params) => {
  try {
    console.log('T4播放解析请求:', { module, params })
    
    const playData = await getPlayData(module, params)
    console.log('T4播放解析响应:', playData)
    
    // 调试：显示原始headers数据
    const rawHeaders = playData?.headers || playData?.header
    if (rawHeaders) {
      console.log('T4接口返回的原始headers:', rawHeaders, '类型:', typeof rawHeaders)
    }
    
    // 处理解析结果
    const result = {
      success: true,
      data: playData,
      // 解析播放类型
      playType: 'direct', // 默认直链
      url: '',
      headers: {}, // 添加headers字段
      needParse: false,
      needSniff: false,
      message: ''
    }
    
    // 检查返回数据格式
    if (playData && typeof playData === 'object') {
      // 检查parse和jx字段，jx:1优先级高于parse:1
      if (playData.jx === 1) {
        // 需要解析 - 优先级最高
        result.playType = 'parse'
        result.url = playData.url || playData.play_url || ''
        result.headers = parseHeaders(playData.headers || playData.header)
        result.needParse = true
        result.qualities = []
        result.hasMultipleQualities = false
        result.message = '需要解析才能播放，尽情期待'
      } else if (playData.parse === 0) {
        // 直链播放
        result.playType = 'direct'
        
        // 处理URL字段 - 支持数组格式的多画质
        const urlData = playData.url || playData.play_url || ''
        if (Array.isArray(urlData)) {
          // URL是数组格式，包含多画质信息
          console.log('检测到多画质URL数组:', urlData)
          
          // 解析画质数组：奇数索引是画质名称，偶数索引是对应链接
          const qualities = []
          for (let i = 0; i < urlData.length; i += 2) {
            if (i + 1 < urlData.length) {
              const qualityName = urlData[i]?.toString().trim()
              const qualityUrl = urlData[i + 1]?.toString().trim()
              if (qualityName && qualityUrl) {
                qualities.push({
                  name: qualityName,
                  url: qualityUrl
                })
              }
            }
          }
          
          console.log('解析出的画质列表:', qualities)
          
          // 设置多画质数据
          result.qualities = qualities
          result.hasMultipleQualities = qualities.length > 1
          
          // 默认使用第一个画质
          if (qualities.length > 0) {
            result.url = qualities[0].url
            result.currentQuality = qualities[0].name
            result.message = `多画质播放 (当前: ${qualities[0].name})`
          } else {
            result.url = ''
            result.message = '多画质数据解析失败'
          }
        } else {
          // URL是字符串格式，单一画质
          result.url = urlData
          result.qualities = []
          result.hasMultipleQualities = false
          result.currentQuality = '默认'
          result.message = '直链播放'
        }
        
        result.headers = parseHeaders(playData.headers || playData.header)
        result.needParse = false
        result.needSniff = false
      } else if (playData.parse === 1) {
        // 需要嗅探
        result.playType = 'sniff'
        result.url = playData.url || playData.play_url || ''
        result.headers = parseHeaders(playData.headers || playData.header)
        result.needSniff = true
        result.qualities = []
        result.hasMultipleQualities = false
        result.message = '需要嗅探才能播放，尽情期待'
      } else {
        // 默认处理为直链
        result.url = playData.url || playData.play_url || playData
        result.headers = parseHeaders(playData.headers || playData.header)
        result.qualities = []
        result.hasMultipleQualities = false
        result.message = '直链播放'
      }
    } else if (typeof playData === 'string') {
      // 如果返回的是字符串，直接作为播放地址
      result.url = playData
      result.headers = {}
      result.qualities = []
      result.hasMultipleQualities = false
      result.message = '直链播放'
    }
    
    return result
  } catch (error) {
    console.error('T4播放解析失败:', error)
    return {
      success: false,
      error: error.message || '播放解析失败',
      playType: 'error',
      url: '',
      headers: {},
      needParse: false,
      needSniff: false,
      message: '播放解析失败: ' + (error.message || '未知错误')
    }
  }
}

/**
 * 搜索接口
 * @param {string} module - 模块名称
 * @param {object} params - 搜索参数
 * @param {string} params.wd - 搜索关键词
 * @param {number} params.pg - 页码（从1开始）
 * @param {string|object} params.extend - 接口数据扩展参数（对象类型会自动转换为JSON字符串）
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
  
  const processedExtend = processExtendParam(extend)
  if (processedExtend) {
    requestParams.extend = processedExtend
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
 * @param {string|object} data.extend - 接口数据扩展参数（对象类型会自动转换为JSON字符串）
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
  
  const processedExtend = processExtendParam(extend)
  if (processedExtend) {
    requestData.extend = processedExtend
  }
  
  console.log('executeAction调用参数:', {
    module,
    data,
    requestData,
    apiUrl
  })
  
  // 如果提供了apiUrl，直接使用站点的API地址
  if (apiUrl) {
    console.log('直接调用API:', apiUrl, requestData)
    
    // 如果是测试用的JSON文件，使用GET请求
    if (apiUrl.endsWith('.json')) {
      const response = await axios.get(apiUrl, {
        timeout: API_CONFIG.TIMEOUT,
        headers: {
          'Accept': 'application/json'
        }
      })
      console.log('API响应 (GET):', response.data)
      return response.data
    } else {
      // 否则使用POST请求
      const response = await axios.post(apiUrl, requestData, {
        timeout: API_CONFIG.TIMEOUT,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json;charset=UTF-8',
        }
      })
      console.log('API响应 (POST):', response.data)
      return response.data
    }
  }
  
  // 否则使用原来的代理方式
  console.log('使用代理方式调用:', buildModuleUrl(module), requestData)
  const result = await post(buildModuleUrl(module), requestData)
  console.log('代理响应:', result)
  return result
}

/**
 * 刷新模块数据
 * @param {string} module - 模块名称
 * @param {string|object} extend - 接口数据扩展参数（对象类型会自动转换为JSON字符串）
 * @param {string} apiUrl - 可选的直接API地址
 * @returns {Promise} 刷新结果
 */
export const refreshModule = async (module, extend, apiUrl) => {
  const params = {
    refresh: '1'
  }
  
  const processedExtend = processExtendParam(extend)
  if (processedExtend) {
    params.extend = processedExtend
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
  parsePlayUrl,
  searchVideos,
  executeAction,
  refreshModule,
  callModuleApi
}