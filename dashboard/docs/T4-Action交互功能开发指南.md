# T4 Action交互功能开发指南

## 概述

T4 Action交互功能是DrPlayer中用于实现用户与站源接口间动态交互的核心机制。通过返回特定格式的JSON配置，可以动态生成各种类型的输入界面、弹窗和交互组件，实现复杂的用户交互流程。

## 核心概念

### 1. 交互动作（Action）
影图APP与站源接口间交互的动作指令，用户在APP主动发出动作请求，接口根据指令返回数据或返回构建信息输入窗口的配置JSON，具有连续交互的机制。

### 2. 动作类型分类

#### 静态动作
- 用户通过视频分类列表主动发起交互的起点动作
- 动作指令以分类列表的视频JSON数据为基础，属于静态数据
- 所有交互动作的起始都是静态动作

#### 动态动作
- 静态动作构建的信息输入窗口提交action数据后，接口如果再次需要用户输入数据，可以返回新的动作配置JSON数据
- 此数据是交互过程中动态生成的，属于动态动作

### 3. 数据结构

#### 视频VOD结构（静态动作入口）
```json
{
  "vod_id": "动作指令结构...",
  "vod_name": "显示名称",
  "vod_tag": "action",
  "vod_pic": "图片URL（可选）",
  "vod_remarks": "备注信息（可选）"
}
```

#### 动态动作返回结构
```json
{
  "action": {
    // 动作指令结构...
  },
  "toast": "Toast显示消息"
}
```

## 动作类型详解

### 1. 基础动作
简单的动作指令字符串（非JSON结构），用户点击时无信息输入窗口，直接发送指令。

**示例：**
```json
{
  "vod_id": "hello world",
  "vod_name": "基础动作",
  "vod_tag": "action"
}
```

### 2. 单项输入（input）
要求用户输入一个字段的动作。

**核心字段：**
- `actionId`: 识别动作的路由ID（必须）
- `type`: "input"
- `id`: 输入项目id
- `title`: 输入窗口标题
- `tip`: 输入提示（必须）
- `value`: 输入初始值
- `msg`: 窗口文本说明
- `width`: 宽度
- `button`: 按键数量（0-无按键，1-取消，2-确定/取消，3-确定/取消/重置）
- `selectData`: 预定义选项，格式："1:=选项一,2:=选项二"
- `imageUrl`: 窗口显示图片的URL
- `imageHeight`: 图片高度
- `imageClickCoord`: 是否检测图片的点击坐标输入
- `qrcode`: 生成二维码的URL
- `qrcodeSize`: 二维码的大小
- `timeout`: 超时时间（秒）
- `keep`: 输入确认后，窗口是否保持
- `initAction`: 窗口弹出时自动发送的初始化动作指令
- `initValue`: 窗口弹出时自动发送的初始化指令值
- `cancelAction`: 按窗口的取消键时发送的取消动作指令
- `cancelValue`: 按窗口的取消键时发送的取消动作指令值

**示例：**
```json
{
  "actionId": "玩偶域名",
  "id": "domain",
  "type": "input",
  "width": 450,
  "title": "玩偶域名",
  "tip": "请输入玩偶域名",
  "value": "",
  "msg": "选择或输入使用的域名",
  "selectData": "1:=https://www.wogg.net/,2:=https://wogg.xxooo.cf/"
}
```

### 3. 多行编辑（edit）
要求用户在一个多行编辑区输入单个字段内容的动作。

**示例：**
```json
{
  "actionId": "多行编辑",
  "type": "edit",
  "id": "alitoken",
  "title": "阿里云盘Token",
  "msg": "阿里云盘32位的Token",
  "tip": "请输入阿里云盘32位的Token",
  "value": "",
  "width": 640,
  "height": 400
}
```

### 4. 多项输入（multiInput）
要求用户输入多个字段（5个以内）的动作。建议使用"增强多项输入"。

### 5. 增强多项输入（multiInputX）
要求用户输入多个字段（不限制个数）的动作，功能最强大的输入类型。

**核心字段：**
- `type`: "multiInputX"
- `canceledOnTouchOutside`: 弹出窗口是否允许触摸窗口外时取消窗口
- `height`: 高度（负数表示从底部计算）
- `bottom`: 底部对齐和底边距
- `dimAmount`: 设置窗口背景暗化效果（0.0-1.0）
- `input`: 输入项目定义JSON数组

