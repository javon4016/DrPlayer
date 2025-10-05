<template>
  <ActionDialog
    :visible="visible"
    :title="config.title"
    :width="config.width || 720"
    :height="config.height"
    :canceled-on-touch-outside="!config.keep"
    :module="module"
    :extend="extend"
    :api-url="apiUrl"
    @close="handleCancel"
    @toast="$emit('toast', $event)"
    @reset="$emit('reset', $event)"
  >
    <div class="menu-action-modern">
      <!-- 消息区域 -->
      <div v-if="config.msg" class="message-section">
        <div class="message-content glass-effect">
          <div class="message-bg gradient-primary"></div>
          <div class="message-text">{{ config.msg }}</div>
        </div>
      </div>

      <!-- 图片区域 -->
      <div v-if="config.imageUrl" class="media-section">
        <div class="media-container glass-effect">
          <div class="media-bg gradient-secondary"></div>
          <img
            :src="config.imageUrl"
            :style="{ height: config.imageHeight ? `${config.imageHeight}px` : 'auto' }"
            class="media-image"
            alt="Action Image"
          />
        </div>
      </div>

      <!-- 搜索区域 -->
      <div v-if="config.searchable" class="search-section">
        <div class="search-container">
          <div class="search-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
          </div>
          <input
            v-model="searchKeyword"
            type="text"
            placeholder="搜索选项..."
            class="search-input"
            @input="handleSearch"
          />
        </div>
      </div>

      <!-- 菜单选项区域 -->
      <div class="menu-section">
        <div class="menu-layout">
          <!-- 菜单选项列表 -->
          <div class="menu-options-container">
            <div
              v-for="(option, index) in menuOptions"
              :key="option.value || index"
              class="menu-option-card"
              :class="{ 
                'selected': isSelected(option),
                'disabled': option.disabled,
                'has-description': option.description
              }"
              @click="handleOptionClick(option, index)"
            >
              <!-- 选项图标 -->
              <div v-if="option.icon" class="option-icon-container">
                <!-- 网络图片 -->
                <img v-if="option.icon.startsWith('http')" :src="option.icon" alt="" class="option-icon-image" />
                <!-- SVG 图标 -->
                <div v-else-if="option.icon.includes('<svg')" class="option-icon-svg" v-html="option.icon"></div>
                <!-- Unicode 图标 -->
                <span v-else-if="option.icon.startsWith('&#')" class="option-icon-unicode" v-html="option.icon"></span>
                <!-- Emoji 图标 -->
                <span v-else-if="isEmoji(option.icon)" class="option-icon-emoji">{{ option.icon }}</span>
                <!-- CSS 类图标 -->
                <span v-else class="option-icon-class" :class="option.icon"></span>
              </div>

              <!-- 选项内容 -->
              <div class="option-content">
                <div class="option-title">{{ option.name }}</div>
                <div v-if="option.description" class="option-description">
                  {{ option.description }}
                </div>
              </div>

              <!-- 选择指示器 -->
              <div class="option-selector">
                <!-- 复选框（多选） -->
                <div v-if="isMultiSelect" class="checkbox-modern">
                  <input
                    type="checkbox"
                    :id="`menu-checkbox-${index}`"
                    :checked="isSelected(option)"
                    @change="handleCheckboxClick(option, index, $event)"
                    class="checkbox-input"
                  />
                  <label class="checkbox-label" @click="handleCheckboxClick(option, index, $event)">
                    <div class="checkbox-indicator">
                      <svg v-if="isSelected(option)" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                        <polyline points="20,6 9,17 4,12"></polyline>
                      </svg>
                    </div>
                  </label>
                </div>

                <!-- 单选框（单选） -->
                <div v-else class="radio-modern">
                  <input
                    type="radio"
                    :id="`menu-radio-${index}`"
                    :name="'menu-radio-group'"
                    :checked="isSelected(option)"
                    @change="handleRadioClick(option, index, $event)"
                    class="radio-input"
                  />
                  <label class="radio-label" @click="handleRadioClick(option, index, $event)">
                    <div class="radio-indicator">
                      <div v-if="isSelected(option)" class="radio-dot"></div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <!-- 多选快捷操作按钮列 -->
          <div v-if="isMultiSelect" class="quick-actions-column">
            <div class="quick-actions-container">
              <div class="quick-actions-title">快捷操作</div>
              <div class="quick-actions-buttons">
                <button 
                  class="quick-action-btn"
                  @click="selectAll"
                  :disabled="selectedOptions.length === menuOptions.length"
                  title="选择所有选项"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="9,11 12,14 22,4"></polyline>
                    <path d="m21,3-6.5,6.5L11,6"></path>
                  </svg>
                  <span>全选</span>
                </button>
                <button 
                  class="quick-action-btn"
                  @click="clearAll"
                  :disabled="selectedOptions.length === 0"
                  title="清除所有选择"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="15" y1="9" x2="9" y2="15"></line>
                    <line x1="9" y1="9" x2="15" y2="15"></line>
                  </svg>
                  <span>全清</span>
                </button>
                <button 
                  class="quick-action-btn"
                  @click="invertSelection"
                  :disabled="menuOptions.length === 0"
                  title="反转当前选择"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                    <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                    <path d="m9 14 2 2 4-4"></path>
                  </svg>
                  <span>反选</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 已选择项目显示（多选） -->
      <div v-if="isMultiSelect && selectedOptions.length > 0" class="selected-section">
        <div class="selected-container glass-effect">
          <div class="selected-bg gradient-tertiary"></div>
          <div class="selected-header">
            <div class="selected-title">已选择项目</div>
            <div class="selected-count">{{ selectedOptions.length }}</div>
          </div>
          <div class="selected-items-grid">
            <div
              v-for="option in selectedOptions"
              :key="option.value"
              class="selected-item-tag"
              @click="removeSelection(option)"
            >
              <span class="selected-item-name">{{ option.name }}</span>
              <div class="selected-item-remove">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 超时提示 -->
      <div v-if="config.timeout && timeLeft > 0" class="timeout-section">
        <div class="timeout-container">
          <div class="timeout-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12,6 12,12 16,14"></polyline>
            </svg>
          </div>
          <div class="timeout-text">{{ timeLeft }}秒后自动关闭</div>
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
          <span>取消</span>
        </button>
        
        <!-- 确定按钮（多选或非自动提交时显示） -->
        <button
          v-if="showOkButton"
          class="btn-modern btn-primary"
          :disabled="!isValid"
          @click="handleSubmit"
        >
          <span>确定</span>
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
  parseSelectData,
  normalizeButtonType 
} from './types.js'
import { executeAction } from '@/api/modules/module.js'
import { showToast } from '@/stores/toast.js'
import { useRouter } from 'vue-router'

