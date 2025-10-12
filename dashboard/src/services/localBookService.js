// 本地图书存储服务
class LocalBookService {
  constructor() {
    this.storageKey = 'drplayer-local-books'
    this.books = []
    this.listeners = [] // 事件监听器
    this.loadBooks()
  }

  // 添加事件监听器
  addEventListener(listener) {
    this.listeners.push(listener)
  }

  // 移除事件监听器
  removeEventListener(listener) {
    const index = this.listeners.indexOf(listener)
    if (index > -1) {
      this.listeners.splice(index, 1)
    }
  }

  // 触发事件
  emit(eventType, data) {
    this.listeners.forEach(listener => {
      try {
        listener(eventType, data)
      } catch (error) {
        console.error('事件监听器执行失败:', error)
      }
    })
  }

  // 从localStorage加载本地图书数据
  loadBooks() {
    try {
      const stored = localStorage.getItem(this.storageKey)
      if (stored) {
        this.books = JSON.parse(stored)
      }
    } catch (error) {
      console.error('加载本地图书数据失败:', error)
      this.books = []
    }
  }

  // 保存本地图书数据到localStorage
  saveBooks() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.books))
    } catch (error) {
      console.error('保存本地图书数据失败:', error)
    }
  }

  // 生成唯一ID
  generateId() {
    return 'local_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
  }

  // 添加本地图书
  addLocalBook(bookData) {
    const book = {
      id: this.generateId(),
      title: bookData.title,
      author: bookData.author || '未知作者',
      cover: bookData.cover || '', // 封面图片URL或base64
      filePath: bookData.filePath, // 本地文件路径
      fileName: bookData.fileName, // 文件名
      fileSize: bookData.fileSize || 0, // 文件大小
      content: bookData.content || '', // 文件内容（可选，用于小文件）
      type: 'local', // 标识为本地图书
      category: bookData.category || '小说', // 分类
      description: bookData.description || '',
      addedAt: Date.now(),
      lastReadAt: null,
      readingProgress: {
        position: 0, // 阅读位置
        percentage: 0, // 阅读百分比
        chapter: 0, // 当前章节（如果有）
        lastReadTime: null
      },
      tags: bookData.tags || [], // 标签
      favorite: false, // 是否收藏
      rating: 0 // 评分
    }

    this.books.unshift(book)
    this.saveBooks()
    return book
  }

  // 检查是否存在重复图书
  findDuplicateBook(title, author) {
    return this.books.find(book => 
      book.title === title && book.author === author
    )
  }

  // 从内容添加图书（用于下载任务导出）
  addBookFromContent(bookData, options = {}) {
    const { allowOverwrite = false } = options
    
    // 检查重复
    const existingBook = this.findDuplicateBook(bookData.title, bookData.author || '未知作者')
    if (existingBook && !allowOverwrite) {
      // 返回重复信息，让调用者处理
      return {
        success: false,
        duplicate: true,
        existingBook,
        message: `图书《${bookData.title}》已存在`
      }
    }

    // 检查存储空间限制（覆盖时不需要检查，因为不会增加总大小）
    if (!existingBook || !allowOverwrite) {
      const contentSize = new Blob([bookData.content]).size
      if (!this.canAddBook(contentSize)) {
        const storageStats = this.getStorageStats()
        return {
          success: false,
          storageLimit: true,
          message: `存储空间不足！当前已用 ${storageStats.formattedUsed}，剩余 ${storageStats.formattedAvailable}，需要 ${this.formatFileSize(contentSize)}`
        }
      }
    }

    const book = {
      id: existingBook && allowOverwrite ? existingBook.id : this.generateId(),
      title: bookData.title,
      author: bookData.author || '未知作者',
      cover: bookData.cover || '',
      filePath: '', // 虚拟路径，因为内容直接存储
      fileName: bookData.fileName || `${bookData.title}.txt`,
      fileSize: new Blob([bookData.content]).size,
      content: bookData.content,
      type: 'local',
      category: '小说',
      description: bookData.description || '',
      addedAt: bookData.addedAt || Date.now(),
      lastReadAt: null,
      readingProgress: {
        position: 0,
        percentage: 0,
        chapter: 0,
        lastReadTime: null
      },
      tags: bookData.source === 'download' ? ['下载导入'] : [],
      favorite: false,
      rating: 0
    }

    if (existingBook && allowOverwrite) {
      // 覆盖现有图书
      const index = this.books.findIndex(b => b.id === existingBook.id)
      if (index !== -1) {
        // 保留原有的阅读进度和收藏状态
        book.readingProgress = existingBook.readingProgress
        book.favorite = existingBook.favorite
        book.rating = existingBook.rating
        book.lastReadAt = existingBook.lastReadAt
        this.books[index] = book
      }
    } else {
      // 添加新图书
      this.books.unshift(book)
    }

    this.saveBooks()
    
    // 触发事件
    this.emit('bookAdded', { book, isOverwrite: existingBook && allowOverwrite })
    
    return {
      success: true,
      book,
      isOverwrite: existingBook && allowOverwrite
    }
  }

  // 从下载任务添加图书
  addBookFromDownloadTask(task) {
    const book = {
      id: this.generateId(),
      title: task.novelTitle,
      author: task.novelAuthor || '未知作者',
      cover: task.novelCover || '',
      filePath: '', // 将在导出TXT后设置
      fileName: `${task.novelTitle}.txt`,
      fileSize: task.downloadedSize || 0,
      content: '', // 将从章节内容生成
      type: 'local',
      category: '小说',
      description: task.novelDescription || '',
      addedAt: Date.now(),
      lastReadAt: null,
      readingProgress: {
        position: 0,
        percentage: 0,
        chapter: 0,
        lastReadTime: null
      },
      tags: ['下载导入'],
      favorite: false,
      rating: 0,
      // 保存原始下载任务信息
      sourceTask: {
        id: task.id,
        totalChapters: task.totalChapters,
        completedChapters: task.completedChapters,
        createdAt: task.createdAt
      }
    }

    this.books.unshift(book)
    this.saveBooks()
    return book
  }

  // 获取所有本地图书
  getAllBooks() {
    return this.books
  }

  // 根据ID获取图书
  getBookById(id) {
    return this.books.find(book => book.id === id)
  }

  // 根据分类获取图书
  getBooksByCategory(category) {
    if (category === 'all') {
      return this.books
    }
    return this.books.filter(book => book.category === category)
  }

  // 搜索图书
  searchBooks(keyword) {
    if (!keyword.trim()) {
      return this.books
    }
    
    const lowerKeyword = keyword.toLowerCase()
    return this.books.filter(book => 
      book.title.toLowerCase().includes(lowerKeyword) ||
      book.author.toLowerCase().includes(lowerKeyword) ||
      book.description.toLowerCase().includes(lowerKeyword) ||
      book.tags.some(tag => tag.toLowerCase().includes(lowerKeyword))
    )
  }

  // 更新阅读进度
  updateReadingProgress(bookId, progress) {
    const book = this.getBookById(bookId)
    if (book) {
      book.readingProgress = {
        ...book.readingProgress,
        ...progress,
        lastReadTime: Date.now()
      }
      book.lastReadAt = Date.now()
      this.saveBooks()
      return true
    }
    return false
  }

  // 删除图书
  deleteBook(bookId) {
    const index = this.books.findIndex(book => book.id === bookId)
    if (index !== -1) {
      this.books.splice(index, 1)
      this.saveBooks()
      return true
    }
    return false
  }

  // 更新图书信息
  updateBook(bookId, updates) {
    const book = this.getBookById(bookId)
    if (book) {
      Object.assign(book, updates)
      this.saveBooks()
      return book
    }
    return null
  }

  // 切换收藏状态
  toggleFavorite(bookId) {
    const book = this.getBookById(bookId)
    if (book) {
      book.favorite = !book.favorite
      this.saveBooks()
      return book.favorite
    }
    return false
  }

  // 设置评分
  setRating(bookId, rating) {
    const book = this.getBookById(bookId)
    if (book && rating >= 0 && rating <= 5) {
      book.rating = rating
      this.saveBooks()
      return true
    }
    return false
  }

  // 获取统计信息
  getStats() {
    const total = this.books.length
    const categories = {}
    const recentlyRead = this.books.filter(book => book.lastReadAt).length
    const favorites = this.books.filter(book => book.favorite).length

    this.books.forEach(book => {
      categories[book.category] = (categories[book.category] || 0) + 1
    })

    return {
      total,
      categories,
      recentlyRead,
      favorites
    }
  }

  // 获取储存空间统计
  getStorageStats() {
    const STORAGE_LIMIT = 100 * 1024 * 1024 // 100MB 限制
    
    // 计算所有本地图书的总大小
    const usedBytes = this.books.reduce((total, book) => {
      return total + (book.fileSize || 0)
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

  // 检查是否可以添加新图书（基于大小限制）
  canAddBook(contentSize) {
    const storageStats = this.getStorageStats()
    return contentSize <= storageStats.availableBytes
  }

  // 导出图书数据
  exportBooks() {
    return {
      books: this.books,
      exportTime: new Date().toISOString(),
      version: '1.0'
    }
  }

  // 导入图书数据
  importBooks(data) {
    try {
      if (data.books && Array.isArray(data.books)) {
        // 合并导入的图书，避免重复
        const existingIds = new Set(this.books.map(book => book.id))
        const newBooks = data.books.filter(book => !existingIds.has(book.id))
        
        this.books.unshift(...newBooks)
        this.saveBooks()
        return newBooks.length
      }
      return 0
    } catch (error) {
      console.error('导入图书数据失败:', error)
      throw error
    }
  }

  // 删除本地图书
  deleteLocalBook(bookId) {
    try {
      const bookIndex = this.books.findIndex(book => book.id === bookId)
      
      if (bookIndex === -1) {
        return {
          success: false,
          error: '图书不存在'
        }
      }

      const deletedBook = this.books[bookIndex]
      
      // 从数组中移除图书
      this.books.splice(bookIndex, 1)
      
      // 保存到本地存储
      this.saveBooks()
      
      // 触发删除事件
      this.emit('bookDeleted', { book: deletedBook })
      
      return {
        success: true,
        deletedBook
      }
    } catch (error) {
      console.error('删除本地图书失败:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // 批量删除本地图书
  deleteMultipleBooks(bookIds) {
    try {
      const deletedBooks = []
      
      // 按ID删除图书
      bookIds.forEach(bookId => {
        const bookIndex = this.books.findIndex(book => book.id === bookId)
        if (bookIndex !== -1) {
          deletedBooks.push(this.books[bookIndex])
          this.books.splice(bookIndex, 1)
        }
      })
      
      if (deletedBooks.length > 0) {
        // 保存到本地存储
        this.saveBooks()
        
        // 触发批量删除事件
        this.emit('booksDeleted', { books: deletedBooks })
      }
      
      return {
        success: true,
        deletedCount: deletedBooks.length,
        deletedBooks
      }
    } catch (error) {
      console.error('批量删除本地图书失败:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // 清空所有图书
  clearAllBooks() {
    this.books = []
    this.saveBooks()
    
    // 触发清空事件
    this.emit('allBooksCleared')
  }

  // 读取本地文件内容
  async readLocalFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        resolve(e.target.result)
      }
      reader.onerror = (e) => {
        reject(new Error('文件读取失败'))
      }
      reader.readAsText(file, 'utf-8')
    })
  }

  // 处理文件上传
  async handleFileUpload(file) {
    try {
      // 验证文件类型
      if (!file.name.toLowerCase().endsWith('.txt')) {
        throw new Error('只支持TXT格式的文件')
      }

      // 读取文件内容
      const content = await this.readLocalFile(file)
      
      // 提取书名（从文件名）
      const title = file.name.replace(/\.txt$/i, '')
      
      // 创建图书数据
      const bookData = {
        title,
        fileName: file.name,
        fileSize: file.size,
        content,
        filePath: file.name, // 浏览器环境下使用文件名作为路径标识
        category: '小说',
        tags: ['本地导入']
      }

      return this.addLocalBook(bookData)
    } catch (error) {
      console.error('处理文件上传失败:', error)
      throw error
    }
  }
}

// 创建单例实例
export const localBookService = new LocalBookService()
export default localBookService