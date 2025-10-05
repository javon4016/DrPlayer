<template>
  <a-card v-if="visible && videoUrl" class="video-player-section">
    <!-- 使用PlayerHeader组件 -->
    <PlayerHeader
      :episode-name="episodeName"
      :player-type="playerType"
      :episodes="episodes"
      :auto-next-enabled="autoNext"
      :countdown-enabled="showCountdown"
      :skip-enabled="skipEnabled"
      :show-debug-button="showDebugButton"
      :qualities="availableQualities"
      :current-quality="currentQuality"
      @toggle-auto-next="toggleAutoNext"
      @toggle-countdown="toggleCountdown"
      @player-change="handlePlayerTypeChange"
      @open-skip-settings="openSkipSettingsDialog"
      @toggle-debug="toggleDebugDialog"
      @proxy-change="handleProxyChange"
      @quality-change="handleQualityChange"
      @close="closePlayer"
    />
    <div class="video-player-container">
      <video 
        ref="videoPlayer"
        class="video-player"
        controls
        autoplay
        preload="auto"
        :poster="poster"
      >
        您的浏览器不支持视频播放
      </video>
      
      <!-- 倍速控制器 -->
      <div class="speed-control">
        <label for="speed-select">倍速：</label>
        <select 
          id="speed-select" 
          v-model="currentSpeed" 
          @change="changePlaybackRate"
          class="speed-selector"
        >
          <option value="0.5">0.5x</option>
          <option value="0.75">0.75x</option>
          <option value="1">1x</option>
          <option value="1.25">1.25x</option>
          <option value="1.5">1.5x</option>
          <option value="2">2x</option>
          <option value="2.5">2.5x</option>
          <option value="3">3x</option>
          <option value="4">4x</option>
          <option value="5">5x</option>
        </select>
      </div>
      
      <!-- 自动下一集倒计时弹窗 -->
      <div v-if="showAutoNextDialog" class="auto-next-dialog">
        <div class="auto-next-content">
          <div class="auto-next-title">
            <span>即将播放下一集</span>
          </div>
          <div class="auto-next-episode" v-if="getNextEpisode()">
            {{ getNextEpisode().name }}
          </div>
          <div class="auto-next-countdown">
            {{ autoNextCountdown }} 秒后自动播放
          </div>
          <div class="auto-next-buttons">
            <button @click="playNextEpisode" class="btn-play-now">立即播放</button>
            <button @click="cancelAutoNext" class="btn-cancel">取消</button>
          </div>
        </div>
      </div>
      
      <!-- 使用SkipSettingsDialog组件 -->
      <SkipSettingsDialog
        :visible="showSkipSettingsDialog"
        :skip-intro-enabled="skipIntroEnabled"
        :skip-outro-enabled="skipOutroEnabled"
        :skip-intro-seconds="skipIntroSeconds"
        :skip-outro-seconds="skipOutroSeconds"
        @close="closeSkipSettingsDialog"
        @save="saveSkipSettings"
      />
      
      <!-- 调试信息弹窗组件 -->
      <DebugInfoDialog
        :visible="showDebugDialog"
        :video-url="currentPlayingUrl || videoUrl"
        :headers="headers"
        :player-type="'default'"
        :detected-format="detectedFormat"
        :proxy-url="proxyVideoUrl"
        @close="closeDebugDialog"
      />
    </div>
  </a-card>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted, nextTick, computed } from 'vue'
import { Message } from '@arco-design/web-vue'
import { IconClose } from '@arco-design/web-vue/es/icon'
import Hls from 'hls.js'
import PlayerHeader from './PlayerHeader.vue'
import SkipSettingsDialog from './SkipSettingsDialog.vue'
import DebugInfoDialog from './DebugInfoDialog.vue'
import { useSkipSettings } from '@/composables/useSkipSettings'
import { applyCSPBypass, setVideoReferrerPolicy, REFERRER_POLICIES, getCSPConfig } from '@/utils/csp'
import { MediaPlayerManager, detectVideoFormat } from '@/utils/MediaPlayerManager'
import { processVideoUrl, isProxyPlayEnabled } from '@/utils/proxyPlayer'

