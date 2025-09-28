/**
 * 配置管理服务
 * 负责管理应用配置，包括配置地址、站点数据等
 * 支持localStorage持久化存储
 */

import axios from 'axios'

/**
 * 配置管理类
 */
class ConfigService {
  constructor() {
    this.configUrl = null
    this.configData = null
    this.lastFetchTime = null
    this.cacheExpiry = 5 * 60 * 1000 // 5分钟缓存
    this.liveConfigUrl = null // 直播配置地址
    this.loadConfigFromStorage()
  }

  /**
   * 设置配置地址
   * @param {string} url - 配置地址URL
   * @returns {Promise<boolean>} 设置是否成功
   */
  async setConfigUrl(url) {
    try {
      if (!url || typeof url !== 'string') {
        throw new Error('配置地址不能为空')
      }

      // 验证URL格式
      const urlPattern = /^https?:\/\/.+/
      if (!urlPattern.test(url)) {
        throw new Error('配置地址格式不正确，请输入有效的HTTP/HTTPS地址')
      }

      // 测试配置地址是否可访问
      const isValid = await this.validateConfigUrl(url)
      if (!isValid) {
        throw new Error('配置地址无法访问或数据格式不正确')
      }

      this.configUrl = url
      this.saveConfigToStorage()
      
      // 自动设置直播配置地址（如果未设置）
      await this.autoSetLiveConfigUrl()
      
      console.log('配置地址设置成功:', url)
      return true
    } catch (error) {
      console.error('设置配置地址失败:', error)
      throw error
    }
  }

  /**
   * 设置直播配置地址
   * @param {string} url - 直播配置地址URL
   * @returns {Promise<boolean>} 设置是否成功
   */
  async setLiveConfigUrl(url) {
    try {
      if (!url || typeof url !== 'string') {
        throw new Error('直播配置地址不能为空')
      }

      // 验证URL格式
      const urlPattern = /^https?:\/\/.+/
      if (!urlPattern.test(url)) {
        throw new Error('直播配置地址格式不正确，请输入有效的HTTP/HTTPS地址')
      }

      this.liveConfigUrl = url
      this.saveConfigToStorage()
      
      console.log('直播配置地址设置成功:', url)
      return true
    } catch (error) {
      console.error('设置直播配置地址失败:', error)
      throw error
    }
  }

  /**
   * 获取直播配置地址
   * @returns {string|null} 直播配置地址
   */
  getLiveConfigUrl() {
    return this.liveConfigUrl
  }

  /**
   * 自动设置直播配置地址（从点播配置中提取lives链接）
   * @returns {Promise<boolean>} 是否成功设置
   */
  async autoSetLiveConfigUrl() {
    try {
      // 如果已经设置了直播配置地址，则不自动设置
      if (this.liveConfigUrl) {
        return false
      }

      // 获取点播配置数据
      const configData = await this.getConfigData()
      if (!configData || !configData.lives || !Array.isArray(configData.lives) || configData.lives.length === 0) {
        console.log('点播配置中未找到lives链接')
        return false
      }

      // 取lives数组中第一个对象的url字段
      const firstLiveConfig = configData.lives[0]
      if (!firstLiveConfig || !firstLiveConfig.url) {
        console.log('lives配置中未找到有效的url')
        return false
      }

      // 设置直播配置地址
      this.liveConfigUrl = firstLiveConfig.url
      this.saveConfigToStorage()
      
      console.log('自动设置直播配置地址成功:', firstLiveConfig.url)
      return true
    } catch (error) {
      console.error('自动设置直播配置地址失败:', error)
      return false
    }
  }

  /**
   * 重置直播配置地址（重置为当前点播配置中的默认lives链接）
   * @returns {Promise<boolean>} 是否成功重置
   */
  async resetLiveConfigUrl() {
    try {
      // 获取点播配置数据
      const configData = await this.getConfigData()
      if (!configData || !configData.lives || !Array.isArray(configData.lives) || configData.lives.length === 0) {
        console.log('点播配置中未找到lives链接，无法重置')
        return false
      }

      // 取lives数组中第一个对象的url字段
      const firstLiveConfig = configData.lives[0]
      if (!firstLiveConfig || !firstLiveConfig.url) {
        console.log('lives配置中未找到有效的url，无法重置')
        return false
      }

      // 重置直播配置地址
      this.liveConfigUrl = firstLiveConfig.url
      this.saveConfigToStorage()
      
      console.log('直播配置地址重置成功:', firstLiveConfig.url)
      return true
    } catch (error) {
      console.error('重置直播配置地址失败:', error)
      return false
    }
  }

  /**
   * 获取当前配置地址
   * @returns {string|null} 当前配置地址
   */
  getConfigUrl() {
    return this.configUrl
  }

