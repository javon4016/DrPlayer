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
                <button 
                  v-if="input.help" 
                  class="help-button"
                  @click="showHelpPopup(input.help)"
                  title="查看帮助信息"
                >
                  ?
                </button>
              </label>
            </div>

            <!-- 输入区域 -->
            <div class="input-group">
              <!-- 快速选择 - 在输入框上方，只显示非特殊选择器，且非多选模式 -->
              <div v-if="input.selectData && hasNonSpecialOptions(input.selectData) && !input.multiSelect" class="quick-select">
                <div class="quick-select-options">
                  <button
                    v-for="option in getNonSpecialOptions(input.selectData)"
                    :key="option.value"
                    class="quick-select-tag"
                    :class="{ 'selected': isOptionSelected(index, option) }"
                    @click="selectQuickOption(index, option)"
                  >
                    {{ option.name }}
                  </button>
                </div>
              </div>

              <!-- 日期选择器 (当selectData为[calendar]且inputType为0时) -->
              <div v-if="(!input.multiLine || input.multiLine <= 1) && !input.onlyQuickSelect && input.selectData === '[calendar]' && input.inputType === 0" class="input-container">
                <div class="input-wrapper-modern">
                  <DatePicker
                    v-model="inputValues[index]"
                    :placeholder="input.tip || input.name"
                    class="date-picker-modern"
                    style="width: 100%;"
                    :class="{
                      error: inputErrors[index],
                      success: !inputErrors[index] && inputValues[index] && input.required
                    }"
                    format="YYYY-MM-DD"
                    @change="handleDateChange(index, $event)"
                  />
                </div>
              </div>

              <!-- 单行输入 -->
              <div v-else-if="(!input.multiLine || input.multiLine <= 1) && !input.onlyQuickSelect" class="input-container">
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
                    :readonly="input.inputType === 0"
                    @input="handleInputChange(index, $event)"
                    @blur="validateInput(index)"
                  />
                  <div class="input-actions">
                    <!-- 特殊输入框图标按钮 -->
                    <button
                      v-if="getSpecialInputType(input)"
                      class="special-input-btn"
                      :class="`special-${getSpecialInputType(input)}`"
                      @click="handleSpecialInput(index, getSpecialInputType(input))"
                      :title="getSpecialInputTitle(getSpecialInputType(input))"
                    >
                      <!-- 日历图标 -->
                      <svg v-if="getSpecialInputType(input) === 'calendar'" width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zM4 7h12v9H4V7z"/>
                      </svg>
                      <!-- 文件图标 -->
                      <svg v-else-if="getSpecialInputType(input) === 'file'" width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm0 2h12v10H4V5z"/>
                      </svg>
                      <!-- 文件夹图标 -->
                      <svg v-else-if="getSpecialInputType(input) === 'folder'" width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"/>
                      </svg>
                      <!-- 图像图标 -->
                      <svg v-else-if="getSpecialInputType(input) === 'image'" width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"/>
                      </svg>
                    </button>
                    <!-- 展开选项按钮 (inputType为0时) -->
                    <button
                      v-else-if="input.inputType === 0 && input.selectData"
                      class="expand-options-btn"
                      @click="openSelectOptions(index)"
                      title="展开选项"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M7 10l5 5 5-5z"/>
                      </svg>
                    </button>
                    <!-- 普通展开按钮 -->
                    <button
                      v-else
                      class="expand-btn"
                      @click="openTextEditor(index)"
                      title="打开大文本编辑器"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14zM5 7h14v2H5zm0 4h14v2H5zm0 4h10v2H5z"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              <!-- 多行输入 -->
              <div v-else-if="!input.onlyQuickSelect" class="textarea-container">
                <div class="textarea-wrapper-modern">
                  <textarea
                    v-model="inputValues[index]"
                    :placeholder="input.tip || input.name"
                    :rows="Math.min(input.multiLine || 3, 4)"
                    class="textarea-field-modern"
                    :class="{ 
                      error: inputErrors[index],
                      success: !inputErrors[index] && inputValues[index] && input.required
                    }"
                    :readonly="input.inputType === 0"
                    @input="handleInputChange(index, $event)"
                    @blur="validateInput(index)"
                  ></textarea>
                  <!-- 特殊输入框图标按钮 -->
                  <button
                    v-if="getSpecialInputType(input)"
                    class="special-input-btn textarea-expand"
                    :class="`special-${getSpecialInputType(input)}`"
                    @click="handleSpecialInput(index, getSpecialInputType(input))"
                    :title="getSpecialInputTitle(getSpecialInputType(input))"
                  >
                    <!-- 日历图标 -->
                    <svg v-if="getSpecialInputType(input) === 'calendar'" width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zM4 7h12v9H4V7z"/>
                    </svg>
                    <!-- 文件图标 -->
                    <svg v-else-if="getSpecialInputType(input) === 'file'" width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm0 2h12v10H4V5z"/>
                    </svg>
                    <!-- 文件夹图标 -->
                    <svg v-else-if="getSpecialInputType(input) === 'folder'" width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"/>
                    </svg>
                    <!-- 图像图标 -->
                    <svg v-else-if="getSpecialInputType(input) === 'image'" width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"/>
                    </svg>
                  </button>
                  <!-- 普通展开按钮 -->
                  <button
                    v-else
                    class="expand-btn textarea-expand"
                    @click="openTextEditor(index)"
                    title="打开大文本编辑器"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14zM5 7h14v2H5zm0 4h14v2H5zm0 4h10v2H5z"/>
                    </svg>
                  </button>
                </div>
              </div>

              <!-- 状态指示器 -->
              <div class="input-status">
                <!-- 错误提示 -->
                <div v-if="inputErrors[index]" class="error-message">
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
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
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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

  <!-- 日期选择器弹窗 -->
  <ActionDialog
    :visible="showDatePicker"
    title="选择日期"
    :width="400"
    @close="handleDateCancel"
  >
    <div class="date-picker-container">
      <DatePicker
        v-model="selectedDate"
        :style="{ width: '100%' }"
        placeholder="请选择日期"
        format="YYYY-MM-DD"
        @change="handleDateConfirm"
      />
    </div>

    <template #footer>
      <div class="modern-footer">
        <button class="btn-modern btn-secondary" @click="handleDateCancel">
          取消
        </button>
      </div>
    </template>
   </ActionDialog>

   <!-- 帮助信息弹窗 -->
   <ActionDialog
     :visible="showHelpDialog"
     title="帮助信息"
     :width="500"
     @close="closeHelpDialog"
   >
     <div class="help-content" v-html="helpContent"></div>

     <template #footer>
       <div class="modern-footer">
         <button class="btn-modern btn-primary" @click="closeHelpDialog">
           确定
         </button>
       </div>
     </template>
   </ActionDialog>

   <!-- 选项弹窗 -->
   <ActionDialog
     :visible="showSelectOptions"
     :title="isMultiSelectMode ? '请选择字母' : '请选择'"
     :width="isMultiSelectMode ? (currentSelectColumn * 160 + 200) : 400"
     @close="showSelectOptions = false"
   >
     <div class="select-options-content">
       <!-- 单选模式 -->
       <div v-if="!isMultiSelectMode" class="radio-container">
         <a-radio-group 
           v-model="selectedRadioValue"
           @change="handleRadioChange"
           direction="vertical"
           class="radio-options-list"
         >
           <a-radio
             v-for="option in currentSelectOptions"
             :key="option.value"
             :value="option.value"
             class="radio-option-item"
           >
             {{ option.name }}
           </a-radio>
         </a-radio-group>
       </div>

       <!-- 多选模式 -->
       <div v-else class="multiselect-container">
         <div class="multiselect-main">
           <a-checkbox-group 
             v-model="selectedCheckboxValues"
             class="checkbox-grid"
             :style="{ gridTemplateColumns: `repeat(${currentSelectColumn}, 1fr)` }"
           >
             <a-checkbox
               v-for="option in currentSelectOptions"
               :key="option.value"
               :value="option.value"
               class="checkbox-option-item"
             >
               {{ option.name }}
             </a-checkbox>
           </a-checkbox-group>
         </div>
         
         <div class="multiselect-actions">
           <button class="btn-modern btn-secondary btn-small" @click="selectAll">
             全选
           </button>
           <button class="btn-modern btn-secondary btn-small" @click="clearSelection">
              全清
            </button>
           <button class="btn-modern btn-secondary btn-small" @click="invertSelection">
             反选
           </button>
           <button class="btn-modern btn-primary btn-small" @click="confirmMultiSelection">
             确定
           </button>
         </div>
       </div>
     </div>

     <template #footer v-if="!isMultiSelectMode">
       <div class="modern-footer">
         <button class="btn-modern btn-secondary" @click="showSelectOptions = false">
           取消
         </button>
         <button class="btn-modern btn-primary" @click="confirmRadioSelection">
           确认
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
import { DatePicker, Radio, RadioGroup, Checkbox, CheckboxGroup } from '@arco-design/web-vue'

