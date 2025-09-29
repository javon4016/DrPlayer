<template>
  <ActionDialog
    :visible="visible"
    :title="config.title"
    :width="config.width || 600"
    :height="config.height"
    :canceled-on-touch-outside="!config.keep"
    @close="handleCancel"
  >
    <div class="multi-input-action-modern">
      <!-- 消息区域 -->
      <div v-if="config.msg" class="message-section">
        <div class="message-content">
          <div class="message-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="m2 17 10 5 10-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="m2 12 10 5 10-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <p class="message-text">{{ config.msg }}</p>
        </div>
      </div>

      <!-- 图片区域 -->
      <div v-if="config.imageUrl" class="media-section">
        <div class="image-container">
          <img
            :src="config.imageUrl"
            :style="{ height: config.imageHeight ? `${config.imageHeight}px` : 'auto' }"
            class="action-image-modern"
            alt="配置图片"
          />
        </div>
      </div>

      <!-- 输入项列表 -->
      <div class="inputs-section">
        <div class="inputs-grid">
          <div
            v-for="(input, index) in inputItems"
            :key="input.id || index"
            class="input-card"
          >
            <!-- 输入项头部 -->
            <div class="input-card-header">
              <div class="input-label-group">
                <label v-if="input.name" class="input-label-modern">
                  {{ input.name }}
                  <span v-if="input.required" class="required-indicator">*</span>
                </label>
                <div v-if="input.help" class="input-help-text">
                  {{ input.help }}
                </div>
              </div>
              
              <!-- 删除按钮（仅增强模式且可删除时显示） -->
              <button
                v-if="isEnhanced && inputItems.length > 1"
                class="remove-btn"
                @click="removeInputItem(index)"
                title="删除此项"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
            </div>

            <!-- 输入区域 -->
            <div class="input-area">
              <!-- 单行输入 -->
              <div v-if="!input.multiLine || input.multiLine <= 1" class="input-wrapper-modern">
                <input
                  v-model="inputValues[index]"
                  :type="getInputType(input)"
                  :placeholder="input.tip || input.name"
                  class="input-field-modern"
                  :class="{ 
                    error: inputErrors[index],
                    success: !inputErrors[index] && inputValues[index] && input.required
                  }"
                  @input="handleInputChange(index, $event)"
                  @blur="validateInput(index)"
                />
                <div class="input-actions">
                  <button
                    v-if="inputValues[index] && inputValues[index].length > 20"
                    class="expand-btn"
                    @click="openTextEditor(index)"
                    title="打开大文本编辑器"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </button>
                </div>
              </div>

              <!-- 多行输入 -->
              <div v-else class="textarea-container">
                <div class="textarea-wrapper-modern">
                  <textarea
                    v-model="inputValues[index]"
                    :placeholder="input.tip || input.name"
                    :rows="input.multiLine || 3"
                    class="textarea-field-modern"
                    :class="{ 
                      error: inputErrors[index],
                      success: !inputErrors[index] && inputValues[index] && input.required
                    }"
                    @input="handleInputChange(index, $event)"
                    @blur="validateInput(index)"
                  ></textarea>
                  <button
                    class="textarea-expand"
                    @click="openTextEditor(index)"
                    title="打开大文本编辑器"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </button>
                </div>
              </div>

              <!-- 状态指示器 -->
              <div v-if="inputErrors[index] || (inputValues[index] && inputValues[index].length > 0)" class="input-status">
                <div v-if="inputErrors[index]" class="error-message">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                    <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" stroke-width="2"/>
                    <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" stroke-width="2"/>
                  </svg>
                  {{ inputErrors[index] }}
                </div>
                <div v-if="inputValues[index]" class="char-count">
                  {{ inputValues[index].length }} 字符
                </div>
              </div>
            </div>

            <!-- 快速选择区域 -->
            <div v-if="input.selectData" class="quick-select-section">
              <div class="quick-select-label">快速选择</div>
              <div class="quick-select-grid">
                <button
                  v-for="option in parseSelectData(input.selectData)"
                  :key="option.value"
                  class="quick-select-item"
                  @click="selectQuickOption(index, option)"
                >
                  {{ option.name }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 增强功能区域 -->
      <div v-if="isEnhanced" class="enhanced-section">
        <div class="enhanced-controls">
          <!-- 添加新输入项 -->
          <button
            v-if="config.allowAdd"
            class="btn-modern btn-secondary"
            @click="addInputItem"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" stroke-width="2"/>
              <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" stroke-width="2"/>
            </svg>
            添加项目
          </button>

          <!-- 批量操作 -->
          <div v-if="config.allowBatch" class="batch-controls">
            <button
              class="btn-modern btn-secondary"
              @click="clearAll"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <polyline points="3,6 5,6 21,6" stroke="currentColor" stroke-width="2"/>
                <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2" stroke="currentColor" stroke-width="2"/>
              </svg>
              清空全部
            </button>
            <button
              class="btn-modern btn-secondary"
              @click="fillExample"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" stroke-width="2"/>
                <polyline points="14,2 14,8 20,8" stroke="currentColor" stroke-width="2"/>
                <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" stroke-width="2"/>
                <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" stroke-width="2"/>
                <polyline points="10,9 9,9 8,9" stroke="currentColor" stroke-width="2"/>
              </svg>
              填充示例
            </button>
          </div>
        </div>
      </div>

      <!-- 超时提示 -->
      <div v-if="config.timeout && timeLeft > 0" class="timeout-section">
        <div class="timeout-indicator">
          <div class="timeout-icon">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/>
            </svg>
          </div>
          <span class="timeout-text">{{ timeLeft }}秒后自动关闭</span>
          <div class="timeout-progress">
            <div 
              class="timeout-progress-bar"
              :style="{ width: `${(timeLeft / config.timeout) * 100}%` }"
            ></div>
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
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" stroke-width="2"/>
            <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" stroke-width="2"/>
          </svg>
          取消
        </button>
        
        <!-- 确定按钮 -->
        <button
          v-if="showOkButton"
          class="btn-modern btn-primary"
          :class="{ disabled: !isValid }"
          :disabled="!isValid"
          @click="handleSubmit"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <polyline points="20,6 9,17 4,12" stroke="currentColor" stroke-width="2"/>
          </svg>
          确定
        </button>
      </div>
    </template>
  </ActionDialog>

  <!-- 大文本编辑器弹窗 -->
  <ActionDialog
    :visible="showTextEditor"
    title="大文本编辑器"
    :width="800"
    :height="600"
    @close="closeTextEditor"
  >
    <div class="text-editor">
      <textarea
        ref="textEditorRef"
        v-model="editorText"
        class="text-editor-textarea"
        placeholder="请输入文本内容..."
      ></textarea>
    </div>

    <template #footer>
      <div class="modern-footer">
        <button class="btn-modern btn-secondary" @click="closeTextEditor">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" stroke-width="2"/>
            <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" stroke-width="2"/>
          </svg>
          取消
        </button>
        <button class="btn-modern btn-primary" @click="saveEditorText">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <polyline points="20,6 9,17 4,12" stroke="currentColor" stroke-width="2"/>
          </svg>
          确定
        </button>
      </div>
    </template>
  </ActionDialog>
</template>

<script>
import { ref, computed, watch, reactive, nextTick, onMounted, onUnmounted } from 'vue'
import ActionDialog from './ActionDialog.vue'
import { 
  ButtonType, 
  parseSelectData, 
  debounce 
} from './types.js'

export default {
  name: 'MultiInputAction',
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
    const inputValues = ref([])
    const inputErrors = ref([])
    const inputItems = ref([])
    const timeLeft = ref(0)
    const timer = ref(null)

    // 大文本编辑器相关
    const textEditorRef = ref(null)
    const showTextEditor = ref(false)
    const editorText = ref('')
    const currentEditIndex = ref(-1)

    // 计算属性
    const isEnhanced = computed(() => {
      return props.config.type === 'multiInputEnhanced'
    })

    const showOkButton = computed(() => {
      const { button = ButtonType.OK_CANCEL } = props.config
      return button === ButtonType.OK_CANCEL || button === ButtonType.OK_ONLY
    })

    const showCancelButton = computed(() => {
      const { button = ButtonType.OK_CANCEL } = props.config
      return button === ButtonType.OK_CANCEL || button === ButtonType.CANCEL_ONLY
    })

    const isValid = computed(() => {
      // 检查是否有错误
      if (inputErrors.value.some(error => error)) return false
      
      // 检查必填项
      for (let i = 0; i < inputItems.value.length; i++) {
        const item = inputItems.value[i]
        const value = inputValues.value[i]
        
        if (item.required && (!value || !value.trim())) {
          return false
        }
      }
      
      return true
    })

    // 初始化输入项
    const initializeInputs = () => {
      const inputs = props.config.input || []
      inputItems.value = Array.isArray(inputs) ? inputs : [inputs]
      
      // 初始化输入值和错误状态
      inputValues.value = inputItems.value.map(item => item.value || '')
      inputErrors.value = inputItems.value.map(() => '')
    }

    // 获取输入类型
    const getInputType = (input) => {
      const { inputType = 0 } = input
      const typeMap = {
        0: 'text',
        1: 'password',
        2: 'number',
        3: 'email',
        4: 'url'
      }
      return typeMap[inputType] || 'text'
    }

    // 验证单个输入
    const validateInput = (index) => {
      const item = inputItems.value[index]
      const value = inputValues.value[index]
      
      inputErrors.value[index] = ''

      // 必填验证
      if (item.required && (!value || !value.trim())) {
        inputErrors.value[index] = `${item.name || '此字段'}为必填项`
        return false
      }

      // 自定义验证
      if (item.validation && value) {
        try {
          const regex = new RegExp(item.validation)
          if (!regex.test(value)) {
            inputErrors.value[index] = `${item.name || '输入'}格式不正确`
            return false
          }
        } catch (err) {
          console.warn('验证正则表达式错误:', err)
        }
      }

      // 类型验证
      const inputType = getInputType(item)
      if (inputType === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(value)) {
          inputErrors.value[index] = '请输入有效的邮箱地址'
          return false
        }
      }

      if (inputType === 'url' && value) {
        try {
          new URL(value)
        } catch {
          inputErrors.value[index] = '请输入有效的URL地址'
          return false
        }
      }

      return true
    }

    // 防抖验证
    const debouncedValidate = debounce((index) => {
      validateInput(index)
    }, 300)

    // 事件处理
    const handleInputChange = (index, event) => {
      const value = event.target.value
      inputValues.value[index] = value
      debouncedValidate(index)
    }

    const handleSubmit = () => {
      // 验证所有输入
      let allValid = true
      for (let i = 0; i < inputItems.value.length; i++) {
        if (!validateInput(i)) {
          allValid = false
        }
      }

      if (!allValid) return

      // 构建结果
      const result = {}
      
      inputItems.value.forEach((item, index) => {
        const key = item.id || item.name || `input_${index}`
        result[key] = inputValues.value[index]
      })

      emit('submit', result)
    }

    const handleCancel = () => {
      emit('cancel')
      emit('close')
    }

    // 大文本编辑器方法
    const openTextEditor = (index) => {
      currentEditIndex.value = index
      editorText.value = inputValues.value[index] || ''
      showTextEditor.value = true
      nextTick(() => {
        if (textEditorRef.value) {
          textEditorRef.value.focus()
        }
      })
    }

    const closeTextEditor = () => {
      showTextEditor.value = false
      currentEditIndex.value = -1
    }

    const saveEditorText = () => {
      if (currentEditIndex.value >= 0) {
        inputValues.value[currentEditIndex.value] = editorText.value
        handleInputChange(currentEditIndex.value, { target: { value: editorText.value } })
      }
      showTextEditor.value = false
      currentEditIndex.value = -1
    }

    const selectQuickOption = (index, option) => {
      inputValues.value[index] = option.value
      validateInput(index)
    }

    // 增强功能
    const addInputItem = () => {
      const newItem = {
        id: `dynamic_${Date.now()}`,
        name: `输入项 ${inputItems.value.length + 1}`,
        tip: '请输入内容',
        required: false
      }
      
      inputItems.value.push(newItem)
      inputValues.value.push('')
      inputErrors.value.push('')
    }

    const removeInputItem = (index) => {
      if (inputItems.value.length <= 1) return
      
      inputItems.value.splice(index, 1)
      inputValues.value.splice(index, 1)
      inputErrors.value.splice(index, 1)
    }

    const clearAll = () => {
      inputValues.value = inputValues.value.map(() => '')
      inputErrors.value = inputErrors.value.map(() => '')
    }

    const fillExample = () => {
      inputItems.value.forEach((item, index) => {
        if (item.example) {
          inputValues.value[index] = item.example
        } else {
          inputValues.value[index] = `示例${index + 1}`
        }
      })
      
      // 验证所有输入
      inputItems.value.forEach((_, index) => {
        validateInput(index)
      })
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
      initializeInputs()
      
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
      }
    })

    onMounted(() => {
      initializeInputs()
    })

    onUnmounted(() => {
      stopTimeout()
    })

    return {
      inputValues,
      inputErrors,
      inputItems,
      timeLeft,
      isEnhanced,
      showOkButton,
      showCancelButton,
      isValid,
      getInputType,
      validateInput,
      handleInputChange,
      handleSubmit,
      handleCancel,
      selectQuickOption,
      addInputItem,
      removeInputItem,
      clearAll,
      fillExample,
      parseSelectData,
      // 大文本编辑器相关
      textEditorRef,
      showTextEditor,
      editorText,
      currentEditIndex,
      openTextEditor,
      closeTextEditor,
      saveEditorText
    }
  }
}
</script>

