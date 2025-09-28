<template>
  <div class="video-detail">
    <!-- 头部导航 -->
    <div class="detail-header">
      <a-button type="text" @click="goBack" class="back-btn">
        <template #icon>
          <icon-left />
        </template>
        返回
      </a-button>
      <div class="header-title">
        <span v-if="!originalVideoInfo.name">视频详情</span>
        <span v-else class="title-with-info">
          <span class="title-main">视频详情 - {{ originalVideoInfo.name }}</span>
          <span class="title-source" v-if="currentSiteInfo.name">
            ({{ currentSiteInfo.name }} - ID: {{ originalVideoInfo.id }})
          </span>
        </span>
      </div>
      <!-- 收藏按钮 -->
      <div class="header-actions" v-if="originalVideoInfo.id">
        <a-button 
          :type="isCurrentFavorited ? 'primary' : 'outline'"
          @click="toggleFavorite"
          class="favorite-btn"
          :loading="favoriteLoading"
        >
          <template #icon>
            <icon-heart-fill v-if="isCurrentFavorited" />
            <icon-heart v-else />
          </template>
          {{ isCurrentFavorited ? '取消收藏' : '收藏' }}
        </a-button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <a-spin :size="40" />
      <div class="loading-text">正在加载详情...</div>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="error-container">
      <a-result status="error" :title="error" />
      <a-button type="primary" @click="loadVideoDetail">重新加载</a-button>
    </div>

    <!-- 详情内容 -->
    <div v-else-if="videoDetail" class="detail-content">
      <!-- 视频信息卡片 -->
      <a-card class="video-info-card">
        <div class="video-header">
          <div class="video-poster" @click="showImageModal">
            <img :src="videoDetail.vod_pic" :alt="videoDetail.vod_name" @error="handleImageError" />
            <div class="poster-overlay">
              <icon-eye class="view-icon" />
              <span>查看大图</span>
            </div>
          </div>
          <div class="video-meta">
            <h1 class="video-title">{{ videoDetail.vod_name }}</h1>
            <div class="video-tags">
              <a-tag v-if="videoDetail.type_name" color="blue">{{ videoDetail.type_name }}</a-tag>
              <a-tag v-if="videoDetail.vod_year" color="green">{{ videoDetail.vod_year }}</a-tag>
              <a-tag v-if="videoDetail.vod_area" color="orange">{{ videoDetail.vod_area }}</a-tag>
            </div>
            <div class="video-info-grid">
              <div v-if="videoDetail.vod_director" class="info-item">
                <span class="label">导演：</span>
                <span class="value">{{ videoDetail.vod_director }}</span>
              </div>
              <div v-if="videoDetail.vod_actor" class="info-item">
                <span class="label">演员：</span>
                <span class="value">{{ videoDetail.vod_actor }}</span>
              </div>
              <div v-if="videoDetail.vod_remarks" class="info-item">
                <span class="label">备注：</span>
                <span class="value">{{ videoDetail.vod_remarks }}</span>
              </div>
            </div>
          </div>
          <div class="video-actions">
            <!-- 播放按钮区域 -->
            <div v-if="currentEpisodeUrl" class="play-actions">
              <a-button type="primary" size="large" @click="playVideo" class="play-btn">
                <template #icon>
                  <icon-play-arrow />
                </template>
                播放视频
              </a-button>
              <a-button @click="copyPlayUrl" class="copy-btn">
                <template #icon>
                  <icon-copy />
                </template>
                复制链接
              </a-button>
            </div>
          </div>
        </div>
        
        <!-- 剧情简介 -->
        <div v-if="videoDetail.vod_content" class="video-description">
          <h3>剧情简介</h3>
          <div class="description-content" :class="{ expanded: descriptionExpanded }">
            {{ videoDetail.vod_content }}
          </div>
          <a-button 
            v-if="videoDetail.vod_content.length > 200" 
            type="text" 
            @click="toggleDescription"
            class="expand-btn"
          >
            {{ descriptionExpanded ? '收起' : '展开' }}
          </a-button>
        </div>
      </a-card>

      <!-- 播放线路和选集 -->
      <a-card v-if="playRoutes.length > 0" class="play-section">
        <h3>播放线路</h3>
        
        <!-- 线路选择 -->
        <div class="route-tabs">
          <a-button
            v-for="(route, index) in playRoutes"
            :key="index"
            :type="currentRoute === index ? 'primary' : 'outline'"
            @click="switchRoute(index)"
            class="route-btn"
          >
            <span class="route-name">{{ route.name }}</span>
            <a-badge :count="route.episodes.length" class="route-badge" />
          </a-button>
        </div>

        <!-- 选集列表 -->
        <div v-if="currentRouteEpisodes.length > 0" class="episodes-section">
          <div class="episodes-header">
            <h4>选集列表 ({{ currentRouteEpisodes.length }}集)</h4>
            <div class="episodes-controls">
              <!-- 排序按钮 -->
              <a-button 
                type="text" 
                size="small" 
                @click="toggleEpisodeSort"
                :title="episodeSortOrder === 'asc' ? '切换为倒序' : '切换为正序'"
                class="sort-btn"
              >
                <template #icon>
                  <icon-sort-ascending v-if="episodeSortOrder === 'asc'" />
                  <icon-sort-descending v-else />
                </template>
                {{ episodeSortOrder === 'asc' ? '正序' : '倒序' }}
              </a-button>
              
              <!-- 显示策略选择 -->
              <a-select 
                v-model="episodeDisplayStrategy" 
                @change="changeDisplayStrategy"
                size="small"
                class="strategy-select"
                :style="{ width: '150px' }"
                position="bl"
                :popup-container="'body'"
              >
                <template #prefix>
                  <icon-settings />
                </template>
                <a-option value="full">完整显示</a-option>
                <a-option value="smart">智能去重</a-option>
                <a-option value="simple">精简显示</a-option>
              </a-select>
              
              <!-- 布局选项 -->
              <a-select 
                v-model="episodeLayoutColumns" 
                @change="changeLayoutColumns"
                size="small"
                class="layout-select"
                :style="{ width: '110px' }"
                position="bl"
                :popup-container="'body'"
              >
                <template #prefix>
                  <icon-menu />
                </template>
                <a-option :value="12">12列</a-option>
                <a-option :value="6">6列</a-option>
                <a-option :value="3">3列</a-option>
              </a-select>
            </div>
          </div>
          <div class="episodes-grid" :style="{ '--episodes-columns': episodeLayoutColumns }">
            <a-button
              v-for="(episode, index) in currentRouteEpisodes"
              :key="index"
              :type="currentEpisode === index ? 'primary' : 'outline'"
              @click="selectEpisode(index)"
              class="episode-btn"
              size="small"
              :title="episode.name"
            >
              <span class="episode-text">{{ episode.displayName || episode.name }}</span>
            </a-button>
          </div>
        </div>


      </a-card>

      <!-- 无播放资源提示 -->
      <a-card v-else class="no-play-section">
        <a-empty description="暂无播放资源" />
      </a-card>
    </div>

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
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Message } from '@arco-design/web-vue'
import videoService from '@/api/services/video'
import { useSiteStore } from '@/stores/siteStore'
import { useFavoriteStore } from '@/stores/favoriteStore'
import { useHistoryStore } from '@/stores/historyStore'
import { usePageStateStore } from '@/stores/pageStateStore'
import { 
  IconLeft, 
  IconPlayArrow, 
  IconCopy,
  IconHeart,
  IconHeartFill,
  IconSortAscending,
  IconSortDescending,
  IconSettings,
  IconMenu,
  IconEye
} from '@arco-design/web-vue/es/icon'

