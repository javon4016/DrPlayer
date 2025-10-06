import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useParserStore = defineStore('parser', () => {
  // 解析列表
  const parsers = ref([])
  
  // 加载状态
  const loading = ref(false)
  
  // 错误信息
  const error = ref(null)
  
  // 计算属性
  const enabledParsers = computed(() => 
    parsers.value.filter(parser => parser.enabled !== false)
  )
  
  const disabledParsers = computed(() => 
    parsers.value.filter(parser => parser.enabled === false)
  )
  
  const parserCount = computed(() => parsers.value.length)
  
  // 从配置地址加载解析列表
  const loadParsersFromConfig = async (configUrl) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await fetch(configUrl)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      if (data.parses && Array.isArray(data.parses)) {
        // 为每个解析器添加唯一ID和启用状态
        parsers.value = data.parses.map((parser, index) => ({
          ...parser,
          id: parser.id || `parser_${Date.now()}_${index}`,
          enabled: parser.enabled !== false, // 默认启用
          order: index
        }))
        
        // 保存到本地存储
        saveToLocalStorage()
        return true
      } else {
        throw new Error('配置数据格式错误：缺少parses字段')
      }
    } catch (err) {
      error.value = err.message
      console.error('加载解析配置失败:', err)
      return false
    } finally {
      loading.value = false
    }
  }
  
  // 从本地存储加载
  const loadFromLocalStorage = () => {
    try {
      const stored = localStorage.getItem('drplayer_parsers')
      if (stored) {
        const data = JSON.parse(stored)
        if (Array.isArray(data)) {
          parsers.value = data
          return true
        }
      }
    } catch (err) {
      console.error('从本地存储加载解析配置失败:', err)
    }
    return false
  }
  
  // 保存到本地存储
  const saveToLocalStorage = () => {
    try {
      localStorage.setItem('drplayer_parsers', JSON.stringify(parsers.value))
    } catch (err) {
      console.error('保存解析配置到本地存储失败:', err)
    }
  }
  
  // 添加解析器
  const addParser = (parser) => {
    const newParser = {
      ...parser,
      id: `parser_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      enabled: true,
      order: parsers.value.length
    }
    parsers.value.push(newParser)
    saveToLocalStorage()
    return newParser
  }
  
  // 更新解析器
  const updateParser = (id, updates) => {
    const index = parsers.value.findIndex(p => p.id === id)
    if (index !== -1) {
      parsers.value[index] = { ...parsers.value[index], ...updates }
      saveToLocalStorage()
      return true
    }
    return false
  }
  
  // 删除解析器
  const deleteParser = (id) => {
    const index = parsers.value.findIndex(p => p.id === id)
    if (index !== -1) {
      parsers.value.splice(index, 1)
      saveToLocalStorage()
      return true
    }
    return false
  }
  
  // 切换启用状态
  const toggleParser = (id) => {
    const parser = parsers.value.find(p => p.id === id)
    if (parser) {
      parser.enabled = !parser.enabled
      saveToLocalStorage()
      return parser.enabled
    }
    return false
  }
  
  // 重新排序
  const reorderParsers = (newOrder) => {
    parsers.value = newOrder.map((parser, index) => ({
      ...parser,
      order: index
    }))
    saveToLocalStorage()
  }

  // 根据ID映射重新排序（只更新参与拖拽的解析器）
  const reorderParsersById = (orderMap) => {
    // 创建一个新的解析器数组，保持原有的解析器不变
    const updatedParsers = [...parsers.value]
    
    // 只更新参与拖拽的解析器的order属性
    updatedParsers.forEach(parser => {
      if (orderMap.has(parser.id)) {
        parser.order = orderMap.get(parser.id)
      }
    })
    
    // 按order排序
    updatedParsers.sort((a, b) => a.order - b.order)
    
    // 重新分配连续的order值
    updatedParsers.forEach((parser, index) => {
      parser.order = index
    })
    
    parsers.value = updatedParsers
    saveToLocalStorage()
  }
  
  // 测试解析器
  const testParser = async (parser, testUrl) => {
    try {
      // 构建解析请求URL
      const parseUrl = parser.url.replace(/\{url\}/g, encodeURIComponent(testUrl))
      
      const response = await fetch(parseUrl, {
        method: 'GET',
        headers: parser.header || {},
        timeout: 10000 // 10秒超时
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const result = await response.text()
      
      // 简单验证返回结果是否包含视频链接
      const hasVideoUrl = /https?:\/\/[^\s]+\.(mp4|m3u8|flv)/i.test(result)
      
      return {
        success: true,
        hasVideoUrl,
        response: result,
        message: hasVideoUrl ? '解析成功，检测到视频链接' : '解析完成，但未检测到视频链接'
      }
    } catch (err) {
      return {
        success: false,
        error: err.message,
        message: `解析失败: ${err.message}`
      }
    }
  }
  
  // 导出配置
  const exportParsers = () => {
    const exportData = {
      parses: parsers.value.map(parser => ({
        name: parser.name,
        url: parser.url,
        type: parser.type,
        ext: parser.ext,
        header: parser.header
      })),
      exportTime: new Date().toISOString(),
      version: '1.0'
    }
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    })
    
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `drplayer_parsers_${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
  
  // 导入配置
  const importParsers = async (file) => {
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      
      if (data.parses && Array.isArray(data.parses)) {
        // 合并导入的解析器
        const importedParsers = data.parses.map((parser, index) => ({
          ...parser,
          id: `imported_${Date.now()}_${index}`,
          enabled: true,
          order: parsers.value.length + index
        }))
        
        parsers.value.push(...importedParsers)
        saveToLocalStorage()
        return { success: true, count: importedParsers.length }
      } else {
        throw new Error('导入文件格式错误：缺少parses字段')
      }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }
  
  // 清空所有解析器
  const clearAllParsers = () => {
    parsers.value = []
    saveToLocalStorage()
  }
  
  // 初始化时从本地存储加载
  loadFromLocalStorage()
  
  // loadParsers作为loadFromLocalStorage的别名，用于兼容性
  const loadParsers = () => {
    loadFromLocalStorage()
  }

  return {
    // 状态
    parsers,
    loading,
    error,
    
    // 计算属性
    enabledParsers,
    disabledParsers,
    parserCount,
    
    // 方法
    loadParsers,
    loadParsersFromConfig,
    loadFromLocalStorage,
    saveToLocalStorage,
    addParser,
    updateParser,
    deleteParser,
    toggleParser,
    reorderParsers,
    reorderParsersById,
    testParser,
    exportParsers,
    importParsers,
    clearAllParsers
  }
})