export default {
  name: 'MultiInputAction',
  components: {
    ActionDialog,
    DatePicker,
    'a-radio': Radio,
    'a-radio-group': RadioGroup,
    'a-checkbox': Checkbox,
    'a-checkbox-group': CheckboxGroup
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

    // 日期选择器相关
    const showDatePicker = ref(false)
    const currentDateIndex = ref(-1)
    const selectedDate = ref('')

    // 选项弹窗相关
    const showSelectOptions = ref(false)
    const currentSelectIndex = ref(-1)
    const currentSelectOptions = ref([])
    const selectedRadioValue = ref('')
    
    // 多选相关
    const selectedCheckboxValues = ref([])
    const isMultiSelectMode = ref(false)
    const currentSelectColumn = ref(4)

    // 帮助弹窗相关
    const showHelpDialog = ref(false)
    const helpContent = ref('')

    // 计算属性
    const isEnhanced = computed(() => {
      return props.config.type === 'multiInputEnhanced'
    })

    // 按钮显示逻辑，与InputAction.vue保持一致
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
          showToast('已复制到剪切板', 'success')
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

    // 处理日期选择器变化
    const handleDateChange = (index, value) => {
      inputValues.value[index] = value
      validateInput(index)
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

    // 获取选择选项
    const getSelectOptions = (selectData) => {
      return parseSelectData(selectData)
    }

    // 获取特殊输入框类型
    const getSpecialInputType = (input) => {
      if (!input.selectData) return null
      
      const options = parseSelectData(input.selectData)
      for (const option of options) {
        if (option.value && option.value.startsWith('[') && option.value.endsWith(']')) {
          const type = option.value.slice(1, -1).toLowerCase()
          if (['calendar', 'file', 'folder', 'image'].includes(type)) {
            return type
          }
        }
      }
      return null
    }

    // 获取特殊输入框按钮标题
    const getSpecialInputTitle = (type) => {
      const titles = {
        'calendar': '选择日期',
        'file': '选择文件',
        'folder': '选择文件夹',
        'image': '选择图片'
      }
      return titles[type] || '特殊输入'
    }

    // 处理特殊输入框点击
    const handleSpecialInput = (index, type) => {
      switch (type) {
        case 'calendar':
          handleDateSelect(index)
          break
        case 'file':
          handleFileSelect(index)
          break
        case 'folder':
          handleFolderSelect(index)
          break
        case 'image':
          handleImageSelect(index)
          break
        default:
          console.warn('未知的特殊输入类型:', type)
      }
    }

    // 打开选项弹窗
    const openSelectOptions = (index) => {
      const input = inputItems.value[index]
      if (input.selectData) {
        currentSelectIndex.value = index
        currentSelectOptions.value = parseSelectData(input.selectData)
        
        // 判断是否为多选模式
        isMultiSelectMode.value = input.multiSelect === true
        currentSelectColumn.value = input.selectColumn || 4
        
        if (isMultiSelectMode.value) {
          // 多选模式：解析已选中的值
          const currentValue = inputValues.value[index] || ''
          selectedCheckboxValues.value = currentValue ? currentValue.split(',').map(v => v.trim()).filter(v => v) : []
        } else {
          // 单选模式：设置当前选中的值
          selectedRadioValue.value = inputValues.value[index] || ''
        }
        
        showSelectOptions.value = true
      }
    }

    // 选择选项
    const selectOption = (option) => {
      if (currentSelectIndex.value >= 0) {
        inputValues.value[currentSelectIndex.value] = option.value
        validateInput(currentSelectIndex.value)
      }
      showSelectOptions.value = false
      currentSelectIndex.value = -1
      currentSelectOptions.value = []
    }

    // 处理radio变化
    const handleRadioChange = (value) => {
      if (currentSelectIndex.value >= 0) {
        inputValues.value[currentSelectIndex.value] = value
        validateInput(currentSelectIndex.value)
      }
    }

    // 确认单选
    const confirmRadioSelection = () => {
      showSelectOptions.value = false
      currentSelectIndex.value = -1
      currentSelectOptions.value = []
      selectedRadioValue.value = ''
    }







    // 全选
    const selectAll = () => {
      selectedCheckboxValues.value = currentSelectOptions.value.map(option => option.value)
    }

    // 全清选择
    const clearSelection = () => {
      selectedCheckboxValues.value = []
    }

    // 反选
    const invertSelection = () => {
      const allValues = currentSelectOptions.value.map(option => option.value)
      selectedCheckboxValues.value = allValues.filter(value => !selectedCheckboxValues.value.includes(value))
    }

    // 确认选择（单选和多选）
    const confirmMultiSelection = () => {
      if (currentSelectIndex.value >= 0) {
        if (isMultiSelectMode.value) {
          // 多选模式：将选中的值用逗号连接
          inputValues.value[currentSelectIndex.value] = selectedCheckboxValues.value.join(',')
        } else {
          // 单选模式：只取第一个值
          inputValues.value[currentSelectIndex.value] = selectedCheckboxValues.value[0] || ''
        }
        validateInput(currentSelectIndex.value)
      }
      showSelectOptions.value = false
      currentSelectIndex.value = -1
      currentSelectOptions.value = []
      selectedCheckboxValues.value = []
      isMultiSelectMode.value = false
    }

    // 判断是否为特殊选择器
    const isSpecialSelector = (value) => {
      return value && value.startsWith('[') && value.endsWith(']')
    }

    // 获取选项显示名称
    const getOptionDisplayName = (option) => {
      if (isSpecialSelector(option.value)) {
        const selectorType = option.value.slice(1, -1).toLowerCase()
        const displayNames = {
          'calendar': '📅 选择日期',
          'file': '📄 选择文件',
          'folder': '📁 选择文件夹',
          'image': '🖼️ 选择图片'
        }
        return displayNames[selectorType] || option.name
      }
      return option.name
    }

    // 检查是否有非特殊选择器选项
    const hasNonSpecialOptions = (selectData) => {
      const options = getSelectOptions(selectData)
      return options.some(option => !isSpecialSelector(option.value))
    }

    // 获取非特殊选择器选项
    const getNonSpecialOptions = (selectData) => {
      const options = getSelectOptions(selectData)
      return options.filter(option => !isSpecialSelector(option.value))
    }

    const selectQuickOption = (index, option) => {
      // 处理特殊选择器
      if (option.value.startsWith('[') && option.value.endsWith(']')) {
        const selectorType = option.value.slice(1, -1).toLowerCase()
        
        switch (selectorType) {
          case 'calendar':
            // 日期选择器
            handleDateSelect(index)
            break
          case 'file':
            // 文件选择器
            handleFileSelect(index)
            break
          case 'folder':
            // 文件夹选择器
            handleFolderSelect(index)
            break
          case 'image':
            // 图像文件选择器
            handleImageSelect(index)
            break
          default:
            // 普通选择
            inputValues.value[index] = option.value
            break
        }
      } else {
        // 普通选择
        inputValues.value[index] = option.value
      }
      validateInput(index)
    }

    // 判断选项是否被选中
    const isOptionSelected = (index, option) => {
      return inputValues.value[index] === option.value
    }

    // 日期选择处理
    const handleDateSelect = (index) => {
      currentDateIndex.value = index
      showDatePicker.value = true
    }

    // 日期选择确认
    const handleDateConfirm = (dateString) => {
      if (dateString && currentDateIndex.value >= 0) {
        inputValues.value[currentDateIndex.value] = dateString
        validateInput(currentDateIndex.value)
      }
      showDatePicker.value = false
      currentDateIndex.value = -1
    }

    // 日期选择取消
    const handleDateCancel = () => {
      showDatePicker.value = false
      currentDateIndex.value = -1
    }

    // 显示帮助弹窗
    const showHelpPopup = (content) => {
      helpContent.value = content
      showHelpDialog.value = true
    }

    // 关闭帮助弹窗
    const closeHelpDialog = () => {
      showHelpDialog.value = false
      helpContent.value = ''
    }

    // 文件选择处理
    const handleFileSelect = (index) => {
      const input = document.createElement('input')
      input.type = 'file'
      input.style.position = 'absolute'
      input.style.left = '-9999px'
      document.body.appendChild(input)
      
      input.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          inputValues.value[index] = e.target.files[0].name
          validateInput(index)
        }
        document.body.removeChild(input)
      })
      
      input.click()
    }

    // 文件夹选择处理
    const handleFolderSelect = (index) => {
      // 创建一个隐藏的文件夹选择器
      const input = document.createElement('input')
      input.type = 'file'
      input.webkitdirectory = true
      input.multiple = true
      input.style.position = 'absolute'
      input.style.left = '-9999px'
      input.style.opacity = '0'
      document.body.appendChild(input)
      
      input.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
          // 从第一个文件的路径中提取文件夹路径
          const firstFile = e.target.files[0]
          const relativePath = firstFile.webkitRelativePath
          
          if (relativePath) {
            // 获取文件夹名称（第一级目录）
            const folderName = relativePath.split('/')[0]
            inputValues.value[index] = folderName
          } else {
            // 如果没有相对路径，使用文件名去掉扩展名
            const fileName = firstFile.name
            const folderName = fileName.substring(0, fileName.lastIndexOf('.')) || fileName
            inputValues.value[index] = folderName
          }
          
          validateInput(index)
        }
        document.body.removeChild(input)
      })
      
      // 添加取消事件监听
      input.addEventListener('cancel', () => {
        document.body.removeChild(input)
      })
      
      input.click()
    }

    // 图像文件选择处理
    const handleImageSelect = (index) => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/*'
      input.style.position = 'absolute'
      input.style.left = '-9999px'
      document.body.appendChild(input)
      
      input.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0]
          const reader = new FileReader()
          reader.onload = (event) => {
            inputValues.value[index] = event.target.result
            validateInput(index)
          }
          reader.readAsDataURL(file)
        }
        document.body.removeChild(input)
      })
      
      input.click()
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
      handleDateChange,
      handleSubmit,
      handleCancel,
      handleReset,
      selectQuickOption,
      handleDateSelect,
      handleFileSelect,
      handleFolderSelect,
      handleImageSelect,
      addInputItem,
      removeInputItem,
      clearAll,
      fillExample,
      parseSelectData,
      getSelectOptions,
      isSpecialSelector,
      getOptionDisplayName,
      getSpecialInputType,
      getSpecialInputTitle,
      handleSpecialInput,
      hasNonSpecialOptions,
      getNonSpecialOptions,
      // 大文本编辑器
      showTextEditor,
      textEditorRef,
      editorText,
      openTextEditor,
      closeTextEditor,
      saveEditorText,
      // 日期选择器
      showDatePicker,
      selectedDate,
      handleDateConfirm,
      handleDateCancel,
      // 选项弹窗
      showSelectOptions,
      currentSelectOptions,
      selectedRadioValue,
      openSelectOptions,
      selectOption,
      handleRadioChange,
      confirmRadioSelection,
      isOptionSelected,
      // 多选相关
      selectedCheckboxValues,
      isMultiSelectMode,
      currentSelectColumn,
      selectAll,
      clearSelection,
      invertSelection,
      confirmMultiSelection,
      // 帮助弹窗
      showHelpDialog,
      helpContent,
      showHelpPopup,
      closeHelpDialog
    }
  }
}
</script>

<style scoped>
/* 主容器 */
.multi-input-action-modern {
  display: flex;
  flex-direction: column;
  height: 100%;
  max-height: 100vh;
  background: var(--ds-surface);
  border-radius: 8px;
  overflow: hidden;
}

