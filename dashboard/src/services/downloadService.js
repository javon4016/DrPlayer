import videoService from '../api/services/video.js'

class DownloadService {
  constructor() {
    this.tasks = new Map()
    this.isDownloading = false
    this.currentTask = null
    this.downloadQueue = []
    this.maxConcurrent = 3
    this.activeDownloads = new Set()
    
    // 从本地存储恢复任务
    this.loadTasksFromStorage()
    
    // 定期保存任务状态
    setInterval(() => {
      this.saveTasksToStorage()
    }, 5000)
  }

  // 创建新的下载任务
  createTask(novelInfo, selectedChapters, settings = {}) {
    const taskId = this.generateTaskId()
    const task = {
      id: taskId,
      novelTitle: novelInfo.title,
      novelId: novelInfo.id,
      novelUrl: novelInfo.url,
      novelAuthor: novelInfo.author || '未知',
      novelDescription: novelInfo.description || '',
      novelCover: novelInfo.cover || '', // 保存封面图片
      totalChapters: selectedChapters.length,
      completedChapters: 0,
      failedChapters: 0,
      status: 'pending', // pending, downloading, paused, completed, failed
      progress: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      settings: {
        fileName: settings.fileName || novelInfo.title,
        concurrent: settings.concurrent || 3,
        retryCount: settings.retryCount || 3,
        chapterInterval: settings.chapterInterval || 1000,
        ...settings
      },
      chapters: selectedChapters.map((chapter, index) => ({
        index,
        name: chapter.name || `第${index + 1}章`,
        url: chapter.url,
        status: 'pending', // pending, downloading, completed, failed
        progress: 0,
        content: '',
        size: 0,
        error: null,
        retryCount: 0,
        startTime: null,
        completeTime: null
      })),
      error: null,
      downloadedSize: 0,
      totalSize: 0,
      startTime: null,
      completeTime: null
    }

    this.tasks.set(taskId, task)
    this.saveTasksToStorage()
    
    return task
  }

  // 开始下载任务
  async startTask(taskId) {
    const task = this.tasks.get(taskId)
    if (!task) {
      throw new Error('任务不存在')
    }

    if (task.status === 'downloading') {
      return
    }

    task.status = 'downloading'
    task.startTime = task.startTime || Date.now() // 设置开始时间
    task.updatedAt = Date.now()
    this.updateTask(task)

    // 添加到下载队列
    if (!this.downloadQueue.includes(taskId)) {
      this.downloadQueue.push(taskId)
    }

    // 开始处理队列
    this.processDownloadQueue()
  }

  // 暂停下载任务
  pauseTask(taskId) {
    const task = this.tasks.get(taskId)
    if (!task) return

    task.status = 'paused'
    task.updatedAt = Date.now()
    this.updateTask(task)

    // 从队列中移除
    const queueIndex = this.downloadQueue.indexOf(taskId)
    if (queueIndex > -1) {
      this.downloadQueue.splice(queueIndex, 1)
    }

    // 停止正在下载的章节
    this.activeDownloads.delete(taskId)
  }

  // 取消下载任务
  cancelTask(taskId) {
    const task = this.tasks.get(taskId)
    if (!task) return

    this.pauseTask(taskId)
    
    // 重置所有下载中的章节状态
    task.chapters.forEach(chapter => {
      if (chapter.status === 'downloading') {
        chapter.status = 'pending'
        chapter.progress = 0
        chapter.startTime = null
      }
    })

    task.status = 'pending'
    task.progress = 0
    this.updateTask(task)
  }

  // 删除下载任务
  deleteTask(taskId) {
    const task = this.tasks.get(taskId)
    if (!task) return

    this.cancelTask(taskId)
    this.tasks.delete(taskId)
    this.saveTasksToStorage()
  }

