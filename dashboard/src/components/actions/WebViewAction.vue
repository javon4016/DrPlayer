<template>
  <ActionDialog
    :visible="visible"
    :title="config.title"
    :width="config.width || '90%'"
    :height="config.height || 'auto'"
    :canceled-on-touch-outside="!config.keep"
    :show-close="false"
    :module="module"
    :extend="extend"
    :api-url="apiUrl"
    @close="handleClose"
    @toast="(message, type) => emit('toast', message, type)"
    @reset="() => emit('reset')"
  >
    <div class="webview-action">
      <!-- 现代化工具栏 -->
      <div v-if="showToolbar" class="webview-toolbar-modern glass-effect">
        <!-- 导航按钮组 -->
        <div class="toolbar-nav-group">
          <button
            class="toolbar-btn-modern nav-btn"
            :class="{ disabled: !canGoBack }"
            :disabled="!canGoBack"
            @click="goBack"
            title="后退"
          >
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <button
            class="toolbar-btn-modern nav-btn"
            :class="{ disabled: !canGoForward }"
            :disabled="!canGoForward"
            @click="goForward"
            title="前进"
          >
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
          <button
            class="toolbar-btn-modern nav-btn"
            @click="reload"
            title="刷新"
          >
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 4v6h6M23 20v-6h-6"/>
              <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
            </svg>
          </button>
        </div>

        <!-- 现代化地址栏 -->
        <div v-if="config.showAddressBar" class="toolbar-address-modern">
          <div class="address-input-container">
            <svg class="address-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>
            <input
              v-model="currentUrl"
              type="url"
              class="address-input-modern"
              placeholder="请输入网址..."
              @keyup.enter="navigate"
            />
            <button
              class="toolbar-btn-modern address-go-btn"
              @click="navigate"
              title="访问"
            >
              <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- 操作按钮组 -->
        <div class="toolbar-actions-modern">
          <button
            v-if="config.allowFullscreen"
            class="toolbar-btn-modern action-btn"
            @click="toggleFullscreen"
            :title="isFullscreen ? '退出全屏' : '全屏'"
          >
            <svg v-if="!isFullscreen" class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
            </svg>
            <svg v-else class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>
            </svg>
          </button>
          <button
            v-if="config.allowDevTools"
            class="toolbar-btn-modern action-btn"
            @click="toggleDevTools"
            title="开发者工具"
          >
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- 现代化加载进度条 -->
      <div v-if="isLoading" class="webview-progress-modern">
        <div 
          class="progress-bar-modern" 
          :style="{ width: `${loadingProgress}%` }"
        ></div>
      </div>

      <!-- WebView容器 -->
      <div class="webview-container-modern" :class="{ fullscreen: isFullscreen }">
        <!-- 现代化加载状态 -->
        <div v-if="isLoading && loadingProgress < 100" class="webview-loading-modern">
          <div class="loading-spinner-modern"></div>
          <div class="loading-text-modern">正在加载网页...</div>
          <div class="loading-progress-text">{{ Math.round(loadingProgress) }}%</div>
        </div>

        <!-- 现代化错误状态 -->
        <div v-if="hasError" class="webview-error-modern">
          <div class="error-container">
            <svg class="error-icon-modern" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <div class="error-title-modern">页面加载失败</div>
            <div class="error-message-modern">{{ errorMessage }}</div>
            <button class="btn-modern btn-primary" @click="reload">
              <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 4v6h6M23 20v-6h-6"/>
                <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
              </svg>
              <span>重新加载</span>
            </button>
          </div>
        </div>

        <!-- iframe -->
        <iframe
          v-show="!isLoading && !hasError"
          ref="webviewFrame"
          :src="iframeSrc"
          class="webview-frame-modern"
          :sandbox="sandboxAttributes"
          @load="onFrameLoad"
          @error="onFrameError"
        ></iframe>
      </div>

      <!-- 现代化底部状态栏 -->
      <div v-if="config.showStatus" class="webview-status-modern glass-effect">
        <div class="status-info-modern">
          <div class="status-url-container">
            <svg class="status-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M2 12h20"/>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
            <span class="status-url-modern">{{ displayUrl }}</span>
          </div>
          <div v-if="config.timeout && timeLeft > 0" class="status-timeout-modern">
            <svg class="timeout-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12,6 12,12 16,14"/>
            </svg>
            <span>{{ timeLeft }}秒后自动关闭</span>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="action-dialog-footer">
        <!-- 关闭按钮 -->
        <button
          class="btn-modern btn-secondary"
          @click="handleClose"
        >
          <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
          <span>{{ config.closeText || '关闭' }}</span>
        </button>
        
        <!-- 取消按钮 -->
        <button
          v-if="showCancelButton"
          class="btn-modern btn-secondary"
          @click="handleCancel"
        >
          <span>{{ config.cancelText || '取消' }}</span>
        </button>
        
        <!-- 确定按钮 -->
        <button
          v-if="showOkButton"
          class="btn-modern btn-primary"
          @click="handleOk"
        >
          <span>{{ config.okText || '确定' }}</span>
        </button>
      </div>
    </template>
  </ActionDialog>
