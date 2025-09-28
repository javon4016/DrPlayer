<template>
  <div class="live-container">
    <!-- 简化的标题显示 -->
    <div class="simple-header">
      <span class="navigation-title">Live</span>
      <div class="header-actions">
        <a-button 
          type="text" 
          @click="refreshData"
          :loading="loading"
          size="small"
        >
          <template #icon>
            <icon-refresh />
          </template>
          刷新
        </a-button>
        <a-input-search
          v-model="searchKeyword"
          placeholder="搜索频道..."
          style="width: 200px"
          size="small"
          @search="handleSearch"
          @clear="handleSearchClear"
          allow-clear
        />
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="live-content">
      <!-- 加载状态 -->
      <div v-if="loading && !liveData" class="loading-container">
        <a-spin :size="32" tip="正在加载直播数据..." />
      </div>

      <!-- 错误状态 -->
      <div v-else-if="error" class="error-container">
        <a-result
          status="error"
          :title="error"
          sub-title="请检查网络连接或直播配置"
        >
          <template #extra>
            <a-button type="primary" @click="refreshData">
              重新加载
            </a-button>
            <a-button @click="goToSettings">
              检查设置
            </a-button>
          </template>
        </a-result>
      </div>

      <!-- 无配置状态 -->
      <div v-else-if="!hasLiveConfig" class="no-config-container">
        <a-result
          status="info"
          title="未配置直播源"
          sub-title="请先在设置页面配置直播地址"
        >
          <template #extra>
            <a-button type="primary" @click="goToSettings">
              前往设置
            </a-button>
          </template>
        </a-result>
      </div>

      <!-- 直播内容 -->
      <div v-else-if="liveData" class="live-main">
        <!-- 左侧分组列表 -->
        <div class="groups-panel">
          <div class="panel-header">
            <h3>分组列表</h3>
            <span class="group-count">{{ filteredGroups.length }}个分组</span>
          </div>
          <div class="groups-list">
            <div
              v-for="group in filteredGroups"
              :key="group.name"
              class="group-item"
              :class="{ active: selectedGroup === group.name }"
              @click="selectGroup(group.name)"
            >
              <div class="group-info">
                <span class="group-name">{{ group.name }}</span>
                <span class="channel-count">{{ group.channels.length }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 中间频道列表 -->
        <div class="channels-panel">
          <div class="panel-header">
            <h3>频道列表</h3>
            <span class="channel-count">{{ currentChannels.length }}个频道</span>
          </div>
          <div class="channels-list">
            <div
              v-for="channel in currentChannels"
              :key="channel.name"
              class="channel-item"
              :class="{ active: selectedChannel?.name === channel.name }"
              @click="selectChannel(channel)"
            >
              <div class="channel-logo">
                <img 
                  v-if="channel.logo" 
                  :src="channel.logo" 
                  :alt="channel.name"
                  @error="handleImageError"
                />
                <icon-live-broadcast v-else class="default-logo" />
              </div>
              <div class="channel-info">
                <div class="channel-name">{{ channel.name }}</div>
                <div class="channel-group">{{ channel.group }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧播放器预览区域 -->
        <div class="player-panel">
          <div class="panel-header">
            <h3>播放预览</h3>
            <div class="player-controls" v-if="selectedChannel">
              <a-button 
                type="text" 
                size="small"
                @click="copyChannelUrl"
              >
                <template #icon>
                  <icon-copy />
                </template>
                复制链接
              </a-button>
              <a-button 
                type="text" 
                size="small"
                @click="openInNewWindow"
              >
                <template #icon>
                  <icon-launch />
                </template>
                新窗口播放
              </a-button>
            </div>
          </div>
          
          <div class="player-content">
            <div v-if="!selectedChannel" class="no-selection">
              <icon-play-circle class="no-selection-icon" />
              <p>请选择一个频道开始播放</p>
            </div>
            
            <div v-else class="player-wrapper">
              <div class="channel-header">
                <div class="channel-title">
                  <h4>{{ selectedChannel.name }}</h4>
                  <span class="channel-url">{{ getCurrentChannelUrl() }}</span>
                </div>
                
                <!-- 线路切换器 -->
                <div v-if="selectedChannel.routes && selectedChannel.routes.length > 1" class="route-switcher">
                  <span class="route-label">线路选择：</span>
                  <a-radio-group 
                    v-model:value="currentRouteId" 
                    @change="switchRoute"
                    size="small"
                    class="route-radio-group"
                    :key="selectedChannel.name + '-routes'"
                  >
                    <a-radio 
                      v-for="route in selectedChannel.routes" 
                      :key="route.id" 
                      :value="route.id"
                      class="route-radio"
                    >
                      {{ route.name }}
                    </a-radio>
                  </a-radio-group>
                </div>
              </div>
              
              <!-- 简单的视频播放器 -->
              <div class="video-container">
                <video
                  ref="videoPlayer"
                  :src="getCurrentChannelUrl()"
                  controls
                  preload="metadata"
                  @error="handleVideoError"
                  @loadstart="handleVideoLoadStart"
                  @loadeddata="handleVideoLoaded"
                >
                  您的浏览器不支持视频播放
                </video>
                
                <!-- 播放状态覆盖层 -->
                <div v-if="videoLoading" class="video-loading">
                  <a-spin :size="32" tip="正在加载视频..." />
                </div>
                
                <div v-if="videoError" class="video-error">
                  <icon-exclamation-circle class="error-icon" />
                  <p>视频加载失败</p>
                  <p class="error-detail">{{ videoError }}</p>
                  <a-button @click="retryVideo">重试</a-button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { Message } from '@arco-design/web-vue'
import { 
  IconRefresh, 
  IconLiveBroadcast, 
  IconPlayCircle,
  IconCopy,
  IconLaunch,
  IconExclamationCircle
} from '@arco-design/web-vue/es/icon'
import liveService from '@/api/services/live.js'

const router = useRouter()

// 响应式数据
const loading = ref(false)
const error = ref('')
const liveData = ref(null)
const hasLiveConfig = ref(true)
const searchKeyword = ref('')
const selectedGroup = ref('')
const selectedChannel = ref(null)
const currentRouteId = ref(1) // 当前选中的线路ID
const videoLoading = ref(false)
const videoError = ref('')
const videoPlayer = ref(null)

// 计算属性
const filteredGroups = computed(() => {
  if (!liveData.value) return []
  
  let groups = liveData.value.groups
  
  // 如果有搜索关键词，过滤分组
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    groups = groups.filter(group => 
      group.name.toLowerCase().includes(keyword) ||
      group.channels.some(channel => 
        channel.name.toLowerCase().includes(keyword)
      )
    )
  }
  
  return groups
})

const currentChannels = computed(() => {
  if (!liveData.value || !selectedGroup.value) return []
  
  const group = filteredGroups.value.find(g => g.name === selectedGroup.value)
  if (!group) return []
  
  let channels = group.channels
  
  // 如果有搜索关键词，过滤频道
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    channels = channels.filter(channel => 
      channel.name.toLowerCase().includes(keyword)
    )
  }
  
  return channels
})

