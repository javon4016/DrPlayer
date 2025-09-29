// Action组件功能演示脚本
// 这个脚本展示了如何使用Action组件系统的各种功能

import { Actions } from '@/components/actions'

// 演示基础输入功能
export const demoBasicInput = async () => {
  try {
    const result = await Actions.input({
      actionId: 'demo-basic-input',
      title: '用户信息输入',
      message: '请输入您的姓名：',
      placeholder: '请输入姓名',
      required: true,
      timeout: 30000
    })
    console.log('输入结果:', result)
    return result
  } catch (error) {
    console.error('输入取消或超时:', error)
  }
}

// 演示多项输入功能
export const demoMultiInput = async () => {
  try {
    const result = await Actions.multiInput({
      actionId: 'demo-multi-input',
      title: '用户注册信息',
      message: '请填写注册信息：',
      inputs: [
        {
          key: 'username',
          label: '用户名',
          placeholder: '请输入用户名',
          required: true,
          validation: {
            minLength: 3,
            maxLength: 20,
            pattern: '^[a-zA-Z0-9_]+$'
          }
        },
        {
          key: 'email',
          label: '邮箱',
          placeholder: '请输入邮箱地址',
          required: true,
          validation: {
            type: 'email'
          }
        },
        {
          key: 'password',
          label: '密码',
          type: 'password',
          placeholder: '请输入密码',
          required: true,
          validation: {
            minLength: 6
          }
        },
        {
          key: 'bio',
          label: '个人简介',
          type: 'textarea',
          placeholder: '请输入个人简介（可选）',
          required: false
        }
      ],
      timeout: 60000
    })
    console.log('多项输入结果:', result)
    return result
  } catch (error) {
    console.error('多项输入取消或超时:', error)
  }
}

// 演示菜单选择功能
export const demoMenu = async () => {
  try {
    const result = await Actions.menu({
      actionId: 'demo-menu',
      title: '选择操作',
      message: '请选择您要执行的操作：',
      options: [
        {
          key: 'create',
          title: '创建新项目',
          description: '创建一个新的项目',
          icon: '➕'
        },
        {
          key: 'edit',
          title: '编辑项目',
          description: '编辑现有项目',
          icon: '✏️'
        },
        {
          key: 'delete',
          title: '删除项目',
          description: '删除选中的项目',
          icon: '🗑️'
        },
        {
          key: 'export',
          title: '导出数据',
          description: '导出项目数据',
          icon: '📤'
        }
      ],
      multiple: false,
      searchable: true,
      timeout: 30000
    })
    console.log('菜单选择结果:', result)
    return result
  } catch (error) {
    console.error('菜单选择取消或超时:', error)
  }
}

// 演示下拉选择功能
export const demoSelect = async () => {
  try {
    const result = await Actions.select({
      actionId: 'demo-select',
      title: '选择技能',
      message: '请选择您掌握的技能（可多选）：',
      options: [
        { key: 'javascript', title: 'JavaScript' },
        { key: 'vue', title: 'Vue.js' },
        { key: 'react', title: 'React' },
        { key: 'angular', title: 'Angular' },
        { key: 'nodejs', title: 'Node.js' },
        { key: 'python', title: 'Python' },
        { key: 'java', title: 'Java' },
        { key: 'csharp', title: 'C#' },
        { key: 'php', title: 'PHP' },
        { key: 'go', title: 'Go' }
      ],
      multiple: true,
      searchable: true,
      defaultSelected: ['javascript', 'vue'],
      timeout: 45000
    })
    console.log('下拉选择结果:', result)
    return result
  } catch (error) {
    console.error('下拉选择取消或超时:', error)
  }
}

// 演示消息框功能
export const demoMsgBox = async () => {
  try {
    // 信息提示
    await Actions.info({
      title: '信息提示',
      message: '这是一个信息提示消息',
      details: '详细信息：操作已成功完成。',
      timeout: 5000
    })

    // 成功提示
    await Actions.success({
      title: '操作成功',
      message: '数据保存成功！',
      timeout: 3000
    })

    // 警告提示
    await Actions.warning({
      title: '警告',
      message: '请注意：此操作可能会影响系统性能。',
      timeout: 5000
    })

    // 错误提示
    await Actions.error({
      title: '错误',
      message: '操作失败，请重试。',
      details: '错误代码：500\n错误信息：服务器内部错误',
      timeout: 8000
    })

    // 确认对话框
    const confirmed = await Actions.confirm({
      title: '确认删除',
      message: '您确定要删除这个项目吗？',
      details: '删除后将无法恢复，请谨慎操作。',
      timeout: 15000
    })
    console.log('确认结果:', confirmed)

    return confirmed
  } catch (error) {
    console.error('消息框操作取消或超时:', error)
  }
}