</template>

<script>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import ActionDialog from './ActionDialog.vue'
import { ButtonType, normalizeButtonType } from './types.js'

export default {
  name: 'WebViewAction',
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
    },
    // T4接口调用相关属性
    module: {
      type: String,
      default: ''
    },
    extend: {
      type: [Object, String],
      default: () => ({})
    },
    apiUrl: {
      type: String,
      default: ''
    }
  },
  emits: ['submit', 'cancel', 'close', 'action', 'toast', 'reset', 'special-action'],
  setup(props, { emit }) {
    const webviewFrame = ref(null)
    const currentUrl = ref('')
    const isLoading = ref(true)
    const loadingProgress = ref(0)
    const hasError = ref(false)
    const errorMessage = ref('')
    const canGoBack = ref(false)
    const canGoForward = ref(false)
    const isFullscreen = ref(false)
    const timeLeft = ref(0)
    const timer = ref(null)
    const progressTimer = ref(null)

    // 计算属性
    const showToolbar = computed(() => {
      return props.config.showToolbar !== false
    })

    const iframeSrc = computed(() => {
      return currentUrl.value || props.config.url || 'about:blank'
    })

    const displayUrl = computed(() => {
      const url = currentUrl.value || props.config.url || ''
      return url.length > 50 ? url.substring(0, 47) + '...' : url
    })

    const sandboxAttributes = computed(() => {
      const { sandbox = 'allow-scripts allow-same-origin allow-forms allow-popups' } = props.config
      return sandbox
    })

    const showOkButton = computed(() => {
      const button = normalizeButtonType(props.config.button)
      return button === ButtonType.OK_CANCEL || button === ButtonType.OK_ONLY
    })

    const showCancelButton = computed(() => {
      const button = normalizeButtonType(props.config.button)
      return button === ButtonType.OK_CANCEL || button === ButtonType.CANCEL_ONLY
    })

    // 方法
    const navigate = () => {
      if (!currentUrl.value) return
      
      isLoading.value = true
      hasError.value = false
      loadingProgress.value = 0
      
      startLoadingProgress()
    }

    const goBack = () => {
      try {
        if (webviewFrame.value && webviewFrame.value.contentWindow) {
          webviewFrame.value.contentWindow.history.back()
        }
      } catch (err) {
        console.warn('无法执行后退操作:', err)
      }
    }

    const goForward = () => {
      try {
        if (webviewFrame.value && webviewFrame.value.contentWindow) {
          webviewFrame.value.contentWindow.history.forward()
        }
      } catch (err) {
        console.warn('无法执行前进操作:', err)
      }
    }

    const reload = () => {
      isLoading.value = true
      hasError.value = false
      loadingProgress.value = 0
      
      if (webviewFrame.value) {
        webviewFrame.value.src = webviewFrame.value.src
      }
      
      startLoadingProgress()
    }

    const toggleFullscreen = () => {
      isFullscreen.value = !isFullscreen.value
    }

    const toggleDevTools = () => {
      // 在实际应用中，这里可能需要调用 Electron 的 API
      console.log('开发者工具功能需要在 Electron 环境中实现')
    }

    const onFrameLoad = () => {
      isLoading.value = false
      hasError.value = false
      loadingProgress.value = 100
      
      stopLoadingProgress()
      
      // 更新导航状态
      updateNavigationState()
      
      // 获取当前URL
      try {
        if (webviewFrame.value && webviewFrame.value.contentWindow) {
          currentUrl.value = webviewFrame.value.contentWindow.location.href
        }
      } catch (err) {
        // 跨域限制，无法获取URL
        console.warn('无法获取iframe URL:', err)
      }
    }

    const onFrameError = (error) => {
      isLoading.value = false
      hasError.value = true
      errorMessage.value = error.message || '页面加载失败'
      
      stopLoadingProgress()
    }

    const updateNavigationState = () => {
      try {
        if (webviewFrame.value && webviewFrame.value.contentWindow) {
          const history = webviewFrame.value.contentWindow.history
          canGoBack.value = history.length > 1
          canGoForward.value = false // 无法直接检测前进状态
        }
      } catch (err) {
        // 跨域限制
        canGoBack.value = false
        canGoForward.value = false
      }
    }

    const startLoadingProgress = () => {
      loadingProgress.value = 0
      progressTimer.value = setInterval(() => {
        if (loadingProgress.value < 90) {
          loadingProgress.value += Math.random() * 10
        }
      }, 200)
    }

    const stopLoadingProgress = () => {
      if (progressTimer.value) {
        clearInterval(progressTimer.value)
        progressTimer.value = null
      }
      
      setTimeout(() => {
        loadingProgress.value = 100
      }, 100)
    }

    const handleOk = () => {
      const result = {
        url: currentUrl.value,
        action: 'ok'
      }
      
      // 尝试获取页面数据
      try {
        if (webviewFrame.value && webviewFrame.value.contentWindow) {
          result.title = webviewFrame.value.contentWindow.document.title
        }
      } catch (err) {
        // 跨域限制
      }
      
      emit('submit', result)
    }

    const handleCancel = () => {
      emit('cancel')
      emit('close')
    }

    const handleClose = () => {
      emit('close')
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

    // 监听配置变化
    watch(() => props.config, (newConfig) => {
      currentUrl.value = newConfig.url || ''
      isLoading.value = true
      hasError.value = false
      loadingProgress.value = 0
      
      if (newConfig.url) {
        nextTick(() => {
          startLoadingProgress()
        })
      }
      
      if (newConfig.timeout) {
        startTimeout()
      } else {
        stopTimeout()
      }
    }, { immediate: true })

    // 监听显示状态
    watch(() => props.visible, (visible) => {
      if (visible) {
        startTimeout()
      } else {
        stopTimeout()
        stopLoadingProgress()
      }
    })

    onMounted(() => {
      currentUrl.value = props.config.url || ''
      
      if (props.visible && props.config.timeout) {
        startTimeout()
      }
    })

    onUnmounted(() => {
      stopTimeout()
      stopLoadingProgress()
    })

    return {
      webviewFrame,
      currentUrl,
      isLoading,
      loadingProgress,
      hasError,
      errorMessage,
      canGoBack,
      canGoForward,
      isFullscreen,
      timeLeft,
      showToolbar,
      iframeSrc,
      displayUrl,
      sandboxAttributes,
      showOkButton,
      showCancelButton,
      navigate,
      goBack,
      goForward,
      reload,
      toggleFullscreen,
      toggleDevTools,
      onFrameLoad,
      onFrameError,
      handleOk,
      handleCancel,
      handleClose
    }
  }
}
</script>