  /**
   * 验证配置地址是否有效
   * @param {string} url - 配置地址
   * @returns {Promise<boolean>} 是否有效
   */
  async validateConfigUrl(url) {
    try {
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'Accept': 'application/json'
        }
      })

      if (!response.data) {
        return false
      }

      // 验证数据格式是否包含必要字段
      const data = response.data
      if (!data.sites || !Array.isArray(data.sites)) {
        return false
      }

      // 验证sites数组中的数据格式
      if (data.sites.length > 0) {
        const firstSite = data.sites[0]
        if (!firstSite.key || !firstSite.name || !firstSite.api) {
          return false
        }
      }

      return true
    } catch (error) {
      console.error('验证配置地址失败:', error)
      return false
    }
  }

  /**
   * 获取配置数据
   * @param {boolean} forceRefresh - 是否强制刷新
   * @returns {Promise<object>} 配置数据
   */
  async getConfigData(forceRefresh = false) {
    try {
      if (!this.configUrl) {
        throw new Error('未设置配置地址')
      }

      // 检查缓存是否有效
      const now = Date.now()
      const isCacheValid = this.configData && 
                          this.lastFetchTime && 
                          (now - this.lastFetchTime) < this.cacheExpiry

      if (!forceRefresh && isCacheValid) {
        console.log('使用缓存的配置数据')
        return this.configData
      }

      console.log('从配置地址获取数据:', this.configUrl)
      const response = await axios.get(this.configUrl, {
        timeout: 15000,
        headers: {
          'Accept': 'application/json'
        }
      })

      if (!response.data) {
        throw new Error('配置数据为空')
      }

      this.configData = response.data
      this.lastFetchTime = now
      this.saveConfigToStorage()

      console.log('配置数据获取成功，站点数量:', this.configData.sites?.length || 0)
      return this.configData
    } catch (error) {
      console.error('获取配置数据失败:', error)
      throw error
    }
  }

  /**
   * 获取站点列表
   * @param {boolean} forceRefresh - 是否强制刷新
   * @returns {Promise<Array>} 站点列表
   */
  async getSites(forceRefresh = false) {
    try {
      const configData = await this.getConfigData(forceRefresh)
      return configData.sites || []
    } catch (error) {
      console.error('获取站点列表失败:', error)
      throw error
    }
  }

  /**
   * 获取推荐配置
   * @returns {Promise<Array>} 推荐配置列表
   */
  async getRecommendConfig() {
    try {
      const configData = await this.getConfigData()
      return configData.recommend || []
    } catch (error) {
      console.error('获取推荐配置失败:', error)
      return []
    }
  }

  /**
   * 获取其他配置信息
   * @returns {Promise<object>} 其他配置信息
   */
  async getOtherConfig() {
    try {
      const configData = await this.getConfigData()
      const { sites, ...otherConfig } = configData
      return otherConfig
    } catch (error) {
      console.error('获取其他配置失败:', error)
      return {}
    }
  }

  /**
   * 清除配置缓存
   */
  clearCache() {
    this.configData = null
    this.lastFetchTime = null
    console.log('配置缓存已清除')
  }

  /**
   * 重置配置
   */
  resetConfig() {
    this.configUrl = null
    this.configData = null
    this.lastFetchTime = null
    this.liveConfigUrl = null
    this.saveConfigToStorage()
    console.log('配置已重置')
  }

  /**
   * 从本地存储加载配置
   */
  loadConfigFromStorage() {
    try {
      const configUrl = localStorage.getItem('drplayer_config_url')
      const configData = localStorage.getItem('drplayer_config_data')
      const lastFetchTime = localStorage.getItem('drplayer_config_fetch_time')
      const liveConfigUrl = localStorage.getItem('drplayer_live_config_url')

      if (configUrl) {
        this.configUrl = configUrl
      }

      if (configData) {
        this.configData = JSON.parse(configData)
      }

      if (lastFetchTime) {
        this.lastFetchTime = parseInt(lastFetchTime)
      }

      if (liveConfigUrl) {
        this.liveConfigUrl = liveConfigUrl
      }

      console.log('从本地存储加载配置成功')
    } catch (error) {
      console.error('加载配置失败:', error)
    }
  }

  /**
   * 保存配置到本地存储
   */
  saveConfigToStorage() {
    try {
      if (this.configUrl) {
        localStorage.setItem('drplayer_config_url', this.configUrl)
      } else {
        localStorage.removeItem('drplayer_config_url')
      }

      if (this.configData) {
        localStorage.setItem('drplayer_config_data', JSON.stringify(this.configData))
      } else {
        localStorage.removeItem('drplayer_config_data')
      }

      if (this.lastFetchTime) {
        localStorage.setItem('drplayer_config_fetch_time', this.lastFetchTime.toString())
      } else {
        localStorage.removeItem('drplayer_config_fetch_time')
      }

      if (this.liveConfigUrl) {
        localStorage.setItem('drplayer_live_config_url', this.liveConfigUrl)
      } else {
        localStorage.removeItem('drplayer_live_config_url')
      }

      console.log('配置保存到本地存储成功')
    } catch (error) {
      console.error('保存配置失败:', error)
    }
  }

  /**
   * 获取配置状态信息
   * @returns {object} 配置状态
   */
  getConfigStatus() {
    const hasValidData = this.configData && this.configData.sites && Array.isArray(this.configData.sites)
    const sitesCount = hasValidData ? this.configData.sites.length : 0
    
    return {
      hasConfigUrl: !!this.configUrl,
      hasConfigData: !!this.configData,
      isValid: hasValidData,
      sitesCount: sitesCount,
      lastFetchTime: this.lastFetchTime,
      cacheAge: this.lastFetchTime ? Date.now() - this.lastFetchTime : null,
      isCacheValid: this.configData && this.lastFetchTime && 
                   (Date.now() - this.lastFetchTime) < this.cacheExpiry,
      hasLiveConfigUrl: !!this.liveConfigUrl,
      liveConfigUrl: this.liveConfigUrl
    }
  }
}

// 创建单例实例
const configService = new ConfigService()

export default configService