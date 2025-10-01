/**
 * Action组件类型定义
 * 基于T4 Action交互功能开发指南
 */

// Action类型枚举
export const ActionType = {
  INPUT: 'input',
  EDIT: 'edit',
  MULTI_INPUT: 'multiInput',
  MULTI_INPUT_X: 'multiInputX',
  MENU: 'menu',
  SELECT: 'select',
  MSGBOX: 'msgbox',
  WEBVIEW: 'webview',
  HELP: 'help'
}

// 错误类型枚举
export const ActionErrorType = {
  PARSE_ERROR: 'PARSE_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  USER_CANCEL: 'USER_CANCEL'
}

// 输入类型枚举
export const InputType = {
  TEXT: 0,
  PASSWORD: 1,
  NUMBER: 2,
  EMAIL: 3,
  URL: 4,
  FOLDER_SELECT: 5,
  FILE_SELECT: 6,
  DATE_SELECT: 7,
  IMAGE_BASE64: 8
}

// 按钮类型枚举
export const ButtonType = {
  OK_CANCEL: 0,
  OK_ONLY: 1,
  CANCEL_ONLY: 2,
  CUSTOM: 3,
}

/**
 * 规范化按钮类型值
 * 如果传入的值不存在于ButtonType枚举中，则默认返回CUSTOM
 * @param {*} buttonType - 按钮类型值
 * @returns {number} 规范化后的按钮类型值
 */
export const normalizeButtonType = (buttonType) => {
  // 如果buttonType是undefined或null，使用默认值OK_CANCEL
  if (buttonType === undefined || buttonType === null) {
    return ButtonType.OK_CANCEL
  }
  
  // 检查是否为有效的ButtonType值
  const validValues = Object.values(ButtonType)
  if (validValues.includes(buttonType)) {
    return buttonType
  }
  
  // 如果不是有效值，默认返回CUSTOM
  return ButtonType.CUSTOM
}

/**
 * 基础Action配置接口
 */
export const createActionConfig = (config) => ({
  actionId: '',
  type: ActionType.INPUT,
  ...config
})

/**
 * 单项输入Action配置
 */
export const createInputActionConfig = (config) => ({
  ...createActionConfig(config),
  type: ActionType.INPUT,
  id: '',
  title: '',
  tip: '',
  value: '',
  msg: '',
  width: 300,
  button: ButtonType.OK_CANCEL,
  selectData: '',
  imageUrl: '',
  imageHeight: 200,
  imageClickCoord: false,
  qrcode: '',
  qrcodeSize: '200x200',
  timeout: 0,
  keep: false,
  help: ''
})

/**
 * 多项输入Action配置
 */
export const createMultiInputActionConfig = (config) => ({
  ...createActionConfig(config),
  type: ActionType.MULTI_INPUT,
  title: '',
  width: 400,
  height: 300,
  msg: '',
  button: ButtonType.OK_CANCEL,
  input: []
})

/**
 * 输入项配置
 */
export const createInputItem = (config) => ({
  id: '',
  name: '',
  tip: '',
  value: '',
  selectData: '',
  inputType: InputType.TEXT,
  multiLine: 1,
  validation: '',
  help: '',
  quickSelect: false,
  onlyQuickSelect: false,
  multiSelect: false,
  selectWidth: 200,
  selectColumn: 1,
  ...config
})

/**
 * 菜单Action配置
 */
export const createMenuActionConfig = (config) => ({
  ...createActionConfig(config),
  type: ActionType.MENU,
  title: '',
  width: 300,
  column: 1,
  option: [],
  selectedIndex: -1
})

/**
 * 菜单选项配置
 */
export const createMenuOption = (config) => ({
  name: '',
  action: '',
  ...config
})

/**
 * 多选Action配置
 */
export const createSelectActionConfig = (config) => ({
  ...createActionConfig(config),
  type: ActionType.SELECT,
  title: '',
  width: 300,
  column: 1,
  option: []
})

