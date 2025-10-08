/**
 * 解析器服务
 * 处理JSON类型和嗅探类型的解析逻辑
 */

import axios from 'axios'
import { API_CONFIG } from '@/api/config'

class ParserService {
  /**
   * 验证解析器配置
   * @param {Object} parser - 解析器配置
   * @returns {Object} 验证结果
   */
  static validateParserConfig(parser) {
    const errors = []
    
    if (!parser) {
      return { valid: false, errors: ['解析器配置不能为空'] }
    }
    
    if (!parser.name) {
      errors.push('解析器名称不能为空')
    }
    
    if (!parser.url) {
      errors.push('解析器URL不能为空')
    } else {
      // 验证URL格式
      try {
        new URL(parser.url)
      } catch (e) {
        errors.push('解析器URL格式无效')
      }
    }
    
    if (!parser.type || !['json', 'sniffer'].includes(parser.type)) {
      errors.push('解析器类型必须是 json 或 sniffer')
    }
    
    // JSON类型特定验证
    if (parser.type === 'json') {
      if (!parser.urlPath) {
        errors.push('JSON解析器必须配置URL提取路径(urlPath)')
      }
    }
    
    // 嗅探类型特定验证
    if (parser.type === 'sniffer') {
      // 嗅探解析器直接拼接URL，不需要占位符验证
    }
    
    return {
      valid: errors.length === 0,
      errors
    }
  }
  
  /**
   * 测试解析器配置
   * @param {Object} parser - 解析器配置
   * @param {string} testUrl - 测试URL
   * @returns {Promise<Object>} 测试结果
   */
  static async testParserConfig(parser, testUrl = 'https://example.com/test.mp4') {
    try {
      console.log('🧪 [解析器测试] 开始测试解析器配置:', { 
        parser: parser.name, 
        testUrl,
        isDefaultTestUrl: testUrl === 'https://example.com/test.mp4'
      })
      
      // 首先验证配置
      const validation = this.validateParserConfig(parser)
      if (!validation.valid) {
        return {
          success: false,
          message: '配置验证失败: ' + validation.errors.join(', ')
        }
      }
      
      // 执行测试解析
      let result
      if (parser.type === 'json') {
        console.log('🧪 [解析器测试] 使用JSON解析器测试')
        result = await this.parseWithJsonParser(parser, { url: testUrl })
      } else if (parser.type === 'sniffer') {
        console.log('🧪 [解析器测试] 使用嗅探解析器测试')
        result = await this.parseWithSnifferParser(parser, { url: testUrl })
      }
      
      return {
        success: result.success,
        message: result.success ? '解析器测试成功' : result.message,
        testResult: result
      }
    } catch (error) {
      return {
        success: false,
        message: '解析器测试失败: ' + error.message
      }
    }
  }