export default {
  name: 'MenuAction',
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
  emits: ['submit', 'cancel', 'close', 'action', 'toast', 'reset'],
  setup(props, { emit }) {
    const router = useRouter()
    const selectedOptions = ref([])
    const searchKeyword = ref('')
    const timeLeft = ref(0)
    const timer = ref(null)

    // 计算属性
    const isMultiSelect = computed(() => {
      // select 类型为多选，menu 类型为单选
      return props.config.type === 'select' || props.config.type === 'multiSelect'
    })

    const menuOptions = computed(() => {
      let options = []
      
      // 优先使用option字段（符合文档规范）
      if (props.config.option) {
        options = Array.isArray(props.config.option) ? props.config.option : [props.config.option]
        // 处理字符串格式：'菜单3$menu3'
        options = options.map(item => {
          if (typeof item === 'string') {
            const [name, action] = item.split('$')
            return { name: name || item, action: action || item, value: action || item }
          }
          return { 
            name: item.name || item.title || item.label,
            action: item.action || item.value,
            value: item.action || item.value,
            description: item.description
          }
        })
      } else if (props.config.selectData) {
        // 兼容旧的selectData格式
        options = parseSelectData(props.config.selectData)
      }
      
      // 搜索过滤
      if (searchKeyword.value) {
        const keyword = searchKeyword.value.toLowerCase()
        options = options.filter(option => 
          option.name.toLowerCase().includes(keyword) ||
          (option.description && option.description.toLowerCase().includes(keyword))
        )
      }
      
      return options
    })

    const showOkButton = computed(() => {
      const button = normalizeButtonType(props.config.button)
      const needOkButton = button === ButtonType.OK_CANCEL || button === ButtonType.OK_ONLY
      
      // 单选且自动提交时不显示确定按钮
      if (!isMultiSelect.value && props.config.autoSubmit) {
        return false
      }
      
      return needOkButton
    })

    const showCancelButton = computed(() => {
      const button = normalizeButtonType(props.config.button)
      return button === ButtonType.OK_CANCEL || button === ButtonType.CANCEL_ONLY
    })

    const isValid = computed(() => {
      if (isMultiSelect.value) {
        return selectedOptions.value.length > 0
      } else {
        return selectedOptions.value.length === 1
      }
    })

    // 方法
    const isSelected = (option) => {
      return selectedOptions.value.some(selected => selected.value === option.value)
    }

    const handleOptionClick = (option, index) => {
      if (option.disabled) return

      if (isMultiSelect.value) {
        // 多选模式
        if (isSelected(option)) {
          removeSelection(option)
        } else {
          selectedOptions.value.push(option)
        }
      } else {
        // 单选模式
        selectedOptions.value = [option]
        
        // 自动提交
        if (props.config.autoSubmit) {
          handleSubmit()
        }
      }
    }

    const removeSelection = (option) => {
      const index = selectedOptions.value.findIndex(selected => selected.value === option.value)
      if (index > -1) {
        selectedOptions.value.splice(index, 1)
      }
    }

    const selectAll = () => {
      selectedOptions.value = [...menuOptions.value]
    }

    const clearAll = () => {
      selectedOptions.value = []
    }

    const invertSelection = () => {
      const currentSelected = new Set(selectedOptions.value.map(option => option.value))
      selectedOptions.value = menuOptions.value.filter(option => !currentSelected.has(option.value))
    }

    const handleSearch = () => {
      // 搜索逻辑在计算属性中处理
    }

    // 复选框点击处理
    const handleCheckboxClick = (option, index, event) => {
      event.stopPropagation()
      if (option.disabled) return
      
      if (isSelected(option)) {
        removeSelection(option)
      } else {
        selectedOptions.value.push(option)
      }
    }

    // 单选框点击处理
    const handleRadioClick = (option, index, event) => {
      event.stopPropagation()
      if (option.disabled) return
      
      selectedOptions.value = [option]
      
      // 自动提交
      if (props.config.autoSubmit) {
        handleSubmit()
      }
    }

    // 检测是否为emoji图标
    const isEmoji = (str) => {
      const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u
      return emojiRegex.test(str)
    }

    // T4接口调用方法
    const callT4Action = async (action, value) => {
      if (!props.module && !props.apiUrl) {
        console.warn('未提供module或apiUrl，无法调用T4接口')
        return null
      }

      const actionData = {
        action,
        value: value
      }

      // 添加扩展参数
      if (props.extend && props.extend.ext) {
        actionData.extend = props.extend.ext
      }

      // 添加API URL
      if (props.apiUrl) {
        actionData.apiUrl = props.apiUrl
      }

      console.log('MenuAction调用T4接口:', {
        module: props.module,
        actionData,
        apiUrl: props.apiUrl
      })

      let result = null
      if (props.module) {
        console.log('调用模块:', props.module)
        result = await executeAction(props.module, actionData)
      } else if (props.apiUrl) {
        // 直接调用API
        console.log('直接调用API:', props.apiUrl)
        const axios = (await import('axios')).default
        const response = await axios.post(props.apiUrl, actionData, {
          timeout: 30000,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        })
        result = response.data
      }

      console.log('T4接口返回结果:', result)
      return result
    }

    const handleSubmit = async () => {
      if (!isValid.value) return

      const result = {}
      let value = ''
      
      if (isMultiSelect.value) {
        result.selectedValues = selectedOptions.value.map(option => option.value)
        result.selectedOptions = selectedOptions.value
        
        // 多选模式下，生成包含所有选项状态的JSON列表
        const allOptionsWithStatus = menuOptions.value.map(option => ({
          name: option.name,
          action: option.value,
          selected: selectedOptions.value.some(selected => selected.value === option.value)
        }))
        
        // 将JSON列表转换为字符串传递给T4接口
        value = JSON.stringify(allOptionsWithStatus)
        console.log('多选菜单T4接口数据格式:', allOptionsWithStatus)
      } else {
        const selected = selectedOptions.value[0]
        result.selectedValue = selected.value
        value = selected.value
        result.selectedOption = selected
      }

      // 调用T4接口
      if (props.config.actionId) {
        try {
          console.log('菜单选择T4接口调用:', props.config.actionId, value)
          const response = await callT4Action(props.config.actionId, value)
          
          // 检查响应是否为普通文本
          if (typeof response === 'string') {
            showToast(response, 'success')
            emit('close')
            return
          }
          
          // 处理JSON格式的专项动作响应
          if (response && response.action) {
            const actionData = response.action
            const toastData = response.toast
            
            if (toastData) {
              showToast(toastData, 'success')
            }
            
            switch (actionData.actionId) {
              case '__keep__':
                if (actionData.msg) {
                  // 更新消息内容
                  console.log('保持弹窗打开，更新消息:', actionData.msg)
                }
                if (actionData.reset) {
                  // 重置选择
                  selectedOptions.value = []
                  searchKeyword.value = ''
                }
                // 不关闭弹窗
                return
                
              case '__close__':
                if (actionData.msg) {
                  showToast(actionData.msg, 'info')
                }
                emit('close')
                return
                
              case '__refresh_list__':
                // 刷新列表
                handleRefreshListAction(actionData)
                emit('close')
                return
                
              default:
                console.warn('未知的专项动作:', actionData.actionId)
                break
            }
          }
        } catch (error) {
          console.error('菜单选择T4接口调用失败:', error)
          showToast('操作失败，请重试', 'error')
          return
        }
      }

      emit('submit', result)
    }

    // 处理刷新列表动作
    const handleRefreshListAction = async (actionData) => {
      try {
        console.log('执行刷新列表:', actionData)
        
        const currentRoute = router.currentRoute.value
        const routeName = currentRoute.name
        
        switch (routeName) {
          case 'Video':
            window.dispatchEvent(new CustomEvent('refreshVideoList', {
              detail: actionData
            }))
            showToast('视频列表已刷新', 'success')
            break
            
          case 'Live':
            window.dispatchEvent(new CustomEvent('refreshLiveList', {
              detail: actionData
            }))
            showToast('直播列表已刷新', 'success')
            break
            
          default:
            showToast('列表已刷新', 'success')
            break
        }
        
      } catch (error) {
        console.error('刷新列表失败:', error)
        showToast('刷新列表失败', 'error')
      }
    }

    const handleCancel = () => {
      emit('cancel')
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
      selectedOptions.value = []
      searchKeyword.value = ''
      
      // 设置默认选中项
      if (newConfig.defaultValue) {
        const options = parseSelectData(newConfig.selectData || '')
        const defaultValues = Array.isArray(newConfig.defaultValue) 
          ? newConfig.defaultValue 
          : [newConfig.defaultValue]
        
        selectedOptions.value = options.filter(option => 
          defaultValues.includes(option.value)
        )
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
      }
    })

    onMounted(() => {
      // 初始化默认选中项
      if (props.config.defaultValue) {
        const options = parseSelectData(props.config.selectData || '')
        const defaultValues = Array.isArray(props.config.defaultValue) 
          ? props.config.defaultValue 
          : [props.config.defaultValue]
        
        selectedOptions.value = options.filter(option => 
          defaultValues.includes(option.value)
        )
      }
    })

    onUnmounted(() => {
      stopTimeout()
    })

    return {
      selectedOptions,
      searchKeyword,
      timeLeft,
      isMultiSelect,
      menuOptions,
      showOkButton,
      showCancelButton,
      isValid,
      isSelected,
      isEmoji,
      handleOptionClick,
      handleCheckboxClick,
      handleRadioClick,
      removeSelection,
      selectAll,
      clearAll,
      invertSelection,
      handleSearch,
      handleSubmit,
      handleCancel
    }
  }
}
</script>