<style scoped>
/* 主容器 */
.multi-input-action-modern {
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

/* 消息区域 */
.message-section {
  background: linear-gradient(135deg, var(--glass-bg-primary), var(--glass-bg-secondary));
  backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-card);
}

.message-content {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-md);
}

.message-icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  background: var(--gradient-primary);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: var(--shadow-sm);
}

.message-text {
  margin: 0;
  color: var(--text-primary);
  font-size: var(--font-size-md);
  line-height: 1.6;
  font-weight: 500;
}

/* 媒体区域 */
.media-section {
  display: flex;
  justify-content: center;
}

.image-container {
  background: var(--glass-bg-light);
  backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-card);
  overflow: hidden;
}

.action-image-modern {
  max-width: 100%;
  height: auto;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
}

/* 输入区域 */
.inputs-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.inputs-grid {
  display: grid;
  gap: var(--spacing-md);
}

.input-card {
  background: var(--glass-bg-light);
  backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-md);
  box-shadow: var(--shadow-card);
  transition: all var(--transition-normal);
  position: relative;
  overflow: hidden;
}

.input-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--gradient-primary);
  opacity: 0;
  transition: opacity var(--transition-normal);
}

.input-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
  border-color: var(--primary-color);
}

.input-card:hover::before {
  opacity: 1;
}

