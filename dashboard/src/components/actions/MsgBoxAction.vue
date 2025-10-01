<template>
  <ActionDialog
    :visible="visible"
    :title="config.title"
    :width="config.width || 480"
    :height="config.height"
    :canceled-on-touch-outside="!config.keep"
    @close="handleClose"
  >
    <div class="msgbox-action-modern">
      <!-- 图标区域 -->
      <div v-if="showIcon" class="icon-section">
        <div class="icon-container glass-effect" :class="iconType">
          <div class="icon-bg" :class="`gradient-${iconType}`"></div>
          <div class="icon-wrapper">
            <svg v-if="iconType === 'info'" width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
            </svg>
            <svg v-else-if="iconType === 'success'" width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            <svg v-else-if="iconType === 'warning'" width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
              <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
            </svg>
            <svg v-else-if="iconType === 'error'" width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"/>
            </svg>
            <svg v-else-if="iconType === 'question'" width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/>
            </svg>
            <svg v-else width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
            </svg>
          </div>
        </div>
      </div>

      <!-- 消息内容 -->
      <div class="content-section">
        <!-- 主要消息 -->
        <div v-if="config.msg" class="message-container glass-effect">
          <div class="message-bg gradient-primary"></div>
          <div class="message-content">
            <div class="message-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
              </svg>
            </div>
            <div class="message-text" v-html="formatMessage(config.msg)"></div>
          </div>
        </div>

        <!-- 详细信息 -->
        <div v-if="config.detail" class="detail-container glass-effect">
          <div class="detail-bg gradient-secondary"></div>
          <div class="detail-content">
            <div class="detail-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.89 2 2 2h12c1.11 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/>
              </svg>
            </div>
            <div class="detail-text" v-html="formatMessage(config.detail)"></div>
          </div>
        </div>

        <!-- 图片显示 -->
        <div v-if="config.imageUrl" class="media-section">
          <div class="image-container glass-effect">
            <div class="image-bg gradient-accent"></div>
            <img
              :src="config.imageUrl"
              :style="{ height: config.imageHeight ? `${config.imageHeight}px` : 'auto' }"
              class="action-image-modern"
              @load="onImageLoad"
              @error="onImageError"
            />
          </div>
        </div>

        <!-- 二维码显示 -->
        <div v-if="config.qrcode" class="media-section">
          <div class="qrcode-container glass-effect">
            <div class="qrcode-bg gradient-accent"></div>
            <div class="qrcode-content">
              <div class="qrcode-header">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 11h8V3H3v8zm2-6h4v4H5V5zM3 21h8v-8H3v8zm2-6h4v4H5v-4zM13 3v8h8V3h-8zm6 6h-4V5h4v4zM19 13h2v2h-2zM13 13h2v2h-2zM15 15h2v2h-2zM13 17h2v2h-2zM15 19h2v2h-2zM17 17h2v2h-2zM17 13h2v2h-2zM19 15h2v2h-2z"/>
                </svg>
                <span class="qrcode-label">二维码</span>
              </div>
              <img
                :src="qrcodeUrl"
                :alt="config.qrcode"
                class="qrcode-image"
                @error="onQrcodeError"
              />
              <div class="qrcode-text">{{ config.qrcode }}</div>
            </div>
          </div>
        </div>

        <!-- 进度条 -->
        <div v-if="config.showProgress" class="progress-section">
          <div class="progress-container glass-effect">
            <div class="progress-bg gradient-primary"></div>
            <div class="progress-content">
              <div class="progress-header">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                <span class="progress-label">进度</span>
              </div>
              <div class="progress-bar-modern">
                <div class="progress-track">
                  <div 
                    class="progress-fill-modern" 
                    :style="{ width: `${progressPercent}%` }"
                  ></div>
                </div>
              </div>
              <div class="progress-text-modern">{{ progressText }}</div>
            </div>
          </div>
        </div>

        <!-- 列表内容 -->
        <div v-if="config.list && config.list.length > 0" class="list-section">
          <div class="list-container glass-effect">
            <div class="list-bg gradient-secondary"></div>
            <div class="list-content">
              <div class="list-header">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
                </svg>
                <span class="list-label">详细信息</span>
              </div>
              <ul class="list-items">
                <li v-for="(item, index) in config.list" :key="index" class="list-item">
                  <div class="item-marker"></div>
                  <span class="item-text">{{ item }}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <!-- 超时提示 -->
        <div v-if="config.timeout && timeLeft > 0" class="timeout-section">
          <div class="timeout-container glass-effect">
            <div class="timeout-bg gradient-warning"></div>
            <div class="timeout-content">
              <div class="timeout-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M15 1H9v2h6V1zm-4 13h2V8h-2v6zm8.03-6.61l1.42-1.42c-.43-.51-.9-.99-1.41-1.41l-1.42 1.42C16.07 4.74 14.12 4 12 4c-4.97 0-9 4.03-9 9s4.02 9 9 9 9-4.03 9-9c0-2.12-.74-4.07-1.97-5.61zM12 20c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/>
                </svg>
              </div>
              <div class="timeout-info">
                <span class="timeout-text">{{ timeLeft }}秒后自动关闭</span>
                <div class="timeout-progress-modern">
                  <div 
                    class="timeout-fill-modern" 
                    :style="{ width: `${timeoutPercent}%` }"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="modern-footer">
        <!-- 取消按钮 -->
        <button
          v-if="showCancelButton"
          class="btn-modern btn-secondary"
          @click="handleCancel"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
          <span>{{ config.cancelText || '取消' }}</span>
        </button>
        
        <!-- 确定按钮 -->
        <button
          v-if="showOkButton"
          class="btn-modern btn-primary"
          @click="handleOk"
        >
          <span>{{ config.okText || '确定' }}</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
          </svg>
        </button>
      </div>
    </template>
  </ActionDialog>
