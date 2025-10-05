<template>
  <div class="player-header">
    <h3>正在播放: {{ episodeName }}</h3>
    <div class="player-controls">
      <div class="compact-button-group">
        <!-- 调试按钮 - 仅在有直链和请求头时显示 -->
        <div 
          v-if="showDebugButton"
          class="compact-btn debug-btn" 
          @click="$emit('toggle-debug')"
          title="调试信息"
        >
          <svg class="btn-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M2 17l10 5 10-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M2 12l10 5 10-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span class="btn-text">调试</span>
        </div>
        <!-- 自动连播按钮 -->
        <div 
          v-if="showAutoNext && episodes.length > 1"
          class="compact-btn" 
          @click="$emit('toggle-auto-next')" 
          :class="{ active: autoNextEnabled }"
        >
          <svg class="btn-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 5v14l11-7z" fill="currentColor"/>
          </svg>
          <span class="btn-text">自动连播</span>
        </div>
        
        <!-- 倒计时按钮 -->
        <div 
          v-if="showCountdown && episodes.length > 1"
          class="compact-btn" 
          @click="$emit('toggle-countdown')" 
          :class="{ active: countdownEnabled }"
        >
          <svg class="btn-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
            <polyline points="12,6 12,12 16,14" stroke="currentColor" stroke-width="2"/>
          </svg>
          <span class="btn-text">倒计时</span>
        </div>
        
        <!-- 代理播放地址选择器 -->
        <div class="compact-btn selector-btn">
          <svg class="btn-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M2 17l10 5 10-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M2 12l10 5 10-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <a-select
            :model-value="currentProxyOption"
            @change="handleProxyChange"
            class="compact-select"
            size="small"
          >
            <a-option value="disabled" title="关闭代理播放功能">代理播放:关闭</a-option>
            <a-option 
              v-for="option in proxyOptions" 
              :key="option.value" 
              :value="option.value"
              :title="`${option.label}\n完整链接: ${option.url || option.value}`"
            >
              代理播放:{{ option.label }}
            </a-option>
          </a-select>
        </div>

        <!-- 画质选择器 -->
        <div 
          v-if="qualities && qualities.length > 1" 
          class="compact-btn selector-btn"
        >
          <svg class="btn-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" stroke="currentColor" stroke-width="2"/>
            <line x1="8" y1="21" x2="16" y2="21" stroke="currentColor" stroke-width="2"/>
            <line x1="12" y1="17" x2="12" y2="21" stroke="currentColor" stroke-width="2"/>
            <text x="12" y="12" text-anchor="middle" fill="currentColor" font-size="8">HD</text>
          </svg>
          <a-select
            :model-value="currentQuality"
            @change="$emit('quality-change', $event)"
            class="compact-select"
            size="small"
          >
            <a-option 
              v-for="quality in qualities" 
              :key="quality.name" 
              :value="quality.name"
              :title="`切换到${quality.name}画质`"
            >
              画质:{{ quality.name }}
            </a-option>
          </a-select>
        </div>

        <!-- 播放器切换选择器 -->
        <div class="compact-btn selector-btn">
          <svg class="btn-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="currentColor" stroke-width="2"/>
            <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" stroke="currentColor" stroke-width="2"/>
          </svg>
          <a-select
            :model-value="playerType"
            @change="$emit('player-change', $event)"
            class="compact-select"
            size="small"
          >
            <a-option value="default" title="使用浏览器默认的HTML5视频播放器">默认播放器</a-option>
            <a-option value="artplayer" title="使用ArtPlayer播放器，支持更多功能和自定义选项">ArtPlayer</a-option>
          </a-select>
        </div>
        
        <!-- 片头片尾设置按钮 -->
        <div 
          class="compact-btn" 
          :class="{ active: skipEnabled }" 
          @click="$emit('open-skip-settings')"
        >
          <svg class="btn-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 4l10 8-10 8V4z" fill="currentColor"/>
            <path d="M19 5v14" stroke="currentColor" stroke-width="2"/>
            <path d="M3 12h2" stroke="currentColor" stroke-width="2"/>
            <path d="M19 12h2" stroke="currentColor" stroke-width="2"/>
          </svg>
          <span class="btn-text">片头片尾</span>
        </div>
        
        <!-- 关闭按钮 -->
        <div class="compact-btn close-btn" @click="$emit('close')">
          <svg class="btn-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" stroke-width="2"/>
            <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" stroke-width="2"/>
          </svg>
          <span class="btn-text">关闭</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

