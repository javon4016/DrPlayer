<template>
  <ActionDialog
    :visible="visible"
    :title="config.title"
    :width="config.width || 450"
    :height="config.height"
    :canceled-on-touch-outside="!config.keep"
    @close="handleCancel"
  >
    <div class="select-action-modern">
      <!-- 消息区域 -->
      <div v-if="config.msg" class="message-section">
        <div class="message-content glass-effect gradient-primary">
          <div class="message-bg gradient-primary"></div>
          <div class="message-text">{{ config.msg }}</div>
        </div>
      </div>

      <!-- 媒体区域 -->
      <div v-if="config.imageUrl" class="media-section">
        <div class="media-container glass-effect gradient-secondary">
          <div class="media-bg gradient-secondary"></div>
          <img
            :src="config.imageUrl"
            :style="{ height: config.imageHeight ? `${config.imageHeight}px` : 'auto' }"
            class="media-image"
          />
        </div>
      </div>

      <!-- 选择器区域 -->
      <div class="selector-section">
        <!-- 标签 -->
        <div v-if="config.tip" class="selector-label">
          <span class="label-text">{{ config.tip }}</span>
          <span v-if="config.required" class="required-mark">*</span>
        </div>

        <!-- 搜索框 -->
        <div v-if="config.searchable" class="search-section">
          <div class="search-container">
            <svg class="search-icon" viewBox="0 0 24 24" width="16" height="16">
              <path fill="currentColor" d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
            <input
              v-model="searchKeyword"
              type="text"
              placeholder="搜索选项..."
              class="search-input"
              @input="handleSearch"
            />
          </div>
        </div>

        <!-- Tag选择器 -->
        <div class="tags-section">
          <div class="tags-grid" :style="{ gridTemplateColumns: `repeat(${config.column || 2}, 1fr)` }">
            <div
              v-for="option in filteredOptions"
              :key="option.value"
              class="tag-card"
              :class="{ 
                selected: isMultiSelect ? isSelected(option) : (selectedOption && selectedOption.value === option.value),
                disabled: option.disabled,
                'has-description': option.description
              }"
              @click="isMultiSelect ? toggleOption(option) : selectOption(option)"
            >
              <div class="tag-content">
                <div class="tag-title">{{ option.name }}</div>
                <div v-if="option.description" class="tag-description">{{ option.description }}</div>
              </div>
              
              <!-- 选择指示器 -->
              <div class="tag-indicator">
                <div v-if="isMultiSelect" class="checkbox-modern">
                  <input 
                    type="checkbox" 
                    :checked="isSelected(option)"
                    class="checkbox-input"
                    readonly
                  />
                  <label class="checkbox-label">
                    <div class="checkbox-indicator">
                      <svg v-if="isSelected(option)" viewBox="0 0 24 24" width="12" height="12">
                        <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                      </svg>
                    </div>
                  </label>
                </div>
                <div v-else class="radio-modern">
                  <input 
                    type="radio" 
                    :checked="selectedOption && selectedOption.value === option.value"
                    class="radio-input"
                    readonly
                  />
                  <label class="radio-label">
                    <div class="radio-indicator">
                      <div class="radio-dot"></div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>
          
          <div v-if="filteredOptions.length === 0" class="empty-state">
            <svg class="empty-icon" viewBox="0 0 24 24" width="48" height="48">
              <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            <div class="empty-text">
              {{ searchKeyword ? '未找到匹配项' : '暂无选项' }}
            </div>
          </div>
        </div>

        <!-- 已选择项显示（多选时） -->
        <div v-if="isMultiSelect && selectedOptions.length > 0" class="selected-section">
          <div class="selected-container glass-effect gradient-tertiary">
            <div class="selected-bg gradient-tertiary"></div>
            <div class="selected-header">
              <span class="selected-title">已选择</span>
              <span class="selected-count">{{ selectedOptions.length }}</span>
            </div>
            <div class="selected-items-grid">
              <div
                v-for="option in selectedOptions"
                :key="option.value"
                class="selected-item-tag"
                @click="removeSelection(option)"
              >
                <span class="selected-item-name">{{ option.name }}</span>
                <span class="selected-item-remove">
                  <svg viewBox="0 0 24 24" width="12" height="12">
                    <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                  </svg>
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- 多选标签框（保留原有结构以防兼容性问题） -->
        <div v-if="false" class="multi-select-wrapper">
          <div
            class="multi-select-trigger"
            :class="{ 
              open: dropdownOpen, 
              error: hasError,
              disabled: selectOptions.length === 0 
            }"
            @click="toggleDropdown"
          >
            <div v-if="selectedOptions.length > 0" class="selected-tags">
              <div
                v-for="option in selectedOptions"
                :key="option.value"
                class="selected-tag"
                @click.stop="removeSelection(option)"
              >
                {{ option.name }}
                <span class="tag-remove">×</span>
              </div>
            </div>
            <span v-else class="select-placeholder">
              {{ config.tip || '请选择' }}
            </span>
            <span class="select-arrow" :class="{ open: dropdownOpen }">▼</span>
          </div>

          <div v-if="dropdownOpen" class="select-dropdown">
            <div v-if="config.searchable" class="select-search">
              <input
                ref="searchInput"
                v-model="searchKeyword"
                type="text"
                placeholder="搜索选项..."
                class="action-input"
                @input="handleSearch"
                @click.stop
              />
            </div>
            
            <div class="select-options">
              <div
                v-for="option in filteredOptions"
                :key="option.value"
                class="select-option"
                :class="{ 
                  selected: isSelected(option),
                  disabled: option.disabled 
                }"
                @click="toggleOption(option)"
              >
                <span class="option-checkbox">
                  <span v-if="isSelected(option)" class="checkbox-checked">✓</span>
                </span>
                <span class="option-text">{{ option.name }}</span>
                <span v-if="option.description" class="option-desc">
                  {{ option.description }}
                </span>
              </div>
              
              <div v-if="filteredOptions.length === 0" class="select-empty">
                {{ searchKeyword ? '未找到匹配项' : '暂无选项' }}
              </div>
            </div>
          </div>
        </div>

        <!-- 状态指示器 -->
        <div class="status-indicators">
          <!-- 错误提示 -->
          <div v-if="hasError" class="error-indicator">
            <svg class="error-icon" viewBox="0 0 24 24" width="16" height="16">
              <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            <span class="error-text">{{ errorMessage }}</span>
          </div>

          <!-- 帮助文本 -->
          <div v-if="config.help" class="help-indicator">
            <svg class="help-icon" viewBox="0 0 24 24" width="16" height="16">
              <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/>
            </svg>
            <span class="help-text">{{ config.help }}</span>
          </div>
        </div>
      </div>

      <!-- 超时提示 -->
      <div v-if="config.timeout && timeLeft > 0" class="timeout-section">
        <div class="timeout-container glass-effect gradient-warning">
          <div class="timeout-bg gradient-warning"></div>
          <div class="timeout-content">
            <svg class="timeout-icon" viewBox="0 0 24 24" width="20" height="20">
              <path fill="currentColor" d="M15,1H9V3H15M11,14H13V8H11M19.03,7.39L20.45,5.97C20,5.46 19.55,5 19.04,4.56L17.62,6C16.07,4.74 14.12,4 12,4A9,9 0 0,0 3,13A9,9 0 0,0 12,22C17,22 21,17.97 21,13C21,10.88 20.26,8.93 19.03,7.39M12,20A7,7 0 0,1 5,13A7,7 0 0,1 12,6A7,7 0 0,1 19,13A7,7 0 0,1 12,20Z"/>
            </svg>
            <span class="timeout-text">剩余时间：{{ timeLeft }}秒</span>
            <div class="timeout-progress">
              <div 
                class="timeout-progress-bar" 
                :style="{ width: `${(timeLeft / config.timeout) * 100}%` }"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="action-dialog-footer">
        <!-- 联动输入框 -->
        <div v-if="selectedOptions.length > 0" class="linked-input-section">
          <label class="linked-input-label">已选择的内容：</label>
          <textarea
            v-model="linkedInputValue"
            class="linked-input"
            placeholder="选中的tag内容将显示在这里..."
            rows="3"
            readonly
          ></textarea>
        </div>
        
        <div class="footer-buttons">
          <button
            v-if="showCancelButton"
            type="button"
            class="btn-modern btn-secondary"
            @click="handleCancel"
          >
            <span>{{ config.cancelText || '取消' }}</span>
          </button>
          <button
            v-if="showOkButton"
            type="button"
            class="btn-modern btn-primary"
            :disabled="!isValid"
            @click="handleSubmit"
          >
            <span>{{ config.okText || '确定' }}</span>
          </button>
        </div>
      </div>
    </template>
  </ActionDialog>
