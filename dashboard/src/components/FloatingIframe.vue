<template>
  <!-- 悬浮按钮 -->
  <div 
    v-if="shouldShowButton"
    class="floating-button"
    :style="{ 
      left: buttonPosition.x + 'px', 
      top: buttonPosition.y + 'px' 
    }"
    @click="openWindow"
    @mousedown="startDragButton"
    :title="buttonTitle"
  >
    <icon-computer class="button-icon" />
  </div>

  <!-- 悬浮窗口 -->
  <div
    v-show="isWindowOpen"
    class="floating-window"
    :style="{
      left: windowPosition.x + 'px',
      top: windowPosition.y + 'px',
      width: windowSize.width + 'px',
      height: windowSize.height + 'px',
      zIndex: zIndex
    }"
    @mousedown="bringToFront"
  >
    <!-- 窗口标题栏 -->
    <div 
      class="window-header"
      @mousedown="startDragWindow"
    >
      <div class="window-title">
        <icon-computer class="title-icon" />
        <span>{{ windowTitle }}</span>
      </div>
      <div class="window-controls">
        <button 
          class="control-btn minimize-btn"
          @click="minimizeWindow"
          title="最小化"
        >
          <icon-minus />
        </button>
        <button 
          class="control-btn close-btn"
          @click="closeWindow"
          title="关闭"
        >
          <icon-close />
        </button>
      </div>
    </div>

    <!-- 窗口内容 -->
    <div class="window-content">
      <iframe
        :src="iframeUrl"
        class="iframe-content"
        frameborder="0"
        allowfullscreen
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
      ></iframe>
    </div>

    <!-- 调整大小的拖拽点 -->
    <div 
      class="resize-handle resize-se"
      @mousedown="startResize"
    ></div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue'
import { 
  IconComputer, 
  IconMinus, 
  IconClose 
} from '@arco-design/web-vue/es/icon'

// Props
const props = defineProps({
  defaultUrl: {
    type: String,
    default: 'http://localhost:5757/apps/websocket'
  },
  defaultPosition: {
    type: Object,
    default: () => ({ x: 33, y: 604 })
  },
  defaultSize: {
    type: Object,
    default: () => ({ width: 419, height: 883 })
  },
  buttonTitle: {
    type: String,
    default: '打开浮窗'
  },
  windowTitle: {
    type: String,
    default: '浮窗浏览器'
  }
})

// 响应式数据
const isWindowOpen = ref(false)
const iframeUrl = ref(props.defaultUrl)

// 响应式的调试设置状态
const debugSettingsState = ref({
  enabled: false,
  url: ''
})

// 加载调试设置
const loadDebugSettings = () => {
  try {
    const debugSettings = localStorage.getItem('debugSettings')
    if (debugSettings) {
      const settings = JSON.parse(debugSettings)
      debugSettingsState.value = {
        enabled: settings.enabled === true,
        url: settings.url || ''
      }
    } else {
      debugSettingsState.value = {
        enabled: false,
        url: ''
      }
    }
  } catch (error) {
    console.error('Failed to load debug settings:', error)
    debugSettingsState.value = {
      enabled: false,
      url: ''
    }
  }
}

// 检查调试设置是否启用
const isDebugEnabled = computed(() => {
  return debugSettingsState.value.enabled
})

// 是否显示悬浮按钮
const shouldShowButton = computed(() => {
  return isDebugEnabled.value
})

// 获取调试设置URL
const getDebugUrl = () => {
  if (debugSettingsState.value.enabled && debugSettingsState.value.url) {
    return debugSettingsState.value.url
  }
  return props.defaultUrl
}

// 计算属性：当前调试URL（用于监听变化）
const currentDebugUrl = computed(() => {
  return getDebugUrl()
})

// localStorage 变化监听器（跨标签页）
const handleStorageChange = (e) => {
  if (e.key === 'debugSettings') {
    loadDebugSettings()
  }
}

// 调试设置变化监听器（同页面内）
const handleDebugSettingsChange = (e) => {
  loadDebugSettings()
}
const zIndex = ref(1000)

// 按钮位置
const buttonPosition = reactive({
  x: props.defaultPosition.x,
  y: props.defaultPosition.y
})

// 窗口位置和大小
const windowPosition = reactive({
  x: 1696,
  y: 130
})

const windowSize = reactive({
  width: props.defaultSize.width,
  height: props.defaultSize.height
})

// 拖拽状态
const dragState = reactive({
  isDragging: false,
  isResizing: false,
  startX: 0,
  startY: 0,
  startLeft: 0,
  startTop: 0,
  startWidth: 0,
  startHeight: 0,
  dragType: '' // 'button', 'window', 'resize'
})

