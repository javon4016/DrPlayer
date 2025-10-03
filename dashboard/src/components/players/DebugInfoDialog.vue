<template>
  <div v-if="visible" class="debug-info-overlay" @click="handleOverlayClick">
    <div class="debug-info-dialog" @click.stop>
      <div class="dialog-header">
        <h3>🔧 视频调试信息</h3>
        <button class="close-btn" @click="$emit('close')">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" stroke-width="2"/>
            <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" stroke-width="2"/>
          </svg>
        </button>
      </div>
      
      <div class="dialog-content">
        <!-- 视频直链信息 -->
        <div class="info-section">
          <div class="section-header">
            <h4>📹 视频直链</h4>
            <button 
              class="copy-btn" 
              @click="copyToClipboard(videoUrl, '视频直链')"
              :disabled="!videoUrl"
            >
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" stroke="currentColor" stroke-width="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" stroke-width="2"/>
              </svg>
              复制
            </button>
          </div>
          <div class="info-content">
            <div class="url-display">
              {{ videoUrl || '暂无视频链接' }}
            </div>
          </div>
        </div>

        <!-- 请求头信息 -->
        <div class="info-section">
          <div class="section-header">
            <h4>📋 请求头信息</h4>
            <button 
              class="copy-btn" 
              @click="copyToClipboard(headersText, '请求头信息')"
              :disabled="!headersText"
            >
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" stroke="currentColor" stroke-width="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" stroke-width="2"/>
              </svg>
              复制
            </button>
          </div>
          <div class="info-content">
            <div class="headers-display">
              <div v-if="!headersText" class="no-data">暂无请求头信息</div>
              <pre v-else class="headers-text">{{ headersText }}</pre>
            </div>
          </div>
        </div>

        <!-- 视频格式信息 -->
        <div class="info-section">
          <div class="section-header">
            <h4>🎬 视频格式</h4>
          </div>
          <div class="info-content">
            <div class="format-info">
              <span class="format-label">检测格式:</span>
              <span class="format-value">{{ detectedFormat || '未知' }}</span>
            </div>
          </div>
        </div>

        <!-- 播放器信息 -->
        <div class="info-section">
          <div class="section-header">
            <h4>⚙️ 播放器信息</h4>
          </div>
          <div class="info-content">
            <div class="player-info">
              <span class="player-label">当前播放器:</span>
              <span class="player-value">{{ playerType === 'artplayer' ? 'ArtPlayer' : '默认播放器' }}</span>
            </div>
          </div>
        </div>

        <!-- 一键复制所有信息 -->
        <div class="action-section">
          <button class="copy-all-btn" @click="copyAllInfo">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" stroke="currentColor" stroke-width="2"/>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" stroke-width="2"/>
            </svg>
            复制所有调试信息
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Message } from '@arco-design/web-vue'

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
  headers: {
    type: Object,
    default: () => ({})
  },
  playerType: {
    type: String,
    default: 'default'
  },
  detectedFormat: {
    type: String,
    default: ''
  }
})

// Emits
const emit = defineEmits(['close'])

// 计算属性
const headersText = computed(() => {
  if (!props.headers || Object.keys(props.headers).length === 0) {
    return ''
  }
  
  return Object.entries(props.headers)
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n')
})

// 方法
const handleOverlayClick = () => {
  emit('close')
}

const copyToClipboard = async (text, type) => {
  if (!text) {
    Message.warning(`${type}为空，无法复制`)
    return
  }

  try {
    await navigator.clipboard.writeText(text)
    Message.success(`${type}已复制到剪贴板`)
  } catch (error) {
    console.error('复制失败:', error)
    Message.error('复制失败，请手动选择复制')
  }
}

const copyAllInfo = async () => {
  const allInfo = [
    '=== DrPlayer 视频调试信息 ===',
    '',
    '📹 视频直链:',
    props.videoUrl || '暂无',
    '',
    '📋 请求头信息:',
    headersText.value || '暂无',
    '',
    '🎬 视频格式:',
    props.detectedFormat || '未知',
    '',
    '⚙️ 播放器类型:',
    props.playerType === 'artplayer' ? 'ArtPlayer' : '默认播放器',
    '',
    '生成时间: ' + new Date().toLocaleString()
  ].join('\n')

  await copyToClipboard(allInfo, '所有调试信息')
}
</script>

<style scoped>
.debug-info-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(4px);
}

.debug-info-dialog {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  max-width: 800px;
  width: 90vw;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e9ecef;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.dialog-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.close-btn svg {
  width: 20px;
  height: 20px;
}

.dialog-content {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.info-section {
  margin-bottom: 24px;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  overflow: hidden;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}

.section-header h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #495057;
}

.copy-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: #23ade5;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: background-color 0.2s;
}

.copy-btn:hover:not(:disabled) {
  background: #1e90ff;
}

.copy-btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.copy-btn svg {
  width: 14px;
  height: 14px;
}

.info-content {
  padding: 16px;
}

.url-display {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  padding: 12px;
  font-family: 'Courier New', monospace;
  font-size: 13px;
  word-break: break-all;
  line-height: 1.4;
  color: #495057;
}

.headers-display {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  padding: 12px;
  min-height: 60px;
}

.no-data {
  color: #6c757d;
  font-style: italic;
  text-align: center;
  padding: 20px;
}

.headers-text {
  font-family: 'Courier New', monospace;
  font-size: 13px;
  margin: 0;
  white-space: pre-wrap;
  color: #495057;
  line-height: 1.4;
}

.format-info,
.player-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.format-label,
.player-label {
  font-weight: 600;
  color: #495057;
}

.format-value,
.player-value {
  background: #e3f2fd;
  color: #1976d2;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
}

.action-section {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #e9ecef;
  text-align: center;
}

.copy-all-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: transform 0.2s, box-shadow 0.2s;
}

.copy-all-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
}

.copy-all-btn svg {
  width: 16px;
  height: 16px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .debug-info-dialog {
    width: 95vw;
    max-height: 90vh;
  }
  
  .dialog-header {
    padding: 16px 20px;
  }
  
  .dialog-header h3 {
    font-size: 16px;
  }
  
  .dialog-content {
    padding: 20px;
  }
  
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .copy-btn {
    align-self: flex-end;
  }
  
  .url-display,
  .headers-text {
    font-size: 12px;
  }
}
</style>