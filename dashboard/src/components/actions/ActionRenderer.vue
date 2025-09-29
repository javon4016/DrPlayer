<template>
  <div class="action-renderer">
    <!-- 动态渲染Action组件 -->
    <component
      v-if="parsedConfig"
      :is="currentComponent"
      :config="parsedConfig"
      :visible="isVisible"
      @submit="handleSubmit"
      @cancel="handleCancel"
      @close="handleClose"
      @action="handleAction"
    />

    <!-- 错误提示 -->
    <ActionDialog
      v-if="error"
      :visible="!!error"
      title="错误"
      width="400"
      @close="clearError"
    >
      <div class="action-error">
        <p><strong>{{ error.type }}</strong></p>
        <p>{{ error.message }}</p>
        <pre v-if="error.details">{{ JSON.stringify(error.details, null, 2) }}</pre>
      </div>
      <template #footer>
        <button class="action-button action-button-primary" @click="clearError">
          确定
        </button>
      </template>
    </ActionDialog>

    <!-- 加载状态 -->
    <ActionDialog
      v-if="isLoading"
      :visible="isLoading"
      title="处理中"
      width="300"
      :show-close="false"
    >
      <div class="action-loading">
        正在处理，请稍候...
      </div>
    </ActionDialog>

    <!-- Toast提示 -->
    <Transition name="action-toast">
      <div v-if="toast" class="action-toast" :class="toastType">
        {{ toast }}
      </div>
    </Transition>
  </div>
</template>

<script>
import { ref, computed, watch, defineAsyncComponent } from 'vue'
import ActionDialog from './ActionDialog.vue'
import { 
  parseActionConfig, 
  validateActionConfig, 
  ActionType, 
  ActionErrorType,
  createActionError 
} from './types.js'

// 懒加载Action组件
const InputAction = defineAsyncComponent(() => import('./InputAction.vue'))
const MultiInputAction = defineAsyncComponent(() => import('./MultiInputAction.vue'))
const MenuAction = defineAsyncComponent(() => import('./MenuAction.vue'))
const SelectAction = defineAsyncComponent(() => import('./SelectAction.vue'))
const MsgBoxAction = defineAsyncComponent(() => import('./MsgBoxAction.vue'))
const WebViewAction = defineAsyncComponent(() => import('./WebViewAction.vue'))
const HelpAction = defineAsyncComponent(() => import('./HelpAction.vue'))