const route = useRoute()
const router = useRouter()
const siteStore = useSiteStore()
const favoriteStore = useFavoriteStore()
const historyStore = useHistoryStore()
const pageStateStore = usePageStateStore()

// 响应式数据
const loading = ref(false)
const error = ref('')
const videoDetail = ref(null)
const originalVideoInfo = ref({
  id: '',
  name: '',
  pic: '',
  year: '',
  area: '',
  type: '',
  remarks: '',
  content: '',
  actor: '',
  director: ''
})
const descriptionExpanded = ref(false)
const currentRoute = ref(0)
const currentEpisode = ref(0)
const favoriteLoading = ref(false)
// 选集排序和显示策略
const episodeSortOrder = ref('asc') // 'asc' 正序, 'desc' 倒序
const episodeDisplayStrategy = ref(localStorage.getItem('episodeDisplayStrategy') || 'full') // 'full' 完整显示, 'smart' 智能去重, 'simple' 精简显示
const episodeLayoutColumns = ref(parseInt(localStorage.getItem('episodeLayoutColumns')) || 12) // 每行显示的按钮数量
// 当前使用的站源信息（可能是全局站源或临时站源）
const currentSiteInfo = ref({
  name: '',
  api: '',
  key: ''
})

// 图片查看器相关
const viewerImages = ref([])
const viewerImageData = ref([])
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
const playRoutes = computed(() => {
  if (!videoDetail.value?.vod_play_from || !videoDetail.value?.vod_play_url) {
    return []
  }
  
  const fromList = videoDetail.value.vod_play_from.split('$$$')
  const urlList = videoDetail.value.vod_play_url.split('$$$')
  
  return fromList.map((name, index) => ({
    name: name.trim(),
    episodes: parseEpisodes(urlList[index] || '')
  }))
})

