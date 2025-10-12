import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { downloadService } from '@/services/downloadService'
import localBookService from '@/services/localBookService'
import { Message, Modal } from '@arco-design/web-vue'

export const useDownloadStore = defineStore('download', () => {
  // 任务列表
  const tasks = ref([])
  
  // 加载状态
  const loading = ref(false)
  
  // 从downloadService加载任务
  const loadTasks = () => {
    tasks.value = downloadService.getAllTasks()
  }
  
  // 保存任务到downloadService
  const saveTasks = () => {
    downloadService.saveTasksToStorage()
  }
  
  // 添加下载任务
  const addTask = (taskData) => {
    const task = downloadService.createTask(taskData)
    loadTasks() // 重新加载任务列表
    return task
  }
  
  // 开始任务
  const startTask = (taskId) => {
    downloadService.startTask(taskId)
    loadTasks()
  }
  
  // 暂停任务
  const pauseTask = (taskId) => {
    downloadService.pauseTask(taskId)
    loadTasks()
  }
  
  // 恢复任务
  const resumeTask = (taskId) => {
    downloadService.startTask(taskId)
    loadTasks()
  }
  
  // 取消任务
  const cancelTask = (taskId) => {
    downloadService.cancelTask(taskId)
    loadTasks()
  }
  
  // 删除任务
  const deleteTask = (taskId) => {
    downloadService.deleteTask(taskId)
    loadTasks()
  }
  
  // 重试任务
  const retryTask = (taskId) => {
    downloadService.startTask(taskId)
    loadTasks()
  }
  
  // 重试章节
  const retryChapter = (taskId, chapterIndex) => {
    downloadService.retryChapter(taskId, chapterIndex)
    loadTasks()
  }
  
  // 导出任务
  const exportTask = async (taskId, options = {}) => {
    try {
      const task = downloadService.getTask(taskId)
      if (!task) {
        Message.error('任务不存在')
        return
      }

      if (task.status !== 'completed') {
        Message.error('只能导出已完成的任务')
        return
      }

      // 生成TXT内容
      const txtContent = downloadService.generateTxtContent(taskId)
      if (!txtContent) {
        Message.error('生成TXT内容失败')
        return
      }

      // 如果选择导出到书画柜
      if (options.exportToGallery) {
        const bookData = {
          title: task.novelTitle,
          author: task.novelAuthor || '未知',
          description: task.novelDescription || '',
          cover: task.novelCover || '',
          content: txtContent,
          fileName: `${task.settings.fileName || task.novelTitle}.txt`,
          addedAt: Date.now(),
          source: 'download'
        }

        // 尝试添加图书，检查是否重复
        const result = localBookService.addBookFromContent(bookData)
        
        if (result.success) {
          const action = result.isOverwrite ? '更新' : '添加'
          Message.success(`《${task.novelTitle}》已${action}到书画柜`)
          return { success: true, action: 'addToGallery', isOverwrite: result.isOverwrite }
        } else if (result.duplicate) {
          // 显示覆盖确认对话框
          return new Promise((resolve) => {
            Modal.confirm({
              title: '图书已存在',
              content: `书画柜中已存在《${bookData.title}》（作者：${bookData.author}），是否要覆盖现有图书？`,
              okText: '覆盖',
              cancelText: '取消',
              onOk: () => {
                // 用户选择覆盖
                const overwriteResult = localBookService.addBookFromContent(bookData, { allowOverwrite: true })
                if (overwriteResult.success) {
                  Message.success(`《${task.novelTitle}》已更新到书画柜`)
                  resolve({ success: true, action: 'addToGallery', isOverwrite: true })
                } else {
                  Message.error('更新图书失败')
                  resolve({ success: false })
                }
              },
              onCancel: () => {
                Message.info('已取消导出')
                resolve({ success: false, cancelled: true })
              }
            })
          })
        } else if (result.storageLimit) {
          // 存储空间不足
          Message.error(result.message)
          return { success: false, storageLimit: true }
        } else {
          Message.error(result.message || '添加图书失败')
          return { success: false }
        }
      } else {
        // 默认下载TXT文件
        const result = downloadService.exportToTxt(taskId)
        Message.success('TXT文件导出成功')
        return result
      }
    } catch (error) {
      console.error('导出任务失败:', error)
      Message.error('导出失败: ' + error.message)
      return null
    }
  }
  
  // 清理已完成的任务
  const clearCompleted = () => {
    const completedTasks = tasks.value.filter(task => task.status === 'completed')
    completedTasks.forEach(task => {
      downloadService.deleteTask(task.id)
    })
    loadTasks()
  }
  
  // 计算属性
  const taskStats = computed(() => {
    return downloadService.getTaskStats()
  })
  
  // 根据状态过滤任务
  const getTasksByStatus = (status) => {
    return downloadService.getTasksByStatus(status)
  }
  
  // 设置任务更新回调
  downloadService.setTaskUpdateCallback(() => {
    loadTasks()
  })
  
  // 初始化时加载任务
  loadTasks()
  
  return {
    tasks,
    loading,
    taskStats,
    loadTasks,
    saveTasks,
    addTask,
    startTask,
    pauseTask,
    resumeTask,
    cancelTask,
    deleteTask,
    retryTask,
    retryChapter,
    exportTask,
    clearCompleted,
    getTasksByStatus
  }
})