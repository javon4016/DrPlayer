/**
 * 代理播放地址处理工具
 */
import {base64Encode} from "@/api/utils/index.js";

/**
 * 获取当前选中的代理播放地址
 * @returns {string|null} 返回代理播放地址，如果未启用代理播放则返回null
 */
export function getCurrentProxyPlayAddress() {
  try {
    // 从addressSettings读取代理播放配置
    const savedAddresses = JSON.parse(localStorage.getItem('addressSettings') || '{}')
    const proxyPlayEnabled = savedAddresses.proxyPlayEnabled || false
    const proxyPlay = savedAddresses.proxyPlay || ''

    // 如果代理播放未启用或地址为空，返回null
    if (!proxyPlayEnabled || !proxyPlay || proxyPlay.trim() === '') {
      return null
    }

    return proxyPlay.trim()
  } catch (error) {
    console.error('获取代理播放地址失败:', error)
    return null
  }
}

/**
 * 构建代理播放URL
 * @param {string} originalUrl 原始视频地址
 * @param {string} proxyAddress 代理播放地址模板
 * @param {Object} headers 请求头对象
 * @returns {string} 构建后的代理播放URL
 */
export function buildProxyPlayUrl(originalUrl, proxyAddress, headers = {}) {
  try {
    // 移除代理地址中的 #名称 部分
    const cleanProxyAddress = proxyAddress.replace(/#.*$/, '')

    // 处理默认 headers：如果 headers 为空或没有有效内容，使用当前页面的 User-Agent
    let finalHeaders = headers
    if (!headers || Object.keys(headers).length === 0 ||
        (Object.keys(headers).length === 1 && !headers['user-agent'] && !headers['User-Agent'])) {
      finalHeaders = {
        'user-agent': navigator.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    }

    // 将headers对象转换为JSON字符串
    const headersJson = JSON.stringify(finalHeaders)

    // 对 URL 和 headers 进行 URL 安全的 base64 编码
    const encodedUrl = base64Encode(originalUrl)
    const encodedHeaders = base64Encode(headersJson)
    const encodedType = originalUrl.split('/').slice(-1)[0].split('?')[0]

    // 替换模板字符串中的${url}和${headers}
    let proxyUrl = cleanProxyAddress
      .replace(/\$\{url\}/g, encodeURIComponent(encodedUrl))
      .replace(/\$\{headers\}/g, encodeURIComponent(encodedHeaders))
      .replace(/\$\{type\}/g, encodedType)

    console.log('🔄 [代理播放] 构建代理URL:')
    console.log('📺 原始地址:', originalUrl)
    console.log('📋 原始请求头:', headers)
    console.log('📋 最终请求头:', finalHeaders)
    console.log('🌐 代理模板:', proxyAddress)
    console.log('🧹 清理后模板:', cleanProxyAddress)
    console.log('🔐 编码后URL:', encodedUrl)
    console.log('🔐 编码后Headers:', encodedHeaders)
    console.log('🔗 最终代理URL:', proxyUrl)

    return proxyUrl
  } catch (error) {
    console.error('构建代理播放URL失败:', error)
    return originalUrl // 失败时返回原始地址
  }
}

/**
 * 处理视频地址，如果启用了代理播放则返回代理URL，否则返回原始URL
 * @param {string} originalUrl 原始视频地址
 * @param {Object} headers 请求头对象
 * @returns {string} 处理后的视频地址
 */
export function processVideoUrl(originalUrl, headers = {}) {
  // 获取当前代理播放地址
  const proxyAddress = getCurrentProxyPlayAddress()

  // 如果没有启用代理播放，直接返回原始地址
  if (!proxyAddress) {
    console.log('🎬 [直接播放] 使用原始地址:', originalUrl)
    return originalUrl
  }

  // 构建并返回代理播放URL
  return buildProxyPlayUrl(originalUrl, proxyAddress, headers)
}

/**
 * 检查是否启用了代理播放
 * @returns {boolean} 是否启用代理播放
 */
export function isProxyPlayEnabled() {
  try {
    const savedAddresses = JSON.parse(localStorage.getItem('addressSettings') || '{}')
    const proxyPlayEnabled = savedAddresses.proxyPlayEnabled || false
    const proxyPlay = savedAddresses.proxyPlay || ''

    return proxyPlayEnabled && proxyPlay && proxyPlay.trim() !== ''
  } catch (error) {
    console.error('检查代理播放状态失败:', error)
    return false
  }
}