<style scoped>
/* 主容器 */
.menu-action-modern {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 0;
}

/* 消息区域 */
.message-section {
  margin-bottom: 0.5rem;
}

.message-content {
  position: relative;
  padding: 1rem 1.25rem;
  border-radius: 0.75rem;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
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
  color: var(--action-color-text);
  font-size: 0.875rem;
  line-height: 1.5;
  font-weight: 500;
}

/* 媒体区域 */
.media-section {
  margin-bottom: 0.5rem;
}

.media-container {
  position: relative;
  padding: 0.75rem;
  border-radius: 0.75rem;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: center;
  align-items: center;
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
  border-radius: 0.5rem;
  box-shadow: var(--action-shadow-medium);
}

/* 搜索区域 */
.search-section {
  margin-bottom: 0.5rem;
}

.search-container {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 0.75rem;
  z-index: 2;
  color: var(--action-color-text-secondary);
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 0.75rem 0.75rem 0.75rem 2.5rem;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: var(--ds-radius-lg);
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  color: rgba(0, 0, 0, 0.85);
  font-size: 0.875rem;
  font-weight: 500;
  transition: all var(--ds-duration-fast) ease;
  outline: none;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.search-input:focus {
  border-color: rgba(59, 130, 246, 0.5);
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 
    0 0 0 4px rgba(59, 130, 246, 0.1),
    0 8px 25px rgba(59, 130, 246, 0.15);
  transform: translateY(-1px);
}

.search-input::placeholder {
  color: rgba(0, 0, 0, 0.4);
  font-weight: 400;
}

/* 菜单选项区域 */
.menu-section {
  flex: 1;
}

/* 菜单布局容器 */
.menu-layout {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.menu-options-container {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.625rem;
  max-height: 400px;
  overflow-y: auto;
  padding-right: 0.25rem;
}

/* 快捷操作按钮列 */
.quick-actions-column {
  flex-shrink: 0;
  width: 120px;
  position: sticky;
  top: 0;
}

.quick-actions-container {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: var(--ds-radius-lg);
  padding: 0.75rem;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.quick-actions-title {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--action-color-text-secondary);
  margin-bottom: 0.5rem;
  text-align: center;
}

.quick-actions-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.quick-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  padding: 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: var(--ds-radius-md);
  background: rgba(255, 255, 255, 0.6);
  color: var(--action-color-text);
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--ds-duration-fast) ease;
  outline: none;
}

