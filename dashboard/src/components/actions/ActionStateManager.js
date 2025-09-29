import { reactive, ref, computed } from 'vue'
import { ActionType, ActionErrorType } from './types.js'

/**
 * Action状态管理器
 * 负责管理Action的状态、历史记录和全局配置
 */
class ActionStateManager {
  constructor() {
    // 当前活动的Action
    this.currentAction = ref(null)
    
    // Action历史记录
    this.actionHistory = ref([])
    
    // 全局配置
    this.globalConfig = reactive({
      // 默认超时时间（秒）
      defaultTimeout: 30,
      // 最大历史记录数
      maxHistorySize: 100,
      // 是否启用调试模式
      debugMode: false,
      // 默认主题
      theme: 'default',
      // 是否允许多个Action同时显示
      allowMultiple: false,
      // 默认弹窗配置
      defaultDialog: {
        width: 400,
        height: null,
        canceledOnTouchOutside: true
      }
    })
    
    // Action队列（当不允许多个Action时使用）
    this.actionQueue = ref([])
    
    // 错误处理器
    this.errorHandlers = new Map()
    
    // 事件监听器
    this.eventListeners = new Map()
    
    // 统计信息
    this.statistics = reactive({
      totalActions: 0,
      successfulActions: 0,
      canceledActions: 0,
      errorActions: 0,
      averageResponseTime: 0
    })
  }

  /**
   * 显示Action
   * @param {Object} config - Action配置
   * @param {Object} options - 显示选项
   * @returns {Promise} Action结果
   */
  async showAction(config, options = {}) {
    try {
      // 验证配置
      this.validateConfig(config)
      
      // 创建Action实例
      const action = this.createAction(config, options)
      
      // 检查是否允许多个Action
      if (!this.globalConfig.allowMultiple && this.currentAction.value) {
        if (options.force) {
          // 强制关闭当前Action
          await this.closeCurrentAction()
        } else {
          // 加入队列
          return this.enqueueAction(action)
        }
      }
      
      // 设置当前Action
      this.currentAction.value = action
      
      // 添加到历史记录
      this.addToHistory(action)
      
      // 更新统计
      this.statistics.totalActions++
      
      // 触发事件
      this.emit('action-show', action)
      
      // 启动超时计时器
      this.startTimeout(action)
      
      // 返回Promise
      return new Promise((resolve, reject) => {
        action.resolve = resolve
        action.reject = reject
      })
      
    } catch (error) {
      this.handleError(error, config)
      throw error
    }
  }

  /**
   * 创建Action实例
   * @param {Object} config - Action配置
   * @param {Object} options - 选项
   * @returns {Object} Action实例
   */
  createAction(config, options) {
    const action = {
      id: this.generateId(),
      type: config.type,
      config: { ...config },
      options: { ...options },
      status: 'pending',
      visible: true,
      startTime: Date.now(),
      endTime: null,
      result: null,
      error: null,
      timeout: null,
      resolve: null,
      reject: null
    }
    
    // 合并全局配置
    this.mergeGlobalConfig(action)
    
    return action
  }

  /**
   * 合并全局配置
   * @param {Object} action - Action实例
   */
  mergeGlobalConfig(action) {
    // 设置默认超时
    if (!action.config.timeout && this.globalConfig.defaultTimeout > 0) {
      action.config.timeout = this.globalConfig.defaultTimeout
    }
    
    // 合并弹窗配置
    if (!action.config.width) {
      action.config.width = this.globalConfig.defaultDialog.width
    }
    if (!action.config.height) {
      action.config.height = this.globalConfig.defaultDialog.height
    }
    if (action.config.canceledOnTouchOutside === undefined) {
      action.config.canceledOnTouchOutside = this.globalConfig.defaultDialog.canceledOnTouchOutside
    }
  }

  /**
   * 提交Action结果
   * @param {*} result - 结果数据
   */
  submitAction(result) {
    const action = this.currentAction.value
    if (!action) return
    
    action.status = 'completed'
    action.result = result
    action.endTime = Date.now()
    action.visible = false
    
    // 清除超时
    this.clearTimeout(action)
    
    // 更新统计
    this.statistics.successfulActions++
    this.updateAverageResponseTime(action)
    
    // 触发事件
    this.emit('action-submit', { action, result })
    
    // 解析Promise
    if (action.resolve) {
      action.resolve(result)
    }
    
    // 处理下一个Action
    this.processNextAction()
  }

  /**
   * 取消Action
   * @param {string} reason - 取消原因
   */
  cancelAction(reason = 'user_cancel') {
    const action = this.currentAction.value
    if (!action) return
    
    action.status = 'canceled'
    action.error = { type: 'cancel', reason }
    action.endTime = Date.now()
    action.visible = false
    
    // 清除超时
    this.clearTimeout(action)
    
    // 更新统计
    this.statistics.canceledActions++
    
    // 触发事件
    this.emit('action-cancel', { action, reason })
    
    // 拒绝Promise
    if (action.reject) {
      action.reject(new Error(`Action canceled: ${reason}`))
    }
    
    // 处理下一个Action
    this.processNextAction()
  }