  // 重试失败的章节
  async retryChapter(taskId, chapterIndex) {
    const task = this.tasks.get(taskId)
    if (!task) return

    const chapter = task.chapters[chapterIndex]
    if (!chapter) return

    chapter.status = 'pending'
    chapter.error = null
    chapter.retryCount = 0
    chapter.progress = 0
    
    this.updateTask(task)

    // 如果任务正在下载，立即处理这个章节
    if (task.status === 'downloading') {
      this.downloadChapter(task, chapter)
    }
  }

  // 处理下载队列
  async processDownloadQueue() {
    if (this.downloadQueue.length === 0) return

    const taskId = this.downloadQueue[0]
    const task = this.tasks.get(taskId)
    
    if (!task || task.status !== 'downloading') {
      this.downloadQueue.shift()
      this.processDownloadQueue()
      return
    }

    this.currentTask = task
    await this.downloadTask(task)
    
    // 任务完成后处理下一个
    this.downloadQueue.shift()
    this.currentTask = null
    
    if (this.downloadQueue.length > 0) {
      setTimeout(() => this.processDownloadQueue(), 1000)
    }
  }

  // 下载单个任务
  async downloadTask(task) {
    const pendingChapters = task.chapters.filter(ch => ch.status === 'pending')
    
    if (pendingChapters.length === 0) {
      this.completeTask(task)
      return
    }

    // 并发下载章节
    const concurrent = Math.min(task.settings.concurrent, pendingChapters.length)
    const downloadPromises = []

    for (let i = 0; i < concurrent; i++) {
      downloadPromises.push(this.downloadChaptersConcurrently(task))
    }

    await Promise.all(downloadPromises)
    this.completeTask(task)
  }

  // 并发下载章节
  async downloadChaptersConcurrently(task) {
    while (task.status === 'downloading') {
      const chapter = task.chapters.find(ch => ch.status === 'pending')
      if (!chapter) break

      await this.downloadChapter(task, chapter)
      
      // 章节间隔
      if (task.settings.chapterInterval > 0) {
        await this.sleep(task.settings.chapterInterval)
      }
    }
  }

  // 下载单个章节
  async downloadChapter(task, chapter) {
    if (chapter.status !== 'pending') return

    chapter.status = 'downloading'
    chapter.startTime = Date.now()
    chapter.progress = 0
    this.updateTask(task)

    try {
      console.log(`开始下载章节: ${chapter.name}`)

      // 调用正确的T4播放接口获取章节内容
      const parseParams = {
        play: chapter.url,
        flag: task.settings.flag || '',
        apiUrl: task.settings.apiUrl || '',
        extend: task.settings.extend || ''
      }
      
      const parseResult = await videoService.parseEpisodePlayUrl(task.settings.module, parseParams)
      console.log('章节播放解析结果:', parseResult)
      
      // 解析小说内容
      let novelContent = null
      if (parseResult.url && parseResult.url.startsWith('novel://')) {
        const novelData = parseResult.url.replace('novel://', '')
        novelContent = JSON.parse(novelData)
      } else {
        throw new Error('无法解析小说内容，返回的不是小说格式')
      }

      // 更新章节内容和状态
      chapter.content = novelContent.content || ''
      chapter.size = new Blob([chapter.content]).size
      chapter.status = 'completed'
      chapter.progress = 100
      chapter.completeTime = Date.now()
      
      task.completedChapters++
      task.downloadedSize += chapter.size

      console.log(`章节下载完成: ${chapter.name}`)
    } catch (error) {
      console.error('下载章节失败:', error)
      
      chapter.status = 'failed'
      chapter.error = error.message
      chapter.retryCount++
      task.failedChapters++

      // 自动重试
      if (chapter.retryCount < task.settings.retryCount) {
        console.log(`章节下载失败，准备重试 (${chapter.retryCount}/${task.settings.retryCount}): ${chapter.name}`)
        await this.sleep(2000)
        chapter.status = 'pending'
        chapter.error = null
        task.failedChapters--
      } else {
        console.log(`章节下载失败，已达到最大重试次数: ${chapter.name}`)
      }
    }

    this.updateTaskProgress(task)
    this.updateTask(task)
  }