.quick-action-btn:hover:not(:disabled) {
  border-color: rgba(59, 130, 246, 0.5);
  background: rgba(59, 130, 246, 0.1);
  color: rgb(59, 130, 246);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
}

.quick-action-btn:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
}

.quick-action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: none !important;
}

.quick-action-btn svg {
  flex-shrink: 0;
}

.quick-action-btn span {
  white-space: nowrap;
}

.menu-options-container::-webkit-scrollbar {
  width: 6px;
}

.menu-options-container::-webkit-scrollbar-track {
  background: var(--action-color-bg-secondary);
  border-radius: 3px;
}

.menu-options-container::-webkit-scrollbar-thumb {
  background: var(--action-color-border);
  border-radius: 3px;
}

.menu-options-container::-webkit-scrollbar-thumb:hover {
  background: var(--action-color-text-secondary);
}

/* 菜单选项卡片 */
.menu-option-card {
  display: flex;
  align-items: center;
  padding: 0.75rem;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: var(--ds-radius-lg);
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  cursor: pointer;
  transition: all var(--ds-duration-fast) ease;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.menu-option-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, 
    rgba(59, 130, 246, 0.1) 0%, 
    rgba(147, 51, 234, 0.1) 100%);
  opacity: 0;
  transition: opacity var(--ds-duration-fast) ease;
  z-index: 0;
}