/**
 * 多选选项配置
 */
export const createSelectOption = (config) => ({
  name: '',
  action: '',
  selected: false,
  ...config
})

/**
 * 消息弹窗Action配置
 */
export const createMsgBoxActionConfig = (config) => ({
  ...createActionConfig(config),
  type: ActionType.MSGBOX,
  title: '',
  msg: '',
  htmlMsg: '',
  imageUrl: ''
})

/**
 * WebView Action配置
 */
export const createWebViewActionConfig = (config) => ({
  ...createActionConfig(config),
  type: ActionType.WEBVIEW,
  url: '',
  height: 400,
  textZoom: 100
})

/**
 * 帮助Action配置
 */
export const createHelpActionConfig = (config) => ({
  ...createActionConfig(config),
  type: ActionType.HELP,
  title: '',
  content: ''
})

/**
 * Action状态接口
 */
export const createActionState = () => ({
  currentAction: null,
  isVisible: false,
  isLoading: false,
  error: null,
  history: []
})

/**
 * Action错误接口
 */
export const createActionError = (type, message, details = null) => ({
  type,
  message,
  details
})

/**
 * Action响应接口
 */
export const createActionResponse = (config) => ({
  success: true,
  data: null,
  action: null,
  toast: '',
  error: '',
  ...config
})

/**
 * 解析Action配置
 */
export const parseActionConfig = (data) => {
  try {
    if (typeof data === 'string') {
      return JSON.parse(data)
    }
    // 如果data是一个包含config属性的对象（如action对象），则返回config
    if (data && typeof data === 'object' && data.config) {
      return data.config
    }
    // 否则直接返回data（假设它本身就是配置对象）
    return data
  } catch (error) {
    throw createActionError(
      ActionErrorType.PARSE_ERROR,
      '无法解析Action配置',
      error
    )
  }
}

/**
 * 验证Action配置
 */
export const validateActionConfig = (config) => {
  if (!config || typeof config !== 'object') {
    throw createActionError(
      ActionErrorType.VALIDATION_ERROR,
      'Action配置必须是一个对象'
    )
  }

  if (!config.actionId) {
    throw createActionError(
      ActionErrorType.VALIDATION_ERROR,
      'actionId是必需的'
    )
  }

  if (!Object.values(ActionType).includes(config.type)) {
    throw createActionError(
      ActionErrorType.VALIDATION_ERROR,
      `不支持的Action类型: ${config.type}`
    )
  }

  return true
}

/**
 * 获取快速选择数据
 */
export const parseSelectData = (selectData) => {
  if (!selectData) return []
  
  try {
    // 支持JSON格式
    if (selectData.startsWith('[') || selectData.startsWith('{')) {
      return JSON.parse(selectData)
    }
    
    // 支持 [tag]:=[value] 格式，用逗号分隔
    if (selectData.includes(':=')) {
      return selectData.split(',').map(item => {
        const trimmedItem = item.trim()
        const [name, value] = trimmedItem.split(':=')
        return {
          name: name ? name.trim() : trimmedItem,
          value: value ? value.trim() : trimmedItem
        }
      }).filter(item => item.name) // 过滤掉空项
    }
    
    // 支持简单的分隔符格式（兼容旧格式）
    return selectData.split('|').map(item => {
      const [name, value] = item.split('=')
      return {
        name: name || item,
        value: value || item
      }
    })
  } catch (error) {
    console.warn('解析selectData失败:', error)
    return []
  }
}

/**
 * 生成二维码URL
 */
export const generateQRCodeUrl = (text, size = '200x200') => {
  const [width, height] = size.split('x').map(s => parseInt(s) || 200)
  return `https://api.qrserver.com/v1/create-qr-code/?size=${width}x${height}&data=${encodeURIComponent(text)}`
}

/**
 * 防抖函数
 */
export const debounce = (func, wait) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

/**
 * 节流函数
 */
export const throttle = (func, limit) => {
  let inThrottle
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}