// 演示进度条功能
export const demoProgress = async () => {
  try {
    const progressAction = Actions.progress({
      title: '文件上传中',
      message: '正在上传文件，请稍候...',
      progress: 0,
      timeout: 30000
    })

    // 模拟进度更新
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 500))
      progressAction.updateProgress(i, `上传进度: ${i}%`)
    }

    await progressAction.complete('上传完成！')
    console.log('进度条演示完成')
  } catch (error) {
    console.error('进度条操作取消或超时:', error)
  }
}

// 演示网页视图功能
export const demoWebView = async () => {
  try {
    const result = await Actions.webView({
      actionId: 'demo-webview',
      title: '网页浏览',
      url: 'https://www.example.com',
      width: '80%',
      height: '70%',
      showToolbar: true,
      allowFullscreen: true,
      timeout: 60000
    })
    console.log('网页视图结果:', result)
    return result
  } catch (error) {
    console.error('网页视图取消或超时:', error)
  }
}

// 演示帮助页面功能
export const demoHelp = async () => {
  try {
    const result = await Actions.help({
      actionId: 'demo-help',
      title: 'Action组件使用帮助',
      message: '欢迎使用Action组件系统！',
      details: `
## Action组件系统

Action组件系统是一个强大的交互式UI组件库，支持多种类型的用户交互。

### 主要功能

1. **输入组件** - 单项和多项输入
2. **选择组件** - 菜单和下拉选择
3. **消息组件** - 各种类型的消息提示
4. **网页组件** - 内嵌网页浏览
5. **帮助组件** - 帮助信息展示

### 使用方法

\`\`\`javascript
import { Actions } from '@/components/actions'

// 显示输入框
const result = await Actions.input({
  title: '输入标题',
  message: '请输入内容',
  placeholder: '占位符文本'
})
\`\`\`
      `,
      steps: [
        '导入Actions模块',
        '调用相应的Action方法',
        '配置Action参数',
        '处理返回结果'
      ],
      faq: [
        {
          question: '如何设置超时时间？',
          answer: '在Action配置中添加timeout参数，单位为毫秒。'
        },
        {
          question: '如何处理用户取消操作？',
          answer: 'Action方法会抛出异常，可以使用try-catch捕获。'
        }
      ],
      links: [
        {
          title: 'Vue.js官方文档',
          url: 'https://vuejs.org/'
        },
        {
          title: 'Arco Design Vue',
          url: 'https://arco.design/vue'
        }
      ],
      contact: {
        email: 'support@example.com',
        phone: '400-123-4567',
        website: 'https://www.example.com'
      },
      timeout: 120000
    })
    console.log('帮助页面结果:', result)
    return result
  } catch (error) {
    console.error('帮助页面取消或超时:', error)
  }
}

// 演示队列功能
export const demoQueue = async () => {
  try {
    console.log('开始队列演示...')

    // 同时显示多个Action（如果允许）
    const promises = [
      Actions.alert({
        title: '队列测试 1',
        message: '这是第一个Action',
        timeout: 5000
      }),
      Actions.alert({
        title: '队列测试 2', 
        message: '这是第二个Action',
        timeout: 5000
      }),
      Actions.alert({
        title: '队列测试 3',
        message: '这是第三个Action',
        timeout: 5000
      })
    ]

    await Promise.all(promises)
    console.log('队列演示完成')
  } catch (error) {
    console.error('队列演示出错:', error)
  }
}

// 综合演示
export const demoAll = async () => {
  console.log('开始综合演示...')
  
  try {
    // 1. 基础输入
    console.log('1. 基础输入演示')
    await demoBasicInput()
    
    // 2. 多项输入
    console.log('2. 多项输入演示')
    await demoMultiInput()
    
    // 3. 菜单选择
    console.log('3. 菜单选择演示')
    await demoMenu()
    
    // 4. 下拉选择
    console.log('4. 下拉选择演示')
    await demoSelect()
    
    // 5. 消息框
    console.log('5. 消息框演示')
    await demoMsgBox()
    
    // 6. 进度条
    console.log('6. 进度条演示')
    await demoProgress()
    
    // 7. 帮助页面
    console.log('7. 帮助页面演示')
    await demoHelp()
    
    console.log('综合演示完成！')
  } catch (error) {
    console.error('综合演示出错:', error)
  }
}

export default {
  demoBasicInput,
  demoMultiInput,
  demoMenu,
  demoSelect,
  demoMsgBox,
  demoProgress,
  demoWebView,
  demoHelp,
  demoQueue,
  demoAll
}