// 打开窗口
const openWindow = () => {
  // 如果窗口已经打开，则关闭它
  if (isWindowOpen.value) {
    closeWindow()
    return
  }
  
  // 打开窗口
  isWindowOpen.value = true
  
  // 只在URL发生变化时才更新iframe URL，避免重复初始化
  const currentDebugUrl = getDebugUrl()
  if (iframeUrl.value !== currentDebugUrl) {
    iframeUrl.value = currentDebugUrl
  }
  
  // 检查是否有保存的窗口位置，如果没有则使用默认位置
  const savedWindowPos = localStorage.getItem('floating-iframe-window-position')
  if (!savedWindowPos) {
    // 只有在没有保存位置时才设置为默认位置
    windowPosition.x = 1696
    windowPosition.y = 130
  }
  // 如果有保存的位置，则使用已经在loadSavedPositions中加载的位置
  
  bringToFront()
}

// 关闭窗口
const closeWindow = () => {
  // 关闭前保存窗口位置和大小
  saveWindowPosition()
  saveWindowSize()
  isWindowOpen.value = false
}

// 最小化窗口
const minimizeWindow = () => {
  // 最小化前保存窗口位置和大小
  saveWindowPosition()
  saveWindowSize()
  isWindowOpen.value = false
}

// 置顶窗口
const bringToFront = () => {
  zIndex.value = Date.now()
}

// 开始拖拽按钮
const startDragButton = (e) => {
  if (e.button !== 0) return // 只响应左键
  
  dragState.isDragging = true
  dragState.dragType = 'button'
  dragState.startX = e.clientX
  dragState.startY = e.clientY
  dragState.startLeft = buttonPosition.x
  dragState.startTop = buttonPosition.y
  
  e.preventDefault()
  e.stopPropagation()
}

// 开始拖拽窗口
const startDragWindow = (e) => {
  if (e.button !== 0) return // 只响应左键
  
  dragState.isDragging = true
  dragState.dragType = 'window'
  dragState.startX = e.clientX
  dragState.startY = e.clientY
  dragState.startLeft = windowPosition.x
  dragState.startTop = windowPosition.y
  
  e.preventDefault()
  e.stopPropagation()
}

// 开始调整大小
const startResize = (e) => {
  if (e.button !== 0) return // 只响应左键
  
  dragState.isResizing = true
  dragState.dragType = 'resize'
  dragState.startX = e.clientX
  dragState.startY = e.clientY
  dragState.startWidth = windowSize.width
  dragState.startHeight = windowSize.height
  
  e.preventDefault()
  e.stopPropagation()
}

// 鼠标移动处理
const handleMouseMove = (e) => {
  if (!dragState.isDragging && !dragState.isResizing) return
  
  const deltaX = e.clientX - dragState.startX
  const deltaY = e.clientY - dragState.startY
  
  if (dragState.dragType === 'button') {
    buttonPosition.x = Math.max(0, Math.min(window.innerWidth - 50, dragState.startLeft + deltaX))
    buttonPosition.y = Math.max(0, Math.min(window.innerHeight - 50, dragState.startTop + deltaY))
  } else if (dragState.dragType === 'window') {
    windowPosition.x = Math.max(0, Math.min(window.innerWidth - 200, dragState.startLeft + deltaX))
    windowPosition.y = Math.max(0, Math.min(window.innerHeight - 100, dragState.startTop + deltaY))
  } else if (dragState.dragType === 'resize') {
    const newWidth = Math.max(300, dragState.startWidth + deltaX)
    const newHeight = Math.max(200, dragState.startHeight + deltaY)
    
    // 确保窗口不会超出屏幕
    windowSize.width = Math.min(newWidth, window.innerWidth - windowPosition.x)
    windowSize.height = Math.min(newHeight, window.innerHeight - windowPosition.y)
  }
}

// 鼠标释放处理
const handleMouseUp = () => {
  // 根据拖拽类型保存对应的位置
  if (dragState.dragType === 'button') {
    saveButtonPosition()
  } else if (dragState.dragType === 'window') {
    saveWindowPosition()
  } else if (dragState.dragType === 'resize') {
    saveWindowSize()
  }
  
  dragState.isDragging = false
  dragState.isResizing = false
  dragState.dragType = ''
}

// 位置持久化函数
const saveButtonPosition = () => {
  localStorage.setItem('floating-iframe-button-position', JSON.stringify({
    x: buttonPosition.x,
    y: buttonPosition.y
  }))
}

const saveWindowPosition = () => {
  localStorage.setItem('floating-iframe-window-position', JSON.stringify({
    x: windowPosition.x,
    y: windowPosition.y
  }))
}