  /**
   * 使用JSON类型解析器解析视频
   * @param {Object} parser - 解析器配置
   * @param {Object} data - 需要解析的数据
   * @returns {Promise<Object>} 解析结果
   */
  static async parseWithJsonParser(parser, data) {
    try {
      console.log('🔍 [JSON解析] 开始解析:', { 
        parser: parser.name, 
        data, 
        dataType: typeof data,
        isTestUrl: data && typeof data === 'object' && data.url === 'https://example.com/test.mp4'
      })
      
      if (!parser.url) {
        throw new Error('解析器URL未配置')
      }
      
      // 提取要解析的URL - 优先处理T4接口返回的数据结构
      let videoUrl
      if (data && typeof data === 'object') {
        // T4接口返回的数据结构：{ jx: 1, url: "视频地址", headers: {...} }
        videoUrl = data.url || data.play_url || data
        console.log('从T4数据结构提取的目标URL:', videoUrl)
      } else {
        // 简单字符串格式
        videoUrl = data
        console.log('直接使用的目标URL:', videoUrl)
      }
      
      // 验证URL有效性
      if (!videoUrl || typeof videoUrl !== 'string') {
        throw new Error('无效的视频URL')
      }
      
      console.log('要解析的视频URL:', videoUrl)
      
      // 构建完整的解析地址：解析器URL + 待解析URL
      const fullParseUrl = parser.url + encodeURIComponent(videoUrl)
      console.log('拼接后的解析地址:', fullParseUrl)
      
      // 获取代理访问接口配置
      const savedAddresses = JSON.parse(localStorage.getItem('addressSettings') || '{}')
      const proxyAccessEnabled = savedAddresses.proxyAccessEnabled || false
      const proxyAccess = savedAddresses.proxyAccess || ''
      
      let requestUrl = fullParseUrl
      
      // 如果启用了代理访问接口，使用代理访问链接
      if (proxyAccessEnabled && proxyAccess) {
        console.log('🔄 [代理访问] 使用代理访问接口:', proxyAccess)
        
        if (proxyAccess.includes('${url}')) {
          // 替换代理访问链接中的${url}占位符
          requestUrl = proxyAccess.replace(/\$\{url\}/g, encodeURIComponent(fullParseUrl))
          console.log('🔄 [代理访问] 替换占位符后的最终URL:', requestUrl)
        } else {
          console.warn('⚠️ [代理访问] 代理访问链接中未找到${url}占位符，将直接访问原地址')
        }
      } else {
        console.log('🔄 [直接访问] 代理访问接口未启用，直接访问解析地址')
      }
      
      // 发送解析请求
      const axiosConfig = {
        method: parser.method || 'GET',
        url: requestUrl,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': fullParseUrl, // 使用拼接后的解析地址作为Referer
          ...parser.headers
        },
        timeout: API_CONFIG.TIMEOUT
      }
      
      const response = await axios(axiosConfig)
      
      console.log('JSON解析响应:', response.data)
      
      // 解析响应数据
      const result = this.parseJsonResponse(response.data, parser)
      
      return {
        success: true,
        url: result.url,
        headers: result.headers || {},
        qualities: result.qualities || [],
        message: '解析成功'
      }
    } catch (error) {
      console.error('JSON解析失败:', error)
      return {
        success: false,
        message: error.message || 'JSON解析失败'
      }
    }
  }
  
  /**
   * 使用嗅探类型解析器解析视频
   * @param {Object} parser - 解析器配置
   * @param {Object} data - 需要解析的数据
   * @returns {Promise<Object>} 解析结果
   */
  static async parseWithSnifferParser(parser, data) {
    try {
      console.log('开始嗅探解析:', { parser: parser.name, data })
      
      if (!parser.url) {
        throw new Error('解析器URL未配置')
      }
      
      // 构建嗅探URL
      const sniffUrl = this.buildSnifferUrl(parser, data)
      
      console.log('嗅探URL:', sniffUrl)
      
      // 发送嗅探请求
      const response = await axios({
        method: 'GET',
        url: sniffUrl,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': data.referer || '',
          ...parser.headers
        },
        timeout: API_CONFIG.TIMEOUT,
        maxRedirects: 5
      })
      
      console.log('嗅探解析响应状态:', response.status)
      
      // 从响应中提取视频URL
      const videoUrl = this.extractVideoUrlFromSniffer(response, parser)
      
      if (!videoUrl) {
        throw new Error('未能从嗅探响应中提取到视频URL')
      }
      
      return {
        success: true,
        url: videoUrl,
        headers: {
          'Referer': parser.url,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        qualities: [],
        message: '嗅探解析成功'
      }
    } catch (error) {
      console.error('嗅探解析失败:', error)
      return {
        success: false,
        message: error.message || '嗅探解析失败'
      }
    }
  }
  
  /**
   * 解析JSON响应数据
   * @param {Object} responseData - 响应数据
   * @param {Object} parser - 解析器配置
   * @returns {Object} 解析结果
   */
  static parseJsonResponse(responseData, parser) {
    try {
      let data = responseData
      
      // 如果响应是字符串，尝试解析为JSON
      if (typeof data === 'string') {
        data = JSON.parse(data)
      }
      
      // 根据解析器配置提取数据
      const result = {
        url: this.extractValueByPath(data, parser.urlPath || 'url'),
        headers: {},
        qualities: []
      }
      
      // 提取请求头
      if (parser.headersPath) {
        result.headers = this.extractValueByPath(data, parser.headersPath) || {}
      }
      
      // 提取多画质数据
      if (parser.qualitiesPath) {
        const qualities = this.extractValueByPath(data, parser.qualitiesPath)
        if (Array.isArray(qualities)) {
          result.qualities = qualities.map(q => ({
            name: q.name || q.quality || 'Unknown',
            url: q.url || q.playUrl || q.src
          }))
        }
      }
      
      return result
    } catch (error) {
      console.error('解析JSON响应失败:', error)
      throw new Error('解析JSON响应失败: ' + error.message)
    }
  }
  
  /**
   * 构建嗅探器URL
   * @param {Object} parser - 解析器配置
   * @param {Object} data - 数据
   * @returns {string} 嗅探URL
   */
  static buildSnifferUrl(parser, data) {
    let url = parser.url
    
    // 提取要解析的URL - 优先处理T4接口返回的数据结构
    let videoUrl
    if (data && typeof data === 'object') {
      // T4接口返回的数据结构：{ jx: 1, url: "视频地址", headers: {...} }
      videoUrl = data.url || data.play_url || data
      console.log('从T4数据结构提取的嗅探目标URL:', videoUrl)
    } else {
      // 简单字符串格式
      videoUrl = data
      console.log('直接使用的嗅探目标URL:', videoUrl)
    }
    
    // 验证URL有效性
    if (!videoUrl || typeof videoUrl !== 'string') {
      throw new Error('无效的视频URL')
    }
    
    // 直接将解析器URL与待解析URL相加
    if (url.includes('{url}')) {
      // 如果包含占位符，替换它（兼容旧格式）
      url = url.replace(/\{url\}/g, encodeURIComponent(videoUrl))
    } else {
      // 直接字符串相加：解析器URL + 待解析URL
      url = url + encodeURIComponent(videoUrl)
    }
    
    // 替换时间占位符
    url = url.replace(/\{time\}/g, Date.now())
    
    // 添加额外参数
    if (parser.params) {
      const params = new URLSearchParams()
      Object.entries(parser.params).forEach(([key, value]) => {
        params.append(key, value)
      })
      url += (url.includes('?') ? '&' : '?') + params.toString()
    }
    
    return url
  }
  
  /**
   * 从嗅探响应中提取视频URL
   * @param {Object} response - HTTP响应
   * @param {Object} parser - 解析器配置
   * @returns {string|null} 视频URL
   */
  static extractVideoUrlFromSniffer(response, parser) {
    try {
      // 方法1: 从响应头的Location中获取
      if (response.headers.location) {
        const location = response.headers.location
        if (this.isVideoUrl(location)) {
          return location
        }
      }
      
      // 方法2: 从响应体中提取
      if (response.data) {
        let content = response.data
        
        // 如果是JSON响应
        if (typeof content === 'object') {
          const url = this.extractValueByPath(content, parser.urlPath || 'url')
          if (url && this.isVideoUrl(url)) {
            return url
          }
        }
        
        // 如果是HTML响应，使用正则提取
        if (typeof content === 'string') {
          const videoUrlRegex = /(https?:\/\/[^\s"'<>]+\.(?:mp4|m3u8|flv|avi|mkv|mov|wmv|webm)(?:\?[^\s"'<>]*)?)/gi
          const matches = content.match(videoUrlRegex)
          if (matches && matches.length > 0) {
            return matches[0]
          }
        }
      }
      
      // 方法3: 如果配置了自定义提取规则
      if (parser.extractRule) {
        const regex = new RegExp(parser.extractRule, 'gi')
        const matches = response.data.match(regex)
        if (matches && matches.length > 0) {
          return matches[0]
        }
      }
      
      return null
    } catch (error) {
      console.error('提取视频URL失败:', error)
      return null
    }
  }
  
  /**
   * 根据路径提取对象中的值
   * @param {Object} obj - 对象
   * @param {string} path - 路径，如 'data.url' 或 'result[0].playUrl'
   * @returns {any} 提取的值
   */
  static extractValueByPath(obj, path) {
    try {
      return path.split('.').reduce((current, key) => {
        // 处理数组索引，如 result[0]
        const arrayMatch = key.match(/^(\w+)\[(\d+)\]$/)
        if (arrayMatch) {
          const [, arrayKey, index] = arrayMatch
          return current?.[arrayKey]?.[parseInt(index)]
        }
        return current?.[key]
      }, obj)
    } catch (error) {
      console.error('提取路径值失败:', error, { path, obj })
      return null
    }
  }
  
  /**
   * 检查URL是否为视频URL
   * @param {string} url - URL
   * @returns {boolean} 是否为视频URL
   */
  static isVideoUrl(url) {
    if (!url || typeof url !== 'string') {
      return false
    }
    
    const videoExtensions = ['.mp4', '.m3u8', '.flv', '.avi', '.mkv', '.mov', '.wmv', '.webm']
    const lowerUrl = url.toLowerCase()
    
    return videoExtensions.some(ext => lowerUrl.includes(ext)) || 
           lowerUrl.includes('video') || 
           lowerUrl.includes('stream')
  }
}

export default ParserService