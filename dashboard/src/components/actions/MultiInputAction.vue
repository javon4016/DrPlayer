<template>
  <ActionDialog
    :visible="visible"
    :title="config.title"
    :width="config.width || 600"
    :height="config.height"
    :canceled-on-touch-outside="!config.keep"
    :module="module"
    :extend="extend"
    :api-url="apiUrl"
    @close="handleCancel"
    @toast="(message, type) => emit('toast', message, type)"
    @reset="() => emit('reset')"
  >
    <div class="multi-input-action-modern">
      <!-- 消息区域 -->
      <div v-if="config.msg" class="message-section">
        <div class="message-content">
          <div class="message-icon">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
            </svg>
          </div>
          <p class="message-text">{{ currentMessage }}</p>
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
        <div class="inputs-container">
          <div
            v-for="(input, index) in inputItems"
            :key="input.id || index"
            class="input-item"
          >
            <!-- 输入项标签 -->
            <div v-if="input.name" class="input-label-container">
              <label class="input-label">
                {{ input.name }}
                <span v-if="input.required" class="required-indicator">*</span>
              </label>
              <div v-if="input.help" class="input-help">
                {{ input.help }}
              </div>
            </div>

            <!-- 输入区域 -->
            <div class="input-group">
              <!-- 快速选择 - 在输入框上方 -->
              <div v-if="input.selectData" class="quick-select">
                <div class="quick-select-options">
                  <button
                    v-for="option in parseSelectData(input.selectData)"
                    :key="option.value"
                    class="quick-select-tag"
                    @click="selectQuickOption(index, option)"
                  >
                    {{ option.name }}
                  </button>
                </div>
              </div>

              <!-- 单行输入 -->
              <div v-if="!input.multiLine || input.multiLine <= 1" class="input-container">
                <div class="input-wrapper-modern">
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
                      class="expand-btn"
                      @click="openTextEditor(index)"
                      title="打开大文本编辑器"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14zM5 7h14v2H5zm0 4h14v2H5zm0 4h10v2H5z"/>
                      </svg>
                    </button>
                  </div>
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
                    class="expand-btn textarea-expand"
                    @click="openTextEditor(index)"
                    title="打开大文本编辑器"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14zM5 7h14v2H5zm0 4h14v2H5zm0 4h10v2H5z"/>
                    </svg>
                  </button>
                </div>
              </div>

              <!-- 状态指示器 -->
              <div class="input-status">
                <!-- 错误提示 -->
                <div v-if="inputErrors[index]" class="error-message">
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293-1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
                  </svg>
                  <span>{{ inputErrors[index] }}</span>
                </div>

                <!-- 字符计数 -->
                <div v-if="inputValues[index] && inputValues[index].length > 0" class="char-count">
                  {{ inputValues[index].length }} 字符
                </div>
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
          <span>取消</span>
        </button>
        
        <!-- 重置按钮 - 仅在 button=3 时显示 -->
        <button
          v-if="showResetButton"
          class="btn-modern btn-secondary"
          @click="handleReset"
        >
          <span>重置</span>
        </button>
        
        <!-- 确定按钮 -->
        <button
          v-if="showOkButton"
          class="btn-modern btn-primary"
          :class="{ disabled: !isValid }"
          :disabled="!isValid"
          @click="handleSubmit"
        >
          <span>确定</span>
          <svg v-if="isValid" width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
          </svg>
        </button>
      </div>
    </template>
  </ActionDialog>

  <!-- 大文本编辑器弹窗 -->
  <ActionDialog
    :visible="showTextEditor"
    title="大文本编辑器"
    :width="800"
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
          取消
        </button>
        <button class="btn-modern btn-primary" @click="saveEditorText">
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
  debounce,
  normalizeButtonType 
} from './types.js'
import { executeAction } from '@/api/modules/module.js'
import { showToast } from '@/stores/toast.js'
import siteService from '@/api/services/site'
import { useRouter } from 'vue-router'

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
    },
    // T4接口调用相关属性
    module: {
      type: String,
      default: ''
    },
    extend: {
      type: Object,
      default: () => ({})
    },
    apiUrl: {
      type: String,
      default: ''
    }
  },
  emits: ['submit', 'cancel', 'close', 'action', 'toast', 'reset', 'special-action'],
  setup(props, { emit }) {
    const router = useRouter()
    const inputValues = ref([])
    const inputErrors = ref([])
    const inputItems = ref([])
    const timeLeft = ref(0)
    const timer = ref(null)
    const currentMessage = ref(props.config.msg || '')

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
      const button = normalizeButtonType(props.config.button)
      return button === ButtonType.OK_CANCEL || button === ButtonType.OK_ONLY || button === ButtonType.CUSTOM
    })

    const showCancelButton = computed(() => {
      const button = normalizeButtonType(props.config.button)
      return button === ButtonType.OK_CANCEL || button === ButtonType.CANCEL_ONLY || button === ButtonType.CUSTOM
    })

    const showResetButton = computed(() => {
      const button = normalizeButtonType(props.config.button)
      return button === ButtonType.CUSTOM
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

    // T4接口调用
    const callT4Action = async (actionId, inputData) => {
      if (!props.module && !props.apiUrl) {
        console.warn('未提供module或apiUrl，无法调用T4接口')
        return null
      }
      try {
        const actionData = {
          action:actionId,
          value: JSON.stringify(inputData)
        }
        // 添加扩展参数
        if (props.extend && props.extend.ext) {
          actionData.extend = props.extend.ext
        }

        // 添加API URL
        if (props.apiUrl) {
          actionData.apiUrl = props.apiUrl
        }
        console.log('InputAction调用T4接口:', {
          module: props.module,
          actionData,
          apiUrl: props.apiUrl
        })

        const response = await executeAction(props.module, actionData)
        return response
      } catch (error) {
        console.error('T4接口调用失败:', error)
        throw error
      }
    }

    // 专项动作处理函数
    const handleDetailAction = async (actionData) => {
      try {
        const { skey, ids } = actionData
        
        if (!skey || !ids) {
          showToast('详情页跳转参数不完整', 'error')
          return
        }
        
        const site = siteService.getSiteByKey(skey)
        if (!site) {
          showToast(`未找到站源: ${skey}`, 'error')
          return
        }
        
        router.push({
          name: 'VideoDetail',
          params: { id: ids },
          query: {
            tempSiteName: site.name,
            tempSiteApi: site.api,
            tempSiteKey: site.key,
            tempSiteExt: site.ext,
            fromSpecialAction: 'true',
            actionType: '__detail__',
            sourcePic: ''
          }
        })
        
        showToast(`正在加载 ${site.name} 的详情...`, 'info')
        
      } catch (error) {
        console.error('详情页跳转失败:', error)
        showToast('详情页跳转失败', 'error')
      }
    }
    
    const handleCopyAction = async (actionData, toastData) => {
      try {
        const { content } = actionData
        
        if (!content) {
          showToast('没有可复制的内容', 'error')
          return
        }
        
        await navigator.clipboard.writeText(content)
        if (!toastData) {
          showToast('已复制到剪贴板', 'success')
        }
        
      } catch (error) {
        console.error('复制失败:', error)
        showToast('复制失败', 'error')
      }
    }
    
    const handleSelfSearchAction = async (actionData) => {
      try {
        const { skey, name, tid, flag, folder } = actionData
        
        const searchParams = {
          name: name || '搜索',
          tid: tid || '',
          flag: flag || '',
          folder: folder || ''
        }
        
        if (skey) {
          const site = siteService.getSiteByKey(skey)
          if (site) {
            siteService.setCurrentSite(skey)
            showToast(`已切换到 ${site.name}`, 'info')
          }
        }
        
        console.log('执行源内搜索:', searchParams)
        showToast('正在执行源内搜索...', 'info')
        
        // 触发special-action事件，传递给父组件处理
        emit('special-action', '__self_search__', {
          tid: searchParams.tid,
          name: searchParams.name,
          type_id: searchParams.tid,
          type_name: searchParams.name,
          actionData: searchParams
        })
        
      } catch (error) {
        console.error('源内搜索失败:', error)
        showToast('源内搜索失败', 'error')
      }
    }
    
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
    
    const handleKtvPlayerAction = async (actionData) => {
      try {
        console.log('执行KTV播放:', actionData)
        showToast('正在启动KTV播放...', 'info')
        
      } catch (error) {
        console.error('KTV播放失败:', error)
        showToast('KTV播放失败', 'error')
      }
    }

    // 事件处理
    const handleInputChange = (index, event) => {
      const value = event.target.value
      inputValues.value[index] = value
      debouncedValidate(index)
    }

    const handleSubmit = async () => {
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

      // 调用T4接口
      if (props.config.actionId) {
        try {
          console.log('多输入框T4接口调用:', props.config.actionId, result)
          const response = await callT4Action(props.config.actionId, result)
          
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
                  currentMessage.value = actionData.msg
                }
                if (actionData.reset) {
                  inputValues.value = inputValues.value.map(() => '')
                  inputErrors.value = inputErrors.value.map(() => '')
                  emit('reset')
                }
                return
                
              case '__detail__':
                await handleDetailAction(actionData)
                emit('close')
                return
                
              case '__copy__':
                await handleCopyAction(actionData, toastData)
                emit('close')
                return
                
              case '__self_search__':
                await handleSelfSearchAction(actionData)
                emit('close')
                return
                
              case '__refresh_list__':
                await handleRefreshListAction(actionData)
                emit('close')
                return
                
              case '__ktvplayer__':
                await handleKtvPlayerAction(actionData)
                emit('close')
                return
                
              default:
                if (actionData.type) {
                  console.log('检测到普通动作，触发新的ActionRenderer:', actionData)
                  emit('action', actionData)
                  return
                } else {
                  console.warn('未知的专项动作:', actionData.actionId)
                }
                break
            }
          }
          
        } catch (error) {
          console.error('多输入框T4接口调用失败:', error)
          showToast('操作失败，请重试', 'error')
          return
        }
      }

      emit('submit', result)
    }

    const handleCancel = () => {
      emit('cancel')
      emit('close')
    }

    const handleReset = () => {
      inputValues.value = inputValues.value.map(() => '')
      inputErrors.value = inputErrors.value.map(() => '')
      emit('reset')
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
      currentMessage.value = newConfig.msg || ''
      
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
      currentMessage,
      isEnhanced,
      showOkButton,
      showCancelButton,
      showResetButton,
      isValid,
      getInputType,
      validateInput,
      handleInputChange,
      handleSubmit,
      handleCancel,
      handleReset,
      selectQuickOption,
      addInputItem,
      removeInputItem,
      clearAll,
      fillExample,
      parseSelectData,
      // 大文本编辑器
      showTextEditor,
      textEditorRef,
      editorText,
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
  gap: 1.5rem;
}