  /**
   * Action错误处理
   * @param {Error} error - 错误对象
   */
  actionError(error) {
    const action = this.currentAction.value
    if (!action) return
    
    action.status = 'error'
    action.error = error
    action.endTime = Date.now()
    
    // 清除超时
    this.clearTimeout(action)
    
    // 更新统计
    this.statistics.errorActions++
    
    // 触发事件
    this.emit('action-error', { action, error })
    
    // 处理错误
    this.handleError(error, action.config)
    
    // 拒绝Promise
    if (action.reject) {
      action.reject(error)
    }
    
    // 处理下一个Action
    this.processNextAction()
  }

  /**
   * 关闭当前Action
   */
  async closeCurrentAction() {
    if (this.currentAction.value) {
      this.cancelAction('force_close')
    }
  }

  /**
   * 将Action加入队列
   * @param {Object} action - Action实例
   * @returns {Promise} Action结果
   */
  enqueueAction(action) {
    this.actionQueue.value.push(action)
    
    return new Promise((resolve, reject) => {
      action.resolve = resolve
      action.reject = reject
    })
  }

  /**
   * 处理下一个Action
   */
  processNextAction() {
    // 清除当前Action
    this.currentAction.value = null
    
    // 处理队列中的下一个Action
    if (this.actionQueue.value.length > 0) {
      const nextAction = this.actionQueue.value.shift()
      this.currentAction.value = nextAction
      
      // 添加到历史记录
      this.addToHistory(nextAction)
      
      // 更新统计
      this.statistics.totalActions++
      
      // 触发事件
      this.emit('action-show', nextAction)
      
      // 启动超时计时器
      this.startTimeout(nextAction)
    }
  }

  /**
   * 启动超时计时器
   * @param {Object} action - Action实例
   */
  startTimeout(action) {
    if (!action.config.timeout || action.config.timeout <= 0) return
    
    action.timeout = setTimeout(() => {
      if (action === this.currentAction.value) {
        this.cancelAction('timeout')
      }
    }, action.config.timeout * 1000)
  }

  /**
   * 清除超时计时器
   * @param {Object} action - Action实例
   */
  clearTimeout(action) {
    if (action.timeout) {
      clearTimeout(action.timeout)
      action.timeout = null
    }
  }

  /**
   * 添加到历史记录
   * @param {Object} action - Action实例
   */
  addToHistory(action) {
    this.actionHistory.value.unshift(action)
    
    // 限制历史记录大小
    if (this.actionHistory.value.length > this.globalConfig.maxHistorySize) {
      this.actionHistory.value = this.actionHistory.value.slice(0, this.globalConfig.maxHistorySize)
    }
  }

  /**
   * 更新平均响应时间
   * @param {Object} action - Action实例
   */
  updateAverageResponseTime(action) {
    const responseTime = action.endTime - action.startTime
    const total = this.statistics.successfulActions
    const current = this.statistics.averageResponseTime
    
    this.statistics.averageResponseTime = Math.round(
      (current * (total - 1) + responseTime) / total
    )
  }

  /**
   * 验证配置
   * @param {Object} config - Action配置
   */
  validateConfig(config) {
    if (!config || typeof config !== 'object') {
      throw new Error('Action配置不能为空')
    }
    
    if (!config.type || !Object.values(ActionType).includes(config.type)) {
      throw new Error(`无效的Action类型: ${config.type}`)
    }
    
    // 验证actionId是必需的
    if (!config.actionId || typeof config.actionId !== 'string') {
      throw new Error('actionId是必需的，且必须是字符串类型')
    }
    
    // 根据类型进行特定验证
    switch (config.type) {
      case ActionType.INPUT:
        if (!config.msg && !config.img && !config.qr) {
          throw new Error('InputAction必须包含消息、图片或二维码')
        }
        break
        
      case ActionType.MULTI_INPUT:
        // 支持 input 和 inputs 两种字段名称
        const inputList = config.input || config.inputs
        if (!inputList || !Array.isArray(inputList) || inputList.length === 0) {
          throw new Error('MultiInputAction必须包含输入项列表')
        }
        break
        
      case ActionType.MULTI_INPUT_X:
        // 支持 input 和 inputs 两种字段名称
        const inputListX = config.input || config.inputs
        if (!inputListX || !Array.isArray(inputListX) || inputListX.length === 0) {
          throw new Error('MultiInputXAction必须包含输入项列表')
        }
        break
        
      case ActionType.MENU:
      case ActionType.SELECT:
        // 支持 option 和 options 两种字段名称
        const optionList = config.option || config.options
        if (!optionList || !Array.isArray(optionList) || optionList.length === 0) {
          throw new Error('MenuAction/SelectAction必须包含选项列表')
        }
        break
        
      case ActionType.MSGBOX:
        if (!config.msg && !config.img && !config.qr) {
          throw new Error('MsgBoxAction必须包含消息、图片或二维码')
        }
        break
        
      case ActionType.WEBVIEW:
        if (!config.url) {
          throw new Error('WebViewAction必须包含URL')
        }
        break
        
      case ActionType.HELP:
        if (!config.msg && !config.details && !config.steps) {
          throw new Error('HelpAction必须包含帮助内容')
        }
        break
    }
  }