<style scoped>
/* 主容器 */
.webview-action {
  padding: 0;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 60vh;
  overflow: hidden;
}

/* 现代化工具栏 */
.webview-toolbar-modern {
  display: flex;
  align-items: center;
  padding: 1rem;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  gap: 0.75rem;
  min-height: 60px;
  flex-shrink: 0;
}

.toolbar-nav-group {
  display: flex;
  gap: 0.375rem;
  background: rgba(255, 255, 255, 0.1);
  padding: 0.25rem;
  border-radius: var(--ds-radius-lg);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.toolbar-btn-modern {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  border: none;
  border-radius: var(--ds-radius-md);
  background: transparent;
  color: rgba(0, 0, 0, 0.7);
  cursor: pointer;
  transition: all var(--ds-duration-fast) ease;
  position: relative;
  overflow: hidden;
}

.toolbar-btn-modern:hover {
  background: rgba(255, 255, 255, 0.2);
  color: rgba(0, 0, 0, 0.85);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.toolbar-btn-modern:active {
  transform: translateY(0);
}

.toolbar-btn-modern.disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none !important;
}

.toolbar-btn-modern.disabled:hover {
  background: transparent;
  box-shadow: none;
}

.btn-icon {
  width: 18px;
  height: 18px;
  stroke-width: 2;
}

/* 现代化地址栏 */
.toolbar-address-modern {
  flex: 1;
  max-width: 600px;
}

.address-input-container {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: var(--ds-radius-lg);
  padding: 0.5rem 0.75rem;
  gap: 0.5rem;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  transition: all var(--ds-duration-fast) ease;
}

.address-input-container:focus-within {
  border-color: rgb(59, 130, 246);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  background: rgba(255, 255, 255, 0.15);
}

.address-icon {
  width: 16px;
  height: 16px;
  color: rgba(0, 0, 0, 0.5);
  flex-shrink: 0;
}

.address-input-modern {
  flex: 1;
  border: none;
  background: transparent;
  color: rgba(0, 0, 0, 0.8);
  font-size: 0.875rem;
  outline: none;
  padding: 0.25rem 0;
}

.address-input-modern::placeholder {
  color: rgba(0, 0, 0, 0.5);
}

.address-go-btn {
  padding: 0.375rem !important;
  background: rgb(59, 130, 246) !important;
  color: white !important;
  border-radius: var(--ds-radius-md) !important;
}

.address-go-btn:hover {
  background: rgb(37, 99, 235) !important;
}

.toolbar-actions-modern {
  display: flex;
  gap: 0.375rem;
  background: rgba(255, 255, 255, 0.1);
  padding: 0.25rem;
  border-radius: var(--ds-radius-lg);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

/* 现代化进度条 */
.webview-progress-modern {
  height: 3px;
  background: rgba(255, 255, 255, 0.1);
  overflow: hidden;
  position: relative;
  flex-shrink: 0;
}

.progress-bar-modern {
  height: 100%;
  background: linear-gradient(90deg, rgb(59, 130, 246), rgb(147, 51, 234));
  transition: width var(--ds-duration-normal) cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.progress-bar-modern::after {
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

/* WebView容器 */
.webview-container-modern {
  flex: 1;
  position: relative;
  overflow: hidden;
  background: white;
  border-radius: var(--ds-radius-md);
  border: 1px solid rgba(255, 255, 255, 0.2);
  min-height: 400px;
  display: flex;
  flex-direction: column;
}

.webview-container-modern.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  background: var(--action-color-bg);
  border-radius: 0;
}

.webview-frame-modern {
  width: 100%;
  height: 100%;
  border: none;
  background: white;
  border-radius: var(--ds-radius-md);
  flex: 1;
}

/* 现代化加载状态 */
.webview-loading-modern {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: var(--action-color-text);
  z-index: 10;
}

.loading-spinner-modern {
  width: 48px;
  height: 48px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top: 3px solid var(--action-color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
  position: relative;
}

.loading-spinner-modern::after {
  content: '';
  position: absolute;
  top: 6px;
  left: 6px;
  right: 6px;
  bottom: 6px;
  border: 2px solid transparent;
  border-top: 2px solid var(--action-color-primary-light);
  border-radius: 50%;
  animation: spin 1.5s linear infinite reverse;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text-modern {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 8px;
  color: var(--action-color-text);
}

.loading-progress-text {
  font-size: 14px;
  color: var(--action-color-text-secondary);
  font-weight: 600;
}

/* 现代化错误状态 */
.webview-error-modern {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 10;
  width: 90%;
  max-width: 400px;
}

.error-container {
  text-align: center;
  padding: 32px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.error-icon-modern {
  width: 64px;
  height: 64px;
  color: var(--action-color-danger);
  margin: 0 auto 16px;
  stroke-width: 1.5;
}

.error-title-modern {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--action-color-text);
}

.error-message-modern {
  font-size: 14px;
  color: var(--action-color-text-secondary);
  margin-bottom: 24px;
  line-height: 1.5;
}

/* 现代化状态栏 */
.webview-status-modern {
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 12px;
}

.status-info-modern {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.status-url-container {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.status-icon {
  width: 14px;
  height: 14px;
  color: var(--action-color-text-secondary);
  flex-shrink: 0;
}

.status-url-modern {
  color: var(--action-color-text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
}

.status-timeout-modern {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--action-color-warning);
  background: rgba(255, 193, 7, 0.1);
  padding: 4px 8px;
  border-radius: 8px;
  font-weight: 500;
  flex-shrink: 0;
}

.timeout-icon {
  width: 14px;
  height: 14px;
}

/* 按钮样式 */
.btn-modern {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 24px;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  min-height: 44px;
}

.btn-modern::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.1) 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.btn-modern:hover::before {
  opacity: 1;
}

.btn-modern:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.btn-modern:active {
  transform: translateY(0);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.1);
  color: var(--action-color-text);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
}

.btn-primary {
  background: linear-gradient(135deg, var(--action-color-primary) 0%, var(--action-color-primary-dark) 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(var(--action-color-primary-rgb), 0.3);
}

.btn-primary:hover {
  box-shadow: 0 8px 25px rgba(var(--action-color-primary-rgb), 0.4);
}

.action-dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin: 0;
  padding: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .webview-toolbar-modern {
    flex-wrap: wrap;
    padding: 12px;
    gap: 8px;
  }
  
  .toolbar-address-modern {
    order: 3;
    width: 100%;
    margin-top: 8px;
  }
  
  .toolbar-btn-modern {
    padding: 10px;
  }
  
  .btn-icon {
    width: 20px;
    height: 20px;
  }
  
  .action-dialog-footer {
    flex-direction: column-reverse;
    gap: 8px;
  }
  
  .btn-modern {
    width: 100%;
    padding: 14px 24px;
  }
  
  .error-container {
    padding: 24px;
    margin: 16px;
  }
  
  .status-info-modern {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .status-timeout-modern {
    align-self: flex-end;
  }
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .webview-action-modern {
    background: linear-gradient(135deg, rgba(0, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0.05) 100%);
  }
  
  .webview-toolbar-modern,
  .webview-status-modern {
    background: rgba(0, 0, 0, 0.2);
    border-color: rgba(255, 255, 255, 0.1);
  }
  
  .toolbar-nav-group,
  .toolbar-actions-modern {
    background: rgba(0, 0, 0, 0.2);
  }
  
  .address-input-container {
    background: rgba(0, 0, 0, 0.2);
    border-color: rgba(255, 255, 255, 0.1);
  }
  
  .address-input-container:focus-within {
    background: rgba(0, 0, 0, 0.3);
  }
  
  .error-container {
    background: rgba(0, 0, 0, 0.3);
    border-color: rgba(255, 255, 255, 0.1);
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
  .webview-toolbar-modern,
  .webview-status-modern {
    border-width: 2px;
  }
  
  .toolbar-btn-modern {
    border: 1px solid currentColor;
  }
  
  .address-input-container {
    border-width: 2px;
  }
  
  .btn-modern {
    border: 2px solid currentColor;
  }
}

/* 减少动画模式 */
@media (prefers-reduced-motion: reduce) {
  .toolbar-btn-modern,
  .btn-modern,
  .progress-bar-modern,
  .loading-spinner-modern,
  .loading-spinner-modern::after {
    transition: none;
    animation: none;
  }
  
  .toolbar-btn-modern:hover,
  .btn-modern:hover {
    transform: none;
  }
}
</style>