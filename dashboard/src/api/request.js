/**
 * 基础请求工具
 * 封装axios，提供统一的请求处理和错误处理
 */

import axios from 'axios'
import { API_CONFIG, RESPONSE_CODES } from './config'

// 创建axios实例
const request = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: API_CONFIG.HEADERS
})

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    // 添加认证token（如果存在）
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // 添加时间戳防止缓存
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now()
      }
    }
    
    console.log('API Request:', config.method?.toUpperCase(), config.url, config.params || config.data)
    return config
  },
  (error) => {
    console.error('Request Error:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    const { data, status } = response
    
    console.log('API Response:', response.config.url, data)
    
    // 检查HTTP状态码
    if (status !== 200) {
      throw new Error(`HTTP Error: ${status}`)
    }
    
    // 检查业务状态码
    if (data.code && data.code !== RESPONSE_CODES.SUCCESS) {
      throw new Error(data.msg || `Business Error: ${data.code}`)
    }
    
    return data
  },
  (error) => {
    console.error('Response Error:', error)
    
    // 处理网络错误
    if (!error.response) {
      throw new Error('网络连接失败，请检查网络设置')
    }
    
    // 处理HTTP错误状态码
    const { status } = error.response
    switch (status) {
      case 404:
        throw new Error('请求的资源不存在')
      case 500:
        throw new Error('服务器内部错误')
      case 401:
        throw new Error('未授权访问')
      case 403:
        throw new Error('访问被禁止')
      default:
        throw new Error(`请求失败: ${status}`)
    }
  }
)

/**
 * 通用请求方法
 * @param {string} url - 请求URL
 * @param {object} options - 请求选项
 * @returns {Promise} 请求结果
 */
export const apiRequest = async (url, options = {}) => {
  try {
    const response = await request({
      url,
      ...options
    })
    return response
  } catch (error) {
    console.error('API Request Failed:', error.message)
    throw error
  }
}

/**
 * GET请求
 * @param {string} url - 请求URL
 * @param {object} params - 查询参数
 * @returns {Promise} 请求结果
 */
export const get = (url, params = {}) => {
  return apiRequest(url, {
    method: 'GET',
    params
  })
}

/**
 * POST请求
 * @param {string} url - 请求URL
 * @param {object} data - 请求数据
 * @returns {Promise} 请求结果
 */
export const post = (url, data = {}) => {
  return apiRequest(url, {
    method: 'POST',
    data
  })
}

/**
 * PUT请求
 * @param {string} url - 请求URL
 * @param {object} data - 请求数据
 * @returns {Promise} 请求结果
 */
export const put = (url, data = {}) => {
  return apiRequest(url, {
    method: 'PUT',
    data
  })
}

/**
 * DELETE请求
 * @param {string} url - 请求URL
 * @param {object} params - 查询参数
 * @returns {Promise} 请求结果
 */
export const del = (url, params = {}) => {
  return apiRequest(url, {
    method: 'DELETE',
    params
  })
}

export default request