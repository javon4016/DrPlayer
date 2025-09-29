<template>
  <div class="action-debug-test">
    <div class="debug-header">
      <h1>Action数据解析调试工具</h1>
      <p>用于排查T4 API返回的action数据解析问题</p>
    </div>

    <div class="debug-sections">
      <!-- 原始数据输入 -->
      <div class="debug-section">
        <h2>1. 原始数据输入</h2>
        <p>请粘贴T4 API返回的vod_id字段内容：</p>
        <textarea 
          v-model="rawData" 
          class="debug-textarea"
          placeholder="粘贴vod_id字段的JSON字符串..."
          rows="8"
        ></textarea>
        <button @click="parseData" class="debug-button">解析数据</button>
      </div>

      <!-- 解析结果 -->
      <div class="debug-section" v-if="parseResult">
        <h2>2. 解析结果</h2>
        <div class="debug-result">
          <h3>解析状态：<span :class="parseResult.success ? 'success' : 'error'">
            {{ parseResult.success ? '成功' : '失败' }}
          </span></h3>
          
          <div v-if="parseResult.success">
            <h4>解析后的配置对象：</h4>
            <pre class="debug-json">{{ JSON.stringify(parseResult.config, null, 2) }}</pre>
            
            <h4>关键字段检查：</h4>
            <ul class="debug-fields">
              <li>actionId: <code>{{ parseResult.config.actionId || 'undefined' }}</code></li>
              <li>type: <code>{{ parseResult.config.type || 'undefined' }}</code></li>
              <li>title: <code>{{ parseResult.config.title || 'undefined' }}</code></li>
              <li>id: <code>{{ parseResult.config.id || 'undefined' }}</code></li>
            </ul>

            <h4>类型验证：</h4>
            <ul class="debug-validation">
              <li>type字段存在: <span :class="parseResult.config.type ? 'success' : 'error'">
                {{ parseResult.config.type ? '是' : '否' }}
              </span></li>
              <li>type值有效: <span :class="isValidType(parseResult.config.type) ? 'success' : 'error'">
                {{ isValidType(parseResult.config.type) ? '是' : '否' }}
              </span></li>
              <li>actionId存在: <span :class="parseResult.config.actionId ? 'success' : 'error'">
                {{ parseResult.config.actionId ? '是' : '否' }}
              </span></li>
            </ul>
          </div>
          
          <div v-else>
            <h4>错误信息：</h4>
            <pre class="debug-error">{{ parseResult.error }}</pre>
          </div>
        </div>
      </div>

      <!-- ActionRenderer测试 -->
      <div class="debug-section" v-if="parseResult && parseResult.success">
        <h2>3. ActionRenderer组件测试</h2>
        <button @click="testActionRenderer" class="debug-button">测试ActionRenderer</button>
        
        <div v-if="rendererError" class="debug-error-box">
          <h4>ActionRenderer错误：</h4>
          <pre>{{ rendererError }}</pre>
        </div>
      </div>

      <!-- 预设测试数据 -->
      <div class="debug-section">
        <h2>4. 预设测试数据</h2>
        <p>使用你提供的真实T4 API数据进行测试：</p>
        <div class="preset-buttons">
          <button @click="loadPresetData('push_video')" class="debug-button">推送视频播放</button>
          <button @click="loadPresetData('push_novel')" class="debug-button">推送番茄小说</button>
        </div>
      </div>
    </div>

    <!-- ActionRenderer组件 -->
    <ActionRenderer
      v-if="showActionRenderer"
      ref="actionRendererRef"
      :action-data="currentActionData"
      @close="handleActionClose"
      @submit="handleActionSubmit"
      @error="handleActionError"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import ActionRenderer from '@/components/actions/ActionRenderer.vue'
import { ActionType, parseActionConfig, validateActionConfig } from '@/components/actions/types.js'

const rawData = ref('')
const parseResult = ref(null)
const showActionRenderer = ref(false)
const currentActionData = ref(null)
const actionRendererRef = ref(null)
const rendererError = ref(null)

