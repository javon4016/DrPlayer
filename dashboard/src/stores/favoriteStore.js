import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useFavoriteStore = defineStore('favorite', () => {
  // 收藏列表
  const favorites = ref([])
  
  // 从localStorage加载收藏数据
  const loadFavorites = () => {
    try {
      const stored = localStorage.getItem('drplayer-favorites')
      if (stored) {
        favorites.value = JSON.parse(stored)
      }
    } catch (error) {
      console.error('加载收藏数据失败:', error)
      favorites.value = []
    }
  }
  
  // 保存收藏数据到localStorage
  const saveFavorites = () => {
    try {
      localStorage.setItem('drplayer-favorites', JSON.stringify(favorites.value))
    } catch (error) {
      console.error('保存收藏数据失败:', error)
    }
  }
  
  // 添加收藏
  const addFavorite = (videoData) => {
    const favoriteItem = {
      id: videoData.vod_id,
      name: videoData.vod_name,
      pic: videoData.vod_pic,
      year: videoData.vod_year,
      area: videoData.vod_area,
      type_name: videoData.type_name,
      remarks: videoData.vod_remarks,
      director: videoData.vod_director,
      actor: videoData.vod_actor,
      // 保存API调用信息，用于从收藏进入详情页
      api_info: {
        module: videoData.module || '',
        api_url: videoData.api_url || '',
        site_name: videoData.site_name || ''
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    // 检查是否已存在
    const existingIndex = favorites.value.findIndex(item => 
      item.id === favoriteItem.id && 
      item.api_info.api_url === favoriteItem.api_info.api_url
    )
    
    if (existingIndex === -1) {
      favorites.value.unshift(favoriteItem)
      saveFavorites()
      return true
    }
    return false
  }
  
  // 移除收藏
  const removeFavorite = (videoId, apiUrl) => {
    const index = favorites.value.findIndex(item => 
      item.id === videoId && item.api_info.api_url === apiUrl
    )
    
    if (index !== -1) {
      favorites.value.splice(index, 1)
      saveFavorites()
      return true
    }
    return false
  }
  
  // 检查是否已收藏
  const isFavorited = (videoId, apiUrl) => {
    return favorites.value.some(item => 
      item.id === videoId && item.api_info.api_url === apiUrl
    )
  }
  
  // 获取收藏项
  const getFavorite = (videoId, apiUrl) => {
    return favorites.value.find(item => 
      item.id === videoId && item.api_info.api_url === apiUrl
    )
  }
  
  // 清空收藏
  const clearFavorites = () => {
    favorites.value = []
    saveFavorites()
  }
  
  // 导出收藏数据
  const exportFavorites = () => {
    const exportData = {
      version: '1.0',
      export_time: new Date().toISOString(),
      favorites: favorites.value
    }
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    })
    
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `drplayer-favorites-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
  
  // 导入收藏数据
  const importFavorites = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          const importData = JSON.parse(e.target.result)
          
          // 验证数据格式
          if (!importData.favorites || !Array.isArray(importData.favorites)) {
            throw new Error('无效的收藏数据格式')
          }
          
          // 合并数据，避免重复
          let importCount = 0
          importData.favorites.forEach(item => {
            const exists = favorites.value.some(existing => 
              existing.id === item.id && 
              existing.api_info.api_url === item.api_info.api_url
            )
            
            if (!exists) {
              favorites.value.push({
                ...item,
                updated_at: new Date().toISOString()
              })
              importCount++
            }
          })
          
          saveFavorites()
          resolve(importCount)
        } catch (error) {
          reject(error)
        }
      }
      
      reader.onerror = () => {
        reject(new Error('文件读取失败'))
      }
      
      reader.readAsText(file)
    })
  }
  
  // 计算属性
  const favoriteCount = computed(() => favorites.value.length)
  
  const favoritesByType = computed(() => {
    const grouped = {}
    favorites.value.forEach(item => {
      // 根据站源名称中的标识进行分类
      const siteName = item.api_info?.site_name || ''
      let type = '影视' // 默认分类
      
      if (siteName.includes('[书]')) {
        type = '小说'
      } else if (siteName.includes('[画]')) {
        type = '漫画'
      } else if (siteName.includes('[密]')) {
        type = '密'
      } else if (siteName.includes('[听]')) {
        type = '音频'
      } else if (siteName.includes('[儿]')) {
        type = '少儿'
      }
      
      if (!grouped[type]) {
        grouped[type] = []
      }
      grouped[type].push(item)
    })
    return grouped
  })
  
  // 初始化时加载数据
  loadFavorites()
  
  return {
    favorites,
    favoriteCount,
    favoritesByType,
    addFavorite,
    removeFavorite,
    isFavorited,
    getFavorite,
    clearFavorites,
    exportFavorites,
    importFavorites,
    loadFavorites,
    saveFavorites
  }
})