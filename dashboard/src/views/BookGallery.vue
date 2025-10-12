<template>
  <div class="book-gallery-container">
    <!-- 头部 -->
    <div class="book-gallery-header">
      <div class="header-left">
        <h1 class="page-title">我的书画柜</h1>
        <a-badge :count="bookGalleryCount" class="count-badge" />
      </div>
      <div class="header-actions">
        <a-input-search
          v-model="searchKeyword"
          placeholder="搜索我的书画..."
          style="width: 300px"
          @search="handleSearch"
          @clear="handleSearch"
          allow-clear
        />
        <a-dropdown @select="handleAction">
          <a-button type="outline">
            <template #icon>
              <icon-more />
            </template>
            更多操作
          </a-button>
          <template #content>
            <a-doption value="add-local">
              <template #icon>
                <icon-plus />
              </template>
              添加本地图书
            </a-doption>
            <a-doption value="import">
              <template #icon>
                <icon-import />
              </template>
              导入收藏
            </a-doption>
            <a-doption value="export">
              <template #icon>
                <icon-export />
              </template>
              导出收藏
            </a-doption>
            <a-doption value="download-manager">
              <template #icon>
                <icon-download />
              </template>
              下载管理
            </a-doption>
            <a-doption value="manage-api">
              <template #icon>
                <icon-settings />
              </template>
              API地址管理
            </a-doption>
            <a-doption value="clear" class="danger-option">
              <template #icon>
                <icon-delete />
              </template>
              清空书画柜
            </a-doption>
          </template>
        </a-dropdown>
      </div>
    </div>

    <!-- 分类筛选和储存空间统计 -->
    <div class="filter-section" v-if="bookGalleryCount > 0">
      <div class="filter-container">
        <!-- 分类按钮 -->
        <div class="filter-tabs">
          <a-button
            :type="selectedCategory === 'all' ? 'primary' : 'outline'"
            @click="selectedCategory = 'all'"
            size="small"
          >
            全部 ({{ bookGalleryCount }})
          </a-button>
          <a-button
            :type="selectedCategory === '小说' ? 'primary' : 'outline'"
            @click="selectedCategory = '小说'"
            size="small"
            v-if="novelCount > 0"
          >
            我的书架 ({{ novelCount }})
          </a-button>
          <a-button
            :type="selectedCategory === '本地图书' ? 'primary' : 'outline'"
            @click="selectedCategory = '本地图书'"
            size="small"
            v-if="localBookCount > 0"
          >
            本地图书 ({{ localBookCount }})
          </a-button>
          <a-button
            :type="selectedCategory === '漫画' ? 'primary' : 'outline'"
            @click="selectedCategory = '漫画'"
            size="small"
            v-if="comicCount > 0"
          >
            我的漫画柜 ({{ comicCount }})
          </a-button>
        </div>

        <!-- 储存空间统计 -->
        <div class="storage-stats" v-if="localBookCount > 0">
          <div class="storage-info">
            <div class="storage-header">
               <icon-book class="storage-icon" />
               <span class="storage-title">本地储存空间</span>
              <a-tag 
                :color="storageStats.isOverLimit ? 'red' : storageStats.isNearLimit ? 'orange' : 'green'"
                size="small"
              >
                {{ Math.round(storageStats.usagePercentage) }}%
              </a-tag>
            </div>
            <div class="storage-progress">
              <a-progress 
                :percent="storageStats.usagePercentage" 
                :color="storageStats.isOverLimit ? '#f53f3f' : storageStats.isNearLimit ? '#ff7d00' : '#00b42a'"
                :show-text="false"
                size="small"
              />
            </div>
            <div class="storage-details">
              <span class="storage-used">已用: {{ storageStats.formattedUsed }}</span>
              <span class="storage-available">可用: {{ storageStats.formattedAvailable }}</span>
              <span class="storage-total">总计: {{ storageStats.formattedTotal }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 书画柜列表 -->
    <div class="book-gallery-content">
      <!-- 空状态 -->
      <div v-if="bookGalleryCount === 0" class="empty-state">
        <a-empty description="还没有收藏任何书画">
          <template #image>
            <icon-book style="font-size: 64px; color: var(--color-text-4);" />
          </template>
          <a-button type="primary" @click="goToVideo">去发现好内容</a-button>
        </a-empty>
      </div>

      <!-- 书画网格 -->
      <div v-else class="books-grid">
        <VideoCard
          v-for="item in filteredBooks"
          :key="`${item.id}-${item.api_info.api_url}`"
          :item="item"
          type="favorite"
          @card-click="goToDetail"
          @image-click="showImageModal"
          @action-click="removeFavorite"
        />
      </div>
    </div>

    <!-- API地址管理组件 -->
    <ApiUrlManager
      v-model="showApiManager"
      @completed="handleApiManagerCompleted"
    />

    <!-- 导入文件输入 -->
    <input
      ref="fileInput"
      type="file"
      accept=".json"
      style="display: none"
      @change="handleFileImport"
    />

    <!-- 本地图书文件输入 -->
    <input
      ref="localFileInput"
      type="file"
      accept=".txt"
      style="display: none"
      @change="handleLocalFileSelect"
    />

    <!-- v-viewer 图片查看器 -->
    <div v-viewer="viewerOptions" class="viewer" v-show="false">
      <img 
        v-for="(imageData, index) in viewerImageData" 
        :key="index"
        :src="imageData.src" 
        :alt="imageData.name"
        :data-source="imageData.src"
        :title="imageData.name"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { Message, Modal } from '@arco-design/web-vue'
import { useFavoriteStore } from '@/stores/favoriteStore'
import { useSiteStore } from '@/stores/siteStore'
import VideoCard from '@/components/VideoCard.vue'
import ApiUrlManager from '@/components/ApiUrlManager.vue'
import localBookService from '@/services/localBookService'
import {
  IconBook,
  IconPlayArrow,
  IconMore,
  IconPlus,
  IconImport,
  IconExport,
  IconSettings,
  IconDelete,
  IconLink,
  IconEye,
  IconDownload
} from '@arco-design/web-vue/es/icon'

const router = useRouter()
const favoriteStore = useFavoriteStore()
const siteStore = useSiteStore()

// 响应式数据
const searchKeyword = ref('')
const selectedCategory = ref('all')
const fileInput = ref(null)
const localFileInput = ref(null) // 本地图书文件输入
const showApiManager = ref(false)
const viewerImages = ref([])
const viewerImageData = ref([])
const localBooks = ref([]) // 本地图书列表
const storageStats = ref({}) // 储存空间统计

// v-viewer 配置选项
const viewerOptions = ref({
  inline: false,
  button: true,
  navbar: true,
  title: true,
  toolbar: {
    zoomIn: 1,
    zoomOut: 1,
    oneToOne: 1,
    reset: 1,
    prev: 1,
    play: {
      show: 1,
      size: 'large',
    },
    next: 1,
    rotateLeft: 1,
    rotateRight: 1,
    flipHorizontal: 1,
    flipVertical: 1,
  },
  tooltip: true,
  movable: true,
  zoomable: true,
  rotatable: true,
  scalable: true,
  transition: true,
  fullscreen: true,
  keyboard: true,
  backdrop: true,
})

// 计算属性 - 获取在线收藏的小说和漫画
const onlineBookItems = computed(() => {
  return favoriteStore.favorites.filter(item => {
    const siteName = item.api_info?.site_name || ''
    return siteName.includes('[书]') || siteName.includes('[画]')
  })
})

// 计算属性 - 合并在线收藏和本地图书
const bookGalleryItems = computed(() => {
  // 将本地图书转换为与在线收藏相同的格式
  const localBooksFormatted = localBooks.value.map(book => ({
    id: book.id,
    name: book.title,
    pic: book.cover || '/default-book-cover.svg',
    year: '',
    area: '',
    type: book.category,
    type_name: book.category,
    remarks: `本地图书 · ${book.author}`,
    director: book.author,
    actor: book.author,
    content: book.description,
    // 标识为本地图书
    isLocalBook: true,
    localBookData: book,
    api_info: {
      site_name: '[本地图书]',
      api_url: 'local',
      module: 'local'
    },
    created_at: new Date(book.addedAt).toISOString()
  }))
  
  return [...localBooksFormatted, ...onlineBookItems.value]
})

const bookGalleryCount = computed(() => bookGalleryItems.value.length)

const localBookCount = computed(() => localBooks.value.length)

const novelCount = computed(() => {
  const onlineNovels = onlineBookItems.value.filter(item => {
    const siteName = item.api_info?.site_name || ''
    return siteName.includes('[书]')
  }).length
  return localBookCount.value + onlineNovels
})

const comicCount = computed(() => {
  return onlineBookItems.value.filter(item => {
    const siteName = item.api_info?.site_name || ''
    return siteName.includes('[画]')
  }).length
})

const filteredBooks = computed(() => {
  let books = bookGalleryItems.value

  // 分类筛选
  if (selectedCategory.value !== 'all') {
    books = books.filter(item => {
      const siteName = item.api_info?.site_name || ''
      let type = ''
      
      if (item.isLocalBook) {
        type = '本地图书'
      } else if (siteName.includes('[书]')) {
        type = '小说'
      } else if (siteName.includes('[画]')) {
        type = '漫画'
      }
      
      return type === selectedCategory.value
    })
  }

  // 搜索筛选
  if (searchKeyword.value.trim()) {
    const keyword = searchKeyword.value.toLowerCase()
    books = books.filter(item =>
      item.name.toLowerCase().includes(keyword) ||
      (item.director && item.director.toLowerCase().includes(keyword)) ||
      (item.actor && item.actor.toLowerCase().includes(keyword))
    )
  }

  return books
})

// 方法
const handleSearch = () => {
  // 搜索逻辑已在计算属性中处理
}

const showImageModal = (item) => {
  // 设置当前图片到 viewer，包含图片URL和名称
  viewerImages.value = [item.pic]
  viewerImageData.value = [{
    src: item.pic,
    name: item.name || item.title || '未知标题'
  }]
  
  // 等待下一个 tick 后显示 viewer
  setTimeout(() => {
    const viewerElement = document.querySelector('.viewer')
    if (viewerElement && viewerElement.$viewer) {
      viewerElement.$viewer.show()
    }
  }, 100)
}

const handleAction = (value) => {
  switch (value) {
    case 'add-local':
      addLocalBook()
      break
    case 'import':
      importFavorites()
      break
    case 'export':
      exportFavorites()
      break
    case 'download-manager':
      openDownloadManager()
      break
    case 'manage-api':
      showApiManager.value = true
      break
    case 'clear':
      clearAllBooks()
      break
  }
}

const addLocalBook = () => {
  localFileInput.value?.click()
}

// 处理本地图书文件选择
const handleLocalFileSelect = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  try {
    const book = await localBookService.handleFileUpload(file)
    loadLocalBooks() // 重新加载本地图书列表
    Message.success(`成功添加本地图书：${book.title}`)
  } catch (error) {
    Message.error(`添加本地图书失败：${error.message}`)
  }

  // 清空文件输入
  event.target.value = ''
}