.menu-option-card:hover::before {
  opacity: 1;
}

.menu-option-card:hover {
  border-color: rgba(59, 130, 246, 0.5);
  background: rgba(255, 255, 255, 0.95);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(59, 130, 246, 0.15);
}

.menu-option-card.selected {
  border-color: rgb(59, 130, 246);
  background: rgba(59, 130, 246, 0.1);
  box-shadow: 0 8px 24px rgba(59, 130, 246, 0.2);
}

.menu-option-card.selected::before {
  opacity: 1;
}

.menu-option-card.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
}

.menu-option-card.disabled:hover {
  border-color: var(--action-color-border);
  box-shadow: none;
}

.menu-option-card.has-description {
  align-items: flex-start;
  padding: 1.25rem 1rem;
}

/* 选项图标 */
.option-icon-container {
  position: relative;
  z-index: 1;
  margin-right: 0.75rem;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-radius: 0.5rem;
  background: rgba(var(--action-color-primary-rgb), 0.1);
}

.option-icon-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 0.25rem;
}

.option-icon-svg {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--action-color-primary);
}

.option-icon-svg svg {
  width: 1.25rem;
  height: 1.25rem;
  fill: currentColor;
}

.option-icon-unicode {
  font-size: 1.125rem;
  line-height: 1;
  color: var(--action-color-primary);
}

.option-icon-emoji {
  font-size: 1.125rem;
  line-height: 1;
}