// Props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  videoUrl: {
    type: String,
    default: ''
  },
  episodeName: {
    type: String,
    default: '未知选集'
  },
  poster: {
    type: String,
    default: ''
  },
  playerType: {
    type: String,
    default: 'default'
  },
  // 自动下一集功能相关 props
  episodes: {
    type: Array,
    default: () => []
  },
  currentEpisodeIndex: {
    type: Number,
    default: 0
  },
  // 自定义请求头，用于HLS播放
  headers: {
    type: Object,
    default: () => ({})
  },
  // 画质相关属性
  qualities: {
    type: Array,
    default: () => []
  },
  hasMultipleQualities: {
    type: Boolean,
    default: false
  },
  initialQuality: {
    type: String,
    default: '默认'
  }
})

// Emits
const emit = defineEmits(['close', 'error', 'player-change', 'next-episode', 'quality-change'])

// 响应式数据
const videoPlayer = ref(null)
const mediaPlayerManager = ref(null)
const autoNext = ref(true) // 默认开启自动连播
const showCountdown = ref(false)
const showAutoNextDialog = ref(false)
const autoNextCountdown = ref(10)
const countdownTimer = ref(null)
const isProcessingAutoNext = ref(false) // 防止重复触发自动连播
const currentSpeed = ref(1) // 当前播放倍速

// 调试相关
const showDebugDialog = ref(false)
const detectedFormat = ref('')

// 画质相关
const currentQuality = ref('默认')
const availableQualities = ref([])
const currentPlayingUrl = ref('')

// 初始化画质数据
const initQualityData = () => {
  if (props.qualities && props.qualities.length > 0) {
    availableQualities.value = [...props.qualities]
    currentQuality.value = props.initialQuality || props.qualities[0]?.name || '默认'
    
    // 设置当前播放URL
    const currentQualityData = availableQualities.value.find(q => q.name === currentQuality.value)
    currentPlayingUrl.value = currentQualityData?.url || props.videoUrl
    
    console.log('初始化画质数据:', {
      qualities: availableQualities.value,
      currentQuality: currentQuality.value,
      currentPlayingUrl: currentPlayingUrl.value
    })
  } else {
    availableQualities.value = []
    currentQuality.value = '默认'
    currentPlayingUrl.value = props.videoUrl
  }
}

// 画质切换处理
const handleQualityChange = (qualityName) => {
  console.log('切换画质:', qualityName)
  
  const targetQuality = availableQualities.value.find(q => q.name === qualityName)
  if (!targetQuality) {
    console.error('未找到指定画质:', qualityName)
    Message.error('画质切换失败：未找到指定画质')
    return
  }
  
  // 记录当前播放时间
  const currentTime = videoPlayer.value?.currentTime || 0
  const wasPlaying = videoPlayer.value && !videoPlayer.value.paused
  
  console.log('切换画质前状态:', {
    currentTime,
    wasPlaying,
    from: currentQuality.value,
    to: qualityName,
    url: targetQuality.url
  })
  
  // 更新当前画质和播放URL
  currentQuality.value = qualityName
  currentPlayingUrl.value = targetQuality.url
  
  // 通知父组件画质已切换
  emit('quality-change', {
    quality: qualityName,
    url: targetQuality.url,
    currentTime,
    wasPlaying
  })
  
  // 切换视频源
  switchVideoSource(targetQuality.url, currentTime, wasPlaying)
}

// 切换视频源
const switchVideoSource = (newUrl, seekTime = 0, autoPlay = false) => {
  if (!videoPlayer.value || !newUrl) return
  
  console.log('切换视频源:', {
    newUrl,
    seekTime,
    autoPlay
  })
  
  try {
    // 使用MediaPlayerManager切换视频
    if (mediaPlayerManager.value) {
      mediaPlayerManager.value.switchVideo(newUrl)
    } else {
      // 原生播放器直接切换
      videoPlayer.value.src = newUrl
    }
    
    // 等待视频加载后跳转到指定时间
    const handleLoadedData = () => {
      if (seekTime > 0) {
        videoPlayer.value.currentTime = seekTime
      }
      
      if (autoPlay) {
        videoPlayer.value.play().catch(err => {
          console.warn('画质切换后自动播放失败:', err)
        })
      }
      
      videoPlayer.value.removeEventListener('loadeddata', handleLoadedData)
      Message.success(`已切换到${currentQuality.value}画质`)
    }
    
    videoPlayer.value.addEventListener('loadeddata', handleLoadedData)
    
  } catch (error) {
    console.error('切换视频源失败:', error)
    Message.error('画质切换失败，请重试')
  }
}

// 计算属性：是否显示调试按钮
const showDebugButton = computed(() => {
  return !!props.videoUrl
})