const importFavorites = () => {
  fileInput.value?.click()
}

const handleFileImport = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  try {
    const importCount = await favoriteStore.importFavorites(file)
    Message.success(`成功导入 ${importCount} 个收藏项`)
  } catch (error) {
    Message.error(`导入失败: ${error.message}`)
  }

  // 清空文件输入
  event.target.value = ''
}

const exportFavorites = () => {
  if (bookGalleryCount.value === 0) {
    Message.warning('没有书画数据可以导出')
    return
  }

  try {
    // 只导出书画相关的收藏
    const bookData = {
      favorites: bookGalleryItems.value,
      exportTime: new Date().toISOString(),
      type: 'book-gallery'
    }
    
    const blob = new Blob([JSON.stringify(bookData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `书画柜_${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    Message.success('书画柜数据导出成功')
  } catch (error) {
    Message.error('导出失败，请稍后重试')
  }
}

const openDownloadManager = () => {
  router.push('/download-manager')
}

// 更新储存空间统计
const updateStorageStats = () => {
  storageStats.value = localBookService.getStorageStats()
}

// 加载本地图书
const loadLocalBooks = () => {
  localBooks.value = [...localBookService.getAllBooks()]
  updateStorageStats() // 同时更新储存空间统计
}

const clearAllBooks = () => {
  Modal.confirm({
    title: '确认清空书画柜',
    content: `确定要清空所有 ${bookGalleryCount.value} 个书画收藏吗？此操作不可恢复。`,
    okText: '确认清空',
    cancelText: '取消',
    okButtonProps: { status: 'danger' },
    onOk: () => {
      // 清空在线收藏的书画
      onlineBookItems.value.forEach(item => {
        favoriteStore.removeFavorite(item.id, item.api_info.api_url)
      })
      // 清空本地图书
      localBookService.clearAllBooks()
      loadLocalBooks()
      Message.success('已清空书画柜')
    }
  })
}

const removeFavorite = (item) => {
  // 如果是本地图书，调用删除本地图书的方法
  if (item.isLocalBook) {
    deleteLocalBook(item)
    return
  }
  
  // 在线图书的取消收藏逻辑
  Modal.confirm({
    title: '取消收藏',
    content: `确定要取消收藏《${item.name}》吗？`,
    okText: '确认取消',
    cancelText: '保留',
    okButtonProps: { status: 'danger' },
    onOk: () => {
      const success = favoriteStore.removeFavorite(item.id, item.api_info.api_url)
      if (success) {
        Message.success('已取消收藏')
      }
    }
  })
}

// 删除本地图书的方法
const deleteLocalBook = (item) => {
  Modal.confirm({
    title: '删除本地图书',
    content: `确定要删除《${item.name}》吗？删除后将无法恢复。`,
    okText: '确认删除',
    cancelText: '取消',
    okButtonProps: { status: 'danger' },
    onOk: () => {
      try {
        const result = localBookService.deleteLocalBook(item.localBookData.id)
        if (result.success) {
          Message.success('图书删除成功')
          // 强制重新获取本地图书列表，确保响应式更新
          nextTick(() => {
            localBooks.value = [...localBookService.getAllBooks()]
            updateStorageStats()
          })
        } else {
          Message.error('删除失败: ' + (result.error || '未知错误'))
        }
      } catch (error) {
        console.error('删除本地图书失败:', error)
        Message.error('删除失败: ' + error.message)
      }
    }
  })
}

const goToDetail = async (item) => {
  try {
    // 如果是本地图书，直接打开阅读界面
    if (item.isLocalBook) {
      openLocalBookReader(item.localBookData)
      return
    }

    // 不再切换全局站源，而是通过路由参数传递站源信息
    const siteInfo = {
      name: item.api_info.site_name,
      api: item.api_info.api_url,
      key: item.api_info.module,
      ext: item.api_info.ext || null  // 从收藏数据中获取extend参数
    }
    
    console.log('从书画柜进入详情页，使用临时站源:', siteInfo.name, '扩展参数:', siteInfo.ext)
    
    // 跳转到详情页，传递站源信息
    router.push({
        name: 'VideoDetail',
        params: { id: item.id },
        query: {
          name: item.name,
          pic: item.pic,
          year: item.year,
          area: item.area,
          type: item.type,
          type_name: item.type_name,
          remarks: item.remarks,
          content: item.content,
          actor: item.actor,
          director: item.director,
          fromCollection: 'true',  // 标识从收藏进入
          // 传递站源信息，不影响全局状态
          tempSiteName: siteInfo.name,
          tempSiteApi: siteInfo.api,
          tempSiteKey: siteInfo.key,
          tempSiteExt: siteInfo.ext,  // 添加extend参数传递
          // 添加来源页面信息
          sourceRouteName: 'BookGallery',
          sourceRouteParams: JSON.stringify({}),
          sourceRouteQuery: JSON.stringify({}),
          // 添加来源图片信息，用于详情页图片备用
          sourcePic: item.pic
        }
      })
    
    Message.info(`正在加载 ${item.api_info.site_name} 的详情...`)
  } catch (error) {
    Message.error('跳转失败，请稍后重试')
    console.error('跳转到详情页失败:', error)
  }
}

// 打开本地图书阅读器
const openLocalBookReader = (book) => {
  // 跳转到本地图书阅读页面
  router.push({
    name: 'LocalBookReader',
    params: { bookId: book.id },
    query: {
      title: book.title,
      author: book.author
    }
  })
}

const goToVideo = () => {
  router.push('/video')
}

const handleApiManagerCompleted = (result) => {
  console.log('API地址管理完成:', result)
  Message.success(`API地址管理完成，共处理 ${result.replacedCount} 条记录`)
  // 可以在这里添加其他后续处理逻辑
}

const handleImageError = (event) => {
  // 防止无限循环：如果已经是默认图片，就不再重新设置
  if (event.target.src.includes('default-poster.svg')) {
    return
  }
  // 使用BASE_URL确保在任何路由层级和部署环境下都能正确访问
  const basePath = import.meta.env.BASE_URL || '/'
  event.target.src = `${basePath}default-poster.svg`
  event.target.style.objectFit = 'contain'
  event.target.style.backgroundColor = '#f7f8fa'
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// 本地图书事件监听器
const handleLocalBookEvent = (eventType, data) => {
  if (eventType === 'bookAdded') {
    // 重新加载本地图书列表
    loadLocalBooks()
  }
}

// 组件挂载时加载收藏数据
onMounted(() => {
  favoriteStore.loadFavorites()
  loadLocalBooks() // 加载本地图书数据
  
  // 添加事件监听器
  localBookService.addEventListener(handleLocalBookEvent)
})

// 组件卸载时清理事件监听器
onUnmounted(() => {
  localBookService.removeEventListener(handleLocalBookEvent)
})
</script>

<style scoped>
.book-gallery-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--color-bg-1);
}

.book-gallery-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px;
  background: var(--color-bg-2);
  border-bottom: 1px solid var(--color-border-2);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-text-1);
  margin: 0;
}

.count-badge {
  margin-left: 8px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.filter-section {
  padding: 16px 24px;
  background: var(--color-bg-2);
  border-bottom: 1px solid var(--color-border-2);
}

.filter-container {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
}

.filter-tabs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.book-gallery-content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

.books-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
}

.danger-option {
  color: var(--color-danger-6);
}

/* 储存空间统计样式 */
.storage-stats {
  flex-shrink: 0;
}

.storage-info {
  max-width: 300px;
  min-width: 250px;
}

.storage-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.storage-icon {
  font-size: 16px;
  color: var(--color-text-2);
}

.storage-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-1);
}

.storage-progress {
  margin-bottom: 8px;
}

.storage-details {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: var(--color-text-3);
}

.storage-used {
  color: var(--color-text-2);
}

.storage-available {
  color: var(--color-success-6);
}

.storage-total {
  color: var(--color-text-3);
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .books-grid {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 20px;
  }
}

@media (max-width: 768px) {
  .book-gallery-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .header-actions {
    flex-direction: column;
    gap: 12px;
  }
  
  .header-actions .arco-input-wrapper {
    width: 100% !important;
  }
  
  .filter-section {
    padding: 12px 16px;
  }
  
  .filter-container {
    flex-direction: column;
    gap: 16px;
  }
  
  .storage-info {
    max-width: none;
    min-width: auto;
  }
  
  .book-gallery-content {
    padding: 16px;
  }
  
  .books-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 16px;
  }
}

@media (max-width: 480px) {
  .book-gallery-header {
    padding: 16px;
  }
  
  .page-title {
    font-size: 20px;
  }
  
  .books-grid {
    grid-template-columns: 1fr;
  }
}

/* v-viewer 自定义样式 */
.viewer {
  display: none;
}
</style>