// 预设测试数据
const presetData = {
  push_video: `{"actionId":"推送视频播放","id":"push","type":"input","title":"推送视频地址进行播放","tip":"支持网盘、官链、直链、待嗅探链接","value":"","msg":"请输入待推送的视频地址","imageUrl":"http://127.0.0.1:5757/public/images/lives.jpg","imageHeight":200,"imageType":"card_pic_3","keep":true,"button":4,"width":640,"selectData":"123:=\`https://www.123684.com/s/oec7Vv-DggWh?ZY4K,腾讯:=https://v.qq.com/x/cover/mzc00200vkqr54u/u4100l66fas.html,爱奇艺:=http://www.iqiyi.com/v_1b0tk1b8tl8.html,夸克:=https://pan.quark.cn/s/6c8158e258f3,UC:=https://drive.uc.cn/s/59023f57d3ce4?public=1,阿里:=https://www.alipan.com/s/vgXMcowK8pQ,天翼:=https://cloud.189.cn/web/share?code=INJbU3NbqyUj,百度:=https://pan.baidu.com/s/1L0UIv4p0X0QrbbKErJuc_w?pwd=2pwj,移动1:=https://yun.139.com/shareweb/#/w/i/0i5CLQ7BpV7Ai,移动2:=https://caiyun.139.com/m/i?2jexC1gcjeN7q,移动3:=https://yun.139.com/shareweb/#/w/i/2i2MoE9ZHn9p1,直链1:=https://vdse.bdstatic.com//628ca08719cef5987ea2ae3c6f0d2386.mp4,嗅探1:=https://www.6080kk.cc/haokanplay/178120-1-1.html,嗅探2:=https://www.hahads.com/play/537106-3-1.html,多集:=https://v.qq.com/x/cover/m441e3rjq9kwpsc/m00253deqqo.html@https://pan.quark.cn/s/6c8158e258f3@https://pan.baidu.com/s/1TdbgcwaMG1dK7B5pQ1LbBg?pwd=1234,海阔二级单线路:=H4sIAAAAAAAAA52Uy27TQBSGXwUZlsT2GefadZ+AN3ATk7qKL7guUoKQXAQFeoEG6oKaVBUFlBZFbdQ0TXAIeRjPTJwVr8AYCsNyijQbnzPfPz72p3kk6WXf8aQFibzszFsb0l2p7Ni+YfusFAe78/W383C6eC8OmnEQsEVal7NxiEebeLQ/i75oKvl6iccfZwdPWY0OhnR8+uPbdnJ2kUx7ONrAo094skMOD+ZHHbL1nIbHbCf53KdBh7RPaP+Yfm8n5x+S3gWr016TtCb03VUa2Brh6A0Nm8ngVRysk7Nt+mI3aYfk9fs0YfMERxENn+FoKw6e3KJ7V8lgyF6+YnrG9UAPTLu6ZNgrpu4ZNlJRlrXve47FWrNomgzPEdJYydYtIx1/Z0rbXTzps9zrza5ZZo1l33dXFxSFPWlyvdGom5ZeNVblsmMpa27N0SvKQ6eipEwGIINAgYKGIA+lYg7kFbfKkta8Wnpqt6sC+8Z3/kQuyXm1qDZ+RbEMt6bXFVBBQ6UMy5KXfat2O4WQMIQ4pAlDGoeywlCWQzlhKMehvDCU51BBGCpwqCgMFTlUEoZKfyFQxX+uyqkbKMGdAHEnAP0Xxa0AcZWAawHiLgH3AsRlAi4GiNsE3AwQ1wm4GiDuE/zjhrhQiLuBxI1C3A0kbhTibqAb3DK/3ZAe/wSSQMKkPgYAAA==\`"}`,
  push_novel: `{"actionId":"推送番茄小说","id":"push","type":"input","title":"推送番茄小说网页目录链接进行解析","tip":"支持番茄小说网页版链接","value":"\`https://fanqienovel.com/page/7421167583522458648\`","msg":"请输入待推送的番茄小说网页版链接","imageUrl":"http://127.0.0.1:5757/public/images/icon_cookie/%E9%98%85%E8%AF%BB.png","imageHeight":200,"imageType":"card_pic_3","keep":false,"selectData":"大一实习:=\`https://fanqienovel.com/page/7421167583522458648,十日终焉:=https://fanqienovel.com/page/7143038691944959011,斩神:=https://fanqienovel.com/page/6982529841564224526\`"}`
}