const currentRouteEpisodes = computed(() => {
  let episodes = playRoutes.value[currentRoute.value]?.episodes || []
  
  // 应用显示策略
  episodes = episodes.map(episode => ({
    ...episode,
    displayName: processEpisodeName(episode.name)
  }))
  
  // 应用排序
  if (episodeSortOrder.value === 'desc') {
    episodes = [...episodes].reverse()
  }
  
  return episodes
})

const currentEpisodes = computed(() => {
  return currentRouteEpisodes.value
})

const currentEpisodeUrl = computed(() => {
  const episode = currentRouteEpisodes.value[currentEpisode.value]
  return episode?.url || ''
})

const isCurrentFavorited = computed(() => {
  if (!originalVideoInfo.value.id || !currentSiteInfo.value.api) return false
  return favoriteStore.isFavorited(originalVideoInfo.value.id, currentSiteInfo.value.api)
})

// 方法
const parseEpisodes = (urlString) => {
  if (!urlString) return []
  
  return urlString.split('#').map(item => {
    const [name, url] = item.split('$')
    return {
      name: name?.trim() || '未知集数',
      url: url?.trim() || ''
    }
  }).filter(item => item.url)
}

const loadVideoDetail = async () => {
  if (!route.params.id) {
    error.value = '视频ID不能为空'
    return
  }

  // 从路由参数中获取原始视频信息
  originalVideoInfo.value = {
    id: route.params.id,
    name: route.query.name || '',
    pic: route.query.pic || '',
    year: route.query.year || '',
    area: route.query.area || '',
    type: route.query.type || '',
    type_name: route.query.type_name || '',
    remarks: route.query.remarks || '',
    content: route.query.content || '',
    actor: route.query.actor || '',
    director: route.query.director || ''
  }

  // 检查是否有当前站点
  if (!siteStore.nowSite) {
    error.value = '请先选择一个视频源'
    return
  }

  loading.value = true
  error.value = ''
  
  // 检查是否从收藏、历史或推送进入，如果是则优先调用T4详情接口获取最新数据
  const fromCollection = route.query.fromCollection === 'true'
  const fromHistory = route.query.fromHistory === 'true'
  const fromPush = route.query.fromPush === 'true'
  
  try {
    // 确定使用的站源信息
    let module, apiUrl, siteName
    
    if ((fromCollection || fromHistory || fromPush) && route.query.tempSiteKey) {
      // 从收藏、历史或推送进入，使用临时站源信息，不影响全局状态
      module = route.query.tempSiteKey
      apiUrl = route.query.tempSiteApi
      siteName = route.query.tempSiteName
      
      const sourceType = fromCollection ? '收藏' : fromHistory ? '历史' : '推送'
      console.log(`从${sourceType}进入，使用临时站源:`, {
        siteName,
        module,
        apiUrl
      })
    } else {
      // 正常进入，使用全局站源
      const currentSite = siteStore.nowSite
      module = currentSite.key || currentSite.name
      apiUrl = currentSite.api
      siteName = currentSite.name
    }
    
    // 设置当前使用的站源信息
    currentSiteInfo.value = {
      name: siteName,
      api: apiUrl,
      key: module
    }
    
    console.log('获取视频详情:', {
      videoId: route.params.id,
      module: module,
      apiUrl: apiUrl,
      fromCollection: fromCollection,
      usingTempSite: fromCollection && route.query.tempSiteKey
    })
    
    if (fromCollection) {
      console.log('从收藏进入，优先调用T4详情接口获取最新数据')
    }
    
    // 从收藏进入时跳过缓存，强制获取最新数据
    const videoInfo = await videoService.getVideoDetails(module, route.params.id, apiUrl, fromCollection)
    
    if (videoInfo) {
      // 添加API信息用于收藏
      videoInfo.module = module
      videoInfo.api_url = apiUrl
      videoInfo.site_name = siteName
      
      videoDetail.value = videoInfo
      console.log('视频详情获取成功:', videoInfo)
      
      // 处理历史记录恢复
      const historyRoute = route.query.historyRoute
      const historyEpisode = route.query.historyEpisode
      
      if (historyRoute && historyEpisode) {
        console.log('检测到历史记录参数，准备恢复播放位置:', { historyRoute, historyEpisode })
        // 等待DOM更新和计算属性更新后恢复历史记录位置
        nextTick(() => {
          // 再次等待，确保playRoutes计算属性已完全更新
          setTimeout(() => {
            console.log('开始恢复历史记录，当前playRoutes长度:', playRoutes.value.length)
            if (playRoutes.value.length > 0) {
              restoreHistoryPosition(historyRoute, historyEpisode)
            } else {
              console.warn('playRoutes为空，无法恢复历史记录')
            }
          }, 100)
        })
      } else {
        // 如果没有历史记录参数，确保默认选择第一个线路和选集
        nextTick(() => {
          setTimeout(() => {
            if (playRoutes.value.length > 0 && currentRoute.value === 0) {
              console.log('初始化默认播放位置')
              currentRoute.value = 0
              if (currentRouteEpisodes.value.length > 0) {
                currentEpisode.value = 0
              }
            }
          }, 100)
        })
      }
    } else {
      error.value = '未找到视频详情'
    }
  } catch (err) {
    console.error('加载视频详情失败:', err)
    error.value = err.message || '加载失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

const toggleFavorite = async () => {
  if (!originalVideoInfo.value.id || !currentSiteInfo.value.api) return
  
  favoriteLoading.value = true
  
  try {
    if (isCurrentFavorited.value) {
      const success = favoriteStore.removeFavorite(originalVideoInfo.value.id, currentSiteInfo.value.api)
      if (success) {
        Message.success('已取消收藏')
      }
    } else {
      // 构建收藏数据，优先使用列表数据，缺失时使用详情接口数据
      const favoriteData = {
        vod_id: originalVideoInfo.value.id,
        vod_name: originalVideoInfo.value.name || videoDetail.value?.vod_name || '',
        vod_pic: originalVideoInfo.value.pic || videoDetail.value?.vod_pic || '',
        vod_year: originalVideoInfo.value.year || videoDetail.value?.vod_year || '',
        vod_area: originalVideoInfo.value.area || videoDetail.value?.vod_area || '',
        vod_type: originalVideoInfo.value.type || videoDetail.value?.vod_type || '',
        type_name: originalVideoInfo.value.type_name || videoDetail.value?.type_name || '',
        vod_remarks: originalVideoInfo.value.remarks || videoDetail.value?.vod_remarks || '',
        vod_content: originalVideoInfo.value.content || videoDetail.value?.vod_content || '',
        vod_actor: originalVideoInfo.value.actor || videoDetail.value?.vod_actor || '',
        vod_director: originalVideoInfo.value.director || videoDetail.value?.vod_director || '',
        // 播放相关数据使用详情接口返回的数据
        vod_play_from: videoDetail.value?.vod_play_from || '',
        vod_play_url: videoDetail.value?.vod_play_url || '',
        // API信息使用当前站源信息
        module: currentSiteInfo.value.key,
        api_url: currentSiteInfo.value.api,
        site_name: currentSiteInfo.value.name
      }
      
      const success = favoriteStore.addFavorite(favoriteData)
      if (success) {
        Message.success('收藏成功')
      } else {
        Message.warning('该视频已在收藏列表中')
      }
    }
  } catch (error) {
    Message.error('操作失败，请稍后重试')
    console.error('收藏操作失败:', error)
  } finally {
    favoriteLoading.value = false
  }
}

const goBack = () => {
  // 检查是否有来源页面信息
  const sourceRouteName = route.query.sourceRouteName
  const sourceRouteParams = route.query.sourceRouteParams
  const sourceRouteQuery = route.query.sourceRouteQuery
  const fromSearch = route.query.fromSearch // 新增：标识是否来自搜索
  
  console.log('goBack 调用，来源信息:', { sourceRouteName, fromSearch, sourceRouteParams, sourceRouteQuery });
  
  if (sourceRouteName) {
    try {
      // 解析来源页面的参数和查询
      const params = sourceRouteParams ? JSON.parse(sourceRouteParams) : {}
      const query = sourceRouteQuery ? JSON.parse(sourceRouteQuery) : {}
      
      console.log('返回来源页面:', sourceRouteName, { params, query, fromSearch });
      
      // 根据来源页面类型和是否来自搜索处理状态恢复
      if (sourceRouteName === 'Video') {
        if (fromSearch === 'true') {
          // 来自Video页面的搜索结果，需要恢复搜索状态
          console.log('从Video页面搜索返回，恢复搜索状态');
          const savedSearchState = pageStateStore.getPageState('search');
          if (savedSearchState && savedSearchState.keyword && !pageStateStore.isStateExpired('search')) {
            console.log('发现保存的搜索状态，将恢复搜索结果:', savedSearchState);
            // 添加搜索恢复标识
            query._restoreSearch = 'true';
          }
        } else {
          // 来自Video页面的分类列表，恢复分类状态
          console.log('从Video页面分类返回，恢复分类状态');
          if (query.activeKey) {
            query._returnToActiveKey = query.activeKey;
            console.log('设置返回分类:', query.activeKey);
          }
          
          // 检查是否有保存的Video页面状态
          const savedVideoState = pageStateStore.getPageState('video');
          if (savedVideoState && !pageStateStore.isStateExpired('video')) {
            console.log('发现保存的Video页面状态，将恢复状态而非重新加载');
          }
        }
      } else if (sourceRouteName === 'Home') {
        // 返回Home页面，检查搜索状态
        const savedSearchState = pageStateStore.getPageState('search');
        if (savedSearchState && savedSearchState.keyword && !pageStateStore.isStateExpired('search')) {
          console.log('发现保存的搜索状态，将恢复搜索结果');
          // 添加搜索恢复标识
          query._restoreSearch = 'true';
        }
      }
      
      // 跳转到来源页面
      router.push({
        name: sourceRouteName,
        params: params,
        query: query
      })
    } catch (error) {
      console.error('解析来源页面信息失败:', error)
      // 如果解析失败，使用默认的返回方式
      router.back()
    }
  } else {
    console.log('没有来源信息，使用默认返回方式')
    // 没有来源信息，使用默认的返回方式
    router.back()
  }
}

const handleImageError = (event) => {
  // 使用相对路径，适配子目录部署
  event.target.src = './default-poster.svg'
  event.target.style.objectFit = 'contain'
  event.target.style.backgroundColor = '#f7f8fa'
}

const showImageModal = () => {
  if (videoDetail.value?.vod_pic) {
    // 设置当前图片到 viewer，包含图片URL和名称
    viewerImages.value = [videoDetail.value.vod_pic]
    viewerImageData.value = [{
      src: videoDetail.value.vod_pic,
      name: videoDetail.value.vod_name || '未知标题'
    }]
    
    // 等待下一个 tick 后显示 viewer
    setTimeout(() => {
      const viewerElement = document.querySelector('.viewer')
      if (viewerElement && viewerElement.$viewer) {
        viewerElement.$viewer.show()
      }
    }, 100)
  }
}

const restoreHistoryPosition = (historyRoute, historyEpisode) => {
  try {
    console.log('开始恢复历史记录位置:', { historyRoute, historyEpisode })
    
    // 查找对应的线路和选集
    const routes = playRoutes.value
    const targetRoute = routes.find(route => route.name === historyRoute)
    
    if (targetRoute) {
      console.log('找到历史线路:', targetRoute.name)
      
      // 设置当前线路索引
      const routeIndex = routes.indexOf(targetRoute)
      currentRoute.value = routeIndex
      
      // 等待currentRouteEpisodes更新后查找选集
      nextTick(() => {
        const episodes = currentRouteEpisodes.value
        const targetEpisode = episodes.find(ep => ep.name === historyEpisode)
        
        if (targetEpisode) {
          console.log('找到历史选集:', targetEpisode.name)
          
          // 设置当前选集索引
          const episodeIndex = episodes.indexOf(targetEpisode)
          currentEpisode.value = episodeIndex
          
          console.log('历史记录位置恢复成功:', { routeIndex, episodeIndex })
        } else {
          console.warn('未找到历史选集:', historyEpisode)
          // 如果找不到历史选集，默认选择第一个选集
          if (episodes.length > 0) {
            currentEpisode.value = 0
          }
        }
      })
    } else {
      console.warn('未找到历史线路:', historyRoute)
      // 如果找不到历史线路，默认选择第一个线路
      if (routes.length > 0) {
        currentRoute.value = 0
        nextTick(() => {
          if (currentRouteEpisodes.value.length > 0) {
            currentEpisode.value = 0
          }
        })
      }
    }
  } catch (error) {
    console.error('恢复历史记录位置失败:', error)
  }
}

const toggleDescription = () => {
  descriptionExpanded.value = !descriptionExpanded.value
}

const switchRoute = (index) => {
  currentRoute.value = index
  currentEpisode.value = 0 // 切换线路时重置选集
}

const selectEpisode = (index) => {
  currentEpisode.value = index
  
  // 添加到历史记录
  if (videoDetail.value && currentRouteEpisodes.value[index]) {
    const videoInfo = {
      id: originalVideoInfo.value.id,
      name: originalVideoInfo.value.name || videoDetail.value.vod_name || '',
      pic: originalVideoInfo.value.pic || videoDetail.value.vod_pic || '',
      year: originalVideoInfo.value.year || videoDetail.value.vod_year || '',
      area: originalVideoInfo.value.area || videoDetail.value.vod_area || '',
      type: originalVideoInfo.value.type || videoDetail.value.vod_type || '',
      type_name: originalVideoInfo.value.type_name || videoDetail.value.type_name || '',
      remarks: originalVideoInfo.value.remarks || videoDetail.value.vod_remarks || '',
      api_info: {
        module: currentSiteInfo.value.key,
        api_url: currentSiteInfo.value.api,
        site_name: currentSiteInfo.value.name
      }
    }
    
    const routeInfo = {
      name: playRoutes.value[currentRoute.value]?.name || '',
      index: currentRoute.value
    }
    
    const episodeInfo = {
      name: currentRouteEpisodes.value[index].name,
      index: index,
      url: currentRouteEpisodes.value[index].url
    }
    
    historyStore.addToHistory(videoInfo, routeInfo, episodeInfo)
  }
}

// 选集排序切换
const toggleEpisodeSort = () => {
  episodeSortOrder.value = episodeSortOrder.value === 'asc' ? 'desc' : 'asc'
  // 排序切换后需要调整当前选集索引
  if (episodeSortOrder.value === 'desc') {
    const totalEpisodes = playRoutes.value[currentRoute.value]?.episodes.length || 0
    currentEpisode.value = totalEpisodes - 1 - currentEpisode.value
  } else {
    const totalEpisodes = playRoutes.value[currentRoute.value]?.episodes.length || 0
    currentEpisode.value = totalEpisodes - 1 - currentEpisode.value
  }
}

// 显示策略切换
const changeDisplayStrategy = (strategy) => {
  episodeDisplayStrategy.value = strategy
  localStorage.setItem('episodeDisplayStrategy', strategy)
}

// 布局列数切换
const changeLayoutColumns = (columns) => {
  episodeLayoutColumns.value = parseInt(columns)
  localStorage.setItem('episodeLayoutColumns', columns)
}

// 获取显示策略文本
const getDisplayStrategyText = () => {
  switch (episodeDisplayStrategy.value) {
    case 'full': return '完整显示'
    case 'smart': return '智能去重'
    case 'simple': return '精简显示'
    default: return '完整显示'
  }
}

// 处理选集名称显示
const processEpisodeName = (episodeName) => {
  if (!episodeName) return '未知集数'
  
  switch (episodeDisplayStrategy.value) {
    case 'full':
      return episodeName
      
    case 'smart':
      // 智能去重：去除与视频标题重复的部分
      const videoTitle = originalVideoInfo.value.name || videoDetail.value?.vod_name || ''
      if (videoTitle && episodeName.includes(videoTitle)) {
        // 去除标题部分，保留后缀
        let processed = episodeName.replace(videoTitle, '').trim()
        // 去除开头的特殊字符
        processed = processed.replace(/^[_\-\s]+/, '')
        return processed || episodeName
      }
      return episodeName
      
    case 'simple':
      // 精简显示：提取数字部分
      const numberMatch = episodeName.match(/(\d+)/g)
      if (numberMatch && numberMatch.length > 0) {
        // 取最后一个数字，并格式化为三位数
        const lastNumber = numberMatch[numberMatch.length - 1]
        return String(lastNumber).padStart(3, '0')
      }
      // 如果没有数字，尝试提取中文数字或其他标识
      const chineseNumberMatch = episodeName.match(/[一二三四五六七八九十百千万]+/)
      if (chineseNumberMatch) {
        return chineseNumberMatch[0]
      }
      // 如果都没有，返回原名称的简化版本
      return episodeName.length > 6 ? episodeName.substring(0, 6) + '...' : episodeName
      
    default:
      return episodeName
  }
}

const playVideo = () => {
  // 检查是否有历史记录
  const videoId = originalVideoInfo.value.id
  const apiUrl = currentSiteInfo.value.api
  
  if (videoId && apiUrl) {
    const historyItem = historyStore.getHistoryByVideo(videoId, apiUrl)
    
    if (historyItem) {
      console.log('发现历史记录，播放历史位置:', historyItem)
      
      // 查找历史记录对应的线路和选集
      const routes = playRoutes.value
      const targetRoute = routes.find(route => route.name === historyItem.current_route_name)
      
      if (targetRoute) {
        const routeIndex = routes.indexOf(targetRoute)
        currentRoute.value = routeIndex
        
        // 等待currentRouteEpisodes更新后查找选集
        nextTick(() => {
          const episodes = currentRouteEpisodes.value
          const targetEpisode = episodes.find(ep => ep.name === historyItem.current_episode_name)
          
          if (targetEpisode) {
            const episodeIndex = episodes.indexOf(targetEpisode)
            currentEpisode.value = episodeIndex
            
            // 等待currentEpisodeUrl更新后播放
            nextTick(() => {
              if (currentEpisodeUrl.value) {
                console.log('播放历史记录位置:', historyItem.current_episode_name)
                Message.info(`继续播放: ${historyItem.current_episode_name}`)
                window.open(currentEpisodeUrl.value, '_blank')
                
                // 更新历史记录的播放时间
                updateHistoryRecord()
              }
            })
          } else {
            console.warn('未找到历史选集，播放第一个选集')
            playFirstEpisode()
          }
        })
      } else {
        console.warn('未找到历史线路，播放第一个选集')
        playFirstEpisode()
      }
    } else {
      console.log('无历史记录，播放第一个选集')
      playFirstEpisode()
    }
  } else {
    playFirstEpisode()
  }
}

const playFirstEpisode = () => {
  // 播放第一个线路的第一个选集（受排序影响）
  if (playRoutes.value.length > 0) {
    currentRoute.value = 0
    
    nextTick(() => {
      if (currentRouteEpisodes.value.length > 0) {
        currentEpisode.value = 0
        
        nextTick(() => {
          if (currentEpisodeUrl.value) {
            console.log('播放第一个选集:', currentRouteEpisodes.value[0].name)
            Message.info(`开始播放: ${currentRouteEpisodes.value[0].name}`)
            window.open(currentEpisodeUrl.value, '_blank')
            
            // 添加到历史记录
            updateHistoryRecord()
          }
        })
      }
    })
  }
}

const updateHistoryRecord = () => {
  // 添加到历史记录
  if (videoDetail.value && currentRouteEpisodes.value[currentEpisode.value]) {
    const videoInfo = {
      id: originalVideoInfo.value.id,
      name: originalVideoInfo.value.name || videoDetail.value.vod_name || '',
      pic: originalVideoInfo.value.pic || videoDetail.value.vod_pic || '',
      year: originalVideoInfo.value.year || videoDetail.value.vod_year || '',
      area: originalVideoInfo.value.area || videoDetail.value.vod_area || '',
      type: originalVideoInfo.value.type || videoDetail.value.vod_type || '',
      type_name: originalVideoInfo.value.type_name || videoDetail.value.type_name || '',
      remarks: originalVideoInfo.value.remarks || videoDetail.value.vod_remarks || '',
      api_info: {
        module: currentSiteInfo.value.key,
        api_url: currentSiteInfo.value.api,
        site_name: currentSiteInfo.value.name
      }
    }
    
    const routeInfo = {
      name: playRoutes.value[currentRoute.value]?.name || '',
      index: currentRoute.value
    }
    
    const episodeInfo = {
      name: currentRouteEpisodes.value[currentEpisode.value].name,
      index: currentEpisode.value,
      url: currentRouteEpisodes.value[currentEpisode.value].url
    }
    
    historyStore.addToHistory(videoInfo, routeInfo, episodeInfo)
  }
}

const copyPlayUrl = async () => {
  if (currentEpisodeUrl.value) {
    try {
      await navigator.clipboard.writeText(currentEpisodeUrl.value)
      Message.success('链接已复制到剪贴板')
    } catch (err) {
      Message.error('复制失败')
    }
  }
}

// 监听路由变化（包括参数和查询参数）
watch(() => [route.params.id, route.query], () => {
  if (route.params.id) {
    console.log('检测到路由变化，重新加载视频详情:', {
      id: route.params.id,
      fromCollection: route.query.fromCollection,
      name: route.query.name
    })
    loadVideoDetail()
  }
}, { immediate: true, deep: true })

// 监听站点变化，换源后重新加载详情
watch(() => siteStore.nowSite, (newSite, oldSite) => {
  if (newSite && oldSite && newSite.api !== oldSite.api && route.params.id) {
    console.log('检测到站点切换，重新加载视频详情:', { 
      oldSite: oldSite?.name, 
      newSite: newSite?.name 
    })
    loadVideoDetail()
  }
}, { deep: true })

// 组件挂载时的初始化（watch已经设置了immediate: true，无需重复调用）
onMounted(() => {
  console.log('VideoDetail组件已挂载')
})
</script>

<style scoped>
.video-detail {
  min-height: 100vh;
  background: var(--color-bg-1);
}

.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background: var(--color-bg-2);
  border-bottom: 1px solid var(--color-border-2);
  position: sticky;
  top: 0;
  z-index: 100;
}

.detail-header .left-section {
  display: flex;
  align-items: center;
  flex: 1;
}

.back-btn {
  margin-right: 16px;
  flex-shrink: 0;
}

.header-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-1);
  flex: 1;
  min-width: 0;
}