</template>

<script>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import ActionDialog from './ActionDialog.vue'
import { 
  ButtonType, 
  parseSelectData 
} from './types.js'

export default {
  name: 'SelectAction',
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
    const selectedOption = ref(null)
    const selectedOptions = ref([])
    const dropdownOpen = ref(false)
    const searchKeyword = ref('')
    const errorMessage = ref('')
    const timeLeft = ref(0)
    const timer = ref(null)
    const searchInput = ref(null)

    // 计算属性
    const isMultiSelect = computed(() => {
      return props.config.type === 'multiSelect'
    })

    const selectOptions = computed(() => {
      // 优先使用 option 字段
      if (props.config.option) {
        if (Array.isArray(props.config.option)) {
          return props.config.option.map(item => {
            if (typeof item === 'string') {
              return { name: item, value: item, action: item }
            }
            return {
              name: item.name || item.title || item.label || item.value,
              value: item.value || item.action || item.name,
              action: item.action || item.value || item.name,
              description: item.description || item.desc,
              disabled: item.disabled,
              selected: item.selected
            }
          })
        }
      }
      
      // 兼容旧的 selectData 格式
      return parseSelectData(props.config.selectData || '')
    })

    const filteredOptions = computed(() => {
      if (!searchKeyword.value) return selectOptions.value
      
      const keyword = searchKeyword.value.toLowerCase()
      return selectOptions.value.filter(option => 
        option.name.toLowerCase().includes(keyword) ||
        (option.description && option.description.toLowerCase().includes(keyword))
      )
    })

    const showOkButton = computed(() => {
      const { button = ButtonType.OK_CANCEL } = props.config
      return button === ButtonType.OK_CANCEL || button === ButtonType.OK_ONLY
    })

    const showCancelButton = computed(() => {
      const { button = ButtonType.OK_CANCEL } = props.config
      return button === ButtonType.OK_CANCEL || button === ButtonType.CANCEL_ONLY
    })

    const hasError = computed(() => {
      return !!errorMessage.value
    })

    const isValid = computed(() => {
      if (hasError.value) return false
      
      if (props.config.required) {
        if (isMultiSelect.value) {
          return selectedOptions.value.length > 0
        } else {
          return selectedOption.value !== null
        }
      }
      
      return true
    })

    // 联动输入框的值
    const linkedInputValue = computed(() => {
      if (isMultiSelect.value && selectedOptions.value.length > 0) {
        return selectedOptions.value.map(option => {
          const parts = []
          parts.push(`名称: ${option.name}`)
          if (option.action && option.action !== option.name) {
            parts.push(`值: ${option.action}`)
          }
          if (option.description) {
            parts.push(`描述: ${option.description}`)
          }
          return parts.join(' | ')
        }).join('\n')
      } else if (!isMultiSelect.value && selectedOption.value) {
        const option = selectedOption.value
        const parts = []
        parts.push(`名称: ${option.name}`)
        if (option.action && option.action !== option.name) {
          parts.push(`值: ${option.action}`)
        }
        if (option.description) {
          parts.push(`描述: ${option.description}`)
        }
        return parts.join(' | ')
      }
      return ''
    })

    // 方法
    const isSelected = (option) => {
      return selectedOptions.value.some(selected => selected.value === option.value)
    }

    const toggleDropdown = () => {
      if (selectOptions.value.length === 0) return
      
      dropdownOpen.value = !dropdownOpen.value
      
      if (dropdownOpen.value && props.config.searchable) {
        nextTick(() => {
          if (searchInput.value) {
            searchInput.value.focus()
          }
        })
      }
    }

    const selectOption = (option) => {
      if (option.disabled) return
      
      selectedOption.value = option
      searchKeyword.value = ''
      validateSelection()
      
      // 自动提交
      if (props.config.autoSubmit) {
        handleSubmit()
      }
    }

    const toggleOption = (option) => {
      if (option.disabled) return
      
      if (isSelected(option)) {
        removeSelection(option)
      } else {
        selectedOptions.value.push(option)
      }
      
      validateSelection()
    }

    const removeSelection = (option) => {
      if (isMultiSelect.value) {
        const index = selectedOptions.value.findIndex(selected => selected.value === option.value)
        if (index > -1) {
          selectedOptions.value.splice(index, 1)
        }
      } else {
        selectedOption.value = null
      }
      
      validateSelection()
    }

    const handleSearch = () => {
      // 搜索逻辑在计算属性中处理
    }

    const validateSelection = () => {
      errorMessage.value = ''
      
      if (props.config.required) {
        if (isMultiSelect.value) {
          if (selectedOptions.value.length === 0) {
            errorMessage.value = '请至少选择一项'
          }
        } else {
          if (!selectedOption.value) {
            errorMessage.value = '请选择一项'
          }
        }
      }
    }

    const handleSubmit = () => {
      validateSelection()
      if (!isValid.value) return

      const result = {}
      
      if (isMultiSelect.value) {
        result.selectedValues = selectedOptions.value.map(option => option.value)
        result.selectedOptions = selectedOptions.value
      } else {
        result.selectedValue = selectedOption.value.value
        result.selectedOption = selectedOption.value
      }

      emit('submit', result)
    }

    const handleCancel = () => {
      emit('cancel')
      emit('close')
    }

    // 点击外部关闭下拉框
    const handleClickOutside = (event) => {
      const selectWrapper = event.target.closest('.select-wrapper, .multi-select-wrapper')
      if (!selectWrapper) {
        dropdownOpen.value = false
      }
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
      selectedOption.value = null
      selectedOptions.value = []
      dropdownOpen.value = false
      searchKeyword.value = ''
      errorMessage.value = ''
      
      // 设置默认选中项
      if (newConfig.defaultValue) {
        const options = parseSelectData(newConfig.selectData || '')
        
        if (isMultiSelect.value) {
          const defaultValues = Array.isArray(newConfig.defaultValue) 
            ? newConfig.defaultValue 
            : [newConfig.defaultValue]
          
          selectedOptions.value = options.filter(option => 
            defaultValues.includes(option.value)
          )
        } else {
          selectedOption.value = options.find(option => 
            option.value === newConfig.defaultValue
          ) || null
        }
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
        document.addEventListener('click', handleClickOutside)
      } else {
        stopTimeout()
        document.removeEventListener('click', handleClickOutside)
        dropdownOpen.value = false
      }
    })

    onMounted(() => {
      // 初始化默认选中项
      if (props.config.defaultValue) {
        const options = parseSelectData(props.config.selectData || '')
        
        if (isMultiSelect.value) {
          const defaultValues = Array.isArray(props.config.defaultValue) 
            ? props.config.defaultValue 
            : [props.config.defaultValue]
          
          selectedOptions.value = options.filter(option => 
            defaultValues.includes(option.value)
          )
        } else {
          selectedOption.value = options.find(option => 
            option.value === props.config.defaultValue
          ) || null
        }
      }
      
      if (props.visible) {
        document.addEventListener('click', handleClickOutside)
      }
    })

    onUnmounted(() => {
      stopTimeout()
      document.removeEventListener('click', handleClickOutside)
    })

    return {
      selectedOption,
      selectedOptions,
      dropdownOpen,
      searchKeyword,
      errorMessage,
      timeLeft,
      searchInput,
      isMultiSelect,
      selectOptions,
      filteredOptions,
      showOkButton,
      showCancelButton,
      hasError,
      isValid,
      isSelected,
      toggleDropdown,
      selectOption,
      toggleOption,
      removeSelection,
      handleSearch,
      validateSelection,
      handleSubmit,
      handleCancel
    }
  }
}
</script>