.option-icon-class {
  font-size: 1rem;
  color: var(--action-color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 选项内容 */
.option-content {
  position: relative;
  z-index: 1;
  flex: 1;
  min-width: 0;
}

.option-title {
  font-weight: 600;
  color: var(--action-color-text);
  margin-bottom: 0.0625rem;
  font-size: 0.95rem;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.option-description {
  font-size: 0.8rem;
  color: var(--action-color-text-secondary);
  line-height: 1.2;
  margin-top: 0.125rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 选择指示器 */
.option-selector {
  position: relative;
  z-index: 1;
  margin-left: 0.75rem;
  flex-shrink: 0;
}

/* 现代化复选框 */
.checkbox-modern {
  position: relative;
}

.checkbox-input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.checkbox-label {
  display: block;
  cursor: pointer;
}

.checkbox-indicator {
  width: 1.25rem;
  height: 1.25rem;
  border: 2px solid var(--action-color-border);
  border-radius: 0.375rem;
  background: var(--action-color-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--action-transition-duration);
  color: white;
}

.checkbox-input:checked + .checkbox-label .checkbox-indicator {
  background: var(--action-color-primary);
  border-color: var(--action-color-primary);
  transform: scale(1.05);
}

.checkbox-input:focus + .checkbox-label .checkbox-indicator {
  box-shadow: 0 0 0 3px rgba(var(--action-color-primary-rgb), 0.2);
}

/* 现代化单选框 */
.radio-modern {
  position: relative;
}

.radio-input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.radio-label {
  display: block;
  cursor: pointer;
}

.radio-indicator {
  width: 1.25rem;
  height: 1.25rem;
  border: 2px solid var(--action-color-border);
  border-radius: 50%;
  background: var(--action-color-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--action-transition-duration);
}

.radio-dot {
  width: 0.5rem;
  height: 0.5rem;
  background: white;
  border-radius: 50%;
  transform: scale(0);
  transition: transform var(--action-transition-duration);
}

.radio-input:checked + .radio-label .radio-indicator {
  background: var(--action-color-primary);
  border-color: var(--action-color-primary);
  transform: scale(1.05);
}

.radio-input:checked + .radio-label .radio-dot {
  transform: scale(1);
}

.radio-input:focus + .radio-label .radio-indicator {
  box-shadow: 0 0 0 3px rgba(var(--action-color-primary-rgb), 0.2);
}

/* 多选控制按钮 */
.multi-select-controls {
  margin-top: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: var(--ds-radius-lg);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.control-buttons {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  flex-wrap: wrap;
}

.control-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.9) 0%, rgba(37, 99, 235, 0.9) 100%);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: var(--ds-radius-md);
  color: white;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--ds-duration-fast) ease;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
  position: relative;
  overflow: hidden;
}

.control-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left var(--ds-duration-normal) ease;
}

.control-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, rgba(59, 130, 246, 1) 0%, rgba(37, 99, 235, 1) 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.4);
  border-color: rgba(255, 255, 255, 0.5);
}

.control-btn:hover:not(:disabled)::before {
  left: 100%;
}

.control-btn:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
}

.control-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  background: rgba(156, 163, 175, 0.5);
  border-color: rgba(156, 163, 175, 0.3);
  box-shadow: none;
}

.control-btn svg {
  flex-shrink: 0;
}

/* 已选择项目区域 */
.selected-section {
  margin-top: 1rem;
}

.selected-container {
  position: relative;
  padding: 1rem;
  border-radius: 0.75rem;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
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
  margin-bottom: 0.75rem;
}

.selected-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--action-color-text);
}

.selected-count {
  background: var(--action-color-primary);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 600;
  min-width: 1.5rem;
  text-align: center;
}

.selected-items-grid {
  position: relative;
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.selected-item-tag {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: rgba(var(--action-color-primary-rgb), 0.1);
  border: 1px solid rgba(var(--action-color-primary-rgb), 0.2);
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all var(--action-transition-duration);
  font-size: 0.75rem;
}

.selected-item-tag:hover {
  background: rgba(var(--action-color-danger-rgb), 0.1);
  border-color: rgba(var(--action-color-danger-rgb), 0.3);
  transform: translateY(-1px);
}

.selected-item-name {
  color: var(--action-color-text);
  font-weight: 500;
}

.selected-item-remove {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--action-color-text-secondary);
  transition: color var(--action-transition-duration);
}