  // 构造章节URL
  buildChapterUrl(novelUrl, chapterUrl) {
    // 如果章节URL是完整的，直接使用
    if (chapterUrl.startsWith('http')) {
      return chapterUrl
    }
    
    // 如果是相对路径，拼接基础URL
    if (chapterUrl.startsWith('/')) {
      const baseUrl = new URL(novelUrl).origin
      return baseUrl + chapterUrl
    }
    
    // 其他情况，基于小说URL构造
    return `${novelUrl}/${chapterUrl}`
  }

  // 解析小说内容（基于BookReader.vue的逻辑）
  parseNovelContent(data) {
    if (typeof data === 'string') {
      // 如果是novel://协议的内容
      if (data.startsWith('novel://')) {
        try {
          const content = decodeURIComponent(data.substring(8))
          return content
        } catch (error) {
          return data
        }
      }
      return data
    }
    
    // 如果是对象，尝试提取文本内容
    if (typeof data === 'object') {
      return data.content || data.text || JSON.stringify(data)
    }
    
    return String(data)
  }

  // 完成任务
  completeTask(task) {
    const allCompleted = task.chapters.every(ch => ch.status === 'completed')
    const hasFailed = task.chapters.some(ch => ch.status === 'failed')
    
    if (allCompleted) {
      task.status = 'completed'
      task.completeTime = Date.now()
    } else if (hasFailed) {
      task.status = 'failed'
    } else {
      task.status = 'paused'
    }
    
    // 计算总大小
    task.totalSize = task.chapters.reduce((total, chapter) => total + (chapter.size || 0), 0)
    
    task.updatedAt = Date.now()
    this.updateTask(task)
  }

  // 更新任务进度
  updateTaskProgress(task) {
    const completedCount = task.chapters.filter(ch => ch.status === 'completed').length
    task.progress = Math.round((completedCount / task.totalChapters) * 100)
    task.completedChapters = completedCount
    task.failedChapters = task.chapters.filter(ch => ch.status === 'failed').length
    
    // 实时更新已下载大小和总大小
    task.downloadedSize = task.chapters
      .filter(ch => ch.status === 'completed')
      .reduce((total, chapter) => total + (chapter.size || 0), 0)
    task.totalSize = task.chapters.reduce((total, chapter) => total + (chapter.size || 0), 0)
  }

  // 更新任务
  updateTask(task) {
    task.updatedAt = Date.now()
    this.tasks.set(task.id, { ...task })
    
    // 触发事件通知UI更新
    this.notifyTaskUpdate(task)
  }