<style scoped>
/* 主容器 */
.select-action-modern {
  padding: 0;
  max-height: 600px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 消息区域 */
.message-section {
  margin-bottom: 4px;
}

.message-content {
  position: relative;
  padding: 20px 24px;
  border-radius: 16px;
  overflow: hidden;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.message-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  opacity: 0.1;
  z-index: 0;
}

.message-text {
  position: relative;
  z-index: 1;
  font-size: 15px;
  line-height: 1.6;
  color: var(--text-primary, #1a1a1a);
  font-weight: 500;
}

/* 媒体区域 */
.media-section {
  margin-bottom: 4px;
}

.media-container {
  position: relative;
  padding: 16px;
  border-radius: 16px;
  overflow: hidden;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.media-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  opacity: 0.05;
  z-index: 0;
}

.media-image {
  position: relative;
  z-index: 1;
  max-width: 100%;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

/* 选择器区域 */
.selector-section {
  padding: 0 4px;
}

.selector-label {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 16px;
}

.label-text {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary, #1a1a1a);
}

.required-mark {
  color: var(--error-color, #ef4444);
  font-weight: 700;
}

/* 搜索区域 */
.search-section {
  margin-bottom: 20px;
}

.search-container {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 16px;
  color: var(--text-secondary, #6b7280);
  z-index: 2;
}

.search-input {
  width: 100%;
  padding: 14px 16px 14px 48px;
  border: 2px solid var(--border-color, #e5e7eb);
  border-radius: 12px;
  font-size: 14px;
  background: var(--bg-secondary, #ffffff);
  color: var(--text-primary, #1a1a1a);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  outline: none;
}

.search-input:focus {
  border-color: var(--primary-color, #3b82f6);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  transform: translateY(-1px);
}

.search-input::placeholder {
  color: var(--text-tertiary, #9ca3af);
}

/* 标签区域 */
.tags-section {
  margin-bottom: 16px;
}

.tags-grid {
  display: grid;
  gap: 12px;
  margin-bottom: 16px;
}

.tag-card {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border: 2px solid var(--border-color, #e5e7eb);
  border-radius: 12px;
  background: var(--bg-secondary, #ffffff);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.tag-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(147, 51, 234, 0.05));
  opacity: 0;
  transition: opacity 0.3s ease;
}

.tag-card:hover {
  border-color: var(--primary-color, #3b82f6);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(59, 130, 246, 0.15);
}

.tag-card:hover::before {
  opacity: 1;
}

.tag-card.selected {
  border-color: var(--primary-color, #3b82f6);
  background: rgba(59, 130, 246, 0.05);
  box-shadow: 0 4px 20px rgba(59, 130, 246, 0.2);
}

.tag-card.selected::before {
  opacity: 1;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.1));
}

.tag-card.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
}

.tag-card.disabled:hover {
  border-color: var(--border-color, #e5e7eb);
  box-shadow: none;
}

.tag-content {
  flex: 1;
  text-align: left;
  position: relative;
  z-index: 1;
}

.tag-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary, #1a1a1a);
  margin-bottom: 4px;
  line-height: 1.4;
}

.tag-description {
  font-size: 13px;
  color: var(--text-secondary, #6b7280);
  line-height: 1.4;
}

.tag-indicator {
  position: relative;
  z-index: 1;
  margin-left: 12px;
}

/* 现代化复选框 */
.checkbox-modern {
  position: relative;
}

.checkbox-input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.checkbox-label {
  cursor: pointer;
}

.checkbox-indicator {
  width: 20px;
  height: 20px;
  border: 2px solid var(--border-color, #e5e7eb);
  border-radius: 6px;
  background: var(--bg-secondary, #ffffff);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.checkbox-input:checked + .checkbox-label .checkbox-indicator {
  background: var(--primary-color, #3b82f6);
  border-color: var(--primary-color, #3b82f6);
  color: white;
}

.checkbox-indicator svg {
  opacity: 0;
  transform: scale(0.5);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.checkbox-input:checked + .checkbox-label .checkbox-indicator svg {
  opacity: 1;
  transform: scale(1);
}

/* 现代化单选框 */
.radio-modern {
  position: relative;
}

.radio-input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.radio-label {
  cursor: pointer;
}

.radio-indicator {
  width: 20px;
  height: 20px;
  border: 2px solid var(--border-color, #e5e7eb);
  border-radius: 50%;
  background: var(--bg-secondary, #ffffff);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.radio-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--primary-color, #3b82f6);
  transform: scale(0);
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.radio-input:checked + .radio-label .radio-indicator {
  border-color: var(--primary-color, #3b82f6);
}

.radio-input:checked + .radio-label .radio-dot {
  transform: scale(1);
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: var(--text-secondary, #6b7280);
}

.empty-icon {
  margin-bottom: 12px;
  opacity: 0.5;
}

.empty-text {
  font-size: 14px;
  font-weight: 500;
}

/* 已选择项区域 */
.selected-section {
  margin-top: 20px;
}

.selected-container {
  position: relative;
  padding: 20px;
  border-radius: 16px;
  overflow: hidden;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.selected-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  opacity: 0.08;
  z-index: 0;
}

.selected-header {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.selected-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary, #1a1a1a);
}

.selected-count {
  background: var(--primary-color, #3b82f6);
  color: white;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.selected-items-grid {
  position: relative;
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.selected-item-tag {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--primary-color, #3b82f6);
  color: white;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.selected-item-tag:hover {
  background: var(--primary-dark, #2563eb);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.selected-item-name {
  flex: 1;
}

.selected-item-remove {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  transition: background 0.2s ease;
}

.selected-item-remove:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* 状态指示器 */
.status-indicators {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.error-indicator,
.help-indicator {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 10px;
  font-size: 13px;
  line-height: 1.5;
}

.error-indicator {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: var(--error-color, #ef4444);
}

.help-indicator {
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.2);
  color: var(--primary-color, #3b82f6);
}

.error-icon,
.help-icon {
  flex-shrink: 0;
  margin-top: 1px;
}

/* 超时区域 */
.timeout-section {
  margin-top: 20px;
}

.timeout-container {
  position: relative;
  padding: 16px 20px;
  border-radius: 12px;
  overflow: hidden;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 193, 7, 0.3);
  box-shadow: 0 4px 20px rgba(255, 193, 7, 0.15);
}

.timeout-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  opacity: 0.1;
  z-index: 0;
}

.timeout-content {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 12px;
}

.timeout-icon {
  color: var(--warning-color, #f59e0b);
  flex-shrink: 0;
}

.timeout-text {
  flex: 1;
  font-size: 14px;
  font-weight: 600;
  color: var(--warning-color, #f59e0b);
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
  background: var(--warning-color, #f59e0b);
  border-radius: 2px;
  transition: width 1s linear;
}

/* 底部按钮 */
.action-dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid var(--border-color, #e5e7eb);
  background: var(--bg-primary, #ffffff);
}

.btn-modern {
  position: relative;
  padding: 12px 24px;
  border: 2px solid transparent;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  min-width: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-modern::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
  opacity: 0;
  transition: opacity 0.3s ease;
}

.btn-modern:hover::before {
  opacity: 1;
}

.btn-secondary {
  background: var(--bg-secondary, #f8fafc);
  color: var(--text-secondary, #64748b);
  border-color: var(--border-color, #e2e8f0);
}

.btn-secondary:hover {
  background: var(--bg-tertiary, #e2e8f0);
  color: var(--text-primary, #1e293b);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.btn-primary {
  background: var(--primary-color, #3b82f6);
  color: white;
  border-color: var(--primary-color, #3b82f6);
}

.btn-primary:hover {
  background: var(--primary-dark, #2563eb);
  border-color: var(--primary-dark, #2563eb);
  transform: translateY(-1px);
  box-shadow: 0 4px 20px rgba(59, 130, 246, 0.3);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: none !important;
}

.btn-primary:disabled:hover {
  background: var(--primary-color, #3b82f6);
  border-color: var(--primary-color, #3b82f6);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .select-action-modern {
    gap: 16px;
  }

  .message-content,
  .media-container,
  .selected-container,
  .timeout-container {
    padding: 16px;
  }

  .tags-grid {
    grid-template-columns: 1fr !important;
    gap: 10px;
  }

  .tag-card {
    padding: 14px 16px;
  }

  .selected-items-grid {
    flex-direction: column;
    gap: 6px;
  }

  .action-dialog-footer {
    padding: 16px;
    flex-direction: column-reverse;
  }

  .btn-modern {
    width: 100%;
  }
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .select-action-modern {
    --bg-primary: #1f2937;
    --bg-secondary: #374151;
    --bg-tertiary: #4b5563;
    --text-primary: #f9fafb;
    --text-secondary: #d1d5db;
    --text-tertiary: #9ca3af;
    --border-color: #4b5563;
    --primary-color: #60a5fa;
    --primary-dark: #3b82f6;
    --error-color: #f87171;
    --warning-color: #fbbf24;
  }
}

/* 高对比度模式 */
@media (prefers-contrast: high) {
  .tag-card {
    border-width: 3px;
  }

  .btn-modern {
    border-width: 3px;
  }

  .checkbox-indicator,
  .radio-indicator {
    border-width: 3px;
  }
}

/* 联动输入框样式 */
.linked-input-section {
  margin-bottom: 16px;
  padding: 16px;
  background: var(--bg-secondary, #f8fafc);
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 8px;
}

.linked-input-label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary, #6b7280);
}

.linked-input {
  width: 100%;
  min-height: 80px;
  padding: 12px;
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 6px;
  background: var(--bg-primary, #ffffff);
  color: var(--text-primary, #1f2937);
  font-size: 14px;
  line-height: 1.5;
  resize: vertical;
  font-family: inherit;
}

.linked-input:focus {
  outline: none;
  border-color: var(--primary-color, #3b82f6);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.footer-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 减少动画模式 */
@media (prefers-reduced-motion: reduce) {
  * {
    transition: none !important;
    animation: none !important;
  }
}
</style>