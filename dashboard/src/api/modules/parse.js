/**
 * 解析接口
 * 封装 /parse/:jx 相关的视频解析接口
 */

import { get, post } from '../request'
import { API_PATHS } from '../config'

/**
 * 构建解析接口URL
 * @param {string} jx - 解析器名称
 * @returns {string} 完整的解析URL
 */
const buildParseUrl = (jx) => {
  return `${API_PATHS.PARSE}/${jx}`
}

/**
 * 解析视频地址
 * @param {string} jx - 解析器名称
 * @param {object} params - 解析参数
 * @param {string} params.url - 需要解析的视频URL
 * @param {string} params.flag - 解析标识（可选）
 * @param {object} params.headers - 自定义请求头（可选）
 * @returns {Promise} 解析结果
 */
export const parseVideo = async (jx, params) => {
  const { url, flag, headers, ...otherParams } = params
  
  if (!url) {
    throw new Error('视频URL不能为空')
  }
  
  const requestParams = {
    url,
    ...otherParams
  }
  
  if (flag) {
    requestParams.flag = flag
  }
  
  const requestOptions = {}
  if (headers) {
    requestOptions.headers = {
      ...requestOptions.headers,
      ...headers
    }
  }
  
  return get(buildParseUrl(jx), requestParams, requestOptions)
}

/**
 * POST方式解析视频（用于复杂参数）
 * @param {string} jx - 解析器名称
 * @param {object} data - 解析数据
 * @param {string} data.url - 需要解析的视频URL
 * @param {string} data.flag - 解析标识（可选）
 * @param {object} data.headers - 自定义请求头（可选）
 * @returns {Promise} 解析结果
 */
export const parseVideoPost = async (jx, data) => {
  const { url, headers, ...requestData } = data
  
  if (!url) {
    throw new Error('视频URL不能为空')
  }
  
  const requestOptions = {}
  if (headers) {
    requestOptions.headers = {
      ...requestOptions.headers,
      ...headers
    }
  }
  
  return post(buildParseUrl(jx), requestData, requestOptions)
}

/**
 * 批量解析视频
 * @param {string} jx - 解析器名称
 * @param {Array} urls - 视频URL数组
 * @param {object} options - 解析选项
 * @param {string} options.flag - 解析标识（可选）
 * @param {object} options.headers - 自定义请求头（可选）
 * @returns {Promise} 批量解析结果
 */
export const parseVideoBatch = async (jx, urls, options = {}) => {
  if (!Array.isArray(urls) || urls.length === 0) {
    throw new Error('视频URL数组不能为空')
  }
  
  const { flag, headers } = options
  
  const requestData = {
    urls,
    batch: true
  }
  
  if (flag) {
    requestData.flag = flag
  }
  
  const requestOptions = {}
  if (headers) {
    requestOptions.headers = {
      ...requestOptions.headers,
      ...headers
    }
  }
  
  return post(buildParseUrl(jx), requestData, requestOptions)
}

/**
 * 获取解析器信息
 * @param {string} jx - 解析器名称
 * @returns {Promise} 解析器信息
 */
export const getParserInfo = async (jx) => {
  return get(buildParseUrl(jx), { info: true })
}

/**
 * 测试解析器可用性
 * @param {string} jx - 解析器名称
 * @param {string} testUrl - 测试URL（可选）
 * @returns {Promise} 测试结果
 */
export const testParser = async (jx, testUrl) => {
  const params = { test: true }
  
  if (testUrl) {
    params.url = testUrl
  }
  
  return get(buildParseUrl(jx), params)
}

/**
 * 通用解析接口调用
 * @param {string} jx - 解析器名称
 * @param {object} params - 请求参数
 * @param {string} method - 请求方法 ('GET' | 'POST')
 * @returns {Promise} 解析响应
 */
export const callParseApi = async (jx, params = {}, method = 'GET') => {
  const url = buildParseUrl(jx)
  
  if (method.toUpperCase() === 'POST') {
    return post(url, params)
  } else {
    return get(url, params)
  }
}

// 默认导出所有解析接口
export default {
  parseVideo,
  parseVideoPost,
  parseVideoBatch,
  getParserInfo,
  testParser,
  callParseApi
}