// 计算属性：代理后的视频链接
const proxyVideoUrl = computed(() => {
  // 使用当前实际播放的URL，如果没有则使用props.videoUrl
  const actualUrl = currentPlayingUrl.value || props.videoUrl
  if (!actualUrl) return ''
  
  const headers = props.headers || {}
  return processVideoUrl(actualUrl, headers)
})

// 检查是否有下一集
const hasNextEpisode = () => {
  return props.episodes && props.episodes.length > 0 && 
         props.currentEpisodeIndex < props.episodes.length - 1
}

// 获取下一集信息
const getNextEpisode = () => {
  if (hasNextEpisode()) {
    return props.episodes[props.currentEpisodeIndex + 1]
  }
  return null
}

// 隐藏自动下一集对话框
const hideAutoNextDialog = () => {
  showAutoNextDialog.value = false
  if (countdownTimer.value) {
    clearInterval(countdownTimer.value)
    countdownTimer.value = null
  }
}

// 播放下一集
const playNextEpisode = () => {
  if (hasNextEpisode()) {
    const nextIndex = props.currentEpisodeIndex + 1
    emit('next-episode', nextIndex)
    hideAutoNextDialog()
    // 重置防抖标志
    setTimeout(() => {
      isProcessingAutoNext.value = false
    }, 2000) // 2秒后重置，给视频切换足够的时间
  }
}

// 使用片头片尾跳过功能组合式函数
const {
  showSkipSettingsDialog,
  skipIntroEnabled,
  skipOutroEnabled,
  skipIntroSeconds,
  skipOutroSeconds,
  skipEnabled,
  skipOutroTimer,
  initSkipSettings,
  applySkipSettings,
  applyIntroSkipImmediate,
  handleTimeUpdate,
  resetSkipState,
  openSkipSettingsDialog,
  closeSkipSettingsDialog,
  saveSkipSettings: saveSkipSettingsComposable,
  onUserSeekStart,
  onUserSeekEnd
} = useSkipSettings({
  onSkipToNext: playNextEpisode,
  getCurrentTime: () => videoPlayer.value?.currentTime || 0,
  setCurrentTime: (time) => {
    if (videoPlayer.value) {
      videoPlayer.value.currentTime = time
    }
  },
  getDuration: () => videoPlayer.value?.duration || 0
})

// 切换自动连播
const toggleAutoNext = () => {
  autoNext.value = !autoNext.value
}

// 切换倒计时显示
const toggleCountdown = () => {
  showCountdown.value = !showCountdown.value
}

// 显示自动下一集对话框
const showAutoNextDialogFunc = () => {
  if (!autoNext.value || !hasNextEpisode()) return
  
  showAutoNextDialog.value = true
  autoNextCountdown.value = 10
  
  countdownTimer.value = setInterval(() => {
    autoNextCountdown.value--
    if (autoNextCountdown.value <= 0) {
      playNextEpisode()
    }
  }, 1000)
}

// 取消自动下一集
const cancelAutoNext = () => {
  hideAutoNextDialog()
  // 重置防抖标志
  isProcessingAutoNext.value = false
}

// 改变播放倍速
const changePlaybackRate = () => {
  if (videoPlayer.value) {
    videoPlayer.value.playbackRate = parseFloat(currentSpeed.value)
    console.log('播放倍速已设置为:', currentSpeed.value)
  }
}

// 调试弹窗控制方法
const toggleDebugDialog = () => {
  showDebugDialog.value = !showDebugDialog.value
}

const closeDebugDialog = () => {
  showDebugDialog.value = false
}

