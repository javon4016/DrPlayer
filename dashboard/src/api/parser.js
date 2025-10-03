import { useParserStore } from '@/stores/parser'

/**
 * 解析服务API
 * 提供视频解析功能，支持播放器通过 jx:1 格式调用
 */
export class ParserService {
  constructor() {
    this.parserStore = useParserStore()
  }

  /**
   * 解析视频地址
   * @param {string} videoUrl - 原始视频地址
   * @param {string} flag - 播放器标识 (可选)
   * @param {number} parserIndex - 指定解析器索引 (可选)
   * @returns {Promise<Object>} 解析结果
   */
  async parseVideo(videoUrl, flag = null, parserIndex = null) {
    try {
      // 获取可用的解析器
      let availableParsers = this.parserStore.enabledParsers

      // 如果指定了播放器标识，过滤支持该标识的解析器
      if (flag) {
        availableParsers = availableParsers.filter(parser => 
          parser.ext?.flag?.includes(flag)
        )
      }

      // 如果指定了解析器索引，使用指定的解析器
      if (parserIndex !== null && availableParsers[parserIndex]) {
        availableParsers = [availableParsers[parserIndex]]
      }

      if (availableParsers.length === 0) {
        throw new Error('没有可用的解析器')
      }

      // 尝试使用解析器解析视频
      for (const parser of availableParsers) {
        try {
          const result = await this.parseWithParser(parser, videoUrl)
          if (result.success) {
            return {
              success: true,
              data: result.data,
              parser: {
                name: parser.name,
                id: parser.id
              },
              message: '解析成功'
            }
          }
        } catch (err) {
          console.warn(`解析器 ${parser.name} 解析失败:`, err.message)
          continue
        }
      }

      throw new Error('所有解析器都解析失败')
    } catch (err) {
      return {
        success: false,
        error: err.message,
        message: `解析失败: ${err.message}`
      }
    }
  }

