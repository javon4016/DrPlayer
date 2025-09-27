/**
 * 站点管理相关业务接口服务
 * 封装站点配置、管理和数据源切换功能
 */

import { proxyRequest } from '../modules/proxy'
import { validateModule } from '../utils'
import { createSiteInfo } from '../types'
import configService from './config'

/**
 * 站点服务类
 */
class SiteService {
  constructor() {
    this.sites = new Map()
    this.currentSite = null
    this.loadSitesFromStorage()
    this.initializeFromConfig()
  }

  /**
   * 获取所有站点配置
   * @returns {Array} 站点列表
   */
  getAllSites() {
    return Array.from(this.sites.values())
  }

  /**
   * 根据key获取站点信息
   * @param {string} siteKey - 站点标识
   * @returns {object|null} 站点信息
   */
  getSiteByKey(siteKey) {
    return this.sites.get(siteKey) || null
  }

  /**
   * 获取当前选中的站点
   * @returns {object|null} 当前站点信息
   */
  getCurrentSite() {
    return this.currentSite
  }

  /**
   * 设置当前站点
   * @param {string} siteKey - 站点标识
   * @returns {boolean} 设置是否成功
   */
  setCurrentSite(siteKey) {
    const site = this.sites.get(siteKey)
    if (!site) {
      console.error('站点不存在:', siteKey)
      return false
    }

    this.currentSite = site
    this.saveSitesToStorage()
    
    // 触发站点切换事件
    this.emitSiteChange(site)
    
    return true
  }

  /**
   * 添加站点
   * @param {object} siteInfo - 站点信息
   * @returns {boolean} 添加是否成功
   */
  addSite(siteInfo) {
    try {
      const site = this.formatSiteInfo(siteInfo)
      
      if (!site.key) {
        throw new Error('站点标识不能为空')
      }

      if (!site.name) {
        throw new Error('站点名称不能为空')
      }

      if (!site.api) {
        throw new Error('API地址不能为空')
      }

      this.sites.set(site.key, site)
      this.saveSitesToStorage()
      
      console.log('添加站点成功:', site.name)
      return true
    } catch (error) {
      console.error('添加站点失败:', error)
      return false
    }
  }

  /**
   * 更新站点信息
   * @param {string} siteKey - 站点标识
   * @param {object} updates - 更新的信息
   * @returns {boolean} 更新是否成功
   */
  updateSite(siteKey, updates) {
    const site = this.sites.get(siteKey)
    if (!site) {
      console.error('站点不存在:', siteKey)
      return false
    }

    try {
      const updatedSite = { ...site, ...updates }
      const formattedSite = this.formatSiteInfo(updatedSite)
      
      this.sites.set(siteKey, formattedSite)
      this.saveSitesToStorage()
      
      // 如果更新的是当前站点，同步更新
      if (this.currentSite && this.currentSite.key === siteKey) {
        this.currentSite = formattedSite
      }
      
      console.log('更新站点成功:', formattedSite.name)
      return true
    } catch (error) {
      console.error('更新站点失败:', error)
      return false
    }
  }

  /**
   * 删除站点
   * @param {string} siteKey - 站点标识
   * @returns {boolean} 删除是否成功
   */
  removeSite(siteKey) {
    const site = this.sites.get(siteKey)
    if (!site) {
      console.error('站点不存在:', siteKey)
      return false
    }

    this.sites.delete(siteKey)
    this.saveSitesToStorage()
    
    // 如果删除的是当前站点，清空当前站点
    if (this.currentSite && this.currentSite.key === siteKey) {
      this.currentSite = null
    }
    
    console.log('删除站点成功:', site.name)
    return true
  }

