# Action组件系统

Action组件系统是一个功能强大的Vue.js交互式UI组件库，提供了丰富的用户交互功能，包括输入、选择、消息提示、网页浏览等多种组件类型。

## 🚀 快速开始

### 安装和配置

1. 在`main.js`中注册Action组件：

```javascript
import { createApp } from 'vue'
import App from './App.vue'
import ActionComponents from '@/components/actions'

const app = createApp(App)
app.use(ActionComponents)
app.mount('#app')
```

2. 在组件中使用：

```javascript
import { Actions } from '@/components/actions'

// 显示输入框
const result = await Actions.input({
  title: '请输入',
  message: '请输入您的姓名：',
  placeholder: '姓名'
})
```

## 📦 组件列表

### 核心组件

- **ActionRenderer** - 主渲染器组件
- **ActionDialog** - 弹窗容器组件
- **ActionStateManager** - 状态管理器

### 交互组件

- **InputAction** - 单项输入组件
- **MultiInputAction** - 多项输入组件
- **MenuAction** - 菜单选择组件
- **SelectAction** - 下拉选择组件
- **MsgBoxAction** - 消息框组件
- **WebViewAction** - 网页视图组件
- **HelpAction** - 帮助页面组件

## 🎯 使用方法

### 1. 基础输入 (InputAction)

```javascript
// 简单输入
const name = await Actions.input({
  title: '用户信息',
  message: '请输入您的姓名：',
  placeholder: '请输入姓名',
  required: true,
  timeout: 30000
})

// 带验证的输入
const email = await Actions.input({
  title: '邮箱验证',
  message: '请输入邮箱地址：',
  placeholder: 'example@email.com',
  validation: {
    type: 'email',
    required: true
  },
  helpText: '请输入有效的邮箱地址'
})

// 多行文本输入
const description = await Actions.input({
  title: '描述信息',
  message: '请输入描述：',
  type: 'textarea',
  rows: 4,
  maxLength: 500
})
```

### 2. 多项输入 (MultiInputAction)

```javascript
const userInfo = await Actions.multiInput({
  title: '用户注册',
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
      placeholder: '请输入邮箱',
      required: true,
      validation: { type: 'email' }
    },
    {
      key: 'password',
      label: '密码',
      type: 'password',
      required: true,
      validation: { minLength: 6 }
    }
  ]
})
```

### 3. 菜单选择 (MenuAction)

```javascript
// 单选菜单
const action = await Actions.menu({
  title: '选择操作',
  message: '请选择要执行的操作：',
  options: [
    {
      key: 'create',
      title: '创建',
      description: '创建新项目',
      icon: '➕'
    },
    {
      key: 'edit',
      title: '编辑',
      description: '编辑现有项目',
      icon: '✏️'
    }
  ],
  searchable: true
})

// 多选菜单
const selectedItems = await Actions.menu({
  title: '选择功能',
  options: [...],
  multiple: true,
  maxSelections: 3
})
```

### 4. 下拉选择 (SelectAction)

```javascript
// 单选下拉
const country = await Actions.select({
  title: '选择国家',
  message: '请选择您的国家：',
  options: [
    { key: 'cn', title: '中国' },
    { key: 'us', title: '美国' },
    { key: 'jp', title: '日本' }
  ],
  searchable: true
})

// 多选下拉
const skills = await Actions.select({
  title: '技能选择',
  options: [...],
  multiple: true,
  defaultSelected: ['javascript', 'vue']
})
```

### 5. 消息提示 (MsgBoxAction)

```javascript
// 基础消息类型
await Actions.alert('这是一个提醒消息')
await Actions.info('这是信息提示')
await Actions.success('操作成功！')
await Actions.warning('这是警告信息')
await Actions.error('发生错误！')

// 确认对话框
const confirmed = await Actions.confirm({
  title: '确认删除',
  message: '您确定要删除这个项目吗？',
  details: '删除后将无法恢复'
})

// 带进度条的消息
const progressAction = Actions.progress({
  title: '处理中',
  message: '正在处理，请稍候...',
  progress: 0
})

// 更新进度
progressAction.updateProgress(50, '处理中... 50%')
progressAction.complete('处理完成！')
```

### 6. 网页视图 (WebViewAction)

```javascript
const result = await Actions.webView({
  title: '网页浏览',
  url: 'https://www.example.com',
  width: '80%',
  height: '70%',
  showToolbar: true,
  allowFullscreen: true
})
```

### 7. 帮助页面 (HelpAction)

```javascript
await Actions.help({
  title: '使用帮助',
  message: '欢迎使用本系统！',
  details: '这里是详细的帮助信息...',
  steps: [
    '第一步：登录系统',
    '第二步：选择功能',
    '第三步：开始使用'
  ],
  faq: [
    {
      question: '如何重置密码？',
      answer: '点击登录页面的"忘记密码"链接'
    }
  ],
  links: [
    {
      title: '官方文档',
      url: 'https://docs.example.com'
    }
  ]
})
```