**输入项目字段：**
- `id`: 项目id
- `name`: 项目名称
- `tip`: 项目输入提示
- `value`: 项目初始值
- `selectData`: 项目输入预定义选项
  - `[folder]`: 选择文件夹
  - `[file]`: 选择文件
  - `[calendar]`: 选择日期
  - `[image]`: 选择图像文件转为BASE64
- `quickSelect`: 是否能快速选择
- `onlyQuickSelect`: 是否只快速选择，隐藏输入框等
- `selectWidth`: 选择窗的宽度
- `multiSelect`: 是否多选
- `selectColumn`: 选择窗的列数
- `inputType`: 项目输入类型（0-只读但可通过选项输入，129-密码输入）
- `multiLine`: 项目输入框的行数（多行编辑）
- `validation`: 提交时项目输入值校验正则表达式
- `help`: 项目输入的帮助说明，支持简易HTML

**示例：**
```json
{
  "actionId": "多项输入",
  "type": "multiInputX",
  "canceledOnTouchOutside": true,
  "title": "Action多项输入(multiInputX)",
  "width": 716,
  "height": -300,
  "bottom": 1,
  "dimAmount": 0.3,
  "button": 3,
  "input": [
    {
      "id": "item1",
      "name": "文件夹路径（文件夹选择）",
      "tip": "请输入文件夹路径",
      "value": "",
      "selectData": "[folder]",
      "inputType": 0
    },
    {
      "id": "item2",
      "name": "多项选择",
      "tip": "请输入多项内容，以","分隔",
      "value": "",
      "selectData": "[请选择字母]a,b,c,d,e,f,g",
      "selectWidth": 640,
      "multiSelect": true,
      "selectColumn": 4,
      "inputType": 0
    }
  ]
}
```

### 6. 单项选择（menu）
要求用户在列表中选择一个项目的动作。

**核心字段：**
- `type`: "menu"
- `column`: 单项选择窗口的列数
- `option`: 选项定义JSON数组
- `selectedIndex`: 默认选中的索引

**选项格式：**
- 对象格式：`{"name": "菜单1", "action": "menu1"}`
- 字符串格式：`"菜单3$menu3"`

**示例：**
```json
{
  "actionId": "单选菜单",
  "type": "menu",
  "title": "Action菜单",
  "width": 300,
  "column": 2,
  "option": [
    {"name": "菜单1", "action": "menu1"},
    {"name": "菜单2", "action": "menu2"},
    "菜单3$menu3",
    "菜单4$menu4"
  ],
  "selectedIndex": 3
}
```

### 7. 多项选择（select）
要求用户在列表中选择多个项目的动作。

**示例：**
```json
{
  "actionId": "多选菜单",
  "type": "select",
  "title": "Action多选菜单",
  "width": 480,
  "column": 2,
  "option": [
    {"name": "选项1", "action": "menu1", "selected": true},
    {"name": "选项2", "action": "menu2"},
    {"name": "选项3", "action": "menu3", "selected": true}
  ]
}
```

### 8. 消息弹窗（msgbox）
弹出窗口显示消息。

**核心字段：**
- `type`: "msgbox"
- `msg`: 文本消息内容
- `htmlMsg`: 简单html消息内容
- `imageUrl`: 图片URL

**示例：**
```json
{
  "actionId": "消息弹窗",
  "type": "msgbox",
  "title": "消息弹窗",
  "htmlMsg": "这是一个支持 <font color=red><b>简单HTML语法</b></font> 内容的弹窗",
  "imageUrl": "https://pic.imgdb.cn/item/667ce9f4d9c307b7e9f9d052.webp"
}
```

### 9. WebView（webview）
嵌入网页视图。

**示例：**
```json
{
  "actionId": "WEBVIEW",
  "type": "webview",
  "height": -260,
  "textZoom": 70,
  "url": "http://127.0.0.1:9978/"
}
```

### 10. 帮助页面（help）
显示帮助信息。

**示例：**
```json
{
  "actionId": "help",
  "type": "help",
  "title": "使用帮助",
  "data": {
    "使用帮助": "暂未收录内容"
  }
}
```

## 专项动作

专项动作为动态动作，接口让APP执行一些特定的行为动作。actionId值为行为特定的标识。

### 1. 源内搜索（__self_search__）
```json
{
  "actionId": "__self_search__",
  "skey": "目标源key（可选）",
  "name": "搜索分类名称",
  "tid": "使用分类ID传递的搜索值",
  "flag": "列表视图参数",
  "folder": "查询1$搜索词$0-0-S#查询2$搜索词$3#查询3$搜索词$5"
}
```