  /**
   * 批量导入站点
   * @param {Array} siteList - 站点列表
   * @returns {object} 导入结果
   */
  importSites(siteList) {
    if (!Array.isArray(siteList)) {
      throw new Error('站点列表必须是数组')
    }

    const result = {
      success: 0,
      failed: 0,
      errors: []
    }

    siteList.forEach((siteInfo, index) => {
      try {
        const success = this.addSite(siteInfo)
        if (success) {
          result.success++
        } else {
          result.failed++
          result.errors.push(`第${index + 1}个站点添加失败`)
        }
      } catch (error) {
        result.failed++
        result.errors.push(`第${index + 1}个站点添加失败: ${error.message}`)
      }
    })

    console.log('批量导入站点完成:', result)
    return result
  }

  /**
   * 导出站点配置
   * @returns {Array} 站点配置列表
   */
  exportSites() {
    return this.getAllSites()
  }

  /**
   * 测试站点连接
   * @param {string} siteKey - 站点标识
   * @returns {Promise} 测试结果
   */
  async testSiteConnection(siteKey) {
    const site = this.sites.get(siteKey)
    if (!site) {
      throw new Error('站点不存在')
    }

    try {
      // 尝试获取站点首页数据
      const response = await proxyRequest(site.key, '', {
        method: 'GET',
        params: { test: true }
      })

      return {
        success: true,
        message: '连接成功',
        responseTime: Date.now(),
        data: response
      }
    } catch (error) {
      return {
        success: false,
        message: error.message || '连接失败',
        error: error
      }
    }
  }

  /**
   * 获取站点统计信息
   * @returns {object} 统计信息
   */
  getSiteStats() {
    const sites = this.getAllSites()
    
    return {
      total: sites.length,
      searchable: sites.filter(site => site.searchable).length,
      filterable: sites.filter(site => site.filterable).length,
      quickSearch: sites.filter(site => site.quickSearch).length,
      byType: this.groupSitesByType(sites)
    }
  }

  /**
   * 按类型分组站点
   * @param {Array} sites - 站点列表
   * @returns {object} 分组结果
   */
  groupSitesByType(sites) {
    const groups = {}
    
    sites.forEach(site => {
      const type = site.type || 0
      if (!groups[type]) {
        groups[type] = []
      }
      groups[type].push(site)
    })
    
    return groups
  }

  /**
   * 搜索站点
   * @param {string} keyword - 搜索关键词
   * @returns {Array} 搜索结果
   */
  searchSites(keyword) {
    if (!keyword || keyword.trim().length === 0) {
      return this.getAllSites()
    }

    const searchTerm = keyword.trim().toLowerCase()
    
    return this.getAllSites().filter(site => 
      site.name.toLowerCase().includes(searchTerm) ||
      site.key.toLowerCase().includes(searchTerm) ||
      (site.api && site.api.toLowerCase().includes(searchTerm))
    )
  }

  /**
   * 格式化站点信息
   * @param {object} rawSite - 原始站点数据
   * @returns {object} 格式化后的站点信息
   */
  formatSiteInfo(rawSite) {
    const site = createSiteInfo()
    
    Object.keys(site).forEach(key => {
      if (rawSite[key] !== undefined) {
        site[key] = rawSite[key]
      }
    })

    // 处理特殊字段
    site.searchable = rawSite.searchable ? 1 : 0
    site.quickSearch = rawSite.quickSearch ? 1 : 0
    site.filterable = rawSite.filterable ? 1 : 0
    site.type = parseInt(rawSite.type) || 0
    site.order = parseInt(rawSite.order) || 0

    return site
  }

  /**
   * 从本地存储加载站点配置
   */
  loadSitesFromStorage() {
    try {
      const sitesData = localStorage.getItem('drplayer_sites')
      const currentSiteKey = localStorage.getItem('drplayer_current_site')
      
      if (sitesData) {
        const sites = JSON.parse(sitesData)
        sites.forEach(site => {
          this.sites.set(site.key, site)
        })
      }
      
      if (currentSiteKey) {
        this.currentSite = this.sites.get(currentSiteKey)
      }
      
      console.log('从本地存储加载站点配置成功')
    } catch (error) {
      console.error('加载站点配置失败:', error)
    }
  }

