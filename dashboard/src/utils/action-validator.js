// Action组件功能验证脚本
// 用于验证Action组件系统的各项功能是否正常工作

import { Actions, actionStateManager, globalConfig } from '@/components/actions'

/**
 * 验证Action组件系统的基本功能
 */
export class ActionValidator {
  constructor() {
    this.results = []
    this.errors = []
  }

  /**
   * 记录测试结果
   */
  log(test, success, message, data = null) {
    const result = {
      test,
      success,
      message,
      data,
      timestamp: new Date().toISOString()
    }
    
    this.results.push(result)
    
    if (success) {
      console.log(`✅ ${test}: ${message}`, data)
    } else {
      console.error(`❌ ${test}: ${message}`, data)
      this.errors.push(result)
    }
  }

  /**
   * 验证组件导入
   */
  async validateImports() {
    try {
      // 验证Actions对象
      if (typeof Actions !== 'object') {
        throw new Error('Actions对象未正确导入')
      }

      // 验证actionStateManager
      if (typeof actionStateManager !== 'object') {
        throw new Error('actionStateManager未正确导入')
      }

      // 验证Actions方法
      const requiredMethods = [
        'input', 'multiInput', 'menu', 'select', 
        'msgBox', 'webView', 'help', 'alert', 
        'confirm', 'info', 'success', 'warning', 
        'error', 'progress'
      ]

      for (const method of requiredMethods) {
        if (typeof Actions[method] !== 'function') {
          throw new Error(`Actions.${method}方法不存在`)
        }
      }

      this.log('组件导入验证', true, '所有组件和方法导入正常')
      return true
    } catch (error) {
      this.log('组件导入验证', false, error.message, error)
      return false
    }
  }

  /**
   * 验证状态管理器
   */
  async validateStateManager() {
    try {
      // 验证配置设置
      const originalConfig = { ...globalConfig.value }
      
      actionStateManager.updateConfig({
        defaultTimeout: 5000,
        debugMode: true
      })

      const newConfig = globalConfig.value
      if (newConfig.defaultTimeout !== 5000 || !newConfig.debugMode) {
        throw new Error('配置设置失败')
      }

      // 恢复原配置
      actionStateManager.updateConfig(originalConfig)

      // 验证统计信息
      const stats = actionStateManager.statistics
      if (typeof stats !== 'object') {
        throw new Error('统计信息获取失败')
      }

      this.log('状态管理器验证', true, '状态管理器功能正常', { stats })
      return true
    } catch (error) {
      this.log('状态管理器验证', false, error.message, error)
      return false
    }
  }

  /**
   * 验证基础Alert功能
   */
  async validateBasicAlert() {
    try {
      // 创建一个快速关闭的Alert
      const alertPromise = Actions.alert('这是一个测试消息', '测试Alert')

      // 等待Alert完成
      await alertPromise

      this.log('基础Alert验证', true, 'Alert功能正常')
      return true
    } catch (error) {
      this.log('基础Alert验证', false, error.message, error)
      return false
    }
  }

  /**
   * 验证输入组件配置
   */
  async validateInputConfig() {
    try {
      // 验证输入组件的配置解析
      const config = {
        title: '测试输入',
        message: '请输入测试内容',
        placeholder: '测试占位符',
        required: true,
        validation: {
          minLength: 3,
          maxLength: 10
        },
        timeout: 1000
      }

      // 创建输入Action但立即取消
      const inputPromise = Actions.input({
        actionId: 'validator-input-test',
        ...config
      })
      
      // 等待一小段时间后取消
      setTimeout(() => {
        ActionStateManager.cancelAction()
      }, 100)

      try {
        await inputPromise
      } catch (error) {
        if (error.type === 'cancel') {
          this.log('输入组件配置验证', true, '输入组件配置解析正常')
          return true
        }
        throw error
      }

      this.log('输入组件配置验证', false, '输入组件未正确取消')
      return false
    } catch (error) {
      this.log('输入组件配置验证', false, error.message, error)
      return false
    }
  }

  /**
   * 验证多输入组件配置
   */
  async validateMultiInputConfig() {
    try {
      const config = {
        title: '测试多输入',
        message: '请填写测试信息',
        inputs: [
          {
            key: 'name',
            label: '姓名',
            required: true
          },
          {
            key: 'email',
            label: '邮箱',
            validation: { type: 'email' }
          }
        ],
        timeout: 1000
      }

      const multiInputPromise = Actions.multiInput({
        actionId: 'validator-multi-input-test',
        ...config
      })
      
      setTimeout(() => {
        ActionStateManager.cancelAction()
      }, 100)

      try {
        await multiInputPromise
      } catch (error) {
        if (error.type === 'cancel') {
          this.log('多输入组件配置验证', true, '多输入组件配置解析正常')
          return true
        }
        throw error
      }

      this.log('多输入组件配置验证', false, '多输入组件未正确取消')
      return false
    } catch (error) {
      this.log('多输入组件配置验证', false, error.message, error)
      return false
    }
  }