/* 输入卡片头部 */
.input-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-md);
}

.input-label-group {
  flex: 1;
}

.input-label-modern {
  display: block;
  font-weight: 600;
  color: var(--text-primary);
  font-size: var(--font-size-md);
  margin-bottom: var(--spacing-xs);
}

.required-indicator {
  color: var(--danger-color);
  margin-left: 4px;
  font-weight: 700;
}

.input-help-text {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  line-height: 1.4;
}

.remove-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: var(--glass-bg-danger);
  color: var(--danger-color);
  border-radius: var(--radius-md);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-normal);
  opacity: 0.7;
}

.remove-btn:hover {
  opacity: 1;
  background: var(--danger-color);
  color: white;
  transform: scale(1.1);
}

/* 输入区域 */
.input-area {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.input-wrapper-modern {
  position: relative;
  display: flex;
  align-items: center;
}

.input-field-modern {
  width: 100%;
  padding: var(--spacing-md);
  padding-right: 50px;
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: var(--font-size-md);
  transition: all var(--transition-normal);
  outline: none;
}

.input-field-modern:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px var(--primary-color-alpha);
  background: var(--bg-elevated);
}

.input-field-modern.error {
  border-color: var(--danger-color);
  box-shadow: 0 0 0 3px var(--danger-color-alpha);
}