  /**
   * 错误处理
   * @param {Error} error - 错误对象
   * @param {Object} config - Action配置
   */
  handleError(error, config) {
    // 记录错误
    if (this.globalConfig.debugMode) {
      console.error('Action错误:', error, config)
    }
    
    // 调用错误处理器
    const handler = this.errorHandlers.get(error.type) || this.errorHandlers.get('default')
    if (handler) {
      try {
        handler(error, config)
      } catch (handlerError) {
        console.error('错误处理器异常:', handlerError)
      }
    }
    
    // 触发错误事件
    this.emit('error', { error, config })
  }

  /**
   * 注册错误处理器
   * @param {string} type - 错误类型
   * @param {Function} handler - 处理函数
   */
  registerErrorHandler(type, handler) {
    this.errorHandlers.set(type, handler)
  }

  /**
   * 注册事件监听器
   * @param {string} event - 事件名称
   * @param {Function} listener - 监听函数
   */
  on(event, listener) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, [])
    }
    this.eventListeners.get(event).push(listener)
  }

  /**
   * 移除事件监听器
   * @param {string} event - 事件名称
   * @param {Function} listener - 监听函数
   */
  off(event, listener) {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      const index = listeners.indexOf(listener)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  /**
   * 触发事件
   * @param {string} event - 事件名称
   * @param {*} data - 事件数据
   */
  emit(event, data) {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data)
        } catch (error) {
          console.error('事件监听器异常:', error)
        }
      })
    }
  }

  /**
   * 生成唯一ID
   * @returns {string} 唯一ID
   */
  generateId() {
    return `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 获取Action历史记录
   * @param {Object} filter - 过滤条件
   * @returns {Array} 历史记录
   */
  getHistory(filter = {}) {
    let history = [...this.actionHistory.value]
    
    // 按类型过滤
    if (filter.type) {
      history = history.filter(action => action.type === filter.type)
    }
    
    // 按状态过滤
    if (filter.status) {
      history = history.filter(action => action.status === filter.status)
    }
    
    // 按时间范围过滤
    if (filter.startTime) {
      history = history.filter(action => action.startTime >= filter.startTime)
    }
    if (filter.endTime) {
      history = history.filter(action => action.endTime <= filter.endTime)
    }
    
    // 限制数量
    if (filter.limit) {
      history = history.slice(0, filter.limit)
    }
    
    return history
  }

  /**
   * 清除历史记录
   * @param {Object} filter - 过滤条件
   */
  clearHistory(filter = {}) {
    if (Object.keys(filter).length === 0) {
      // 清除所有历史记录
      this.actionHistory.value = []
    } else {
      // 按条件清除
      const toKeep = this.actionHistory.value.filter(action => {
        if (filter.type && action.type === filter.type) return false
        if (filter.status && action.status === filter.status) return false
        if (filter.before && action.startTime < filter.before) return false
        return true
      })
      this.actionHistory.value = toKeep
    }
  }

  /**
   * 更新全局配置
   * @param {Object} config - 配置对象
   */
  updateConfig(config) {
    Object.assign(this.globalConfig, config)
  }

  /**
   * 重置统计信息
   */
  resetStatistics() {
    this.statistics.totalActions = 0
    this.statistics.successfulActions = 0
    this.statistics.canceledActions = 0
    this.statistics.errorActions = 0
    this.statistics.averageResponseTime = 0
  }

  /**
   * 销毁管理器
   */
  destroy() {
    // 关闭当前Action
    if (this.currentAction.value) {
      this.cancelAction('destroy')
    }
    
    // 清除队列
    this.actionQueue.value.forEach(action => {
      if (action.reject) {
        action.reject(new Error('ActionStateManager destroyed'))
      }
    })
    this.actionQueue.value = []
    
    // 清除事件监听器
    this.eventListeners.clear()
    
    // 清除错误处理器
    this.errorHandlers.clear()
    
    // 清除历史记录
    this.actionHistory.value = []
  }
}

// 创建全局实例
const actionStateManager = new ActionStateManager()

// 导出管理器类和全局实例
export { ActionStateManager, actionStateManager }

// 导出便捷方法
export const showAction = (config, options) => actionStateManager.showAction(config, options)
export const submitAction = (result) => actionStateManager.submitAction(result)
export const cancelAction = (reason) => actionStateManager.cancelAction(reason)
export const actionError = (error) => actionStateManager.actionError(error)

// 导出计算属性
export const currentAction = computed(() => actionStateManager.currentAction.value)
export const actionHistory = computed(() => actionStateManager.actionHistory.value)
export const actionQueue = computed(() => actionStateManager.actionQueue.value)
export const statistics = computed(() => actionStateManager.statistics)
export const globalConfig = computed(() => actionStateManager.globalConfig)