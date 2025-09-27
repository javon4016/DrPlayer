<template>
  <div class="collection-container">
    <!-- 头部 -->
    <div class="collection-header">
      <div class="header-left">
        <h1 class="page-title">我的收藏</h1>
        <a-badge :count="favoriteStore.favoriteCount" class="count-badge" />
      </div>
      <div class="header-actions">
        <a-input-search
          v-model="searchKeyword"
          placeholder="搜索收藏的视频..."
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
            <a-doption value="clear" class="danger-option">
              <template #icon>
                <icon-delete />
              </template>
              清空收藏
            </a-doption>
          </template>
        </a-dropdown>
      </div>
    </div>

    <!-- 分类筛选 -->
    <div class="filter-section" v-if="favoriteStore.favoriteCount > 0">
      <div class="filter-tabs">
        <a-button
          :type="selectedCategory === 'all' ? 'primary' : 'outline'"
          @click="selectedCategory = 'all'"
          size="small"
        >
          全部 ({{ favoriteStore.favoriteCount }})
        </a-button>
        <a-button
          v-for="(items, category) in favoriteStore.favoritesByType"
          :key="category"
          :type="selectedCategory === category ? 'primary' : 'outline'"
          @click="selectedCategory = category"
          size="small"
        >
          {{ category }} ({{ items.length }})
        </a-button>
      </div>
    </div>

    <!-- 收藏列表 -->
    <div class="collection-content">
      <!-- 空状态 -->
      <div v-if="favoriteStore.favoriteCount === 0" class="empty-state">
        <a-empty description="还没有收藏任何视频">
          <template #image>
            <icon-heart style="font-size: 64px; color: var(--color-text-4);" />
          </template>
          <a-button type="primary" @click="goToVideo">去发现好内容</a-button>
        </a-empty>
      </div>

      <!-- 收藏网格 -->
      <div v-else class="favorites-grid">
        <VideoCard
          v-for="item in filteredFavorites"
          :key="`${item.id}-${item.api_info.api_url}`"
          :item="item"
          type="favorite"
          @card-click="goToDetail"
          @image-click="showImageModal"
          @action-click="removeFavorite"
        />
      </div>
    </div>

    <!-- 导入文件输入 -->
    <input
      ref="fileInput"
      type="file"
      accept=".json"
      style="display: none"
      @change="handleFileImport"
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
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Message, Modal } from '@arco-design/web-vue'
import { useFavoriteStore } from '@/stores/favoriteStore'
import { useSiteStore } from '@/stores/siteStore'
import VideoCard from '@/components/VideoCard.vue'
import {
  IconHeart,
  IconHeartFill,
  IconPlayArrow,
  IconMore,
  IconImport,
  IconExport,
  IconDelete,
  IconLink,
  IconEye
} from '@arco-design/web-vue/es/icon'

const router = useRouter()
const favoriteStore = useFavoriteStore()
const siteStore = useSiteStore()

// 响应式数据
const searchKeyword = ref('')
const selectedCategory = ref('all')
const fileInput = ref(null)
const viewerImages = ref([])
const viewerImageData = ref([])

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

// 计算属性
const filteredFavorites = computed(() => {
  let favorites = favoriteStore.favorites

  // 分类筛选
  if (selectedCategory.value !== 'all') {
    favorites = favorites.filter(item => {
      // 根据站源名称中的标识进行分类（与favoriteStore中的逻辑保持一致）
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
      
      return type === selectedCategory.value
    })
  }

  // 搜索筛选
  if (searchKeyword.value.trim()) {
    const keyword = searchKeyword.value.toLowerCase()
    favorites = favorites.filter(item =>
      item.name.toLowerCase().includes(keyword) ||
      (item.director && item.director.toLowerCase().includes(keyword)) ||
      (item.actor && item.actor.toLowerCase().includes(keyword))
    )
  }

  return favorites
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
    case 'import':
      importFavorites()
      break
    case 'export':
      exportFavorites()
      break
    case 'clear':
      clearAllFavorites()
      break
  }
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
  if (favoriteStore.favoriteCount === 0) {
    Message.warning('没有收藏数据可以导出')
    return
  }

  try {
    favoriteStore.exportFavorites()
    Message.success('收藏数据导出成功')
  } catch (error) {
    Message.error('导出失败，请稍后重试')
  }
}

const clearAllFavorites = () => {
  Modal.confirm({
    title: '确认清空收藏',
    content: `确定要清空所有 ${favoriteStore.favoriteCount} 个收藏项吗？此操作不可恢复。`,
    okText: '确认清空',
    cancelText: '取消',
    okButtonProps: { status: 'danger' },
    onOk: () => {
      favoriteStore.clearFavorites()
      Message.success('已清空所有收藏')
    }
  })
}

const removeFavorite = (item) => {
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

const goToDetail = async (item) => {
  try {
    // 不再切换全局站源，而是通过路由参数传递站源信息
    const siteInfo = {
      name: item.api_info.site_name,
      api: item.api_info.api_url,
      key: item.api_info.module
    }
    
    console.log('从收藏进入详情页，使用临时站源:', siteInfo.name)
    
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
          tempSiteKey: siteInfo.key
        }
      })
    
    Message.info(`正在加载 ${item.api_info.site_name} 的视频详情...`)
  } catch (error) {
    Message.error('跳转失败，请稍后重试')
    console.error('跳转到详情页失败:', error)
  }
}

const goToVideo = () => {
  router.push('/video')
}

const handleImageError = (event) => {
  event.target.src = '/default-poster.svg'
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

// 组件挂载时加载收藏数据
onMounted(() => {
  favoriteStore.loadFavorites()
})
</script>

<style scoped>
.collection-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--color-bg-1);
}

.collection-header {
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

.filter-tabs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.collection-content {
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

.favorites-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
}



.danger-option {
  color: var(--color-danger-6);
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .favorites-grid {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 20px;
  }
}

@media (max-width: 768px) {
  .collection-header {
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
  
  .collection-content {
    padding: 16px;
  }
  
  .favorites-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 16px;
  }
}

@media (max-width: 480px) {
  .collection-header {
    padding: 16px;
  }
  
  .page-title {
    font-size: 20px;
  }
  
  .favorites-grid {
    grid-template-columns: 1fr;
  }
}

/* v-viewer 自定义样式 */
.viewer {
  display: none;
}
</style>