### 2. 详情页跳转（__detail__）
```json
{
  "actionId": "__detail__",
  "skey": "目标源key",
  "ids": "传递给详情页的视频ids"
}
```

### 3. KTV播放（__ktvplayer__）
```json
{
  "actionId": "__ktvplayer__",
  "name": "歌名",
  "id": "歌曲的直链"
}
```

### 4. 刷新列表（__refresh_list__）
```json
{
  "actionId": "__refresh_list__"
}
```

### 5. 复制到剪贴板（__copy__）
```json
{
  "actionId": "__copy__",
  "content": "复制的内容"
}
```

### 6. 保持窗口（__keep__）
```json
{
  "actionId": "__keep__",
  "msg": "更新窗口里的文本消息内容",
  "reset": true
}
```

## 接口实现

### action函数签名
```javascript
async function action(action, value) {
  // action: 动作指令
  // value: 动作指令值
  // 返回: 结果消息或新的动作指令数据（动态动作）
}
```

### 实现示例

#### 1. 基础动作处理
```javascript
if (action == 'set-cookie') {
  return JSON.stringify({
    action: {
      actionId: 'quarkCookieConfig',
      id: 'cookie',
      type: 'input',
      title: '夸克Cookie',
      tip: '请输入夸克的Cookie',
      value: '原值',
      msg: '此弹窗是动态设置的参数，可用于动态返回原设置值等场景'
    }
  });
}
```

#### 2. 输入数据处理
```javascript
if (action == 'quarkCookieConfig' && value) {
  try {
    const obj = JSON.parse(value);
    const val = obj.cookie;
    return "我收到了：" + value;
  } catch (e) {
    return '发生错误：' + e;
  }
}
```

#### 3. 连续对话处理
```javascript
if (action == '连续对话') {
  let content = JSON.parse(value);
  if (content.talk.indexOf('http') == 0) {
    return JSON.stringify({
      action: {
        actionId: '__detail__',
        skey: 'push_agent',
        ids: content.talk,
      },
      toast: '你要去看视频了'
    });
  }
  return JSON.stringify({
    action: {
      actionId: '__keep__',
      msg: '回音：' + content.talk,
      reset: true
    },
    toast: '你有新的消息'
  });
}
```

#### 4. 扫码功能实现
```javascript
if (action == '夸克扫码') {
  if (rule.quarkScanCheck) {
    return '请等待上个扫码任务完成';
  }
  
  let requestId = generateUUID();
  // 获取扫码token的API调用...
  
  return JSON.stringify({
    action: {
      actionId: 'quarkScanCookie',
      id: 'quarkScanCookie',
      canceledOnTouchOutside: false,
      type: 'input',
      title: '夸克扫码Cookie',
      msg: '请使用夸克APP扫码登录获取',
      width: 500,
      button: 1,
      timeout: 20,
      qrcode: qrcodeUrl,
      qrcodeSize: '400',
      initAction: 'quarkScanCheck',
      initValue: requestId,
      cancelAction: 'quarkScanCancel',
      cancelValue: requestId,
    }
  });
}
```

## 开发注意事项

### 1. 数据格式
- 所有JSON动作都需要使用`JSON.stringify()`转换为字符串
- 动态动作返回时需要包装在`action`字段中
- 可选择性添加`toast`字段显示提示消息

### 2. 错误处理
- 使用try-catch处理JSON解析错误
- 提供友好的错误提示信息
- 考虑超时和取消操作的处理

### 3. 状态管理
- 对于需要状态的操作（如扫码），使用全局变量管理状态
- 及时清理状态，避免内存泄漏
- 处理并发操作的冲突

### 4. 用户体验
- 合理设置窗口大小和位置
- 提供清晰的提示信息和帮助文档
- 支持取消操作和超时处理
- 使用适当的图标和图片增强视觉效果

### 5. 安全考虑
- 验证用户输入数据
- 使用正则表达式验证格式
- 避免执行不安全的操作

## 最佳实践

1. **模块化设计**：将不同类型的动作处理分离到不同的函数中
2. **配置驱动**：使用配置文件管理常用的选项和参数
3. **错误恢复**：提供重试机制和错误恢复选项
4. **性能优化**：避免在动作处理中执行耗时操作
5. **文档完善**：为每个动作提供清晰的使用说明

通过以上指南，开发者可以充分利用T4 Action交互功能，创建丰富的用户交互体验。