/* 消息区域 */
.message-section {
  margin-bottom: 0.5rem;
}

.message-content {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: var(--ds-radius-lg);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.message-icon {
  flex-shrink: 0;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(59, 130, 246, 0.1);
  border-radius: var(--ds-radius-md);
  color: rgb(59, 130, 246);
}

.message-text {
  margin: 0;
  color: rgba(0, 0, 0, 0.8);
  font-size: 0.875rem;
  line-height: 1.5;
  font-weight: 500;
}

/* 媒体区域 */
.media-section {
  margin-bottom: 0.5rem;
}

.image-container {
  text-align: center;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: var(--ds-radius-lg);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.action-image-modern {
  max-width: 100%;
  height: auto;
  border-radius: var(--ds-radius-md);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all var(--ds-duration-fast) ease;
}

/* 输入区域 */
.inputs-section {
  flex: 1;
}

.inputs-container {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.input-item {
  position: relative;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: var(--ds-radius-lg);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  transition: all var(--ds-duration-fast) ease;
}

.input-item:hover {
  background: rgba(255, 255, 255, 0.7);
  border-color: rgba(59, 130, 246, 0.3);
}

.input-label-container {
  margin-bottom: 0.5rem;
}

.input-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.8);
  margin-bottom: 0.25rem;
}

.required-indicator {
  color: rgb(239, 68, 68);
  margin-left: 0.25rem;
}

.input-help {
  font-size: 0.75rem;
  color: rgba(0, 0, 0, 0.6);
  line-height: 1.4;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

/* 快速选择 */
.quick-select {
  margin-bottom: 0.75rem;
}

.quick-select-options {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.quick-select-tag {
  padding: 0.375rem 0.75rem;
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: var(--ds-radius-full);
  color: rgb(59, 130, 246);
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--ds-duration-fast) ease;
  white-space: nowrap;
}

.quick-select-tag:hover {
  background: rgb(59, 130, 246);
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
}

/* 输入框样式 */
.input-container {
  position: relative;
}

.input-wrapper-modern {
  position: relative;
  display: flex;
  align-items: center;
}

.input-field-modern {
  width: 100%;
  padding: 0.75rem;
  padding-right: 3rem;
  border: 2px solid rgba(0, 0, 0, 0.1);
  border-radius: var(--ds-radius-md);
  background: rgba(255, 255, 255, 0.8);
  color: rgba(0, 0, 0, 0.9);
  font-size: 0.875rem;
  transition: all var(--ds-duration-fast) ease;
  outline: none;
}

.input-field-modern:focus {
  border-color: rgb(59, 130, 246);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  background: white;
}

.input-field-modern.error {
  border-color: rgb(239, 68, 68);
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.input-field-modern.success {
  border-color: rgb(34, 197, 94);
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
}

.input-actions {
  position: absolute;
  right: 0.5rem;
  display: flex;
  gap: 0.25rem;
}

.expand-btn {
  width: 2rem;
  height: 2rem;
  border: none;
  background: rgba(59, 130, 246, 0.1);
  color: rgb(59, 130, 246);
  border-radius: var(--ds-radius-sm);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--ds-duration-fast) ease;
  opacity: 0.8;
}

.expand-btn:hover {
  opacity: 1;
  background: rgb(59, 130, 246);
  color: white;
  transform: scale(1.1);
}

/* 多行输入 */
.textarea-container {
  position: relative;
}

.textarea-wrapper-modern {
  position: relative;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: var(--ds-radius-lg);
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  transition: all var(--ds-duration-fast) ease;
  overflow: hidden;
}

.textarea-wrapper-modern:focus-within {
  border-color: rgba(59, 130, 246, 0.5);
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 
    0 0 0 4px rgba(59, 130, 246, 0.1),
    0 8px 25px rgba(59, 130, 246, 0.15);
  transform: translateY(-1px);
}

.textarea-field-modern {
  width: 100%;
  border: none;
  outline: none;
  background: transparent;
  padding: 1rem 1.25rem;
  padding-bottom: 2.5rem;
  font-size: 0.875rem;
  line-height: 1.5;
  color: rgba(0, 0, 0, 0.85);
  font-weight: 500;
  font-family: inherit;
  resize: vertical;
  min-height: 4rem;
  box-sizing: border-box;
  transition: all var(--ds-duration-fast) ease;
}

.textarea-field-modern::placeholder {
  color: rgba(0, 0, 0, 0.4);
  font-weight: 400;
}

.textarea-field-modern:focus {
  /* 焦点样式由wrapper处理 */
}

.textarea-field-modern.error {
  color: rgb(239, 68, 68);
}

.textarea-field-modern.error ~ .textarea-expand {
  border-left-color: rgba(239, 68, 68, 0.3);
}

.textarea-wrapper-modern:has(.error) {
  border-color: rgba(239, 68, 68, 0.5);
  background: rgba(254, 242, 242, 0.8);
}

.textarea-field-modern.success {
  color: rgb(34, 197, 94);
}

.textarea-wrapper-modern:has(.success) {
  border-color: rgba(34, 197, 94, 0.3);
}

.textarea-expand {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  padding: 0.5rem;
  border-radius: var(--ds-radius-md);
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  color: rgba(0, 0, 0, 0.5);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--ds-duration-fast) ease;
}

.textarea-expand:hover {
  background: rgba(59, 130, 246, 0.1);
  color: rgb(59, 130, 246);
}

/* 状态指示器 */
.input-status {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.5rem;
  min-height: 1.25rem;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  color: rgb(239, 68, 68);
  font-size: 0.75rem;
  font-weight: 500;
}

.char-count {
  font-size: 0.75rem;
  color: rgba(0, 0, 0, 0.5);
  font-weight: 500;
}

/* 删除按钮 */
.remove-btn {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  width: 1.5rem;
  height: 1.5rem;
  border: none;
  background: rgba(239, 68, 68, 0.1);
  color: rgb(239, 68, 68);
  border-radius: var(--ds-radius-sm);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--ds-duration-fast) ease;
  opacity: 0.7;
}