// 方法
const loadLiveData = async (forceRefresh = false) => {
  loading.value = true
  error.value = ''
  
  try {
    // 检查是否有直播配置
    const config = await liveService.getLiveConfig()
    if (!config) {
      hasLiveConfig.value = false
      return
    }
    
    hasLiveConfig.value = true
    
    // 获取直播数据
    const data = await liveService.getLiveData(forceRefresh)
    liveData.value = data
    
    // 自动选择第一个分组
    if (data.groups.length > 0 && !selectedGroup.value) {
      selectedGroup.value = data.groups[0].name
    }
    
    console.log('直播数据加载成功:', data)
  } catch (err) {
    console.error('加载直播数据失败:', err)
    error.value = err.message || '加载直播数据失败'
  } finally {
    loading.value = false
  }
}

const refreshData = () => {
  loadLiveData(true)
}

const selectGroup = (groupName) => {
  selectedGroup.value = groupName
  selectedChannel.value = null // 清除选中的频道
}

const selectChannel = (channel) => {
  selectedChannel.value = channel
  videoError.value = ''
  
  // 使用nextTick确保DOM更新后再设置线路ID
  nextTick(() => {
    if (channel && channel.routes && channel.routes.length > 0) {
      // 智能选择线路ID：使用第一个线路的实际ID
      currentRouteId.value = Number(channel.routes[0].id)
    } else {
      currentRouteId.value = 1
    }
    
    // 重置视频播放器
    if (videoPlayer.value) {
      videoPlayer.value.load()
    }
  })
}