// 链接类型判断函数
const isDirectVideoLink = (url) => {
  if (!url) return false
  
  // 视频文件扩展名
  const videoExtensions = [
    '.mp4', '.webm', '.ogg', '.avi', '.mov', '.wmv', '.flv', '.mkv', 
    '.m4v', '.3gp', '.ts', '.m3u8', '.mpd'
  ]
  
  // 检查URL是否包含视频扩展名
  const hasVideoExtension = videoExtensions.some(ext => 
    url.toLowerCase().includes(ext)
  )
  
  // 检查是否是流媒体格式
  const isStreamingFormat = url.toLowerCase().includes('m3u8') || 
                           url.toLowerCase().includes('mpd') ||
                           url.toLowerCase().includes('rtmp') ||
                           url.toLowerCase().includes('rtsp')
  
  // 如果有视频扩展名或是流媒体格式，认为是直链
  if (hasVideoExtension || isStreamingFormat) {
    return true
  }
  
  // 检查是否看起来像网页链接（但排除已经确认为视频的情况）
  const looksLikeWebpage = url.includes('://') && 
                          (url.includes('.html') || 
                           url.includes('.php') || 
                           url.includes('.asp') || 
                           url.includes('.jsp') ||
                           url.match(/\/[^.?#]*$/) // 没有扩展名且没有查询参数的路径
                          ) &&
                          !hasVideoExtension && 
                          !isStreamingFormat
  
  // 如果看起来像网页，认为不是直链
  if (looksLikeWebpage) {
    return false
  }
  
  // 默认尝试作为直链处理
  return true
}

// 初始化视频播放器
const initVideoPlayer = (url) => {
  if (!videoPlayer.value || !url) return
  
  // 重置片头片尾跳过状态
  resetSkipState()
  
  // 首先判断链接类型
  if (!isDirectVideoLink(url)) {
    Message.info('检测到网页链接，正在新窗口打开...')
    window.open(url, '_blank')
    emit('close') // 关闭播放器
    return
  }
  
  // 初始化MediaPlayerManager
  if (!mediaPlayerManager.value) {
    mediaPlayerManager.value = new MediaPlayerManager(videoPlayer.value)
  } else {
    // 清理之前的播放器实例
    mediaPlayerManager.value.destroy()
  }
  
  const video = videoPlayer.value
  
  // 应用CSP绕过策略
  try {
    const appliedPolicy = applyCSPBypass(url, video)
    console.log(`已为视频播放应用CSP策略: ${appliedPolicy}`)
  } catch (error) {
    console.warn('应用CSP策略失败:', error)
    // 降级到基本的no-referrer策略
    setVideoReferrerPolicy(video, REFERRER_POLICIES.NO_REFERRER)
  }
  
  // 视频结束事件处理函数
  const handleVideoEnded = () => {
    // 防抖：如果正在处理自动连播，则忽略
    if (isProcessingAutoNext.value) {
      return
    }
    
    if (autoNext.value && hasNextEpisode()) {
      isProcessingAutoNext.value = true
      
      if (showCountdown.value) {
        showAutoNextDialogFunc()
      } else {
        // 如果不显示倒计时，直接播放下一集
        setTimeout(() => {
          playNextEpisode()
        }, 1000)
      }
    }
  }

  // 使用MediaPlayerManager加载视频
  try {
    // 重置片头片尾跳过状态（对所有格式都适用）
    resetSkipState()
    
    const format = detectVideoFormat(url)
    detectedFormat.value = format
    console.log(`检测到视频格式: ${format}`)
    
    // 准备自定义请求头
    const headers = props.headers || {}
    
    // 处理代理播放地址
    const finalUrl = processVideoUrl(url, headers)
    if (finalUrl !== url) {
      console.log('🔄 [代理播放] 使用代理地址播放视频')
    }
    
    // 使用MediaPlayerManager加载视频
    const player = mediaPlayerManager.value.loadVideo(finalUrl, headers)
    
    if (player) {
      console.log(`使用${format}播放器加载视频成功`)
      
      // 为HLS播放器添加事件监听
      if (format === 'hls' && player) {
        player.on(Hls.Events.MANIFEST_PARSED, () => {
          console.log('HLS manifest 解析完成，开始播放')
          video.play().catch(err => {
            console.warn('自动播放失败:', err)
          })
        })
        
        player.on(Hls.Events.ERROR, (event, data) => {
          console.error('HLS播放错误:', data)
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                Message.error('网络错误，请检查网络连接')
                player.startLoad()
                break
              case Hls.ErrorTypes.MEDIA_ERROR:
                Message.error('媒体错误，尝试恢复播放')
                player.recoverMediaError()
                break
              default:
                Message.error('播放器错误，请重试')
                emit('error', '播放器错误')
                break
            }
          }
        })
      }
      
      // 为所有格式的播放器添加统一的video元素事件监听器
      const handleLoadedMetadata = () => {
        video.play().catch(err => {
          console.warn('自动播放失败:', err)
          Message.warning('自动播放失败，请手动点击播放')
        })
        
        // 应用片头片尾设置
        applySkipSettings()
      }
      
      const handleError = (e) => {
        console.error('视频播放错误:', e)
        Message.error('视频播放失败，请检查视频链接或格式')
        emit('error', '视频播放失败')
      }
      
      const handlePlaying = () => {
        // 立即尝试片头跳过（针对视频刚开始播放的情况）
        const immediateSkipped = applyIntroSkipImmediate()
        
        // 如果立即跳过未执行，则使用常规跳过逻辑
        if (!immediateSkipped) {
          applySkipSettings()
          
          // 为了确保片头跳过生效，再次检查（短延迟）
          setTimeout(() => {
            applySkipSettings()
          }, 50)
        }
      }
      
      const handleSeeking = () => {
        onUserSeekStart()
      }
      
      const handleSeeked = () => {
        onUserSeekEnd()
      }
      
      // 移除之前的事件监听器（如果有）
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('error', handleError)
      video.removeEventListener('playing', handlePlaying)
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('seeking', handleSeeking)
      video.removeEventListener('seeked', handleSeeked)
      
      // 添加新的事件监听器
      video.addEventListener('loadedmetadata', handleLoadedMetadata)
      video.addEventListener('error', handleError)
      video.addEventListener('playing', handlePlaying)
      video.addEventListener('timeupdate', handleTimeUpdate)
      video.addEventListener('seeking', handleSeeking)
      video.addEventListener('seeked', handleSeeked)
    } else {
        // 原生视频播放 - 直接设置src
        video.src = url
      }
    
  } catch (error) {
    console.error('视频加载失败:', error)
    Message.error('视频加载失败，请重试')
    emit('error', '视频加载失败')
  }
  
  // 统一添加视频结束事件监听器（避免重复添加）
  video.removeEventListener('ended', handleVideoEnded)
  video.addEventListener('ended', handleVideoEnded)
}