.title-with-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.title-main {
  font-size: 16px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.title-source {
  font-size: 12px;
  color: var(--color-text-3);
  font-weight: normal;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.favorite-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 100px;
  justify-content: center;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: 16px;
}

.loading-text {
  color: var(--color-text-2);
  font-size: 14px;
}

.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: 16px;
}

.detail-content {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

.video-info-card {
  margin-bottom: 24px;
}

.video-header {
  display: flex;
  gap: 24px;
  margin-bottom: 24px;
}

.video-poster {
  flex-shrink: 0;
  width: 200px;
  height: 280px;
  border-radius: 8px;
  overflow: hidden;
  background: var(--color-bg-3);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.video-poster img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-meta {
  flex: 1;
}

.video-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--color-text-1);
  margin: 0 0 16px 0;
  line-height: 1.3;
}

.video-tags {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.video-info-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-item {
  display: flex;
  align-items: flex-start;
}

.info-item .label {
  font-weight: 600;
  color: var(--color-text-2);
  min-width: 60px;
  flex-shrink: 0;
}

.info-item .value {
  color: var(--color-text-1);
  line-height: 1.5;
}

.video-description {
  border-top: 1px solid var(--color-border-2);
  padding-top: 24px;
}

.video-description h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-1);
  margin: 0 0 16px 0;
}