// 获取当前频道的播放URL
const getCurrentChannelUrl = () => {
  if (!selectedChannel.value) return ''
  
  if (selectedChannel.value.routes && selectedChannel.value.routes.length > 0) {
    const currentRoute = selectedChannel.value.routes.find(route => route.id === currentRouteId.value)
    return currentRoute ? currentRoute.url : selectedChannel.value.routes[0].url
  }
  
  return selectedChannel.value.url || ''
}

// 切换线路
const switchRoute = (event) => {
  const routeId = Number(event.target ? event.target.value : event)
  if (!selectedChannel.value || !selectedChannel.value.routes) return
  
  const route = selectedChannel.value.routes.find(r => r.id === routeId)
  if (route) {
    currentRouteId.value = routeId
    videoError.value = ''
    
    // 重新加载视频
    nextTick(() => {
      if (videoPlayer.value) {
        videoPlayer.value.src = route.url
        videoPlayer.value.load()
      }
    })
    
    Message.success(`已切换到${route.name}`)
  }
}

const handleSearch = (value) => {
  searchKeyword.value = value
  // 如果搜索后当前分组不在过滤结果中，选择第一个可用分组
  if (filteredGroups.value.length > 0 && 
      !filteredGroups.value.find(g => g.name === selectedGroup.value)) {
    selectedGroup.value = filteredGroups.value[0].name
  }
}

const handleSearchClear = () => {
  searchKeyword.value = ''
}

const goToSettings = () => {
  router.push('/settings')
}

const copyChannelUrl = async () => {
  if (!selectedChannel.value) return
  
  try {
    await navigator.clipboard.writeText(selectedChannel.value.url)
    Message.success('频道链接已复制到剪贴板')
  } catch (err) {
    console.error('复制失败:', err)
    Message.error('复制失败')
  }
}

const openInNewWindow = () => {
  if (!selectedChannel.value) return
  
  window.open(selectedChannel.value.url, '_blank')
}

const handleImageError = (event) => {
  // 图片加载失败时隐藏图片
  event.target.style.display = 'none'
}

const handleVideoError = (event) => {
  console.error('视频播放错误:', event)
  videoError.value = '无法播放此频道，可能是网络问题或频道源不可用'
  videoLoading.value = false
}

const handleVideoLoadStart = () => {
  videoLoading.value = true
  videoError.value = ''
}

const handleVideoLoaded = () => {
  videoLoading.value = false
}

const retryVideo = () => {
  if (videoPlayer.value) {
    videoError.value = ''
    videoPlayer.value.load()
  }
}

// 监听选中频道变化
watch(selectedChannel, (newChannel) => {
  if (newChannel) {
    console.log('选中频道:', newChannel.name, newChannel.url)
  }
})

// 测试方法：直接加载本地M3U文件
const testLocalM3U = async () => {
      try {
        const response = await fetch('/json/tv.m3u')
        const content = await response.text()
        
        // 动态导入live.js并创建实例
        const { default: LiveService } = await import('@/api/services/live.js')
        const liveService = new LiveService()
        
        // 解析M3U内容
        const parsedData = liveService.parseM3U(content, {})
        
        // 设置数据
        liveData.value = parsedData
        
        // 自动选择第一个分组
        if (parsedData.groups && parsedData.groups.length > 0) {
          selectedGroup.value = parsedData.groups[0].name
        }
      } catch (error) {
        console.error('加载本地M3U文件失败:', error)
      }
    }

