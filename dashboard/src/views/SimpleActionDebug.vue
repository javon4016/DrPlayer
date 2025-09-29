<template>
  <div style="padding: 20px; max-width: 1200px; margin: 0 auto;">
    <h1 style="color: #333; margin-bottom: 20px;">Action数据解析调试工具</h1>
    
    <!-- 原始数据输入区域 -->
    <div style="margin-bottom: 30px; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
      <h2 style="color: #666; margin-bottom: 15px;">1. 原始数据输入</h2>
      <p style="margin-bottom: 15px;">请粘贴T4 API返回的vod_id字段内容：</p>
      <textarea 
        v-model="rawData" 
        style="width: 100%; height: 200px; padding: 10px; border: 1px solid #ccc; border-radius: 4px; font-family: monospace;"
        placeholder="粘贴vod_id字段的JSON字符串..."
      ></textarea>
      <br><br>
      <button @click="parseData" style="background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">
        解析数据
      </button>
      <button @click="loadTestData" style="background: #28a745; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; margin-left: 10px;">
        加载测试数据
      </button>
    </div>

    <!-- 解析结果 -->
    <div v-if="parseResult" style="margin-bottom: 30px; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
      <h2 style="color: #666; margin-bottom: 15px;">2. 解析结果</h2>
      <div style="margin-bottom: 15px;">
        <strong>解析状态：</strong>
        <span :style="{ color: parseResult.success ? '#28a745' : '#dc3545', fontWeight: 'bold' }">
          {{ parseResult.success ? '成功' : '失败' }}
        </span>
      </div>
      
      <div v-if="parseResult.success">
        <h3 style="color: #666; margin: 20px 0 10px 0;">解析后的配置对象：</h3>
        <pre style="background: #f8f9fa; padding: 15px; border-radius: 4px; overflow-x: auto; font-size: 12px;">{{ JSON.stringify(parseResult.config, null, 2) }}</pre>
        
        <h3 style="color: #666; margin: 20px 0 10px 0;">关键字段检查：</h3>
        <ul style="list-style: none; padding: 0;">
          <li style="padding: 5px 0;">actionId: <code style="background: #f8f9fa; padding: 2px 6px; border-radius: 3px;">{{ parseResult.config.actionId || 'undefined' }}</code></li>
          <li style="padding: 5px 0;">type: <code style="background: #f8f9fa; padding: 2px 6px; border-radius: 3px;">{{ parseResult.config.type || 'undefined' }}</code></li>
          <li style="padding: 5px 0;">title: <code style="background: #f8f9fa; padding: 2px 6px; border-radius: 3px;">{{ parseResult.config.title || 'undefined' }}</code></li>
        </ul>
      </div>
      
      <div v-else>
        <h3 style="color: #dc3545; margin: 20px 0 10px 0;">错误信息：</h3>
        <pre style="background: #f8d7da; padding: 15px; border-radius: 4px; color: #721c24;">{{ parseResult.error }}</pre>
      </div>
    </div>

    <!-- ActionRenderer测试 -->
    <div v-if="parseResult && parseResult.success" style="margin-bottom: 30px; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
      <h2 style="color: #666; margin-bottom: 15px;">3. ActionRenderer组件测试</h2>
      <button @click="testActionRenderer" style="background: #17a2b8; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">
        测试ActionRenderer
      </button>
      
      <div v-if="rendererError" style="margin-top: 15px; padding: 15px; background: #f8d7da; border-radius: 4px;">
        <h4 style="color: #721c24;">ActionRenderer错误：</h4>
        <pre style="color: #721c24;">{{ rendererError }}</pre>
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
import { ActionType, parseActionConfig } from '@/components/actions/types.js'

const rawData = ref('')
const parseResult = ref(null)
const showActionRenderer = ref(false)
const currentActionData = ref(null)
const rendererError = ref('')
const actionRendererRef = ref(null)

// 测试数据
const testData = `{
  "actionId": "push_video",
  "type": "input",
  "title": "推送视频播放",
  "description": "请输入要推送的视频链接",
  "id": "video_url",
  "placeholder": "请输入视频链接",
  "required": true,
  "validation": {
    "pattern": "^https?://.*",
    "message": "请输入有效的视频链接"
  }
}`

function loadTestData() {
  rawData.value = testData
  parseData()
}

function parseData() {
  try {
    parseResult.value = null
    rendererError.value = ''
    
    if (!rawData.value.trim()) {
      parseResult.value = {
        success: false,
        error: '请输入数据'
      }
      return
    }
    
    // 尝试解析JSON
    let jsonData
    try {
      jsonData = JSON.parse(rawData.value)
    } catch (e) {
      parseResult.value = {
        success: false,
        error: `JSON解析失败: ${e.message}`
      }
      return
    }
    
    // 使用parseActionConfig解析
    try {
      const config = parseActionConfig(jsonData)
      parseResult.value = {
        success: true,
        config: config
      }
    } catch (e) {
      parseResult.value = {
        success: false,
        error: `Action配置解析失败: ${e.message}`
      }
    }
  } catch (e) {
    parseResult.value = {
      success: false,
      error: `未知错误: ${e.message}`
    }
  }
}

function testActionRenderer() {
  try {
    if (parseResult.value && parseResult.value.success) {
      currentActionData.value = parseResult.value.config
      showActionRenderer.value = true
      rendererError.value = ''
    }
  } catch (e) {
    rendererError.value = `ActionRenderer测试失败: ${e.message}`
  }
}

function handleActionClose() {
  showActionRenderer.value = false
  currentActionData.value = null
}

function handleActionSubmit(data) {
  console.log('Action提交数据:', data)
  alert(`Action提交成功: ${JSON.stringify(data, null, 2)}`)
  showActionRenderer.value = false
}

function handleActionError(error) {
  console.error('Action错误:', error)
  rendererError.value = `ActionRenderer错误: ${error.message || error}`
}
</script>