export default {
  name: 'ActionRenderer',
  components: {
    ActionDialog,
    InputAction,
    MultiInputAction,
    MenuAction,
    SelectAction,
    MsgBoxAction,
    WebViewAction,
    HelpAction
  },
  props: {
    // Action数据，可以是JSON字符串或对象
    actionData: {
      type: [String, Object],
      default: null
    },
    // 是否显示
    visible: {
      type: Boolean,
      default: true
    },
    // 自动显示，当actionData变化时自动显示
    autoShow: {
      type: Boolean,
      default: true
    }
  },
  emits: ['action', 'close', 'error', 'success'],
  setup(props, { emit }) {
    const parsedConfig = ref(null)
    const error = ref(null)
    const isLoading = ref(false)
    const isVisible = ref(props.visible)
    const toast = ref('')
    const toastType = ref('success')
    const toastTimer = ref(null)

    // 组件映射
    const componentMap = {
      [ActionType.INPUT]: 'InputAction',
      [ActionType.EDIT]: 'InputAction', // edit类型使用InputAction，通过multiLine区分
      [ActionType.MULTI_INPUT]: 'MultiInputAction',
      [ActionType.MULTI_INPUT_X]: 'MultiInputAction',
      [ActionType.MENU]: 'MenuAction',
      [ActionType.SELECT]: 'SelectAction',
      [ActionType.MSGBOX]: 'MsgBoxAction',
      [ActionType.WEBVIEW]: 'WebViewAction',
      [ActionType.HELP]: 'HelpAction'
    }

    // 当前组件
    const currentComponent = computed(() => {
      if (!parsedConfig.value) return null
      return componentMap[parsedConfig.value.type] || null
    })

    // 解析Action配置
    const parseConfig = (data) => {
      try {
        if (!data) {
          parsedConfig.value = null
          return
        }

        const config = parseActionConfig(data)
        validateActionConfig(config)
        
        // 处理特殊动作
        handleSpecialActions(config)
        
        parsedConfig.value = config
        error.value = null

        if (props.autoShow) {
          isVisible.value = true
        }
      } catch (err) {
        console.error('解析Action配置失败:', err)
        error.value = err
        parsedConfig.value = null
      }
    }

    // 处理特殊动作
    const handleSpecialActions = (config) => {
      const { actionId } = config

      // 专项动作处理
      switch (actionId) {
        case '源内搜索':
          // 可以在这里添加特殊处理逻辑
          break
        case '详情页跳转':
          // 可以在这里添加特殊处理逻辑
          break
        case 'KTV播放':
          // 可以在这里添加特殊处理逻辑
          break
        case '刷新列表':
          // 可以在这里添加特殊处理逻辑
          break
        case '放入剪贴板':
          // 可以在这里添加特殊处理逻辑
          break
        case '保持窗口':
          // 可以在这里添加特殊处理逻辑
          break
      }
    }

    // 处理提交
    const handleSubmit = async (value) => {
      if (!parsedConfig.value) return

      try {
        isLoading.value = true
        
        // 触发action事件
        const result = await emit('action', parsedConfig.value.actionId, value)
        
        // 处理返回结果
        if (result && typeof result === 'object') {
          if (result.success === false) {
            throw createActionError(
              ActionErrorType.NETWORK_ERROR,
              result.error || '操作失败'
            )
          }

          // 显示toast消息
          if (result.toast) {
            showToast(result.toast, 'success')
          }

          // 处理新的action
          if (result.action) {
            parseConfig(result.action)
            return
          }
        }

        // 默认成功处理
        emit('success', value)
        handleClose()
      } catch (err) {
        console.error('执行Action失败:', err)
        error.value = err
      } finally {
        isLoading.value = false
      }
    }

    // 处理取消
    const handleCancel = () => {
      handleClose()
    }

    // 处理关闭
    const handleClose = () => {
      isVisible.value = false
      parsedConfig.value = null
      emit('close')
    }

    // 处理动作
    const handleAction = async (action, value) => {
      await handleSubmit({ action, value })
    }

    // 清除错误
    const clearError = () => {
      error.value = null
    }

    // 显示Toast
    const showToast = (message, type = 'success') => {
      if (toastTimer.value) {
        clearTimeout(toastTimer.value)
      }

      toast.value = message
      toastType.value = type

      toastTimer.value = setTimeout(() => {
        toast.value = ''
        toastTimer.value = null
      }, 3000)
    }

    // 监听actionData变化
    watch(() => props.actionData, (newData) => {
      parseConfig(newData)
    }, { immediate: true })

    // 监听visible变化
    watch(() => props.visible, (newVal) => {
      isVisible.value = newVal
    })

    // 公开方法
    const show = (actionData) => {
      if (actionData) {
        parseConfig(actionData)
      }
      isVisible.value = true
    }

    const hide = () => {
      isVisible.value = false
    }

    const executeAction = async (actionId, value) => {
      try {
        isLoading.value = true
        const result = await emit('action', actionId, value)
        return result
      } catch (err) {
        error.value = err
        throw err
      } finally {
        isLoading.value = false
      }
    }

    return {
      parsedConfig,
      currentComponent,
      error,
      isLoading,
      isVisible,
      toast,
      toastType,
      handleSubmit,
      handleCancel,
      handleClose,
      handleAction,
      clearError,
      show,
      hide,
      executeAction,
      showToast
    }
  }
}
</script>

<style scoped>
.action-renderer {
  position: relative;
}

/* Toast样式 */
.action-toast {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 24px;
  border-radius: 6px;
  color: white;
  font-size: 14px;
  z-index: 2000;
  max-width: 400px;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.action-toast.success {
  background: #52c41a;
}

.action-toast.error {
  background: #f5222d;
}

.action-toast.warning {
  background: #faad14;
}

.action-toast.info {
  background: #1890ff;
}

/* Toast动画 */
.action-toast-enter-active,
.action-toast-leave-active {
  transition: all 0.3s ease;
}

.action-toast-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(-20px);
}

.action-toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-20px);
}

/* 错误样式 */
.action-error {
  color: #f5222d;
}

.action-error pre {
  background: #fff2f0;
  border: 1px solid #ffccc7;
  border-radius: 4px;
  padding: 8px;
  margin-top: 8px;
  font-size: 12px;
  overflow-x: auto;
}

/* 加载样式 */
.action-loading {
  text-align: center;
  padding: 20px;
  color: #8c8c8c;
}
</style>