/* 消息区域 */
.message-section {
  padding: 12px 16px;
  background: var(--ds-background-information-subtle);
  border-bottom: 1px solid var(--ds-border-subtle);
  flex-shrink: 0;
}

.message-content {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.message-icon {
  flex-shrink: 0;
  margin-top: 2px;
}

.message-text {
  flex: 1;
  font-size: 13px;
  line-height: 1.5;
  color: var(--ds-text);
}

/* 媒体区域 */
.media-section {
  padding: 8px 16px;
  border-bottom: 1px solid var(--ds-border-subtle);
  flex-shrink: 0;
}

.image-container {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 8px;
}

.action-image-modern {
  max-width: 100%;
  max-height: 200px;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 输入项容器 - 修复滚动问题 */
.inputs-section {
  flex: 1;
  min-height: 0; /* 关键：允许flex子项收缩 */
  display: flex;
  flex-direction: column;
  overflow: hidden; /* 防止整个section滚动 */
  max-height: 60vh; /* 使用视口高度单位，更适合不同屏幕 */
}

/* 移动端优化 */
@media (max-width: 768px) {
  .inputs-section {
    max-height: 70vh; /* 移动端使用更大的高度比例 */
  }
}

@media (max-width: 480px) {
  .inputs-section {
    max-height: 75vh; /* 小屏手机使用更大的高度比例 */
  }
}

.inputs-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px; /* 减少间距从12px到8px */
  padding: 8px 16px; /* 减少上下内边距 */
  overflow-y: auto; /* 启用垂直滚动 */
  overflow-x: hidden;
  min-height: 0; /* 允许flex收缩 */
  max-height: 100%; /* 不超出父容器 */
  /* 自定义滚动条样式 */
  scrollbar-width: thin;
  scrollbar-color: var(--ds-border-subtle) transparent;
}

/* 移动端内边距优化 */
@media (max-width: 768px) {
  .inputs-container {
    padding: 6px 12px; /* 移动端使用更紧凑的内边距 */
    gap: 6px; /* 减少项目间距 */
  }
}

@media (max-width: 480px) {
  .inputs-container {
    padding: 4px 8px; /* 小屏手机使用最紧凑的内边距 */
    gap: 4px; /* 最小项目间距 */
  }
}

.inputs-container::-webkit-scrollbar {
  width: 6px;
}

.inputs-container::-webkit-scrollbar-track {
  background: transparent;
}

.inputs-container::-webkit-scrollbar-thumb {
  background: var(--ds-border-subtle);
  border-radius: 3px;
}

.inputs-container::-webkit-scrollbar-thumb:hover {
  background: var(--ds-border);
}

.input-item {
  display: flex;
  flex-direction: column;
  gap: 4px; /* 进一步减少内部间距 */
  position: relative;
  background: var(--ds-background-subtle, #f6f8fa);
  border: 1px solid var(--ds-border-subtle, #d1d9e0);
  border-radius: 8px;
  padding: 10px; /* 进一步减少内边距 */
  transition: all 0.2s ease;
}

.input-item:hover {
  border-color: var(--ds-border-brand);
  box-shadow: 0 0 0 1px var(--ds-border-brand-alpha);
}

/* 标签容器 */
.input-label-container {
  display: flex;
  flex-direction: column;
  gap: 2px; /* 减少标签和帮助文本间距 */
}

.input-label {
  font-size: 13px; /* 稍微减小字体 */
  font-weight: 500;
  color: var(--ds-text-subtle);
  display: flex;
  align-items: center;
  gap: 4px;
  margin: 0;
}

.required-indicator {
  color: var(--ds-text-danger);
  font-size: 12px;
}

.help-button {
  background: #3742fa;
  color: white;
  border: none;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  font-size: 12px;
  font-weight: bold;
  cursor: pointer;
  margin-left: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.help-button:hover {
  background: #2f3542;
  transform: scale(1.1);
}

.help-content {
  font-size: 14px;
  line-height: 1.6;
  color: var(--ds-text);
  padding: 16px 0;
}

.input-help {
  font-size: 11px; /* 减小帮助文本字体 */
  color: var(--ds-text-subtlest);
  line-height: 1.3;
}

/* 输入组 */
.input-group {
  display: flex;
  flex-direction: column;
  gap: 6px; /* 减少组内间距 */
}

/* 快速选择 */
.quick-select {
  display: flex;
  flex-direction: column;
  gap: 4px; /* 减少间距 */
}

.quick-select-options {
  display: flex;
  flex-wrap: wrap;
  gap: 4px; /* 减少标签间距 */
}

.quick-select-tag {
  padding: 3px 8px; /* 减少标签内边距 */
  font-size: 11px; /* 减小字体 */
  background: #f5f5f5; /* 灰底 */
  border: 1px solid #d0d0d0;
  border-radius: 4px;
  color: #333; /* 黑字 */
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 4px;
}

.quick-select-tag:hover {
  background: #e8e8e8;
  border-color: #b0b0b0;
}

.quick-select-tag:active {
  background: #d8d8d8;
}

/* 选中状态 - 绿底白字 */
.quick-select-tag.selected {
  background: #22c55e; /* 绿底 */
  border-color: #16a34a;
  color: #ffffff; /* 白字 */
}

.quick-select-tag.selected:hover {
  background: #16a34a;
  border-color: #15803d;
}

.quick-select-tag.selected:active {
  background: #15803d;
}

.quick-select-tag.special-selector {
  background: var(--ds-background-brand-subtle);
  color: var(--ds-text-brand);
  border-color: var(--ds-border-brand);
}

.quick-select-tag.special-selector:hover {
  background: var(--ds-background-brand);
  color: var(--ds-text-inverse);
}

.selector-icon {
  flex-shrink: 0;
}

/* 现代输入框 */
.input-container {
  position: relative;
}

.input-wrapper-modern {
  position: relative;
  display: flex;
  align-items: center;
  background: var(--ds-surface, #ffffff);
  border: 1px solid var(--ds-border, #d0d7de);
  border-radius: 6px;
  transition: all 0.2s ease;
  overflow: hidden;
}

.input-wrapper-modern:focus-within {
  border-color: var(--ds-border-focused);
  box-shadow: 0 0 0 1px var(--ds-border-focused-alpha);
}

.input-field-modern {
  flex: 1;
  padding: 8px 10px; /* 减少内边距 */
  border: none;
  background: transparent;
  font-size: 13px; /* 稍微减小字体 */
  color: var(--ds-text);
  outline: none;
  min-height: 20px; /* 减少最小高度 */
}

.input-field-modern::placeholder {
  color: var(--ds-text-subtlest, #8b949e);
}

.input-field-modern.error {
  color: var(--ds-text-danger);
}

.input-field-modern.success {
  color: var(--ds-text-success);
}

/* 日期选择器样式 */
.date-picker-modern {
  flex: 1;
  border: none;
  background: transparent;
  width: 100%;
}

/* 自定义 Arco DatePicker 样式 */
.date-picker-modern :deep(.arco-picker) {
  width: 100%;
  border: none;
  background: transparent;
  box-shadow: none;
  padding: 8px 10px;
  font-size: 13px;
  min-height: 20px;
}

.date-picker-modern :deep(.arco-picker-input) {
  color: var(--ds-text);
  font-size: 13px;
}

.date-picker-modern :deep(.arco-picker-input::placeholder) {
  color: var(--ds-text-subtlest, #8b949e);
}

.date-picker-modern :deep(.arco-picker-suffix) {
  color: var(--ds-text-subtle);
}

/* 确保日期选择器面板正确显示 */
.date-picker-modern :deep(.arco-picker-dropdown) {
  z-index: 9999 !important;
}

/* 修复日期选择器弹出层样式 */
.date-picker-modern :deep(.arco-picker-panel) {
  z-index: 9999 !important;
}

.date-picker-modern :deep(.arco-picker-popup) {
  z-index: 9999 !important;
}

/* 确保日期选择器容器不被遮挡 */
.date-picker-modern :deep(.arco-picker-container) {
  position: relative;
  z-index: 1;
}



/* 输入操作按钮 */
.input-actions {
  display: flex;
  align-items: center;
  padding: 0 6px; /* 减少内边距 */
}

.expand-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px; /* 减小按钮尺寸 */
  height: 24px;
  border: none;
  background: transparent;
  color: var(--ds-text-subtle);
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.15s ease;
}

.expand-btn:hover {
  background: var(--ds-background-neutral-hovered);
  color: var(--ds-text);
}

.expand-btn:active {
  background: var(--ds-background-neutral-pressed);
}

/* 展开选项按钮 */
.expand-options-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  color: var(--ds-text-subtle);
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.15s ease;
}

.expand-options-btn:hover {
  background: var(--ds-background-neutral-hovered);
  color: var(--ds-text);
}

.expand-options-btn:active {
  background: var(--ds-background-neutral-pressed);
}

/* 特殊输入框按钮 */
.special-input-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.15s ease;
}

.special-input-btn:hover {
  background: var(--ds-background-neutral-hovered);
}

.special-input-btn:active {
  background: var(--ds-background-neutral-pressed);
}

/* 特殊输入框按钮颜色 */
.special-calendar {
  color: #3b82f6; /* 蓝色 - 日历 */
}

.special-file {
  color: #10b981; /* 绿色 - 文件 */
}

.special-folder {
  color: #f59e0b; /* 橙色 - 文件夹 */
}

.special-image {
  color: #8b5cf6; /* 紫色 - 图片 */
}

.special-input-btn:hover {
  opacity: 0.8;
}

/* 文本域容器 */
.textarea-container {
  position: relative;
}

.textarea-wrapper-modern {
  position: relative;
  background: var(--ds-surface);
  border: 1px solid var(--ds-border);
  border-radius: 6px;
  transition: all 0.2s ease;
}

.textarea-wrapper-modern:focus-within {
  border-color: var(--ds-border-focused);
  box-shadow: 0 0 0 1px var(--ds-border-focused-alpha);
}

.textarea-field-modern {
  width: 100%;
  padding: 8px 10px; /* 减少内边距 */
  border: none;
  background: transparent;
  font-size: 13px; /* 稍微减小字体 */
  color: var(--ds-text);
  outline: none;
  resize: vertical;
  min-height: 60px; /* 减少最小高度 */
  line-height: 1.4;
  font-family: inherit;
}

.textarea-field-modern::placeholder {
  color: var(--ds-text-subtlest);
}

.textarea-field-modern.error {
  color: var(--ds-text-danger);
}

.textarea-field-modern.success {
  color: var(--ds-text-success);
}

.textarea-expand {
  position: absolute;
  top: 6px; /* 调整位置 */
  right: 6px;
  z-index: 1;
}

/* 输入状态 */
.input-status {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  min-height: 16px; /* 减少最小高度 */
}

.error-message {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--ds-text-danger);
  font-size: 11px; /* 减小字体 */
}

.char-count {
  font-size: 10px; /* 减小字体 */
  color: var(--ds-text-subtlest);
  white-space: nowrap;
}

/* 删除按钮 */
.remove-btn {
  position: absolute;
  top: 8px; /* 调整位置 */
  right: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px; /* 减小尺寸 */
  height: 20px;
  border: none;
  background: var(--ds-background-danger-subtle);
  color: var(--ds-text-danger);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s ease;
  z-index: 2;
}

.remove-btn:hover {
  background: var(--ds-background-danger);
  color: var(--ds-text-inverse);
}

.remove-btn:active {
  background: var(--ds-background-danger-bold);
}

/* 增强功能区域 */
.enhanced-section {
  padding: 0.75rem;
  background: rgba(248, 250, 252, 0.8);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: var(--ds-radius-lg);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

/* 增强控制区域 */
.enhanced-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px; /* 减少内边距 */
  background: var(--ds-background-subtle);
  border: 1px solid var(--ds-border-subtle);
  border-radius: 6px;
  margin-top: 8px; /* 减少上边距 */
  gap: 8px;
}

.enhanced-controls-left {
  display: flex;
  gap: 6px; /* 减少按钮间距 */
}

.enhanced-controls-right {
  display: flex;
  gap: 6px; /* 减少按钮间距 */
}

.add-input-btn,
.batch-action-btn {
  padding: 4px 8px; /* 减少内边距 */
  font-size: 11px; /* 减小字体 */
  background: var(--ds-background-brand-subtle);
  color: var(--ds-text-brand);
  border: 1px solid var(--ds-border-brand);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s ease;
  display: flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}

.add-input-btn:hover,
.batch-action-btn:hover {
  background: var(--ds-background-brand);
  color: var(--ds-text-inverse);
}

.add-input-btn:active,
.batch-action-btn:active {
  background: var(--ds-background-brand-bold);
}

.batch-controls {
  display: flex;
  gap: 0.375rem;
}

/* 超时提示 */
.timeout-section {
  padding: 0.625rem 0.75rem;
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

/* 超时显示 */
.timeout-display {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px 12px; /* 减少内边距 */
  background: var(--ds-background-warning-subtle);
  color: var(--ds-text-warning);
  border: 1px solid var(--ds-border-warning);
  border-radius: 6px;
  font-size: 12px; /* 减小字体 */
  font-weight: 500;
  gap: 6px;
  margin-top: 8px; /* 减少上边距 */
}

.timeout-icon {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
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

/* 底部按钮区域 */
.footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px; /* 减少按钮间距 */
  padding: 12px 16px; /* 减少内边距 */
  background: var(--ds-background-subtle);
  border-top: 1px solid var(--ds-border-subtle);
  margin-top: auto;
}

.footer-btn {
  padding: 6px 16px; /* 减少内边距 */
  font-size: 13px; /* 稍微减小字体 */
  font-weight: 500;
  border: 1px solid var(--ds-border);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
  min-width: 60px; /* 减少最小宽度 */
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.footer-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.footer-btn.cancel {
  background: var(--ds-background);
  color: var(--ds-text-subtle);
  border-color: var(--ds-border);
}

.footer-btn.cancel:hover:not(:disabled) {
  background: var(--ds-background-neutral-hovered);
  color: var(--ds-text);
}

.footer-btn.reset {
  background: var(--ds-background-warning-subtle);
  color: var(--ds-text-warning);
  border-color: var(--ds-border-warning);
}

.footer-btn.reset:hover:not(:disabled) {
  background: var(--ds-background-warning);
  color: var(--ds-text-inverse);
}

.footer-btn.confirm {
  background: var(--ds-background-brand);
  color: var(--ds-text-inverse);
  border-color: var(--ds-border-brand);
}

.footer-btn.confirm:hover:not(:disabled) {
  background: var(--ds-background-brand-bold);
}

.footer-btn.confirm:active:not(:disabled) {
  background: var(--ds-background-brand-boldest);
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

/* 大文本编辑器对话框 */
.large-text-editor {
  .dialog-content {
    width: 90vw;
    max-width: 800px;
    height: 70vh;
    max-height: 600px;
    display: flex;
    flex-direction: column;
  }

  .dialog-header {
    padding: 12px 16px; /* 减少内边距 */
    border-bottom: 1px solid var(--ds-border-subtle);
    background: var(--ds-background-subtle);
  }

  .dialog-title {
    font-size: 14px; /* 减小字体 */
    font-weight: 600;
    color: var(--ds-text);
    margin: 0;
  }

  .dialog-body {
    flex: 1;
    padding: 12px; /* 减少内边距 */
    display: flex;
    flex-direction: column;
  }

  .large-textarea {
    flex: 1;
    width: 100%;
    border: 1px solid var(--ds-border);
    border-radius: 6px;
    padding: 12px; /* 减少内边距 */
    font-size: 13px; /* 稍微减小字体 */
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    line-height: 1.5;
    resize: none;
    outline: none;
    background: var(--ds-surface);
    color: var(--ds-text);
  }

  .large-textarea:focus {
    border-color: var(--ds-border-focused);
    box-shadow: 0 0 0 1px var(--ds-border-focused-alpha);
  }

  .dialog-footer {
    padding: 12px 16px; /* 减少内边距 */
    border-top: 1px solid var(--ds-border-subtle);
    background: var(--ds-background-subtle);
    display: flex;
    justify-content: flex-end;
    gap: 8px; /* 减少按钮间距 */
  }
}

/* 响应式设计 */
@media (max-width: 640px) {
  .multi-input-action-modern {
    gap: 0.75rem;
  }
  
  .input-item {
    padding: 0.5rem;
  }
  
  .enhanced-controls {
    flex-direction: column;
    align-items: stretch;
  }
  
  .enhanced-controls-left,
  .enhanced-controls-right {
    justify-content: center;
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

/* 日期选择器容器样式 */
.date-picker-container {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 日期选择器输入框样式 */
.date-picker-container :deep(.ant-picker) {
  width: 100%;
  height: 40px;
  border-radius: 6px;
  border: 1px solid var(--ds-border, #d0d7de);
  font-size: 14px;
}

.date-picker-container :deep(.ant-picker-input > input) {
  font-size: 14px;
  color: var(--ds-text, #24292f);
}

.date-picker-container :deep(.ant-picker-input > input::placeholder) {
  color: var(--ds-text-subtlest, #8b949e);
}

/* 选项弹窗样式 */
.select-options-content {
  padding: 16px;
}

/* 单选容器样式 */
.radio-container {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid var(--ds-border, #d0d7de);
  border-radius: 8px;
  background: var(--ds-surface, #ffffff);
  padding: 8px;
}

.radio-options-list {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.radio-option-item {
  margin: 0;
  padding: 0;
}

/* 自定义radio样式，让它看起来像按钮 */
.radio-options-list :deep(.arco-radio) {
  width: 100%;
  margin: 0;
  padding: 0;
  border-radius: 6px;
  border: 1px solid var(--ds-border, #d0d7de);
  background: var(--ds-surface, #ffffff);
  transition: all 0.2s ease;
}

.radio-options-list :deep(.arco-radio:hover) {
  border-color: var(--ds-border-accent, #3b82f6);
  background: var(--ds-background-neutral-hovered, #f6f8fa);
}

.radio-options-list :deep(.arco-radio-checked) {
  border-color: var(--ds-border-accent, #3b82f6);
  background: var(--ds-background-accent-subtle, #dbeafe);
}

.radio-options-list :deep(.arco-radio-checked:hover) {
  background: var(--ds-background-accent-subtle-hovered, #bfdbfe);
}

.radio-options-list :deep(.arco-radio .arco-radio-label) {
  width: 100%;
  padding: 8px 12px;
  margin: 0;
  color: var(--ds-text, #24292f);
  font-size: 13px;
  line-height: 1.4;
  cursor: pointer;
}

.radio-options-list :deep(.arco-radio-checked .arco-radio-label) {
  color: var(--ds-text-accent, #1e40af);
  font-weight: 500;
}

.radio-options-list :deep(.arco-radio .arco-radio-button) {
  margin: 6px 0 6px 10px;
}

.radio-options-list :deep(.arco-radio .arco-radio-button::after) {
  border-color: var(--ds-border-accent, #3b82f6);
}

.radio-options-list :deep(.arco-radio-checked .arco-radio-button) {
  border-color: var(--ds-border-accent, #3b82f6);
  background-color: var(--ds-background-accent, #3b82f6);
}

/* 多选相关样式 */
.multiselect-container {
  display: flex;
  gap: 16px;
  min-height: 300px;
}

.multiselect-main {
  flex: 1;
}

.checkbox-grid {
  display: grid;
  gap: 12px 16px;
  padding: 8px;
}

.checkbox-option-item {
  padding: 8px 12px;
  border: 1px solid var(--ds-border, #d1d5db);
  border-radius: 6px;
  background: var(--ds-background, #ffffff);
  transition: all 0.2s ease;
  cursor: pointer;
  font-size: 14px;
}

.checkbox-option-item:hover {
  border-color: var(--ds-border-accent, #3b82f6);
  background: var(--ds-background-hover, #f8fafc);
}

.checkbox-option-item :deep(.arco-checkbox-checked .arco-checkbox-icon) {
  background-color: var(--ds-background-accent, #3b82f6);
  border-color: var(--ds-border-accent, #3b82f6);
}

.multiselect-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 80px;
  padding: 8px;
}

.btn-small {
  padding: 6px 12px;
  font-size: 12px;
  min-height: 32px;
  white-space: nowrap;
}
</style>