</template>

<script>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import ActionDialog from './ActionDialog.vue'
import { 
  ButtonType, 
  generateQRCodeUrl,
  normalizeButtonType 
} from './types.js'

export default {
  name: 'MsgBoxAction',
  components: {
    ActionDialog
  },
  props: {
    config: {
      type: Object,
      required: true
    },
    visible: {
      type: Boolean,
      default: true
    }
  },
  emits: ['submit', 'cancel', 'close', 'action'],
  setup(props, { emit }) {
    const timeLeft = ref(0)
    const timer = ref(null)
    const progressPercent = ref(0)
    const progressTimer = ref(null)

    // 计算属性
    const showIcon = computed(() => {
      return props.config.icon !== false && props.config.type !== 'plain'
    })

    const iconType = computed(() => {
      const typeMap = {
        'info': 'info',
        'success': 'success',
        'warning': 'warning',
        'error': 'error',
        'question': 'question'
      }
      return typeMap[props.config.type] || 'info'
    })

    const iconSymbol = computed(() => {
      const symbolMap = {
        'info': 'ℹ',
        'success': '✓',
        'warning': '⚠',
        'error': '✕',
        'question': '?'
      }
      return symbolMap[props.config.type] || 'ℹ'
    })

    const qrcodeUrl = computed(() => {
      if (!props.config.qrcode) return ''
      return generateQRCodeUrl(props.config.qrcode, props.config.qrcodeSize)
    })

    const showOkButton = computed(() => {
      const button = normalizeButtonType(props.config.button)
      return button === ButtonType.OK_CANCEL || button === ButtonType.OK_ONLY
    })

    const showCancelButton = computed(() => {
      const button = normalizeButtonType(props.config.button)
      return button === ButtonType.OK_CANCEL || button === ButtonType.CANCEL_ONLY
    })

    const progressText = computed(() => {
      if (props.config.progressText) {
        return props.config.progressText.replace('{percent}', Math.round(progressPercent.value))
      }
      return `${Math.round(progressPercent.value)}%`
    })

    const timeoutPercent = computed(() => {
      if (!props.config.timeout || props.config.timeout <= 0) return 0
      return ((props.config.timeout - timeLeft.value) / props.config.timeout) * 100
    })

    // 方法
    const formatMessage = (message) => {
      if (!message) return ''
      
      // 如果消息已经包含HTML标签，直接返回
      if (/<[^>]+>/.test(message)) {
        return message
      }
      
      // 否则进行简单的文本格式化
      return message
        .replace(/\n/g, '<br>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code>$1</code>')
    }

    const handleOk = () => {
      emit('submit', { action: 'ok' })
    }

    const handleCancel = () => {
      emit('cancel')
      emit('close')
    }

    const handleClose = () => {
      emit('close')
    }

    const onImageLoad = () => {
      console.log('图片加载成功')
    }

    const onImageError = () => {
      console.error('图片加载失败')
    }

    const onQrcodeError = () => {
      console.error('二维码生成失败')
    }

    // 超时处理
    const startTimeout = () => {
      if (!props.config.timeout || props.config.timeout <= 0) return

      timeLeft.value = props.config.timeout
      timer.value = setInterval(() => {
        timeLeft.value--
        if (timeLeft.value <= 0) {
          clearInterval(timer.value)
          handleCancel()
        }
      }, 1000)
    }

    const stopTimeout = () => {
      if (timer.value) {
        clearInterval(timer.value)
        timer.value = null
      }
      timeLeft.value = 0
    }

    // 进度条处理
    const startProgress = () => {
      if (!props.config.showProgress) return

      const duration = props.config.progressDuration || 5000
      const interval = 50
      const step = (100 / duration) * interval

      progressPercent.value = 0
      progressTimer.value = setInterval(() => {
        progressPercent.value += step
        if (progressPercent.value >= 100) {
          progressPercent.value = 100
          clearInterval(progressTimer.value)
          
          // 进度完成后的回调
          if (props.config.onProgressComplete) {
            handleOk()
          }
        }
      }, interval)
    }

    const stopProgress = () => {
      if (progressTimer.value) {
        clearInterval(progressTimer.value)
        progressTimer.value = null
      }
      progressPercent.value = 0
    }

    // 监听配置变化
    watch(() => props.config, (newConfig) => {
      stopTimeout()
      stopProgress()
      
      if (newConfig.timeout) {
        startTimeout()
      }
      
      if (newConfig.showProgress) {
        startProgress()
      }
    }, { immediate: true })

    // 监听显示状态
    watch(() => props.visible, (visible) => {
      if (visible) {
        if (props.config.timeout) {
          startTimeout()
        }
        if (props.config.showProgress) {
          startProgress()
        }
      } else {
        stopTimeout()
        stopProgress()
      }
    })

    onMounted(() => {
      if (props.visible) {
        if (props.config.timeout) {
          startTimeout()
        }
        if (props.config.showProgress) {
          startProgress()
        }
      }
    })

    onUnmounted(() => {
      stopTimeout()
      stopProgress()
    })

    return {
      timeLeft,
      progressPercent,
      showIcon,
      iconType,
      iconSymbol,
      qrcodeUrl,
      showOkButton,
      showCancelButton,
      progressText,
      timeoutPercent,
      formatMessage,
      handleOk,
      handleCancel,
      handleClose,
      onImageLoad,
      onImageError,
      onQrcodeError
    }
  }
}
</script>