// 片头片尾跳过功能相关方法

// 关闭片头片尾设置弹窗
// 保存片头片尾设置
const saveSkipSettings = (settings) => {
  saveSkipSettingsComposable(settings)
  Message.success('片头片尾设置已保存')
  closeSkipSettingsDialog()
}



// 关闭播放器
const closePlayer = () => {
  console.log('关闭视频播放器')
  
  // 停止播放
  if (videoPlayer.value) {
    videoPlayer.value.pause()
    videoPlayer.value.currentTime = 0
  }
  
  // 清理HLS实例
  if (hlsInstance.value) {
    hlsInstance.value.destroy()
    hlsInstance.value = null
  }
  
  // 清理片尾跳过定时器
  if (skipOutroTimer.value) {
    clearInterval(skipOutroTimer.value)
    skipOutroTimer.value = null
  }
  
  emit('close')
}

// 处理播放器类型变更
const handlePlayerTypeChange = (newType) => {
  emit('player-change', newType)
}

// 处理代理播放地址变更
const handleProxyChange = (proxyUrl) => {
  console.log('代理播放地址变更:', proxyUrl)
  
  try {
    // 获取当前的addressSettings
    const savedAddresses = JSON.parse(localStorage.getItem('addressSettings') || '{}')
    
    if (proxyUrl === 'disabled') {
      // 关闭代理播放，但保留设置界面中配置的代理地址
      savedAddresses.proxyPlayEnabled = false
      // 注意：不清除 proxyPlay 地址，保留用户在设置界面的配置
    } else {
      // 启用代理播放并设置地址
      savedAddresses.proxyPlayEnabled = true
      savedAddresses.proxyPlay = proxyUrl
    }
    
    // 保存到localStorage
    localStorage.setItem('addressSettings', JSON.stringify(savedAddresses))
    
    // 触发自定义事件，通知其他组件设置已变化
    window.dispatchEvent(new CustomEvent('addressSettingsChanged'))
    
    // 重新加载视频以应用新的代理设置
    if (props.videoUrl) {
      nextTick(() => {
        initVideoPlayer(props.videoUrl)
      })
    }
  } catch (error) {
    console.error('保存代理播放设置失败:', error)
  }
}

// 监听视频URL变化
watch(() => props.videoUrl, (newUrl) => {
  if (newUrl && props.visible) {
    resetSkipState() // 重置片头片尾跳过状态
    nextTick(() => {
      initVideoPlayer(newUrl)
    })
  }
}, { immediate: true })

// 监听显示状态变化
watch(() => props.visible, (newVisible) => {
  if (newVisible && props.videoUrl) {
    nextTick(() => {
      initVideoPlayer(props.videoUrl)
    })
  } else if (!newVisible) {
    // 隐藏时清理资源
    if (mediaPlayerManager.value) {
      mediaPlayerManager.value.destroy()
    }
  }
})

// 监听画质数据变化
watch(() => props.qualities, (newQualities) => {
  console.log('画质数据变化:', newQualities)
  initQualityData()
}, { immediate: true, deep: true })