## ⚙️ 配置选项

### 全局配置

```javascript
import { ActionStateManager } from '@/components/actions'

// 设置全局配置
ActionStateManager.setConfig({
  defaultTimeout: 30000,        // 默认超时时间
  maxHistorySize: 100,          // 最大历史记录数
  debugMode: true,              // 调试模式
  theme: 'light',               // 主题
  allowMultiple: false,         // 是否允许多个Action同时显示
  defaultDialog: {              // 默认弹窗配置
    width: '500px',
    height: 'auto',
    maskClosable: true,
    escClosable: true
  }
})
```

### 通用配置选项

所有Action组件都支持以下通用配置：

```javascript
{
  title: '标题',                // 弹窗标题
  message: '消息内容',          // 主要消息
  timeout: 30000,              // 超时时间（毫秒）
  width: '500px',              // 弹窗宽度
  height: 'auto',              // 弹窗高度
  maskClosable: true,          // 点击遮罩关闭
  escClosable: true,           // ESC键关闭
  showCancel: true,            // 显示取消按钮
  confirmText: '确定',         // 确认按钮文本
  cancelText: '取消',          // 取消按钮文本
  image: 'path/to/image.jpg',  // 显示图片
  qrcode: 'QR码内容'           // 显示二维码
}
```

## 🎨 样式定制

### CSS变量

Action组件使用CSS变量进行样式定制：

```css
:root {
  --action-primary-color: #1890ff;
  --action-success-color: #52c41a;
  --action-warning-color: #faad14;
  --action-error-color: #ff4d4f;
  --action-border-radius: 6px;
  --action-box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  --action-font-size: 14px;
  --action-line-height: 1.5;
}
```

### 主题切换

```javascript
// 切换到暗色主题
ActionStateManager.setTheme('dark')

// 切换到亮色主题
ActionStateManager.setTheme('light')
```

## 📊 状态管理

### 获取当前状态

```javascript
import { ActionStateManager, currentAction, actionHistory } from '@/components/actions'

// 获取当前Action
console.log(currentAction.value)

// 获取历史记录
console.log(actionHistory.value)

// 获取统计信息
console.log(ActionStateManager.getStats())
```

### 事件监听

```javascript
// 监听Action显示事件
ActionStateManager.on('action:show', (action) => {
  console.log('Action显示:', action)
})

// 监听Action提交事件
ActionStateManager.on('action:submit', (action, result) => {
  console.log('Action提交:', action, result)
})

// 监听Action取消事件
ActionStateManager.on('action:cancel', (action) => {
  console.log('Action取消:', action)
})
```

## 🔧 高级用法

### 自定义验证

```javascript
const result = await Actions.input({
  title: '自定义验证',
  validation: {
    custom: (value) => {
      if (value.length < 3) {
        return '长度不能少于3个字符'
      }
      if (!/^[a-zA-Z]+$/.test(value)) {
        return '只能包含字母'
      }
      return true
    }
  }
})
```

### 动态选项

```javascript
const result = await Actions.select({
  title: '动态选项',
  options: async (searchText) => {
    // 异步获取选项
    const response = await fetch(`/api/search?q=${searchText}`)
    return await response.json()
  },
  searchable: true
})
```

### 链式调用

```javascript
// 链式调用多个Action
const name = await Actions.input({ message: '请输入姓名' })
const age = await Actions.input({ message: '请输入年龄', type: 'number' })
const confirmed = await Actions.confirm({ message: `确认信息：${name}, ${age}岁？` })

if (confirmed) {
  await Actions.success('信息确认成功！')
}
```

## 🐛 错误处理

```javascript
try {
  const result = await Actions.input({
    title: '输入测试',
    message: '请输入内容',
    timeout: 10000
  })
  console.log('输入结果:', result)
} catch (error) {
  if (error.type === 'timeout') {
    console.log('操作超时')
  } else if (error.type === 'cancel') {
    console.log('用户取消')
  } else {
    console.error('其他错误:', error)
  }
}
```

## 📝 最佳实践

1. **合理设置超时时间** - 根据操作复杂度设置合适的超时时间
2. **提供清晰的提示信息** - 使用简洁明了的标题和消息
3. **适当的验证** - 为用户输入提供必要的验证和提示
4. **错误处理** - 始终使用try-catch处理Action调用
5. **用户体验** - 避免同时显示过多Action，保持界面简洁

## 🔗 相关链接

- [Vue.js官方文档](https://vuejs.org/)
- [Arco Design Vue](https://arco.design/vue)
- [项目GitHub仓库](https://github.com/your-repo)

## 📄 许可证

MIT License