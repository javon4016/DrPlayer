import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useHistoryStore = defineStore('history', () => {
  // 状态
  const histories = ref([])

  // 计算属性
  const historyCount = computed(() => histories.value.length)
  
  const sortedHistories = computed(() => {
    return [...histories.value].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
  })

  const historiesByType = computed(() => {
    const grouped = {}
    histories.value.forEach(item => {
      // 根据站源名称中的标识进行分类（与Collection.vue中的逻辑保持一致）
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

  // 方法
  const loadHistories = () => {
    try {
      const stored = localStorage.getItem('drplayer_histories')
      if (stored) {
        histories.value = JSON.parse(stored)
      }
    } catch (error) {
      console.error('加载观看历史失败:', error)
      histories.value = []
    }
  }

  const saveHistories = () => {
    try {
      localStorage.setItem('drplayer_histories', JSON.stringify(histories.value))
    } catch (error) {
      console.error('保存观看历史失败:', error)
    }
  }

  const addToHistory = (videoInfo, routeInfo, episodeInfo) => {
    const now = new Date().toISOString()
    
    // 调试：检查传入的videoInfo
    console.log('=== historyStore.addToHistory 调试 ===')
    console.log('传入的videoInfo.api_info:', videoInfo.api_info)
    console.log('传入的videoInfo.api_info.ext:', videoInfo.api_info.ext)
    
    // 检查是否已存在相同的视频
    const existingIndex = histories.value.findIndex(
      item => item.id === videoInfo.id && item.api_info.api_url === videoInfo.api_info.api_url
    )

    const historyItem = {
      ...videoInfo,
      current_route_name: routeInfo.name,
      current_route_index: routeInfo.index,
      current_episode_name: episodeInfo.name,
      current_episode_index: episodeInfo.index,
      current_episode_url: episodeInfo.url,
      updated_at: now
    }

    if (existingIndex !== -1) {
      // 更新已存在的记录
      histories.value[existingIndex] = {
        ...histories.value[existingIndex],
        ...historyItem
      }
      console.log('更新后的历史记录api_info:', histories.value[existingIndex].api_info)
    } else {
      // 添加新记录
      historyItem.created_at = now
      histories.value.push(historyItem)
      console.log('新添加的历史记录api_info:', historyItem.api_info)
    }
    
    console.log('=== historyStore.addToHistory 调试结束 ===')
    saveHistories()
  }

  const removeFromHistory = (item) => {
    if (!item || !item.id || !item.api_info || !item.api_info.api_url) {
      console.error('删除历史记录失败：参数无效', item)
      return false
    }
    
    const index = histories.value.findIndex(
      h => h.id === item.id && h.api_info.api_url === item.api_info.api_url
    )
    
    if (index !== -1) {
      histories.value.splice(index, 1)
      saveHistories()
      console.log('删除历史记录成功:', item.name)
      return true
    } else {
      console.warn('未找到要删除的历史记录:', item)
      return false
    }
  }

  const clearHistories = () => {
    histories.value = []
    saveHistories()
  }

  const exportHistories = () => {
    const dataStr = JSON.stringify(histories.value, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    
    const link = document.createElement('a')
    link.href = URL.createObjectURL(dataBlob)
    link.download = `drplayer_histories_${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const importHistories = (jsonData) => {
    try {
      const importedHistories = JSON.parse(jsonData)
      
      if (!Array.isArray(importedHistories)) {
        throw new Error('导入的数据格式不正确')
      }

      // 验证数据结构
      const validHistories = importedHistories.filter(item => {
        return item.id && 
               item.name && 
               item.pic && 
               item.api_info && 
               item.current_route_name && 
               item.current_episode_name
      })

      // 合并历史记录，避免重复
      validHistories.forEach(importedItem => {
        const existingIndex = histories.value.findIndex(
          item => item.id === importedItem.id && item.api_info.api_url === importedItem.api_info.api_url
        )

        if (existingIndex === -1) {
          histories.value.push(importedItem)
        } else {
          // 如果导入的记录更新，则更新现有记录
          const existingItem = histories.value[existingIndex]
          const importedTime = new Date(importedItem.updated_at)
          const existingTime = new Date(existingItem.updated_at)
          
          if (importedTime > existingTime) {
            histories.value[existingIndex] = importedItem
          }
        }
      })

      saveHistories()
      return validHistories.length
    } catch (error) {
      throw new Error(`导入失败: ${error.message}`)
    }
  }

  const getHistoryByVideo = (videoId, apiUrl) => {
    return histories.value.find(
      item => item.id === videoId && item.api_info.api_url === apiUrl
    )
  }

  // 获取某个视频的观看进度信息
  const getWatchProgress = (videoId, apiUrl) => {
    const history = getHistoryByVideo(videoId, apiUrl)
    if (!history) return null

    return {
      routeName: history.current_route_name,
      routeIndex: history.current_route_index,
      episodeName: history.current_episode_name,
      episodeIndex: history.current_episode_index,
      episodeUrl: history.current_episode_url,
      lastWatchTime: history.updated_at
    }
  }

  return {
    // 状态
    histories,
    
    // 计算属性
    historyCount,
    sortedHistories,
    historiesByType,
    
    // 方法
    loadHistories,
    saveHistories,
    addToHistory,
    removeFromHistory,
    clearHistories,
    exportHistories,
    importHistories,
    getHistoryByVideo,
    getWatchProgress
  }
})