.remove-btn:hover {
  opacity: 1;
  background: rgb(239, 68, 68);
  color: white;
  transform: scale(1.1);
}

/* 增强功能区域 */
.enhanced-section {
  padding: 1rem;
  background: rgba(248, 250, 252, 0.8);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: var(--ds-radius-lg);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.enhanced-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
}

.batch-controls {
  display: flex;
  gap: 0.5rem;
}

/* 超时提示 */
.timeout-section {
  padding: 0.75rem 1rem;
  background: linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(245, 158, 11, 0.1) 100%);
  border: 1px solid rgba(251, 191, 36, 0.2);
  border-radius: var(--ds-radius-lg);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.timeout-indicator {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.timeout-icon {
  flex-shrink: 0;
  color: rgb(245, 158, 11);
}

.timeout-text {
  font-size: 0.875rem;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.8);
}

.timeout-progress {
  flex: 1;
  height: 0.25rem;
  background: rgba(245, 158, 11, 0.2);
  border-radius: var(--ds-radius-full);
  overflow: hidden;
}

.timeout-progress-bar {
  height: 100%;
  background: rgb(245, 158, 11);
  transition: width 1s linear;
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

.btn-modern.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: none !important;
}

/* 大文本编辑器 */
.text-editor {
  padding: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.text-editor-textarea {
  flex: 1;
  width: 100%;
  height: 300px; /* 设置固定高度，避免溢出 */
  max-height: 400px; /* 设置最大高度限制 */
  padding: 1.25rem;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: var(--ds-radius-lg);
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  font-family: inherit;
  font-size: 0.875rem;
  line-height: 1.6;
  color: rgba(0, 0, 0, 0.85);
  resize: none;
  outline: none;
  overflow-y: auto; /* 添加滚动条 */
  box-sizing: border-box; /* 确保padding包含在尺寸内 */
  transition: all var(--ds-duration-fast) ease;
}

.text-editor-textarea:focus {
  border-color: rgba(59, 130, 246, 0.5);
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 
    0 0 0 4px rgba(59, 130, 246, 0.1),
    0 8px 25px rgba(59, 130, 246, 0.15);
}

.text-editor-textarea::placeholder {
  color: rgba(0, 0, 0, 0.4);
}

/* 响应式设计 */
@media (max-width: 640px) {
  .multi-input-action-modern {
    gap: 1rem;
  }
  
  .input-item {
    padding: 0.75rem;
  }
  
  .enhanced-controls {
    flex-direction: column;
    align-items: stretch;
  }
  
  .batch-controls {
    flex-direction: column;
  }
  
  .modern-footer {
    flex-direction: column-reverse;
  }
  
  .btn-modern {
    justify-content: center;
  }
}

/* 减少动画效果（用户偏好） */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  
  .btn-modern:hover {
    transform: none;
  }
  
  .expand-btn:hover,
  .textarea-expand:hover,
  .remove-btn:hover {
    transform: none;
  }
  
  .quick-select-tag:hover {
    transform: none;
  }
}
</style>