  /**
   * 保存站点配置到本地存储
   */
  saveSitesToStorage() {
    try {
      const sites = this.getAllSites()
      localStorage.setItem('drplayer_sites', JSON.stringify(sites))
      
      if (this.currentSite) {
        localStorage.setItem('drplayer_current_site', this.currentSite.key)
      } else {
        localStorage.removeItem('drplayer_current_site')
      }
      
      console.log('保存站点配置到本地存储成功')
    } catch (error) {
      console.error('保存站点配置失败:', error)
    }
  }

  /**
   * 触发站点切换事件
   * @param {object} site - 新的站点信息
   */
  emitSiteChange(site) {
    // 可以在这里添加事件监听器机制
    console.log('站点已切换:', site.name)
    
    // 触发自定义事件
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('siteChange', {
        detail: { site }
      }))
    }
  }

  /**
   * 清空所有站点
   */
  clearAllSites() {
    this.sites.clear()
    this.currentSite = null
    this.saveSitesToStorage()
    console.log('已清空所有站点配置')
  }

  /**
   * 从配置服务初始化站点数据
   */
  async initializeFromConfig() {
    try {
      const configStatus = configService.getConfigStatus()
      if (configStatus.hasConfigUrl) {
        await this.loadSitesFromConfig()
      }
    } catch (error) {
      console.error('从配置服务初始化失败:', error)
    }
  }

  /**
   * 从配置地址加载站点数据
   * @param {boolean} forceRefresh - 是否强制刷新
   * @returns {Promise<Array>} 站点列表
   */
  async loadSitesFromConfig(forceRefresh = false) {
    try {
      const sites = await configService.getSites(forceRefresh)
      
      if (sites && sites.length > 0) {
        // 清空现有站点（保留本地添加的站点）
        const localSites = Array.from(this.sites.values()).filter(site => site.isLocal)
        this.sites.clear()
        
        // 重新添加本地站点
        localSites.forEach(site => {
          this.sites.set(site.key, site)
        })
        
        // 添加配置中的站点
        sites.forEach(siteData => {
          const siteInfo = this.formatSiteInfo(siteData)
          siteInfo.isFromConfig = true // 标记为来自配置
          this.sites.set(siteInfo.key, siteInfo)
        })
        
        this.saveSitesToStorage()
        console.log(`从配置加载了 ${sites.length} 个站点`)
        
        // 触发站点更新事件
        this.emitSitesUpdate()
        
        return sites
      }
      
      return []
    } catch (error) {
      console.error('从配置加载站点失败:', error)
      throw error
    }
  }

  /**
   * 刷新配置数据
   * @returns {Promise<Array>} 更新后的站点列表
   */
  async refreshConfig() {
    try {
      return await this.loadSitesFromConfig(true)
    } catch (error) {
      console.error('刷新配置失败:', error)
      throw error
    }
  }

  /**
   * 获取配置状态
   * @returns {object} 配置状态信息
   */
  getConfigStatus() {
    return configService.getConfigStatus()
  }

  /**
   * 设置配置地址
   * @param {string} url - 配置地址
   * @returns {Promise<boolean>} 设置是否成功
   */
  async setConfigUrl(url) {
    try {
      const success = await configService.setConfigUrl(url)
      if (success) {
        // 配置地址设置成功后，立即加载站点数据
        await this.loadSitesFromConfig(true)
      }
      return success
    } catch (error) {
      console.error('设置配置地址失败:', error)
      throw error
    }
  }

  /**
   * 获取当前配置地址
   * @returns {string|null} 配置地址
   */
  getConfigUrl() {
    return configService.getConfigUrl()
  }

  /**
   * 触发站点更新事件
   */
  emitSitesUpdate() {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sitesUpdate', {
        detail: { 
          sites: this.getAllSites(),
          count: this.sites.size
        }
      }))
    }
  }
}

// 创建单例实例
const siteService = new SiteService()

export default siteService