// Props
const props = defineProps({
  episodeName: {
    type: String,
    default: '未知选集'
  },
  playerType: {
    type: String,
    default: 'default'
  },
  episodes: {
    type: Array,
    default: () => []
  },
  autoNextEnabled: {
    type: Boolean,
    default: false
  },
  countdownEnabled: {
    type: Boolean,
    default: false
  },
  skipEnabled: {
    type: Boolean,
    default: false
  },
  showAutoNext: {
    type: Boolean,
    default: true
  },
  showCountdown: {
    type: Boolean,
    default: true
  },
  showDebugButton: {
    type: Boolean,
    default: false
  },
  // 画质相关属性
  qualities: {
    type: Array,
    default: () => []
  },
  currentQuality: {
    type: String,
    default: '默认'
  }
})

// Emits
const emit = defineEmits([
  'toggle-auto-next',
  'toggle-countdown', 
  'player-change',
  'open-skip-settings',
  'toggle-debug',
  'close',
  'proxy-change',
  'quality-change'
])

// 代理播放地址相关状态
const currentProxyOption = ref('disabled')
const proxyOptions = ref([])

// 获取代理播放地址配置名称
const getProxyName = (url) => {
  if (!url) return '未知'
  const hashIndex = url.indexOf('#')
  if (hashIndex !== -1 && hashIndex < url.length - 1) {
    return url.substring(hashIndex + 1)
  }
  return '默认代理'
}

// 加载代理播放地址配置
const loadProxyConfig = () => {
  try {
    // 从设置中获取代理播放配置
    const savedAddresses = JSON.parse(localStorage.getItem('addressSettings') || '{}')
    const proxyPlayEnabled = savedAddresses.proxyPlayEnabled || false
    const proxyPlay = savedAddresses.proxyPlay || ''
    
    // 清空选项
    proxyOptions.value = []
    
    // 先加载历史记录
    loadProxyHistory()
    
    // 如果启用了代理播放且有配置地址
    if (proxyPlayEnabled && proxyPlay) {
      // 检查当前配置的代理是否已在历史记录中
      const existingIndex = proxyOptions.value.findIndex(option => option.url === proxyPlay)
      
      if (existingIndex !== -1) {
        // 如果在历史记录中，将其移到最前面
        const currentOption = proxyOptions.value.splice(existingIndex, 1)[0]
        proxyOptions.value.unshift(currentOption)
      } else {
        // 如果不在历史记录中，添加到最前面
        const proxyName = getProxyName(proxyPlay)
        proxyOptions.value.unshift({
          value: proxyPlay,
          label: `${proxyName} (当前)`,
          url: proxyPlay
        })
      }
      
      // 设置默认选中当前配置的代理
      currentProxyOption.value = proxyPlay
    } else {
      // 如果代理播放开关关闭，默认选择关闭
      currentProxyOption.value = 'disabled'
    }
    
    console.log('代理播放配置加载完成:', {
      enabled: proxyPlayEnabled,
      current: proxyPlay,
      optionsCount: proxyOptions.value.length,
      selected: currentProxyOption.value
    })
  } catch (error) {
    console.error('加载代理播放配置失败:', error)
    currentProxyOption.value = 'disabled'
  }
}

// 加载代理播放地址历史记录
const loadProxyHistory = () => {
  try {
    // 只从设置界面的存储位置加载
    const addressHistoryKey = 'address-history-proxy-play'
    const addressHistory = JSON.parse(localStorage.getItem(addressHistoryKey) || '[]')
    
    // 添加历史记录到选项中
    addressHistory.forEach(item => {
      const url = item.url || item.value || ''
      if (!url) return
      
      const exists = proxyOptions.value.some(option => option.url === url)
      if (!exists) {
        const proxyName = getProxyName(url)
        proxyOptions.value.push({
          value: url,
          label: proxyName,
          url: url
        })
      }
    })
    
    console.log('已加载代理播放历史记录:', proxyOptions.value.length, '个选项')
  } catch (error) {
    console.error('加载代理播放历史记录失败:', error)
  }
}

