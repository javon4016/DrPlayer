<template>
  <ActionDialog
    :visible="visible"
    :title="config.title"
    :width="config.width || 420"
    :height="config.height"
    :canceled-on-touch-outside="!config.keep"
    :module="module"
    :extend="extend"
    :api-url="apiUrl"
    @close="handleCancel"
    @toast="(message, type) => emit('toast', message, type)"
    @reset="() => emit('reset')"
  >
    <div class="input-action-modern">
      <!-- 消息文本 -->
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

      <!-- 图片显示 -->
      <div v-if="config.imageUrl" class="media-section">
        <div class="image-container">
          <img
            :src="config.imageUrl"
            :style="{ height: config.imageHeight ? `${config.imageHeight}px` : 'auto' }"
            class="action-image-modern"
            :class="{ 'clickable': config.imageClickCoord }"
            @click="handleImageClick"
            @load="onImageLoad"
            @error="onImageError"
          />
          <div v-if="imageCoords" class="coords-display">
            <span class="coords-label">点击坐标:</span>
            <span class="coords-value">{{ imageCoords.x }}, {{ imageCoords.y }}</span>
          </div>
        </div>
      </div>

      <!-- 二维码显示 -->
      <div v-if="config.qrcode" class="media-section">
        <div class="qrcode-container">
          <div class="qrcode-wrapper">
            <img
              :src="qrcodeUrl"
              :alt="config.qrcode"
              class="qrcode-image"
              @error="onQrcodeError"
            />
          </div>
          <p class="qrcode-text">{{ config.qrcode }}</p>
        </div>
      </div>

      <!-- 输入区域 fixme 有二维码也要显示这个输入框-->
      <div v-if="!config.qrcode" class="input-section">
        <!-- 快速选择 - 在输入框上方 -->
        <div v-if="quickSelectOptions.length > 0" class="quick-select">
          <div class="quick-select-options">
            <a-tag
              v-for="option in quickSelectOptions"
              :key="option.value"
              class="quick-select-tag"
              @click="selectQuickOption(option)"
            >
              {{ option.name }}
            </a-tag>
          </div>
        </div>

        <div class="input-group">
          <label v-if="config.tip" class="input-label">
            {{ config.tip }}
          </label>
          
          <!-- 单行输入 -->
          <div v-if="!isMultiLine" class="input-container">
            <div class="input-wrapper-modern">
              <input
                ref="inputRef"
                v-model="inputValue"
                :type="inputType"
                :placeholder="config.tip || '请输入内容...'"
                class="input-field-modern"
                :class="{ 
                  'error': hasError,
                  'success': !hasError && inputValue.length > 0
                }"
                @keyup.enter="handleSubmit"
                @input="handleInput"
              />
              <div class="input-actions">
                <button
                  class="expand-btn"
                  @click="openTextEditor"
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
                ref="inputRef"
                v-model="inputValue"
                :placeholder="config.tip || '请输入内容...'"
                :rows="config.multiLine || 4"
                class="textarea-field-modern"
                :class="{ 
                  'error': hasError,
                  'success': !hasError && inputValue.length > 0
                }"
                @input="handleInput"
              ></textarea>
              <button
                class="expand-btn textarea-expand"
                @click="openTextEditor"
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
            <div v-if="errorMessage" class="error-message">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293-1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
              </svg>
              <span>{{ errorMessage }}</span>
            </div>

            <!-- 帮助文本 -->
            <div v-else-if="config.help" class="help-message">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd"/>
              </svg>
              <span>{{ config.help }}</span>
            </div>

            <!-- 字符计数 -->
            <div v-if="inputValue.length > 0" class="char-count">
              {{ inputValue.length }} 字符
            </div>
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
        
        <!-- 确认按钮 -->
        <button
          v-if="showOkButton"
          class="btn-modern btn-primary"
          :class="{ 'disabled': !isValid }"
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
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import ActionDialog from './ActionDialog.vue'
import { 
  ButtonType, 
  parseSelectData, 
  generateQRCodeUrl, 
  debounce,
  normalizeButtonType 
} from './types.js'
import { executeAction } from '@/api/modules/module.js'
import { showToast } from '@/stores/toast.js'
import siteService from '@/api/services/site'
import { useRouter } from 'vue-router'
import { getActionTimeout } from '@/api/config'