  /**
   * 使用指定解析器解析视频
   * @param {Object} parser - 解析器配置
   * @param {string} videoUrl - 视频地址
   * @returns {Promise<Object>} 解析结果
   */
  async parseWithParser(parser, videoUrl) {
    try {
      // 构建解析请求URL
      const parseUrl = parser.url.replace(/\{url\}/g, encodeURIComponent(videoUrl))
      
      // 设置请求头
      const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        ...parser.header
      }

      const response = await fetch(parseUrl, {
        method: 'GET',
        headers,
        timeout: 15000 // 15秒超时
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const contentType = response.headers.get('content-type')
      let result

      // 根据解析器类型处理响应
      if (parser.type === '1' || contentType?.includes('application/json')) {
        // JSON 类型解析器
        result = await response.json()
        return this.parseJsonResponse(result)
      } else {
        // 嗅探类型解析器
        result = await response.text()
        return this.parseTextResponse(result)
      }
    } catch (err) {
      throw new Error(`解析器请求失败: ${err.message}`)
    }
  }

  /**
   * 解析JSON响应
   * @param {Object} data - JSON数据
   * @returns {Object} 解析结果
   */
  parseJsonResponse(data) {
    try {
      // 常见的JSON响应格式
      let videoUrl = null
      let videoUrls = []

      // 尝试不同的字段名
      const urlFields = ['url', 'video', 'src', 'link', 'address', 'path']
      const urlsFields = ['urls', 'videos', 'sources', 'links']

      // 查找单个视频地址
      for (const field of urlFields) {
        if (data[field] && typeof data[field] === 'string') {
          videoUrl = data[field]
          break
        }
      }

      // 查找多个视频地址
      for (const field of urlsFields) {
        if (data[field] && Array.isArray(data[field])) {
          videoUrls = data[field]
          break
        }
      }

      // 如果没有找到单个地址，尝试从数组中取第一个
      if (!videoUrl && videoUrls.length > 0) {
        videoUrl = typeof videoUrls[0] === 'string' ? videoUrls[0] : videoUrls[0].url
      }

      if (!videoUrl) {
        throw new Error('未找到视频地址')
      }

      // 验证是否为有效的视频URL
      if (!this.isValidVideoUrl(videoUrl)) {
        throw new Error('解析到的不是有效的视频地址')
      }

      return {
        success: true,
        data: {
          url: videoUrl,
          urls: videoUrls,
          type: 'json',
          raw: data
        }
      }
    } catch (err) {
      throw new Error(`JSON解析失败: ${err.message}`)
    }
  }

  /**
   * 解析文本响应
   * @param {string} text - 文本数据
   * @returns {Object} 解析结果
   */
  parseTextResponse(text) {
    try {
      // 尝试提取视频URL
      const videoUrls = this.extractVideoUrls(text)

      if (videoUrls.length === 0) {
        throw new Error('未找到视频地址')
      }

      return {
        success: true,
        data: {
          url: videoUrls[0],
          urls: videoUrls,
          type: 'text',
          raw: text
        }
      }
    } catch (err) {
      throw new Error(`文本解析失败: ${err.message}`)
    }
  }

  /**
   * 从文本中提取视频URL
   * @param {string} text - 文本内容
   * @returns {Array} 视频URL数组
   */
  extractVideoUrls(text) {
    const videoUrls = []
    
    // 常见的视频URL正则表达式
    const patterns = [
      // M3U8 格式
      /https?:\/\/[^\s"'<>]+\.m3u8[^\s"'<>]*/gi,
      // MP4 格式
      /https?:\/\/[^\s"'<>]+\.mp4[^\s"'<>]*/gi,
      // FLV 格式
      /https?:\/\/[^\s"'<>]+\.flv[^\s"'<>]*/gi,
      // 其他视频格式
      /https?:\/\/[^\s"'<>]+\.(avi|mkv|wmv|mov|webm)[^\s"'<>]*/gi,
      // 通用视频流URL
      /https?:\/\/[^\s"'<>]*(?:video|stream|play)[^\s"'<>]*/gi
    ]

    for (const pattern of patterns) {
      const matches = text.match(pattern)
      if (matches) {
        videoUrls.push(...matches)
      }
    }

    // 去重并过滤有效URL
    return [...new Set(videoUrls)].filter(url => this.isValidVideoUrl(url))
  }

  /**
   * 验证是否为有效的视频URL
   * @param {string} url - URL地址
   * @returns {boolean} 是否有效
   */
  isValidVideoUrl(url) {
    try {
      const urlObj = new URL(url)
      
      // 检查协议
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return false
      }

      // 检查是否包含视频相关关键词或扩展名
      const videoKeywords = ['video', 'stream', 'play', 'm3u8', 'mp4', 'flv', 'avi', 'mkv']
      const urlLower = url.toLowerCase()
      
      return videoKeywords.some(keyword => urlLower.includes(keyword))
    } catch {
      return false
    }
  }

  /**
   * 获取解析器列表
   * @returns {Array} 解析器列表
   */
  getParsers() {
    return this.parserStore.parsers.map(parser => ({
      id: parser.id,
      name: parser.name,
      enabled: parser.enabled,
      type: parser.type,
      flags: parser.ext?.flag || []
    }))
  }

  /**
   * 获取启用的解析器列表
   * @returns {Array} 启用的解析器列表
   */
  getEnabledParsers() {
    return this.parserStore.enabledParsers.map(parser => ({
      id: parser.id,
      name: parser.name,
      type: parser.type,
      flags: parser.ext?.flag || []
    }))
  }

  /**
   * 根据播放器标识获取支持的解析器
   * @param {string} flag - 播放器标识
   * @returns {Array} 支持的解析器列表
   */
  getParsersByFlag(flag) {
    return this.parserStore.enabledParsers
      .filter(parser => parser.ext?.flag?.includes(flag))
      .map(parser => ({
        id: parser.id,
        name: parser.name,
        type: parser.type
      }))
  }
}

// 创建单例实例
export const parserService = new ParserService()

/**
 * 解析视频地址的便捷函数
 * @param {string} videoUrl - 视频地址
 * @param {Object} options - 选项
 * @returns {Promise<Object>} 解析结果
 */
export async function parseVideo(videoUrl, options = {}) {
  const { flag, parserIndex } = options
  return await parserService.parseVideo(videoUrl, flag, parserIndex)
}

/**
 * 处理 jx:1 格式的播放地址
 * @param {string} playUrl - 播放地址 (格式: jx:1$视频地址)
 * @returns {Promise<Object>} 解析结果
 */
export async function handleJxUrl(playUrl) {
  try {
    // 解析 jx:1 格式
    const match = playUrl.match(/^jx:(\d+)\$(.+)$/)
    if (!match) {
      throw new Error('无效的jx格式地址')
    }

    const parserIndex = parseInt(match[1]) - 1 // 转换为0基索引
    const videoUrl = match[2]

    return await parserService.parseVideo(videoUrl, null, parserIndex)
  } catch (err) {
    return {
      success: false,
      error: err.message,
      message: `jx地址解析失败: ${err.message}`
    }
  }
}

export default {
  ParserService,
  parserService,
  parseVideo,
  handleJxUrl
}