<style scoped>
/* 主容器 */
.msgbox-action-modern {
  padding: 24px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
  border-radius: 16px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* 毛玻璃效果 */
.glass-effect {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  position: relative;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.glass-effect:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

/* 渐变背景 */
.gradient-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  opacity: 0.1;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: -1;
}

.gradient-secondary {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  opacity: 0.1;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: -1;
}

.gradient-accent {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  opacity: 0.1;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: -1;
}

.gradient-warning {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
  opacity: 0.1;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: -1;
}

/* 图标区域 */
.icon-section {
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
}

.icon-container {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  position: relative;
  overflow: hidden;
}

.icon-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: -1;
}

.gradient-info {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.gradient-success {
  background: linear-gradient(135deg, #56ab2f 0%, #a8e6cf 100%);
}

.gradient-warning {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.gradient-error {
  background: linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%);
}

.gradient-question {
  background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
}

.icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  z-index: 1;
}

.icon-container.info .icon-wrapper {
  color: #667eea;
}

.icon-container.success .icon-wrapper {
  color: #56ab2f;
}

.icon-container.warning .icon-wrapper {
  color: #f093fb;
}

.icon-container.error .icon-wrapper {
  color: #ff416c;
}

.icon-container.question .icon-wrapper {
  color: #a8edea;
}

/* 内容区域 */
.content-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 消息容器 */
.message-container {
  padding: 20px;
  position: relative;
}

.message-content {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  position: relative;
  z-index: 1;
}

.message-icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  color: var(--primary-color);
}

.message-text {
  flex: 1;
  font-size: 16px;
  line-height: 1.6;
  color: var(--text-primary);
  font-weight: 500;
}

/* 详细信息容器 */
.detail-container {
  padding: 18px;
  position: relative;
}

.detail-content {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  position: relative;
  z-index: 1;
}

.detail-icon {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  color: var(--secondary-color);
}

.detail-text {
  flex: 1;
  font-size: 14px;
  line-height: 1.5;
  color: var(--text-secondary);
}

/* 媒体区域 */
.media-section {
  display: flex;
  justify-content: center;
}

.image-container,
.qrcode-container {
  padding: 20px;
  text-align: center;
  position: relative;
  max-width: 100%;
}

.action-image-modern {
  max-width: 100%;
  height: auto;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  position: relative;
  z-index: 1;
}

.qrcode-content {
  position: relative;
  z-index: 1;
}

.qrcode-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 16px;
  color: var(--primary-color);
}

.qrcode-label {
  font-size: 14px;
  font-weight: 600;
}

.qrcode-image {
  max-width: 200px;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.qrcode-text {
  margin-top: 12px;
  font-size: 12px;
  color: var(--text-secondary);
  opacity: 0.8;
}

/* 进度区域 */
.progress-section {
  margin: 16px 0;
}

.progress-container {
  padding: 20px;
  position: relative;
}

.progress-content {
  position: relative;
  z-index: 1;
}

.progress-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  color: var(--primary-color);
}