// 检查type是否有效
const isValidType = (type) => {
  return Object.values(ActionType).includes(type)
}

// 解析数据
const parseData = () => {
  if (!rawData.value.trim()) {
    parseResult.value = {
      success: false,
      error: '请输入数据'
    }
    return
  }

  try {
    console.log('原始数据:', rawData.value)
    
    // 使用ActionRenderer相同的解析逻辑
    const config = parseActionConfig(rawData.value)
    console.log('解析后的配置:', config)
    
    // 验证配置
    validateActionConfig(config)
    
    parseResult.value = {
      success: true,
      config: config
    }
  } catch (error) {
    console.error('解析错误:', error)
    parseResult.value = {
      success: false,
      error: error.message || error.toString()
    }
  }
}

// 测试ActionRenderer
const testActionRenderer = () => {
  if (!parseResult.value || !parseResult.value.success) {
    return
  }

  try {
    rendererError.value = null
    currentActionData.value = parseResult.value.config
    showActionRenderer.value = true
  } catch (error) {
    rendererError.value = error.message || error.toString()
  }
}

// 加载预设数据
const loadPresetData = (type) => {
  rawData.value = presetData[type]
  parseData()
}

// ActionRenderer事件处理
const handleActionClose = () => {
  showActionRenderer.value = false
  currentActionData.value = null
}

const handleActionSubmit = (result) => {
  console.log('Action提交结果:', result)
  showActionRenderer.value = false
  currentActionData.value = null
}

const handleActionError = (error) => {
  console.error('ActionRenderer错误:', error)
  rendererError.value = error.message || error.toString()
}
</script>

<style scoped>
.action-debug-test {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.debug-header {
  text-align: center;
  margin-bottom: 40px;
}

.debug-header h1 {
  color: var(--color-text-1);
  margin-bottom: 10px;
}

.debug-header p {
  color: var(--color-text-3);
  font-size: 16px;
}

.debug-sections {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.debug-section {
  border: 1px solid var(--color-border-2);
  border-radius: 8px;
  padding: 20px;
  background: var(--color-bg-2);
}

.debug-section h2 {
  color: var(--color-text-1);
  margin-bottom: 15px;
  font-size: 18px;
}

.debug-section p {
  color: var(--color-text-3);
  margin-bottom: 15px;
}

.debug-textarea {
  width: 100%;
  min-height: 120px;
  padding: 12px;
  border: 1px solid var(--color-border-2);
  border-radius: 6px;
  background: var(--color-bg-1);
  color: var(--color-text-1);
  font-family: 'Courier New', monospace;
  font-size: 12px;
  resize: vertical;
  margin-bottom: 15px;
}

.debug-button {
  background: var(--color-primary);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  margin-right: 10px;
  margin-bottom: 10px;
}

.debug-button:hover {
  background: var(--color-primary-hover);
}

.debug-result {
  margin-top: 15px;
}

.debug-result h3 {
  color: var(--color-text-1);
  margin-bottom: 15px;
}

.debug-result h4 {
  color: var(--color-text-2);
  margin: 20px 0 10px 0;
  font-size: 16px;
}

.debug-json {
  background: var(--color-bg-1);
  border: 1px solid var(--color-border-2);
  border-radius: 6px;
  padding: 15px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  overflow-x: auto;
  color: var(--color-text-1);
}

.debug-fields, .debug-validation {
  list-style: none;
  padding: 0;
  margin: 0;
}

.debug-fields li, .debug-validation li {
  padding: 8px 0;
  border-bottom: 1px solid var(--color-border-3);
  color: var(--color-text-2);
}

.debug-fields code {
  background: var(--color-bg-1);
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
  color: var(--color-text-1);
}

.success {
  color: #52c41a;
  font-weight: bold;
}

.error {
  color: #f5222d;
  font-weight: bold;
}

.debug-error {
  background: #fff2f0;
  border: 1px solid #ffccc7;
  border-radius: 6px;
  padding: 15px;
  color: #f5222d;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  overflow-x: auto;
}

.debug-error-box {
  margin-top: 15px;
  padding: 15px;
  background: #fff2f0;
  border: 1px solid #ffccc7;
  border-radius: 6px;
}

.debug-error-box h4 {
  color: #f5222d;
  margin-bottom: 10px;
}

.preset-buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
</style>