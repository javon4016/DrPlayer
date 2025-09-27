/**
 * 模块代理接口
 * 封装 /proxy/:module/* 相关的代理转发接口
 */

import { get, post, put, del } from '../request'
import { API_PATHS } from '../config'

/**
 * 构建代理接口URL
 * @param {string} module - 模块名称
 * @param {string} path - 代理路径
 * @returns {string} 完整的代理URL
 */
const buildProxyUrl = (module, path = '') => {
  const basePath = `${API_PATHS.PROXY}/${module}`
  return path ? `${basePath}/${path}` : basePath
}

/**
 * 代理GET请求
 * @param {string} module - 模块名称
 * @param {string} path - 代理路径
 * @param {object} params - 查询参数
 * @returns {Promise} 代理响应
 */
export const proxyGet = async (module, path = '', params = {}) => {
  const url = buildProxyUrl(module, path)
  return get(url, params)
}

/**
 * 代理POST请求
 * @param {string} module - 模块名称
 * @param {string} path - 代理路径
 * @param {object} data - 请求数据
 * @returns {Promise} 代理响应
 */
export const proxyPost = async (module, path = '', data = {}) => {
  const url = buildProxyUrl(module, path)
  return post(url, data)
}

/**
 * 代理PUT请求
 * @param {string} module - 模块名称
 * @param {string} path - 代理路径
 * @param {object} data - 请求数据
 * @returns {Promise} 代理响应
 */
export const proxyPut = async (module, path = '', data = {}) => {
  const url = buildProxyUrl(module, path)
  return put(url, data)
}

/**
 * 代理DELETE请求
 * @param {string} module - 模块名称
 * @param {string} path - 代理路径
 * @param {object} params - 查询参数
 * @returns {Promise} 代理响应
 */
export const proxyDelete = async (module, path = '', params = {}) => {
  const url = buildProxyUrl(module, path)
  return del(url, params)
}

/**
 * 通用代理请求
 * @param {string} module - 模块名称
 * @param {string} path - 代理路径
 * @param {object} options - 请求选项
 * @param {string} options.method - 请求方法
 * @param {object} options.params - 查询参数（GET请求）
 * @param {object} options.data - 请求数据（POST/PUT请求）
 * @returns {Promise} 代理响应
 */
export const proxyRequest = async (module, path = '', options = {}) => {
  const { method = 'GET', params, data } = options
  
  switch (method.toUpperCase()) {
    case 'GET':
      return proxyGet(module, path, params)
    case 'POST':
      return proxyPost(module, path, data)
    case 'PUT':
      return proxyPut(module, path, data)
    case 'DELETE':
      return proxyDelete(module, path, params)
    default:
      throw new Error(`不支持的请求方法: ${method}`)
  }
}

/**
 * 代理文件上传
 * @param {string} module - 模块名称
 * @param {string} path - 代理路径
 * @param {FormData} formData - 文件数据
 * @returns {Promise} 上传响应
 */
export const proxyUpload = async (module, path = '', formData) => {
  const url = buildProxyUrl(module, path)
  
  return post(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

/**
 * 代理文件下载
 * @param {string} module - 模块名称
 * @param {string} path - 代理路径
 * @param {object} params - 查询参数
 * @returns {Promise} 下载响应
 */
export const proxyDownload = async (module, path = '', params = {}) => {
  const url = buildProxyUrl(module, path)
  
  return get(url, params, {
    responseType: 'blob'
  })
}

// 默认导出所有代理接口
export default {
  proxyGet,
  proxyPost,
  proxyPut,
  proxyDelete,
  proxyRequest,
  proxyUpload,
  proxyDownload
}