.description-content {
  color: var(--color-text-1);
  line-height: 1.6;
  max-height: 120px;
  overflow: hidden;
  transition: max-height 0.3s ease;
}

.description-content.expanded {
  max-height: none;
}

.expand-btn {
  margin-top: 8px;
  padding: 0;
}

.play-section {
  margin-bottom: 24px;
}

.play-section h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-1);
  margin: 0 0 16px 0;
}

.route-tabs {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.route-btn {
  min-width: 120px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.route-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.route-name {
  flex: 1;
  text-align: center;
}

.route-badge {
  flex-shrink: 0;
}

.episodes-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.episodes-header h4 {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-1);
  margin: 0;
}

.episodes-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sort-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--color-text-2);
  border-radius: 6px;
  transition: all 0.2s ease;
}

.sort-btn:hover {
  color: var(--color-text-1);
  background-color: var(--color-bg-2);
}

.strategy-select, .layout-select {
  border-radius: 6px;
}

.strategy-select :deep(.arco-select-view-single), 
.layout-select :deep(.arco-select-view-single) {
  background-color: transparent;
  border: none;
  color: var(--color-text-2);
  font-size: 12px;
  padding: 4px 8px;
  min-height: 28px;
  white-space: nowrap;
  overflow: visible;
}

.strategy-select :deep(.arco-select-view-single):hover, 
.layout-select :deep(.arco-select-view-single):hover {
  background-color: var(--color-bg-2);
  color: var(--color-text-1);
}