.input-field-modern.success {
  border-color: var(--success-color);
  box-shadow: 0 0 0 3px var(--success-color-alpha);
}

.input-actions {
  position: absolute;
  right: var(--spacing-sm);
  display: flex;
  gap: var(--spacing-xs);
}

.expand-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: var(--glass-bg-primary);
  color: var(--primary-color);
  border-radius: var(--radius-sm);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-normal);
  opacity: 0.8;
}

.expand-btn:hover {
  opacity: 1;
  background: var(--primary-color);
  color: white;
  transform: scale(1.1);
}

/* 多行输入 */
.textarea-container {
  position: relative;
}

.textarea-wrapper-modern {
  position: relative;
}

.textarea-field-modern {
  width: 100%;
  padding: var(--spacing-md);
  padding-bottom: 40px;
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: var(--font-size-md);
  font-family: inherit;
  line-height: 1.5;
  resize: vertical;
  min-height: 80px;
  transition: all var(--transition-normal);
  outline: none;
}

.textarea-field-modern:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px var(--primary-color-alpha);
  background: var(--bg-elevated);
}

.textarea-field-modern.error {
  border-color: var(--danger-color);
  box-shadow: 0 0 0 3px var(--danger-color-alpha);
}

.textarea-field-modern.success {
  border-color: var(--success-color);
  box-shadow: 0 0 0 3px var(--success-color-alpha);
}

