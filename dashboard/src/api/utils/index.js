/**
 * API工具函数
 * 提供常用的数据处理、验证和转换功能
 */
import CryptoJS from 'crypto-js'
/**
 * Base64编码（使用CryptoJS）
 * @param {string} text 待编码文本
 * @returns {string} Base64编码结果
 */
export const base64Encode = (text) => {
  return CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(text));
}

/**
 * Base64解码（使用CryptoJS）
 * @param {string} text Base64编码文本
 * @returns {string} 解码结果
 */
export const base64Decode = (text) => {
  return CryptoJS.enc.Utf8.stringify(CryptoJS.enc.Base64.parse(text));
}

/**
 * URL安全的Base64编码（Base64URL）
 * 将 + 替换为 -，将 / 替换为 _，移除填充字符 =
 * @param {string} text 待编码文本
 * @returns {string} URL安全的Base64编码结果
 */
export const base64EncodeUrl = (text) => {
  const base64 = CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(text));
  return base64
    .replace(/\+/g, '-')    // 将 + 替换为 -
    .replace(/\//g, '_')    // 将 / 替换为 _
    .replace(/=/g, '');     // 移除填充字符 =
}

/**
 * URL安全的Base64解码（Base64URL）
 * 将 - 替换为 +，将 _ 替换为 /，补充填充字符 =
 * @param {string} text URL安全的Base64编码文本
 * @returns {string} 解码结果
 */
export const base64DecodeUrl = (text) => {
  // 恢复标准Base64格式
  let base64 = text
    .replace(/-/g, '+')     // 将 - 替换为 +
    .replace(/_/g, '/');    // 将 _ 替换为 /
  
  // 补充填充字符 =
  const padding = base64.length % 4;
  if (padding === 2) {
    base64 += '==';
  } else if (padding === 3) {
    base64 += '=';
  }
  
  return CryptoJS.enc.Utf8.stringify(CryptoJS.enc.Base64.parse(base64));
}

/**
 * MD5哈希
 * @param {string} text 待哈希文本
 * @returns {string} MD5哈希值
 */
export function md5(text) {
  return CryptoJS.MD5(text).toString();
}

/**
 * 将筛选条件对象转换为Base64编码的JSON字符串
 * @param {object} filters - 筛选条件对象
 * @returns {string} Base64编码的JSON字符串
 */
export const encodeFilters = (filters) => {
  if (!filters || typeof filters !== 'object') {
    return ''
  }
  
  try {
    const jsonStr = JSON.stringify(filters)
    return base64Encode(jsonStr)
  } catch (error) {
    console.error('筛选条件编码失败:', error)
    return ''
  }
}

/**
 * 将Base64编码的JSON字符串解码为筛选条件对象
 * @param {string} encodedFilters - Base64编码的JSON字符串
 * @returns {object} 筛选条件对象
 */
export const decodeFilters = (encodedFilters) => {
  if (!encodedFilters || typeof encodedFilters !== 'string') {
    return {}
  }
  
  try {
    const jsonStr = base64Decode(encodedFilters)
    return JSON.parse(jsonStr)
  } catch (error) {
    console.error('筛选条件解码失败:', error)
    return {}
  }
}

/**
 * 构建查询参数字符串
 * @param {object} params - 参数对象
 * @returns {string} 查询参数字符串
 */
export const buildQueryString = (params) => {
  if (!params || typeof params !== 'object') {
    return ''
  }
  
  const searchParams = new URLSearchParams()
  
  Object.keys(params).forEach(key => {
    const value = params[key]
    if (value !== null && value !== undefined && value !== '') {
      searchParams.append(key, String(value))
    }
  })
  
  return searchParams.toString()
}

/**
 * 解析查询参数字符串
 * @param {string} queryString - 查询参数字符串
 * @returns {object} 参数对象
 */
export const parseQueryString = (queryString) => {
  if (!queryString || typeof queryString !== 'string') {
    return {}
  }
  
  const params = {}
  const searchParams = new URLSearchParams(queryString)
  
  for (const [key, value] of searchParams) {
    params[key] = value
  }
  
  return params
}

/**
 * 验证模块名称
 * @param {string} module - 模块名称
 * @returns {boolean} 是否有效
 */
export const validateModule = (module) => {
  if (!module || typeof module !== 'string') {
    return false
  }
  
  // 模块名称不能为空，且长度不能超过100个字符
  // 支持字母、数字、中文、下划线、连字符、方括号、圆括号等常见字符
  if (module.trim().length === 0 || module.length > 100) {
    return false
  }
  
  // 不允许包含特殊控制字符
  const invalidChars = /[\x00-\x1F\x7F]/
  return !invalidChars.test(module)
}

/**
 * 验证视频ID
 * @param {string} videoId - 视频ID
 * @returns {boolean} 是否有效
 */
export const validateVideoId = (videoId) => {
  if (!videoId || typeof videoId !== 'string') {
    return false
  }
  
  const trimmedId = videoId.trim()
  
  // 视频ID不能为空
  if (trimmedId.length === 0) {
    return false
  }
  
  // no_data 被认为是无效的视频ID
  if (trimmedId === 'no_data') {
    return false
  }
  
  // 视频ID长度限制在1024字符内
  return videoId.length <= 1024
}

/**
 * 验证URL格式
 * @param {string} url - URL字符串
 * @returns {boolean} 是否有效
 */
export const validateUrl = (url) => {
  if (!url || typeof url !== 'string') {
    return false
  }
  
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * 格式化错误信息
 * @param {Error|string} error - 错误对象或错误信息
 * @returns {string} 格式化后的错误信息
 */
export const formatError = (error) => {
  if (!error) {
    return '未知错误'
  }
  
  if (typeof error === 'string') {
    return error
  }
  
  if (error instanceof Error) {
    return error.message || '请求失败'
  }
  
  if (error.response && error.response.data) {
    const { data } = error.response
    return data.msg || data.message || '服务器错误'
  }
  
  return '网络请求失败'
}

/**
 * 深度合并对象
 * @param {object} target - 目标对象
 * @param {object} source - 源对象
 * @returns {object} 合并后的对象
 */
export const deepMerge = (target, source) => {
  if (!target || typeof target !== 'object') {
    return source
  }
  
  if (!source || typeof source !== 'object') {
    return target
  }
  
  const result = { ...target }
  
  Object.keys(source).forEach(key => {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(result[key], source[key])
    } else {
      result[key] = source[key]
    }
  })
  
  return result
}

/**
 * 防抖函数
 * @param {Function} func - 需要防抖的函数
 * @param {number} delay - 延迟时间（毫秒）
 * @returns {Function} 防抖后的函数
 */
export const debounce = (func, delay) => {
  let timeoutId
  
  return function (...args) {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func.apply(this, args), delay)
  }
}

/**
 * 节流函数
 * @param {Function} func - 需要节流的函数
 * @param {number} delay - 延迟时间（毫秒）
 * @returns {Function} 节流后的函数
 */
export const throttle = (func, delay) => {
  let lastCall = 0
  
  return function (...args) {
    const now = Date.now()
    
    if (now - lastCall >= delay) {
      lastCall = now
      return func.apply(this, args)
    }
  }
}

// 默认导出所有工具函数
export default {
  base64Encode,
  base64Decode,
  base64EncodeUrl,
  base64DecodeUrl,
  md5,
  encodeFilters,
  decodeFilters,
  buildQueryString,
  parseQueryString,
  validateModule,
  validateVideoId,
  validateUrl,
  formatError,
  deepMerge,
  debounce,
  throttle
}