export default {
  name: 'InputAction',
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
    const router = useRouter()
    const inputRef = ref(null)
    const textEditorRef = ref(null)
    const inputValue = ref('')
    const errorMessage = ref('')
    const imageCoords = ref(null)
    const timeLeft = ref(0)
    const timer = ref(null)
    const showTextEditor = ref(false)
    const editorText = ref('')
    const currentMessage = ref(props.config.msg || '')

    // 计算属性
    const isMultiLine = computed(() => {
      return props.config.type === 'edit' || props.config.multiLine > 1
    })

    const inputType = computed(() => {
      const { inputType = 0 } = props.config
      const typeMap = {
        0: 'text',
        1: 'password',
        2: 'number',
        3: 'email',
        4: 'url'
      }
      return typeMap[inputType] || 'text'
    })

    const quickSelectOptions = computed(() => {
      return parseSelectData(props.config.selectData || '')
    })

    const qrcodeUrl = computed(() => {
      if (!props.config.qrcode) return ''
      return generateQRCodeUrl(props.config.qrcode, props.config.qrcodeSize)
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

    const hasError = computed(() => {
      return !!errorMessage.value
    })

    const isValid = computed(() => {
      if (hasError.value) return false
      if (props.config.required && !inputValue.value.trim()) return false
      return true
    })

    // 验证输入
    const validateInput = debounce((value) => {
      errorMessage.value = ''

      // 必填验证
      if (props.config.required && !value.trim()) {
        errorMessage.value = '此字段为必填项'
        return false
      }

      // 自定义验证
      if (props.config.validation) {
        try {
          const regex = new RegExp(props.config.validation)
          if (!regex.test(value)) {
            errorMessage.value = '输入格式不正确'
            return false
          }
        } catch (err) {
          console.warn('验证正则表达式错误:', err)
        }
      }

      // 类型验证
      if (inputType.value === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(value)) {
          errorMessage.value = '请输入有效的邮箱地址'
          return false
        }
      }

      if (inputType.value === 'url' && value) {
        try {
          new URL(value)
        } catch {
          errorMessage.value = '请输入有效的URL地址'
          return false
        }
      }

      return true
    }, 300)

    // 事件处理
    const handleInput = (event) => {
      const value = event.target.value
      inputValue.value = value
      validateInput(value)
    }

    const handleSubmit = async () => {
      if (!isValid.value) return

      const result = {}
      
      // 图片点击坐标
      if (props.config.imageClickCoord && imageCoords.value) {
        result.imageCoords = imageCoords.value
      }
      
      // 输入值
      const value = inputValue.value
      result[props.config.id || 'value'] = value

      // 调用T4接口
      if (props.config.actionId) {
        try {
          console.log('111:',props.config.actionId)
          const response = await callT4Action(props.config.actionId, value)
          
          console.log('222:',typeof response)
          
          // 检查响应是否为普通文本
          if (typeof response === 'string') {
            // 普通文本响应，使用全局Toast显示消息
            showToast(response, 'success')
            // 立即关闭弹窗，Toast独立显示
            emit('close')
            return
          }
          
          // 处理JSON格式的专项动作响应
          if (response && response.action) {
            const actionData = response.action
            const toastData = response.toast
            
            // 显示toast消息
            if (toastData) {
              showToast(toastData, 'success')
            }
            
            // 处理不同的专项动作
            switch (actionData.actionId) {
              case '__keep__':
                // 保持弹窗打开状态
                if (actionData.msg) {
                  // 更新弹窗内的消息文本
                  currentMessage.value = actionData.msg
                }
                if (actionData.reset) {
                  // 清除输入框内容
                  inputValue.value = ''
                  errorMessage.value = ''
                  emit('reset')
                }
                return // 不关闭弹窗
                
              case '__detail__':
                // 详情页跳转
                console.log('详情页跳转:', actionData)
                await handleDetailAction(actionData)
                emit('close')
                return
                
              case '__copy__':
                // 复制到剪贴板
                await handleCopyAction(actionData,toastData)
                emit('close')
                return
                
              case '__self_search__':
                // 源内搜索
                await handleSelfSearchAction(actionData)
                emit('close')
                return
                
              case '__refresh_list__':
                // 刷新列表
                await handleRefreshListAction(actionData)
                emit('close')
                return
                
              case '__ktvplayer__':
                // KTV播放
                await handleKtvPlayerAction(actionData)
                emit('close')
                return
                
              default:
                // 检查是否为普通动作（包含type字段）
                if (actionData.type) {
                  console.log('检测到普通动作，触发新的ActionRenderer:', actionData)
                  // 通过action事件将新的动作数据传递给ActionRenderer
                  emit('action', actionData)
                  // 不要立即关闭弹窗，让ActionRenderer处理新动作配置
                  return
                } else {
                  console.warn('未知的专项动作:', actionData.actionId)
                }
                break
            }
          }
          
          
        } catch (error) {
          console.error('确认按钮T4接口调用失败:', error)
          showToast('操作失败，请重试', 'error')
          return // 不关闭弹窗
        }
      }

      emit('submit', result)
    }

    // 专项动作处理函数
    const handleDetailAction = async (actionData) => {
      try {
        const { skey, ids } = actionData
        
        if (!skey || !ids) {
          showToast('详情页跳转参数不完整', 'error')
          return
        }
        
        // 根据skey获取对应的站源信息
        const site = siteService.getSiteByKey(skey)
        if (!site) {
          showToast(`未找到站源: ${skey}`, 'error')
          return
        }
        
        console.log('跳转到详情页:', {
          skey,
          ids,
          site: site.name
        })

        console.log('site:',site)
        
        // 跳转到详情页，传递站源信息
        router.push({
          name: 'VideoDetail',
          params: { id: ids },
          query: {
            // 传递站源信息，不影响全局状态
            tempSiteName: site.name,
            tempSiteApi: site.api,
            tempSiteKey: site.key,
            tempSiteExt: site.ext,
            // 标识从专项动作进入
            fromSpecialAction: 'true',
            actionType: '__detail__',
            // 添加来源图片信息，用于详情页图片备用（专项动作通常没有图片）
            sourcePic: ''
          }
        })
        
        showToast(`正在加载 ${site.name} 的详情...`, 'info')
        
      } catch (error) {
        console.error('详情页跳转失败:', error)
        showToast('详情页跳转失败', 'error')
      }
    }
    
    const handleCopyAction = async (actionData,toastData) => {
      try {
        const { content } = actionData
        
        if (!content) {
          showToast('没有可复制的内容', 'error')
          return
        }
        
        await navigator.clipboard.writeText(content)
        if(!toastData){
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
        
        // 构造搜索参数
        const searchParams = {
          name: name || '搜索',
          tid: tid || '',
          flag: flag || '',
          folder: folder || ''
        }
        
        // 如果指定了目标源，切换到该源
        if (skey) {
          const site = siteService.getSiteByKey(skey)
          if (site) {
            siteService.setCurrentSite(skey)
            showToast(`已切换到 ${site.name}`, 'info')
          }
        }
        
        // 跳转到搜索页面或触发搜索
        console.log('执行源内搜索:', searchParams)
        showToast('正在执行源内搜索...', 'info')
        
        // 触发special-action事件，传递给父组件处理
        console.log('📝 [InputAction DEBUG] 即将触发 special-action 事件');
        console.log('📝 [InputAction DEBUG] 事件参数:', {
          actionType: '__self_search__',
          eventData: {
            tid: searchParams.tid,
            name: searchParams.name,
            type_id: searchParams.tid,
            type_name: searchParams.name,
            actionData: searchParams
          }
        });
        
        emit('special-action', '__self_search__', {
          tid: searchParams.tid,
          name: searchParams.name,
          type_id: searchParams.tid,
          type_name: searchParams.name,
          actionData: searchParams
        })
        
        console.log('📝 [InputAction DEBUG] special-action 事件已触发');
        
      } catch (error) {
        console.error('源内搜索失败:', error)
        showToast('源内搜索失败', 'error')
      }
    }
    
    const handleRefreshListAction = async (actionData) => {
      try {
        console.log('执行刷新列表:', actionData)
        
        // 获取当前路由信息
        const currentRoute = router.currentRoute.value
        const routeName = currentRoute.name
        
        // 根据不同页面类型执行相应的刷新操作
        switch (routeName) {
          case 'Video':
            // 视频列表页面刷新
            window.dispatchEvent(new CustomEvent('refreshVideoList', {
              detail: { ...actionData, type: 'video' }
            }))
            break
            
          case 'Live':
            // 直播列表页面刷新
            window.dispatchEvent(new CustomEvent('refreshLiveList', {
              detail: { ...actionData, type: 'live' }
            }))
            break
            
          case 'Collection':
            // 收藏列表页面刷新
            window.dispatchEvent(new CustomEvent('refreshCollectionList', {
              detail: { ...actionData, type: 'collection' }
            }))
            break
            
          case 'History':
            // 历史记录页面刷新
            window.dispatchEvent(new CustomEvent('refreshHistoryList', {
              detail: { ...actionData, type: 'history' }
            }))
            break
            
          case 'BookGallery':
            // 书籍列表页面刷新
            window.dispatchEvent(new CustomEvent('refreshBookList', {
              detail: { ...actionData, type: 'book' }
            }))
            break
            
          default:
            // 通用刷新事件
            window.dispatchEvent(new CustomEvent('refreshList', {
              detail: { ...actionData, routeName }
            }))
            break
        }
        
        // 如果指定了特定的刷新类型，也发送对应事件
        if (actionData.type) {
          window.dispatchEvent(new CustomEvent(`refresh${actionData.type}List`, {
            detail: actionData
          }))
        }
        
        showToast('列表刷新中...', 'info')
        
        // 延迟显示刷新完成提示
        setTimeout(() => {
          showToast('列表已刷新', 'success')
        }, 500)
        
      } catch (error) {
        console.error('刷新列表失败:', error)
        showToast('刷新列表失败', 'error')
      }
    }
    
    const handleKtvPlayerAction = async (actionData) => {
      try {
        const { name, id, url, type = 'ktv' } = actionData
        
        if (!name || !id) {
          showToast('KTV播放参数不完整', 'error')
          return
        }
        
        console.log('启动KTV播放:', {
          name,
          id,
          url,
          type
        })
        
        // 构建播放参数
        const playParams = {
          title: name,
          videoId: id,
          playUrl: url || id, // 如果没有url则使用id作为播放地址
          playType: type,
          isKtv: true,
          // KTV特有参数
          showLyrics: true,
          enableKaraokeMode: true,
          fromAction: '__ktvplayer__'
        }
        
        // 检查是否有专门的KTV播放页面
        try {
          // 尝试跳转到KTV播放页面
          router.push({
            name: 'KtvPlayer',
            params: { id: id },
            query: {
              title: name,
              url: url || id,
              type: type,
              mode: 'ktv'
            }
          })
          
          showToast(`正在启动KTV播放: ${name}`, 'success')
          
        } catch (routeError) {
          // 如果没有专门的KTV页面，尝试使用通用播放器
          console.log('KTV专用页面不存在，使用通用播放器')
          
          // 发送KTV播放事件给播放器组件
          window.dispatchEvent(new CustomEvent('startKtvPlay', {
            detail: playParams
          }))
          
          // 或者跳转到通用播放页面并标记为KTV模式
          router.push({
            name: 'VideoPlayer',
            params: { id: id },
            query: {
              title: name,
              url: url || id,
              type: type,
              ktvMode: 'true',
              showLyrics: 'true',
              fromAction: '__ktvplayer__'
            }
          })
          
          showToast(`正在播放: ${name}`, 'success')
        }
        
      } catch (error) {
        console.error('KTV播放失败:', error)
        showToast('KTV播放失败', 'error')
      }
    }

    const handleCancel = async () => {
      // 检查是否有自定义取消行为
      if (props.config.cancelAction && props.config.cancelValue !== undefined) {
        try {
          await callT4Action(props.config.cancelAction, props.config.cancelValue)
        } catch (error) {
          console.error('取消按钮T4接口调用失败:', error)
          // 即使接口调用失败，也继续执行默认的取消行为
        }
      }
      
      emit('cancel')
      emit('close')
    }

    const handleReset = () => {
      inputValue.value = ''
      errorMessage.value = ''
      if (inputRef.value) {
        inputRef.value.focus()
      }
    }

    // 大文本编辑器方法
    const openTextEditor = () => {
      editorText.value = inputValue.value
      showTextEditor.value = true
      nextTick(() => {
        if (textEditorRef.value) {
          textEditorRef.value.focus()
        }
      })
    }

    const closeTextEditor = () => {
      showTextEditor.value = false
    }

    const saveEditorText = () => {
      inputValue.value = editorText.value
      showTextEditor.value = false
      handleInput({ target: { value: editorText.value } })
    }

    const handleImageClick = (event) => {
      if (!props.config.imageClickCoord) return

      const rect = event.target.getBoundingClientRect()
      const x = Math.round(event.clientX - rect.left)
      const y = Math.round(event.clientY - rect.top)
      
      imageCoords.value = { x, y }
      
      // 将坐标累积到输入框中，多个坐标用-符号分隔
      const newCoordsText = `${x},${y}`
      
      if (inputValue.value.trim()) {
        // 如果输入框已有内容，用-符号分隔追加新坐标
        inputValue.value = `${inputValue.value}-${newCoordsText}`
      } else {
        // 如果输入框为空，直接设置新坐标
        inputValue.value = newCoordsText
      }
      
      // 触发输入验证
      validateInput(inputValue.value)
      
      // 不自动提交，让用户可以看到坐标并手动确认
    }

    const selectQuickOption = (option) => {
      inputValue.value = option.value
      validateInput(option.value)
      
      // 如果只允许快速选择，直接提交
      if (props.config.onlyQuickSelect) {
        nextTick(() => {
          handleSubmit()
        })
      }
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

    // T4接口调用方法
    const callT4Action = async (action, value) => {
      if (!props.module && !props.apiUrl) {
        console.warn('未提供module或apiUrl，无法调用T4接口')
        return null
      }

      // 构造正确的T4接口格式
      // ac=list&action=[actionId]&value={"[id]":[value]}
      const valueObject = {}
      const actionId = props.config.id || 'value'
      valueObject[actionId] = value

      const actionData = {
        action,
        value: JSON.stringify(valueObject)
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

      let result = null
      if (props.module) {
        console.log('调用模块:', props.module)
        result = await executeAction(props.module, actionData)
      } else if (props.apiUrl) {
        // 直接调用API
        console.log('直接调用API:', props.apiUrl)
        const axios = (await import('axios')).default
        const response = await axios.post(props.apiUrl, actionData, {
          timeout: getActionTimeout(),
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

    // 监听配置变化
    watch(() => props.config, (newConfig) => {
      inputValue.value = newConfig.value || ''
      errorMessage.value = ''
      imageCoords.value = null
      
      if (newConfig.timeout) {
        startTimeout()
      } else {
        stopTimeout()
      }
    }, { immediate: true })

    // 监听显示状态
    watch(() => props.visible, (visible) => {
      if (visible) {
        nextTick(() => {
          if (inputRef.value) {
            inputRef.value.focus()
          }
        })
        startTimeout()
      } else {
        stopTimeout()
      }
    })

    onMounted(() => {
      if (props.visible && inputRef.value) {
        inputRef.value.focus()
      }
    })

    onUnmounted(() => {
      stopTimeout()
    })

    return {
      inputRef,
      inputValue,
      errorMessage,
      imageCoords,
      timeLeft,
      currentMessage,
      isMultiLine,
      inputType,
      quickSelectOptions,
      qrcodeUrl,
      showOkButton,
      showCancelButton,
      showResetButton,
      hasError,
      isValid,
      handleInput,
      handleSubmit,
      handleCancel,
      handleReset,
      handleImageClick,
      selectQuickOption,
      onImageLoad,
      onImageError,
      onQrcodeError,
      // 大文本编辑器相关
      textEditorRef,
      showTextEditor,
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
.input-action-modern {
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

.action-image-modern.clickable {
  cursor: crosshair;
}

.action-image-modern.clickable:hover {
  transform: scale(1.02);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.coords-display {
  margin-top: 0.75rem;
  padding: 0.5rem 1rem;
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.2);
  border-radius: var(--ds-radius-md);
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.coords-label {
  color: rgba(0, 0, 0, 0.6);
  font-weight: 500;
}

.coords-value {
  color: rgb(34, 197, 94);
  font-weight: 600;
  font-family: 'Courier New', monospace;
}

.qrcode-container {
  text-align: center;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: var(--ds-radius-lg);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.qrcode-wrapper {
  display: inline-block;
  padding: 1rem;
  background: white;
  border-radius: var(--ds-radius-md);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.qrcode-image {
  max-width: 100%;
  height: auto;
  display: block;
}

.qrcode-text {
  margin: 1rem 0 0;
  color: rgba(0, 0, 0, 0.7);
  font-size: 0.875rem;
  font-weight: 500;
  word-wrap: break-word;
  word-break: break-all;
  white-space: pre-wrap;
  line-height: 1.5;
  max-width: 100%;
  overflow-wrap: break-word;
}

/* 输入区域 */
.input-section {
  margin-bottom: 0.5rem;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.input-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.8);
  margin: 0;
  letter-spacing: -0.025em;
}

/* 输入框容器 */
.input-container,
.textarea-container {
  position: relative;
}

.input-wrapper-modern,
.textarea-wrapper-modern {
  position: relative;
  display: flex;
  align-items: stretch;
  background: rgba(255, 255, 255, 0.8);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: var(--ds-radius-lg);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  transition: all var(--ds-duration-fast) ease;
  overflow: hidden;
}

.input-wrapper-modern:focus-within,
.textarea-wrapper-modern:focus-within {
  border-color: rgba(59, 130, 246, 0.5);
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 
    0 0 0 4px rgba(59, 130, 246, 0.1),
    0 8px 25px rgba(59, 130, 246, 0.15);
  transform: translateY(-1px);
}

.input-field-modern,
.textarea-field-modern {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  padding: 1rem 1.25rem;
  font-size: 0.875rem;
  line-height: 1.5;
  color: rgba(0, 0, 0, 0.85);
  font-weight: 500;
  transition: all var(--ds-duration-fast) ease;
}

.textarea-field-modern {
  resize: vertical;
  min-height: 4rem;
  font-family: inherit;
}

.input-field-modern::placeholder,
.textarea-field-modern::placeholder {
  color: rgba(0, 0, 0, 0.4);
  font-weight: 400;
}

/* 输入框状态 */
.input-field-modern.error,
.textarea-field-modern.error {
  color: rgb(239, 68, 68);
}

.input-field-modern.error + .input-actions,
.textarea-field-modern.error ~ .expand-btn {
  border-left-color: rgba(239, 68, 68, 0.3);
}

.input-wrapper-modern:has(.error),
.textarea-wrapper-modern:has(.error) {
  border-color: rgba(239, 68, 68, 0.5);
  background: rgba(254, 242, 242, 0.8);
}

.input-field-modern.success,
.textarea-field-modern.success {
  color: rgb(34, 197, 94);
}

.input-wrapper-modern:has(.success),
.textarea-wrapper-modern:has(.success) {
  border-color: rgba(34, 197, 94, 0.3);
}

/* 输入框操作按钮 */
.input-actions {
  display: flex;
  align-items: center;
  border-left: 1px solid rgba(255, 255, 255, 0.3);
}

.expand-btn {
  padding: 0.75rem;
  border: none;
  background: transparent;
  color: rgba(0, 0, 0, 0.5);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--ds-duration-fast) ease;
  border-radius: 0;
}

.expand-btn:hover {
  background: rgba(59, 130, 246, 0.1);
  color: rgb(59, 130, 246);
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
}

/* 状态指示器 */
.input-status {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.error-message,
.help-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  font-weight: 500;
  flex: 1;
}

.error-message {
  color: rgb(239, 68, 68);
}

.help-message {
  color: rgba(0, 0, 0, 0.6);
}

.char-count {
  font-size: 0.75rem;
  color: rgba(0, 0, 0, 0.5);
  font-weight: 500;
  flex-shrink: 0;
}

/* 快速选择区域 */
.quick-select {
  margin-bottom: 1rem;
}

.quick-select-options {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: flex-start;
}

.quick-select-tag {
  cursor: pointer;
  transition: all var(--ds-duration-fast) ease;
  margin: 0.25rem;
  font-size: 0.875rem;
  font-weight: 500;
  background-color: #6b7280 !important;
  color: white !important;
  border: none !important;
  border-radius: 12px !important;
  padding: 6px 12px !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  text-align: center !important;
  width: auto !important;
  min-width: auto !important;
  line-height: 1 !important;
}

.quick-select-tag:hover {
  background-color: #4b5563 !important;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(107, 114, 128, 0.3);
}

.quick-select-tag:active {
  transform: translateY(0);
  background-color: #374151 !important;
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

/* 大文本编辑器样式 */
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
  .input-action-modern {
    gap: 1rem;
  }

  .message-content {
    padding: 0.75rem;
    gap: 0.5rem;
  }

  .message-icon {
    width: 1.5rem;
    height: 1.5rem;
  }

  .input-field-modern,
  .textarea-field-modern {
    padding: 0.875rem 1rem;
    font-size: 0.875rem;
  }

  .modern-footer {
    flex-direction: column-reverse;
    gap: 0.5rem;
  }

  .btn-modern {
    width: 100%;
    justify-content: center;
  }

  .quick-select-grid {
    grid-template-columns: 1fr;
  }
  
  .quick-select-tag {
    margin: 0.125rem;
  }

  .input-status {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .char-count {
    align-self: flex-end;
  }
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .message-content {
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(147, 51, 234, 0.15) 100%);
    border-color: rgba(59, 130, 246, 0.3);
  }

  .message-text {
    color: rgba(255, 255, 255, 0.9);
  }

  .input-wrapper-modern,
  .textarea-wrapper-modern {
    background: rgba(0, 0, 0, 0.3);
    border-color: rgba(255, 255, 255, 0.2);
  }

  .input-field-modern,
  .textarea-field-modern {
    color: rgba(255, 255, 255, 0.9);
  }

  .input-field-modern::placeholder,
  .textarea-field-modern::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }

  .btn-secondary {
    background: rgba(0, 0, 0, 0.3);
    color: rgba(255, 255, 255, 0.8);
  }

  .btn-secondary:hover {
    background: rgba(0, 0, 0, 0.5);
    color: rgba(255, 255, 255, 0.95);
  }
}

/* 高对比度模式支持 */
@media (prefers-contrast: high) {
  .input-wrapper-modern,
  .textarea-wrapper-modern,
  .quick-select-tag,
  .btn-modern {
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
    border-width: 2px;
  }
}

/* 减少动画模式支持 */
@media (prefers-reduced-motion: reduce) {
  .input-wrapper-modern,
  .textarea-wrapper-modern,
  .quick-select-tag,
  .btn-modern,
  .expand-btn,
  .action-image-modern {
    transition: none;
  }

  .btn-modern::before {
    display: none;
  }

  .btn-modern:hover,
  .quick-select-tag:hover,
  .action-image-modern:hover {
    transform: none;
  }
}
</style>