// 监听初始画质变化
watch(() => props.initialQuality, (newQuality) => {
  if (newQuality && newQuality !== currentQuality.value) {
    console.log('初始画质变化:', newQuality)
    currentQuality.value = newQuality
  }
}, { immediate: true })

// 组件挂载时初始化
onMounted(() => {
  initSkipSettings()
  initQualityData()
})

// 组件卸载时清理资源
onUnmounted(() => {
  console.log('VideoPlayer组件卸载，清理播放器资源')
  
  // 清理视频播放器
  if (videoPlayer.value) {
    videoPlayer.value.pause()
    videoPlayer.value.src = ''
    videoPlayer.value.load() // 这会清理所有事件监听器
  }
  
  if (mediaPlayerManager.value) {
    mediaPlayerManager.value.destroy()
  }
  
  // 清理倒计时定时器
  if (countdownTimer.value) {
    clearInterval(countdownTimer.value)
    countdownTimer.value = null
  }
})
</script>

<style scoped>
/* 视频播放器样式 */
.video-player-section {
  margin-bottom: 20px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.player-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 12px 16px;
  /* background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); */
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.player-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 16px;
  font-weight: 600;
}

.player-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.compact-button-group {
  display: flex;
  align-items: center;
  gap: 4px;
}

.compact-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  height: 28px;
  background: white;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 12px;
  color: #666;
}

.compact-btn:hover {
  border-color: #1890ff;
  color: #1890ff;
}

.compact-btn.active {
  background: #1890ff;
  border-color: #1890ff;
  color: white;
}

.compact-btn.close-btn {
  background: #ff4d4f;
  border-color: #ff4d4f;
  color: white;
}

.compact-btn.close-btn:hover {
  background: #ff7875;
  border-color: #ff7875;
}

.btn-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.btn-text {
  font-size: 12px;
  white-space: nowrap;
}

.compact-select {
  border: none !important;
  background: transparent !important;
  box-shadow: none !important;
  font-size: 12px;
  min-width: 80px;
}

.compact-select .arco-select-view-single {
  border: none !important;
  background: transparent !important;
  padding: 0 !important;
  height: auto !important;
  min-height: auto !important;
}

.selector-btn {
  min-width: 120px;
}

.video-player-container {
  position: relative;
  width: 100%;
  background: #000;
  border-radius: 8px;
  overflow: hidden;
}

.video-player {
  width: 100%;
  height: auto;
  min-height: 400px;
  max-height: 70vh;
  background: #000;
  outline: none;
}

.video-player::-webkit-media-controls-panel {
  background-color: transparent;
}

.video-player::-webkit-media-controls-play-button,
.video-player::-webkit-media-controls-volume-slider,
.video-player::-webkit-media-controls-timeline,
.video-player::-webkit-media-controls-current-time-display,
.video-player::-webkit-media-controls-time-remaining-display {
  color: #fff;
}

/* 自动下一集倒计时弹窗样式 */
.auto-next-dialog {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.9);
  border-radius: 12px;
  padding: 24px;
  z-index: 1000;
  min-width: 300px;
  text-align: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px);
}

.auto-next-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.auto-next-title {
  font-size: 16px;
  font-weight: 600;
  color: #fff;
}

.auto-next-episode {
  font-size: 14px;
  color: #23ade5;
  font-weight: 500;
}

.auto-next-countdown {
  font-size: 18px;
  font-weight: bold;
  color: #ff6b6b;
}

.auto-next-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 8px;
}

.btn-play-now,
.btn-cancel {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.btn-play-now {
  background: #23ade5;
  color: white;
}

.btn-play-now:hover {
  background: #1890d5;
}

.btn-cancel {
  background: #666;
  color: white;
}

.btn-cancel:hover {
  background: #555;
}

/* 倍速控制器样式 */
.speed-control {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.7);
  padding: 8px 12px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 8px;
  z-index: 10;
}

.speed-control label {
  color: white;
  font-size: 14px;
  font-weight: 500;
}

.speed-selector {
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 14px;
  cursor: pointer;
  outline: none;
  transition: all 0.2s ease;
}

.speed-selector:hover {
  background: white;
  border-color: #23ade5;
}

.speed-selector:focus {
  border-color: #23ade5;
  box-shadow: 0 0 0 2px rgba(35, 173, 229, 0.2);
}



/* 响应式设计 */
@media (max-width: 768px) {
  .player-header {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }

  .player-header h3 {
    font-size: 14px;
  }

  .video-player {
    min-height: 200px;
  }
}
</style>