.textarea-expand {
  position: absolute;
  bottom: var(--spacing-sm);
  right: var(--spacing-sm);
  width: 28px;
  height: 28px;
  border: none;
  background: var(--glass-bg-primary);
  color: var(--primary-color);
  border-radius: var(--radius-sm);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-normal);
  opacity: 0.8;
}

.textarea-expand:hover {
  opacity: 1;
  background: var(--primary-color);
  color: white;
  transform: scale(1.1);
}

/* 状态指示器 */
.input-status {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: var(--spacing-xs);
}

.error-message {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  color: var(--danger-color);
  font-size: var(--font-size-sm);
  font-weight: 500;
}

.char-count {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
  font-weight: 500;
}

/* 快速选择区域 */
.quick-select-section {
  margin-top: var(--spacing-md);
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--border-color-light);
}

.quick-select-label {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: var(--spacing-sm);
}

.quick-select-grid {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.quick-select-item {
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--glass-bg-secondary);
  border: 1px solid var(--border-color-light);
  border-radius: var(--radius-full);
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-normal);
  white-space: nowrap;
}

.quick-select-item:hover {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

/* 增强功能区域 */
.enhanced-section {
  background: var(--glass-bg-light);
  backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-card);
}

.enhanced-controls {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  align-items: center;
}

.batch-controls {
  display: flex;
  gap: var(--spacing-md);
  flex-wrap: wrap;
  justify-content: center;
}

/* 超时区域 */
.timeout-section {
  margin-bottom: 0.5rem;
}

.timeout-indicator {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(251, 191, 36, 0.1) 100%);
  border: 1px solid rgba(245, 158, 11, 0.2);
  border-radius: var(--ds-radius-lg);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.timeout-icon {
  flex-shrink: 0;
  color: rgb(245, 158, 11);
}

.timeout-text {
  flex: 1;
  font-size: 0.875rem;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.8);
}

.timeout-progress {
  flex: 1;
  height: 4px;
  background: rgba(245, 158, 11, 0.2);
  border-radius: 2px;
  overflow: hidden;
}

.timeout-progress-bar {
  height: 100%;
  background: linear-gradient(90deg, rgb(245, 158, 11), rgb(251, 191, 36));
  border-radius: 2px;
  transition: width var(--ds-duration-normal) ease;
}