  /**
   * 验证选择组件配置
   */
  async validateSelectConfig() {
    try {
      const config = {
        title: '测试选择',
        options: [
          { key: 'option1', title: '选项1' },
          { key: 'option2', title: '选项2' }
        ],
        multiple: false,
        timeout: 1000
      }

      const selectPromise = Actions.select({
        actionId: 'validator-select-test',
        ...config
      })
      
      setTimeout(() => {
        ActionStateManager.cancelAction()
      }, 100)

      try {
        await selectPromise
      } catch (error) {
        if (error.type === 'cancel') {
          this.log('选择组件配置验证', true, '选择组件配置解析正常')
          return true
        }
        throw error
      }

      this.log('选择组件配置验证', false, '选择组件未正确取消')
      return false
    } catch (error) {
      this.log('选择组件配置验证', false, error.message, error)
      return false
    }
  }

  /**
   * 验证主题切换
   */
  async validateTheme() {
    try {
      const originalTheme = ActionStateManager.getConfig().theme

      // 切换到暗色主题
      ActionStateManager.setTheme('dark')
      if (ActionStateManager.getConfig().theme !== 'dark') {
        throw new Error('暗色主题设置失败')
      }

      // 切换到亮色主题
      ActionStateManager.setTheme('light')
      if (ActionStateManager.getConfig().theme !== 'light') {
        throw new Error('亮色主题设置失败')
      }

      // 恢复原主题
      ActionStateManager.setTheme(originalTheme)

      this.log('主题切换验证', true, '主题切换功能正常')
      return true
    } catch (error) {
      this.log('主题切换验证', false, error.message, error)
      return false
    }
  }

  /**
   * 验证事件监听
   */
  async validateEvents() {
    try {
      let eventReceived = false

      // 添加事件监听器
      const removeListener = ActionStateManager.on('action:show', () => {
        eventReceived = true
      })

      // 触发一个Action
      const alertPromise = Actions.alert('测试事件监听', '事件测试')

      await alertPromise

      // 移除监听器
      removeListener()

      if (!eventReceived) {
        throw new Error('事件未正确触发')
      }

      this.log('事件监听验证', true, '事件监听功能正常')
      return true
    } catch (error) {
      this.log('事件监听验证', false, error.message, error)
      return false
    }
  }

  /**
   * 运行所有验证测试
   */
  async runAllTests() {
    console.log('🚀 开始Action组件系统验证...')
    
    this.results = []
    this.errors = []

    const tests = [
      () => this.validateImports(),
      () => this.validateStateManager(),
      () => this.validateBasicAlert(),
      () => this.validateInputConfig(),
      () => this.validateMultiInputConfig(),
      () => this.validateSelectConfig(),
      () => this.validateTheme(),
      () => this.validateEvents()
    ]

    let passedTests = 0
    const totalTests = tests.length

    for (const test of tests) {
      try {
        const result = await test()
        if (result) passedTests++
      } catch (error) {
        console.error('测试执行出错:', error)
      }
      
      // 在测试之间添加小延迟
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    const summary = {
      total: totalTests,
      passed: passedTests,
      failed: totalTests - passedTests,
      success: passedTests === totalTests,
      results: this.results,
      errors: this.errors
    }

    console.log('\n📊 验证结果汇总:')
    console.log(`总测试数: ${summary.total}`)
    console.log(`通过: ${summary.passed}`)
    console.log(`失败: ${summary.failed}`)
    console.log(`成功率: ${((summary.passed / summary.total) * 100).toFixed(1)}%`)

    if (summary.success) {
      console.log('🎉 所有测试通过！Action组件系统功能正常。')
    } else {
      console.log('⚠️ 部分测试失败，请检查错误信息。')
      console.log('错误详情:', this.errors)
    }

    return summary
  }

  /**
   * 获取验证报告
   */
  getReport() {
    return {
      timestamp: new Date().toISOString(),
      results: this.results,
      errors: this.errors,
      summary: {
        total: this.results.length,
        passed: this.results.filter(r => r.success).length,
        failed: this.errors.length
      }
    }
  }
}

// 创建全局验证器实例
export const actionValidator = new ActionValidator()

// 便捷方法
export const validateActionSystem = () => actionValidator.runAllTests()

export default ActionValidator