// 组件挂载时加载数据
onMounted(() => {
  // 先尝试正常加载，如果失败则测试本地M3U
  loadLiveData().then(() => {
    if (!liveData.value) {
      console.log('正常加载失败，尝试测试本地M3U文件')
      testLocalM3U()
    }
  })
})
</script>

<style scoped>
.live-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.simple-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 16px 20px;
  background: var(--color-bg-3);
  border-bottom: 1px solid var(--color-border-2);
  box-sizing: border-box;
}

.navigation-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-1);
  white-space: nowrap;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.live-content {
  flex: 1;
  padding: 16px;
  overflow: hidden;
}

.loading-container,
.error-container,
.no-config-container {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.live-main {
  height: 100%;
  display: flex;
  gap: 16px;
}

.groups-panel,
.channels-panel {
  width: 280px;
  background: var(--color-bg-2);
  border-radius: 8px;
  border: 1px solid var(--color-border-2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.player-panel {
  flex: 1;
  background: var(--color-bg-2);
  border-radius: 8px;
  border: 1px solid var(--color-border-2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 400px;
}

.panel-header {
  padding: 16px;
  border-bottom: 1px solid var(--color-border-2);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--color-bg-3);
}

.panel-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-1);
}

.group-count,
.channel-count {
  font-size: 12px;
  color: var(--color-text-3);
}

.player-controls {
  display: flex;
  gap: 8px;
}

.groups-list,
.channels-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.group-item,
.channel-item {
  padding: 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 4px;
}

.group-item:hover,
.channel-item:hover {
  background: var(--color-fill-2);
}

.group-item.active,
.channel-item.active {
  background: var(--color-primary-light-1);
  color: var(--color-primary-6);
}

.group-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.group-name {
  font-size: 14px;
  font-weight: 500;
}

.channel-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.channel-logo {
  flex: 1;
  height: 45px;
  min-width: 60px;
  border-radius: 6px;
  overflow: hidden;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.channel-logo::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
}

.channel-logo img {
  width: 80%;
  height: 80%;
  object-fit: contain;
  position: relative;
  z-index: 1;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
}

.default-logo {
  font-size: 20px;
  color: rgba(255, 255, 255, 0.9);
  position: relative;
  z-index: 1;
}

.channel-info {
  width: 120px;
  flex-shrink: 0;
}

.channel-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.channel-group {
  font-size: 12px;
  color: var(--color-text-3);
  margin-top: 2px;
}

.player-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.no-selection {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--color-text-3);
}

.no-selection-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.player-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.channel-header {
  padding: 16px;
  border-bottom: 1px solid var(--color-border-2);
  background: var(--color-bg-3);
}

.channel-title h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: var(--color-text-1);
}

.channel-url {
  font-size: 12px;
  color: var(--color-text-3);
  word-break: break-all;
}

.route-switcher {
  margin-top: 12px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  flex-wrap: wrap;
}

.route-label {
  font-size: 12px;
  color: var(--color-text-2);
  white-space: nowrap;
  margin-top: 4px;
}

.route-radio-group {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.route-radio {
  margin-right: 0 !important;
}

.video-container {
  flex: 1;
  position: relative;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.video-container video {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.video-loading,
.video-error {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.8);
  color: white;
}

.error-icon {
  font-size: 48px;
  color: var(--color-danger-6);
  margin-bottom: 16px;
}

.error-detail {
  font-size: 12px;
  color: var(--color-text-3);
  margin-top: 8px;
  text-align: center;
}

/* 滚动条样式 */
.groups-list::-webkit-scrollbar,
.channels-list::-webkit-scrollbar {
  width: 6px;
}

.groups-list::-webkit-scrollbar-track,
.channels-list::-webkit-scrollbar-track {
  background: var(--color-fill-2);
  border-radius: 3px;
}

.groups-list::-webkit-scrollbar-thumb,
.channels-list::-webkit-scrollbar-thumb {
  background: var(--color-fill-4);
  border-radius: 3px;
}

.groups-list::-webkit-scrollbar-thumb:hover,
.channels-list::-webkit-scrollbar-thumb:hover {
  background: var(--color-fill-6);
}
</style>