.progress-label {
  font-size: 14px;
  font-weight: 600;
}

.progress-bar-modern {
  margin-bottom: 12px;
}

.progress-track {
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  overflow: hidden;
  position: relative;
}

.progress-fill-modern {
  height: 100%;
  background: linear-gradient(90deg, var(--primary-color), var(--primary-light));
  border-radius: 4px;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.progress-fill-modern::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.progress-text-modern {
  font-size: 14px;
  color: var(--text-secondary);
  text-align: center;
  font-weight: 500;
}

/* 列表区域 */
.list-section {
  margin: 16px 0;
}

.list-container {
  padding: 20px;
  position: relative;
}

.list-content {
  position: relative;
  z-index: 1;
}

.list-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  color: var(--secondary-color);
}

.list-label {
  font-size: 14px;
  font-weight: 600;
}

.list-items {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.list-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  border-left: 3px solid var(--primary-color);
  transition: all 0.2s ease;
}

.list-item:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateX(4px);
}

.item-marker {
  width: 6px;
  height: 6px;
  background: var(--primary-color);
  border-radius: 50%;
  flex-shrink: 0;
}

.item-text {
  font-size: 14px;
  line-height: 1.4;
  color: var(--text-primary);
}

/* 超时区域 */
.timeout-section {
  margin: 16px 0;
}

.timeout-container {
  padding: 20px;
  position: relative;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.timeout-content {
  display: flex;
  align-items: center;
  gap: 16px;
  position: relative;
  z-index: 1;
}

.timeout-icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(245, 158, 11, 0.2);
  border-radius: 50%;
  color: #f59e0b;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.05); opacity: 0.8; }
}

.timeout-info {
  flex: 1;
}

.timeout-text {
  font-size: 14px;
  color: #92400e;
  font-weight: 500;
  margin-bottom: 8px;
}

.timeout-progress-modern {
  width: 100%;
  height: 4px;
  background: rgba(251, 191, 36, 0.3);
  border-radius: 2px;
  overflow: hidden;
}

.timeout-fill-modern {
  height: 100%;
  background: linear-gradient(90deg, #f59e0b, #fbbf24);
  border-radius: 2px;
  transition: width 0.1s linear;
}

/* 现代化底部按钮 */
.modern-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 0 0;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.btn-modern {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(10px);
}

.btn-modern::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.btn-modern:hover::before {
  left: 100%;
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.btn-primary {
  background: linear-gradient(135deg, var(--primary-color), var(--primary-light));
  color: white;
  border: 1px solid var(--primary-color);
}

.btn-primary:hover {
  background: linear-gradient(135deg, var(--primary-dark), var(--primary-color));
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(var(--primary-color-rgb), 0.3);
}

.btn-modern:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.btn-modern:disabled:hover {
  transform: none;
  box-shadow: none;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .msgbox-action-modern {
    padding: 20px;
  }
  
  .icon-container {
    width: 60px;
    height: 60px;
  }
  
  .icon-container svg {
    width: 24px;
    height: 24px;
  }
  
  .message-container,
  .detail-container,
  .progress-container,
  .list-container,
  .timeout-container {
    padding: 16px;
  }
  
  .message-text {
    font-size: 15px;
  }
  
  .detail-text {
    font-size: 13px;
  }
  
  .modern-footer {
    flex-direction: column;
    gap: 8px;
  }
  
  .btn-modern {
    width: 100%;
    justify-content: center;
    padding: 14px 20px;
  }
  
  .timeout-content {
    flex-direction: column;
    text-align: center;
    gap: 12px;
  }
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .glass-effect {
    background: rgba(0, 0, 0, 0.2);
    border-color: rgba(255, 255, 255, 0.1);
  }
  
  .glass-effect:hover {
    background: rgba(0, 0, 0, 0.3);
    border-color: rgba(255, 255, 255, 0.2);
  }
  
  .btn-secondary {
    background: rgba(0, 0, 0, 0.2);
    border-color: rgba(255, 255, 255, 0.1);
  }
  
  .btn-secondary:hover {
    background: rgba(0, 0, 0, 0.3);
    border-color: rgba(255, 255, 255, 0.2);
  }
}

/* 高对比度模式 */
@media (prefers-contrast: high) {
  .glass-effect {
    border-width: 2px;
  }
  
  .btn-modern {
    border-width: 2px;
  }
}

/* 减少动画模式 */
@media (prefers-reduced-motion: reduce) {
  .glass-effect,
  .btn-modern,
  .list-item,
  .progress-fill-modern,
  .timeout-fill-modern {
    transition: none;
  }
  
  .timeout-icon {
    animation: none;
  }
  
  .progress-fill-modern::after {
    animation: none;
  }
  
  .btn-modern::before {
    transition: none;
  }
}
</style>