.strategy-select :deep(.arco-select-view-value), 
.layout-select :deep(.arco-select-view-value) {
  overflow: visible;
  text-overflow: unset;
  white-space: nowrap;
}

.strategy-select :deep(.arco-select-view-suffix), 
.layout-select :deep(.arco-select-view-suffix) {
  margin-left: 4px;
}

.episodes-grid {
  display: grid;
  grid-template-columns: repeat(var(--episodes-columns, 12), 1fr);
  gap: 12px;
  margin-bottom: 24px;
}

.episode-btn {
  min-height: 40px;
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}

.episode-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.episode-text {
  display: block;
  width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: center;
  padding: 0 8px;
}

.video-actions {
  margin-top: 20px;
  padding: 20px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 12px;
  border: 1px solid #dee2e6;
}

.play-actions {
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
  justify-content: center;
}

.play-btn {
  min-width: 140px;
  height: 44px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 16px;
  box-shadow: 0 4px 12px rgba(22, 93, 255, 0.3);
  transition: all 0.2s ease;
}

.play-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(22, 93, 255, 0.4);
}

.copy-btn {
  height: 44px;
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.copy-btn:hover {
  transform: translateY(-1px);
}

.no-play-section {
  text-align: center;
  padding: 40px;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .detail-content {
    max-width: 100%;
    padding: 20px;
  }
}

@media (max-width: 768px) {
  .detail-header {
    padding: 12px 16px;
  }
  
  .header-title {
    font-size: 14px;
  }
  
  .title-main {
    font-size: 14px;
  }
  
  .title-source {
    font-size: 11px;
  }
  
  .favorite-btn {
    min-width: 80px;
    font-size: 12px;
  }
  
  .detail-content {
    padding: 16px;
  }
  
  .video-header {
    flex-direction: column;
    gap: 16px;
  }
  
  .video-poster {
    width: 150px;
    height: 210px;
    margin: 0 auto;
  }
  
  .video-title {
    font-size: 24px;
    text-align: center;
  }
  
  .route-tabs {
    gap: 8px;
  }
  
  .route-btn {
    min-width: 100px;
    height: 36px;
    font-size: 14px;
  }
  
  .episodes-grid {
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
    gap: 8px;
  }
  
  .episode-btn {
    min-height: 36px;
    font-size: 12px;
  }
  
  .play-actions {
    flex-direction: column;
    align-items: stretch;
  }
  
  .play-btn {
    width: 100%;
    height: 40px;
    font-size: 14px;
  }
  
  .copy-btn {
    width: 100%;
    height: 40px;
  }
}

@media (max-width: 480px) {
  .detail-header {
    padding: 10px 12px;
  }
  
  .header-title {
    font-size: 13px;
  }
  
  .title-main {
    font-size: 13px;
  }
  
  .favorite-btn {
    min-width: 70px;
    font-size: 11px;
  }
  
  .episodes-grid {
    grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
  }
}
</style>