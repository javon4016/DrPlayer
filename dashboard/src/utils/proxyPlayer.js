/**
 * 代理播放地址处理工具 - 优化版本
 * 解决内存泄漏问题，提升性能
 */
import {base64Encode} from "@/api/utils/index.js";

// 缓存配置
const CACHE_CONFIG = {
  MAX_SIZE: 100,           // 最大缓存条目数
  CLEANUP_INTERVAL: 300000, // 5分钟清理一次
  MAX_AGE: 600000          // 缓存最大存活时间10分钟
}

// 全局缓存对象
const cache = {
  urlCache: new Map(),     // URL编码缓存
  headerCache: new Map(),  // Headers编码缓存
  proxyCache: new Map(),   // 代理URL缓存
  lastCleanup: Date.now()  // 上次清理时间
}

// 默认User-Agent（避免重复创建）
const DEFAULT_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'

/**
 * 自动清理缓存
 */
function autoCleanupCache() {
  const now = Date.now()
  
  // 检查是否需要清理
  if (now - cache.lastCleanup < CACHE_CONFIG.CLEANUP_INTERVAL) {
    return
  }

  const caches = [cache.urlCache, cache.headerCache, cache.proxyCache]
  
  caches.forEach(cacheMap => {
    // 如果缓存超过最大大小，清理最旧的条目
    if (cacheMap.size > CACHE_CONFIG.MAX_SIZE) {
      const entries = Array.from(cacheMap.entries())
      const toDelete = entries.slice(0, Math.floor(CACHE_CONFIG.MAX_SIZE * 0.3))
      toDelete.forEach(([key]) => cacheMap.delete(key))
    }

    // 清理过期条目
    for (const [key, value] of cacheMap.entries()) {
      if (value.timestamp && now - value.timestamp > CACHE_CONFIG.MAX_AGE) {
        cacheMap.delete(key)
      }
    }
  })

  cache.lastCleanup = now
  
  // 在开发环境下输出清理信息
  if (process.env.NODE_ENV === 'development') {
    console.log('🧹 [代理缓存] 自动清理完成')
  }
}

/**
 * 获取缓存的编码结果
 */
function getCachedEncoding(text, cacheMap) {
  autoCleanupCache()
  
  const cached = cacheMap.get(text)
  if (cached) {
    return cached.value
  }

  const encoded = base64Encode(text)
  cacheMap.set(text, {
    value: encoded,
    timestamp: Date.now()
  })

  return encoded
}

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
 * 构建代理播放URL - 优化版本
 * @param {string} originalUrl 原始视频地址
 * @param {string} proxyAddress 代理播放地址模板
 * @param {Object} headers 请求头对象
 * @returns {string} 构建后的代理播放URL
 */
export function buildProxyPlayUrl(originalUrl, proxyAddress, headers = {}) {
  try {
    // 创建缓存键
    const cacheKey = `${originalUrl}|${proxyAddress}|${JSON.stringify(headers)}`
    
    // 检查缓存
    autoCleanupCache()
    const cached = cache.proxyCache.get(cacheKey)
    if (cached) {
      // 在开发环境下输出缓存命中信息
      if (process.env.NODE_ENV === 'development') {
        console.log('🎯 [代理缓存] 缓存命中:', originalUrl.substring(0, 50) + '...')
      }
      return cached.value
    }

    // 移除代理地址中的 #名称 部分
    const cleanProxyAddress = proxyAddress.replace(/#.*$/, '')

    // 处理默认 headers：如果 headers 为空或没有有效内容，使用默认 User-Agent
    let finalHeaders = headers
    if (!headers || Object.keys(headers).length === 0 ||
        (Object.keys(headers).length === 1 && !headers['user-agent'] && !headers['User-Agent'])) {
      finalHeaders = {
        'user-agent': navigator.userAgent || DEFAULT_USER_AGENT
      }
    }

    // 将headers对象转换为JSON字符串
    const headersJson = JSON.stringify(finalHeaders)

    // 使用缓存的编码结果
    const encodedUrl = getCachedEncoding(originalUrl, cache.urlCache)
    const encodedHeaders = getCachedEncoding(headersJson, cache.headerCache)
    
    // 提取文件类型（优化字符串操作）
    const urlParts = originalUrl.split('/')
    const lastPart = urlParts[urlParts.length - 1]
    const encodedType = lastPart.split('?')[0]

    // 替换模板字符串中的变量
    const proxyUrl = cleanProxyAddress
      .replace(/\$\{url\}/g, encodeURIComponent(encodedUrl))
      .replace(/\$\{headers\}/g, encodeURIComponent(encodedHeaders))
      .replace(/\$\{type\}/g, encodedType)

    // 缓存结果
    cache.proxyCache.set(cacheKey, {
      value: proxyUrl,
      timestamp: Date.now()
    })

    // 输出详细的调试日志
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
    // 仅在开发环境下输出日志
    if (process.env.NODE_ENV === 'development') {
      console.log('🎬 [直接播放] 使用原始地址:', originalUrl.substring(0, 100) + '...')
    }
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

/**
 * 手动清理所有缓存
 * @returns {Object} 清理统计信息
 */
export function clearProxyCache() {
  const stats = {
    urlCache: cache.urlCache.size,
    headerCache: cache.headerCache.size,
    proxyCache: cache.proxyCache.size,
    totalCleared: 0
  }

  // 清理所有缓存
  cache.urlCache.clear()
  cache.headerCache.clear()
  cache.proxyCache.clear()
  cache.lastCleanup = Date.now()

  stats.totalCleared = stats.urlCache + stats.headerCache + stats.proxyCache

  // 在开发环境下输出清理信息
  if (process.env.NODE_ENV === 'development') {
    console.log('🧹 [代理缓存] 手动清理完成:', stats)
  }

  return stats
}

/**
 * 获取缓存统计信息
 * @returns {Object} 缓存统计信息
 */
export function getCacheStats() {
  return {
    urlCache: cache.urlCache.size,
    headerCache: cache.headerCache.size,
    proxyCache: cache.proxyCache.size,
    lastCleanup: new Date(cache.lastCleanup).toLocaleString(),
    maxSize: CACHE_CONFIG.MAX_SIZE,
    maxAge: CACHE_CONFIG.MAX_AGE / 1000 + 's',
    cleanupInterval: CACHE_CONFIG.CLEANUP_INTERVAL / 1000 + 's'
  }
}

/**
 * 配置缓存参数
 * @param {Object} config 缓存配置
 */
export function configureCacheSettings(config = {}) {
  if (config.maxSize && config.maxSize > 0) {
    CACHE_CONFIG.MAX_SIZE = config.maxSize
  }
  if (config.maxAge && config.maxAge > 0) {
    CACHE_CONFIG.MAX_AGE = config.maxAge
  }
  if (config.cleanupInterval && config.cleanupInterval > 0) {
    CACHE_CONFIG.CLEANUP_INTERVAL = config.cleanupInterval
  }

  // 在开发环境下输出配置信息
  if (process.env.NODE_ENV === 'development') {
    console.log('⚙️ [代理缓存] 配置已更新:', CACHE_CONFIG)
  }
}