  // 导出为TXT文件
  exportToTxt(taskId) {
    const task = this.tasks.get(taskId)
    if (!task) return null

    const completedChapters = task.chapters
      .filter(ch => ch.status === 'completed')
      .sort((a, b) => a.index - b.index)

    if (completedChapters.length === 0) {
      throw new Error('没有已完成的章节可以导出')
    }

    let content = `${task.novelTitle}\n\n`
    
    completedChapters.forEach(chapter => {
      content += `${chapter.name}\n\n`
      content += `${chapter.content}\n\n`
      content += '---\n\n'
    })

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `${task.settings.fileName}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    URL.revokeObjectURL(url)
    
    return {
      fileName: `${task.settings.fileName}.txt`,
      size: blob.size,
      chapterCount: completedChapters.length
    }
  }

  // 获取所有任务
  getAllTasks() {
    return Array.from(this.tasks.values()).sort((a, b) => b.createdAt - a.createdAt)
  }

  // 获取单个任务
  getTask(taskId) {
    return this.tasks.get(taskId)
  }

  // 生成TXT内容
  generateTxtContent(taskId) {
    const task = this.tasks.get(taskId)
    if (!task) return null

    const completedChapters = task.chapters
      .filter(ch => ch.status === 'completed')
      .sort((a, b) => a.index - b.index)

    if (completedChapters.length === 0) {
      return null
    }

    let content = `${task.novelTitle}\n\n`
    
    completedChapters.forEach(chapter => {
      content += `${chapter.name}\n\n`
      content += `${chapter.content}\n\n`
      content += '---\n\n'
    })

    return content
  }

  // 根据状态过滤任务
  getTasksByStatus(status) {
    return this.getAllTasks().filter(task => {
      if (status === 'all') return true
      if (status === 'downloaded') return task.status === 'completed'
      if (status === 'downloading') return task.status === 'downloading'
      if (status === 'failed') return task.status === 'failed'
      if (status === 'pending') return task.status === 'pending' || task.status === 'paused'
      return task.status === status
    })
  }

  // 获取任务统计
  getTaskStats() {
    const tasks = this.getAllTasks()
    return {
      total: tasks.length,
      completed: tasks.filter(t => t.status === 'completed').length,
      downloading: tasks.filter(t => t.status === 'downloading').length,
      failed: tasks.filter(t => t.status === 'failed').length,
      pending: tasks.filter(t => t.status === 'pending' || t.status === 'paused').length
    }
  }

  // 获取储存空间统计
  getStorageStats() {
    const STORAGE_LIMIT = 100 * 1024 * 1024 // 100MB 限制，与书画柜独立
    
    // 计算所有下载任务的总大小
    const usedBytes = this.getAllTasks().reduce((total, task) => {
      return total + (task.downloadedSize || 0)
    }, 0)
    
    const availableBytes = Math.max(0, STORAGE_LIMIT - usedBytes)
    const usagePercentage = (usedBytes / STORAGE_LIMIT) * 100
    
    return {
      usedBytes,
      availableBytes,
      totalBytes: STORAGE_LIMIT,
      usagePercentage: Math.min(100, usagePercentage),
      isNearLimit: usagePercentage > 80,
      isOverLimit: usagePercentage >= 100,
      formattedUsed: this.formatFileSize(usedBytes),
      formattedAvailable: this.formatFileSize(availableBytes),
      formattedTotal: this.formatFileSize(STORAGE_LIMIT)
    }
  }

  // 格式化文件大小
  formatFileSize(bytes) {
    if (bytes === 0) return '0 B'
    
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // 检查是否可以添加新任务（基于大小限制）
  canAddTask(estimatedSize = 0) {
    const storageStats = this.getStorageStats()
    return estimatedSize <= storageStats.availableBytes
  }

  // 保存任务到本地存储
  saveTasksToStorage() {
    try {
      const tasksData = Array.from(this.tasks.entries())
      localStorage.setItem('novel_download_tasks', JSON.stringify(tasksData))
    } catch (error) {
      console.error('保存下载任务失败:', error)
    }
  }

  // 从本地存储加载任务
  loadTasksFromStorage() {
    try {
      const tasksData = localStorage.getItem('novel_download_tasks')
      if (tasksData) {
        const tasks = JSON.parse(tasksData)
        this.tasks = new Map(tasks)
        
        // 重置所有下载中的任务状态
        this.tasks.forEach(task => {
          if (task.status === 'downloading') {
            task.status = 'paused'
            task.chapters.forEach(chapter => {
              if (chapter.status === 'downloading') {
                chapter.status = 'pending'
                chapter.progress = 0
                chapter.startTime = null
              }
            })
          }
        })
      }
    } catch (error) {
      console.error('加载下载任务失败:', error)
      this.tasks = new Map()
    }
  }

  // 生成任务ID
  generateTaskId() {
    return 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
  }

  // 睡眠函数
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // 事件通知（可以扩展为EventEmitter）
  notifyTaskUpdate(task) {
    // 这里可以实现事件发布，通知UI组件更新
    if (this.onTaskUpdate) {
      this.onTaskUpdate(task)
    }
  }

  // 设置任务更新回调
  setTaskUpdateCallback(callback) {
    this.onTaskUpdate = callback
  }
}

// 创建单例实例
export const downloadService = new DownloadService()
export default downloadService