const saveWindowSize = () => {
  localStorage.setItem('floating-iframe-window-size', JSON.stringify({
    width: windowSize.width,
    height: windowSize.height
  }))
}

const loadSavedPositions = () => {
  // 恢复按钮位置
  const savedButtonPos = localStorage.getItem('floating-iframe-button-position')
  if (savedButtonPos) {
    try {
      const pos = JSON.parse(savedButtonPos)
      buttonPosition.x = pos.x
      buttonPosition.y = pos.y
    } catch (e) {
      console.warn('Failed to parse saved button position:', e)
    }
  }
  
  // 恢复窗口位置
  const savedWindowPos = localStorage.getItem('floating-iframe-window-position')
  if (savedWindowPos) {
    try {
      const pos = JSON.parse(savedWindowPos)
      windowPosition.x = pos.x
      windowPosition.y = pos.y
    } catch (e) {
      console.warn('Failed to parse saved window position:', e)
    }
  }
  
  // 恢复窗口大小
  const savedWindowSize = localStorage.getItem('floating-iframe-window-size')
  if (savedWindowSize) {
    try {
      const size = JSON.parse(savedWindowSize)
      windowSize.width = size.width
      windowSize.height = size.height
    } catch (e) {
      console.warn('Failed to parse saved window size:', e)
    }
  }
}

// 监听调试URL变化，自动更新iframe URL（仅在窗口打开时）
watch(currentDebugUrl, (newUrl, oldUrl) => {
  if (newUrl !== oldUrl && isWindowOpen.value) {
    iframeUrl.value = newUrl
  }
})

// 生命周期
onMounted(() => {
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
  
  // 添加 localStorage 监听器（跨标签页）
  window.addEventListener('storage', handleStorageChange)
  
  // 添加自定义事件监听器（同页面内）
  window.addEventListener('debugSettingsChanged', handleDebugSettingsChange)
  
  // 加载保存的位置
  loadSavedPositions()
  
  // 加载调试设置
  loadDebugSettings()
  
  // 只在首次挂载且 iframe URL 为默认值时才初始化
  if (iframeUrl.value === props.defaultUrl) {
    iframeUrl.value = getDebugUrl()
  }
})

onUnmounted(() => {
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
  
  // 移除 localStorage 监听器
  window.removeEventListener('storage', handleStorageChange)
  
  // 移除自定义事件监听器
  window.removeEventListener('debugSettingsChanged', handleDebugSettingsChange)
  
  // 组件卸载时保存所有位置
  saveButtonPosition()
  saveWindowPosition()
  saveWindowSize()
})

// 暴露方法给父组件
defineExpose({
  openWindow,
  closeWindow,
  setUrl: (url) => { iframeUrl.value = url }
})
</script>

<style scoped>
/* 悬浮按钮样式 */
.floating-button {
  position: fixed;
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
  z-index: 999;
  user-select: none;
}

.floating-button:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
}

.button-icon {
  color: white;
  font-size: 18px;
}

/* 悬浮窗口样式 */
.floating-window {
  position: fixed;
  background: white;
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  user-select: none;
  border: 1px solid #e0e0e0;
}

/* 窗口标题栏 */
.window-header {
  height: 40px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  cursor: move;
  color: white;
}

.window-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
}

.title-icon {
  font-size: 16px;
}

.window-controls {
  display: flex;
  gap: 4px;
}

.control-btn {
  width: 24px;
  height: 24px;
  border: none;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}

.control-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.close-btn:hover {
  background: #ff4757;
}

/* 窗口内容 */
.window-content {
  height: calc(100% - 40px);
  overflow: hidden;
}

.iframe-content {
  width: 100%;
  height: 100%;
  border: none;
}

/* 调整大小拖拽点 */
.resize-handle {
  position: absolute;
  background: transparent;
}

.resize-se {
  bottom: 0;
  right: 0;
  width: 12px;
  height: 12px;
  cursor: se-resize;
}

.resize-se::after {
  content: '';
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 8px;
  height: 8px;
  background: linear-gradient(
    -45deg,
    transparent 0%,
    transparent 40%,
    #ccc 40%,
    #ccc 60%,
    transparent 60%,
    transparent 100%
  );
}

/* 响应式设计 */
@media (max-width: 768px) {
  .floating-window {
    width: 90vw !important;
    height: 70vh !important;
    left: 5vw !important;
    top: 15vh !important;
  }
  
  .floating-button {
    width: 36px;
    height: 36px;
  }
  
  .button-icon {
    font-size: 16px;
  }
}

/* 防止选中文本 */
.floating-button,
.window-header,
.resize-handle {
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}
</style>