.selected-item-tag:hover .selected-item-remove {
  color: var(--action-color-danger);
}

/* 超时区域 */
.timeout-section {
  margin-top: 0.5rem;
}

.timeout-container {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: rgba(var(--action-color-warning-rgb), 0.1);
  border: 1px solid rgba(var(--action-color-warning-rgb), 0.2);
  border-radius: 0.5rem;
  font-size: 0.875rem;
}

.timeout-icon {
  color: var(--action-color-warning);
  flex-shrink: 0;
}

.timeout-text {
  color: var(--action-color-text);
  font-weight: 500;
  flex: 1;
}

.timeout-progress {
  flex: 1;
  height: 0.25rem;
  background: rgba(var(--action-color-warning-rgb), 0.2);
  border-radius: 0.125rem;
  overflow: hidden;
}

.timeout-progress-bar {
  height: 100%;
  background: var(--action-color-warning);
  transition: width 1s linear;
  border-radius: 0.125rem;
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
  transition: left 0.5s ease;
}

.btn-modern:hover::before {
  left: 100%;
}

.btn-modern span {
  position: relative;
  z-index: 1;
}

.btn-secondary {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
  border-color: rgba(255, 255, 255, 0.2);
  color: rgba(0, 0, 0, 0.8);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.btn-secondary:hover {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.08) 100%);
  border-color: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.btn-secondary:active {
  transform: translateY(0);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.btn-primary {
  background: linear-gradient(135deg, rgb(59, 130, 246) 0%, rgb(37, 99, 235) 100%);
  border-color: rgb(59, 130, 246);
  color: white;
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.3);
}

.btn-primary:hover {
  background: linear-gradient(135deg, rgb(37, 99, 235) 0%, rgb(29, 78, 216) 100%);
  border-color: rgb(37, 99, 235);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(59, 130, 246, 0.4);
}

.btn-primary:active {
  transform: translateY(0);
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.3);
}

.btn-modern.disabled,
.btn-primary:disabled {
  background: linear-gradient(135deg, rgba(156, 163, 175, 0.5) 0%, rgba(107, 114, 128, 0.5) 100%);
  border-color: rgba(156, 163, 175, 0.3);
  color: rgba(156, 163, 175, 0.8);
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.btn-modern.disabled::before,
.btn-primary:disabled::before {
  display: none;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .menu-action-modern {
    gap: 1rem;
  }
  
  .menu-option-card {
    padding: 0.875rem;
  }
  
  .option-icon-container {
    width: 1.75rem;
    height: 1.75rem;
    margin-right: 0.625rem;
  }
  
  .selected-items-grid {
    flex-direction: column;
  }
  
  .selected-item-tag {
    justify-content: space-between;
  }
  
  .modern-footer {
    flex-direction: column-reverse;
  }
  
  .btn-modern {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .menu-action-modern {
    gap: 0.75rem;
  }
  
  .message-content,
  .media-container,
  .selected-container {
    padding: 0.75rem;
  }
  
  .menu-option-card {
    padding: 0.75rem;
  }
  
  .option-icon-container {
    width: 1.5rem;
    height: 1.5rem;
    margin-right: 0.5rem;
  }
  
  .option-title {
    font-size: 0.8125rem;
  }
  
  .option-description {
    font-size: 0.6875rem;
  }
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  .menu-option-card {
    background: rgba(255, 255, 255, 0.02);
  }
  
  .menu-option-card:hover {
    background: rgba(255, 255, 255, 0.05);
  }
  
  .menu-option-card.selected {
    background: rgba(var(--action-color-primary-rgb), 0.1);
  }
}

/* 高对比度模式 */
@media (prefers-contrast: high) {
  .menu-option-card {
    border-width: 3px;
  }
  
  .checkbox-indicator,
  .radio-indicator {
    border-width: 3px;
  }
  
  .btn-modern {
    border-width: 3px;
  }
}

/* 减少动画模式 */
@media (prefers-reduced-motion: reduce) {
  .menu-option-card,
  .checkbox-indicator,
  .radio-indicator,
  .btn-modern,
  .selected-item-tag,
  .timeout-progress-bar {
    transition: none;
  }
  
  .menu-option-card:hover,
  .btn-modern:hover,
  .selected-item-tag:hover {
    transform: none;
  }
}
</style>