// 保存代理播放地址到历史记录
const saveToProxyHistory = (url) => {
  if (!url || url === 'disabled') return
  
  try {
    const proxyName = getProxyName(url)
    const timestamp = Date.now()
    
    // 只保存到设置界面使用的存储位置
    const addressHistoryKey = 'address-history-proxy-play'
    const addressHistory = JSON.parse(localStorage.getItem(addressHistoryKey) || '[]')
    
    // 检查是否已存在
    const existingIndex = addressHistory.findIndex(item => item.url === url)
    
    if (existingIndex !== -1) {
      // 如果存在，移到最前面
      addressHistory.splice(existingIndex, 1)
    }
    
    // 添加到最前面
    addressHistory.unshift({
      url: url,
      timestamp: timestamp
    })
    
    // 限制历史记录数量（最多保存10个）
    if (addressHistory.length > 10) {
      addressHistory.splice(10)
    }
    
    localStorage.setItem(addressHistoryKey, JSON.stringify(addressHistory))
    
    console.log('已保存代理播放地址到历史记录:', url)
  } catch (error) {
    console.error('保存代理播放历史记录失败:', error)
  }
}

// 处理代理播放地址变更
const handleProxyChange = (value) => {
  currentProxyOption.value = value
  
  // 如果不是关闭，保存到历史记录
  if (value !== 'disabled') {
    saveToProxyHistory(value)
  }
  
  // 发送事件给父组件
  emit('proxy-change', value)
}

// 监听设置变化
const handleStorageChange = (event) => {
  if (event.key === 'addressSettings') {
    // 设置发生变化时重新加载配置
    loadProxyConfig()
  }
}

// 组件挂载时加载配置
onMounted(() => {
  loadProxyConfig()
  
  // 监听localStorage变化
  window.addEventListener('storage', handleStorageChange)
  
  // 监听自定义事件（用于同一页面内的设置变化）
  window.addEventListener('addressSettingsChanged', loadProxyConfig)
})

// 组件卸载时清理监听器
onUnmounted(() => {
  window.removeEventListener('storage', handleStorageChange)
  window.removeEventListener('addressSettingsChanged', loadProxyConfig)
})
</script>

<style scoped>
.player-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  padding: 0 4px;
}

.player-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-right: 12px;
}

.player-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.compact-button-group {
  display: flex;
  align-items: center;
  gap: 2px;
  background: #f8f9fa;
  border-radius: 6px;
  padding: 2px;
  border: 1px solid #e9ecef;
}

.compact-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: transparent;
  border: none;
  font-size: 12px;
  font-weight: 500;
  color: #495057;
  min-height: 28px;
  position: relative;
}

.compact-btn:hover {
  background: #e9ecef;
  color: #212529;
  transform: translateY(-1px);
}

.compact-btn.active {
  background: #23ade5;
  color: white;
  box-shadow: 0 2px 8px rgba(35, 173, 229, 0.3);
}

.compact-btn.active:hover {
  background: #1e90ff;
}

.compact-btn.close-btn {
  color: #dc3545;
}

.compact-btn.close-btn:hover {
  background: #f8d7da;
  color: #721c24;
}

.compact-btn.debug-btn {
  color: #6f42c1;
}

.compact-btn.debug-btn:hover {
  background: #e2d9f3;
  color: #5a2d91;
}

.btn-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.btn-text {
  font-size: 11px;
  white-space: nowrap;
}

.selector-btn {
  position: relative;
  padding: 0;
  overflow: hidden;
}

.compact-select {
  border: none !important;
  background: transparent !important;
  box-shadow: none !important;
  min-width: 120px;
}

.compact-select :deep(.arco-select-view) {
  border: none !important;
  background: transparent !important;
  padding: 6px 10px;
  font-size: 11px;
  font-weight: 500;
}

.compact-select :deep(.arco-select-view-suffix) {
  color: currentColor;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .player-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .player-header h3 {
    margin-right: 0;
    font-size: 15px;
  }
  
  .compact-button-group {
    flex-wrap: wrap;
    width: 100%;
    justify-content: center;
  }
  
  .compact-btn {
    flex: 1;
    min-width: 80px;
    justify-content: center;
  }
  
  .btn-text {
    display: none;
  }
  
  .selector-btn {
    flex: 2;
  }
  
  .compact-select {
    min-width: 100px;
  }
}

@media (max-width: 480px) {
  .compact-btn {
    padding: 4px 6px;
    min-height: 26px;
  }
  
  .btn-icon {
    width: 12px;
    height: 12px;
  }
}
</style>