/* 现代化底部 */
.modern-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 0.75rem;
  margin: 0;
  padding: 0;
}

.btn-modern {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: 2px solid transparent;
  border-radius: var(--ds-radius-lg);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--ds-duration-fast) ease;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;
}

.btn-modern::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left var(--ds-duration-normal) ease;
}

.btn-modern:hover::before {
  left: 100%;
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.6);
  border-color: rgba(255, 255, 255, 0.3);
  color: rgba(0, 0, 0, 0.7);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.8);
  border-color: rgba(255, 255, 255, 0.5);
  color: rgba(0, 0, 0, 0.9);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.btn-primary {
  background: linear-gradient(135deg, rgb(59, 130, 246), rgb(147, 51, 234));
  border-color: rgba(59, 130, 246, 0.3);
  color: white;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.btn-primary:hover:not(.disabled) {
  background: linear-gradient(135deg, rgb(37, 99, 235), rgb(126, 34, 206));
  transform: translateY(-1px);
  box-shadow: 0 8px 25px rgba(59, 130, 246, 0.4);
}

.btn-primary.disabled {
  background: rgba(0, 0, 0, 0.1);
  border-color: rgba(0, 0, 0, 0.1);
  color: rgba(0, 0, 0, 0.3);
  cursor: not-allowed;
  box-shadow: none;
}

.btn-modern:active:not(.disabled) {
  transform: translateY(0);
}

/* 大文本编辑器 */
.text-editor {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.text-editor-textarea {
  flex: 1;
  width: 100%;
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: var(--spacing-lg);
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: var(--font-size-md);
  line-height: 1.6;
  resize: none;
  outline: none;
  background: var(--bg-primary);
  color: var(--text-primary);
  transition: all var(--transition-normal);
}

.text-editor-textarea:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px var(--primary-color-alpha);
  background: var(--bg-elevated);
}

/* 动画 */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .multi-input-action-modern {
    gap: var(--spacing-md);
  }
  
  .message-content {
    flex-direction: column;
    text-align: center;
  }
  
  .input-card {
    padding: var(--spacing-md);
  }
  
  .input-card-header {
    flex-direction: column;
    gap: var(--spacing-sm);
  }
  
  .remove-btn {
    align-self: flex-end;
  }
  
  .enhanced-controls {
    gap: var(--spacing-sm);
  }
  
  .batch-controls {
    flex-direction: column;
    width: 100%;
  }
  
  .batch-controls .btn-modern {
    width: 100%;
    justify-content: center;
  }
  
  .quick-select-grid {
    gap: var(--spacing-xs);
  }
  
  .quick-select-item {
    font-size: var(--font-size-xs);
    padding: var(--spacing-xs) var(--spacing-sm);
  }
  
  .timeout-indicator {
    flex-direction: column;
    text-align: center;
    gap: var(--spacing-sm);
  }
  
  .modern-footer {
    flex-direction: column-reverse;
    gap: var(--spacing-sm);
  }
  
  .modern-footer .btn-modern {
    width: 100%;
    justify-content: center;
  }
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  .input-card::before {
    background: var(--gradient-primary-dark);
  }
  
  .message-icon {
    background: var(--gradient-primary-dark);
  }
  
  .timeout-icon {
    background: var(--warning-color-dark);
  }
  
  .timeout-text {
    color: var(--warning-color-dark);
  }
}

/* 高对比度模式 */
@media (prefers-contrast: high) {
  .input-card {
    border-width: 2px;
  }
  
  .input-field-modern,
  .textarea-field-modern {
    border-width: 3px;
  }
  
  .btn-modern {
    border-width: 2px;
  }
}

/* 减少动画模式 */
@media (prefers-reduced-motion: reduce) {
  .input-card,
  .btn-modern,
  .quick-select-item,
  .expand-btn,
  .textarea-expand,
  .remove-btn {
    transition: none;
  }
  
  .timeout-icon {
    animation: none;
  }
  
  .btn-modern::before {
    display: none;
  }
}
</style>