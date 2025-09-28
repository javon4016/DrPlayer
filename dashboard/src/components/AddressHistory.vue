<template>
  <a-popover 
    v-model:popup-visible="visible"
    trigger="click"
    position="bottom"
    :content-style="{ padding: 0, maxWidth: '400px' }"
  >
    <template #content>
      <div class="address-history-content">
        <div class="history-header">
          <span class="history-title">历史配置</span>
          <span class="history-count">{{ histories.length }}/10</span>
        </div>
        
        <div v-if="histories.length === 0" class="empty-state">
          <icon-history class="empty-icon" />
          <span class="empty-text">暂无历史配置</span>
        </div>
        
        <div v-else class="history-list">
          <div 
            v-for="(item, index) in histories" 
            :key="index"
            class="history-item"
            @click="selectHistory(item)"
          >
            <div class="history-content">
              <div class="history-url">{{ item.url }}</div>
              <div class="history-time">{{ formatTime(item.timestamp) }}</div>
            </div>
            <a-button 
              type="text" 
              size="mini"
              class="delete-btn"
              @click.stop="deleteHistory(index)"
            >
              <template #icon>
                <icon-delete />
              </template>
            </a-button>
          </div>
        </div>
        
        <div v-if="histories.length > 0" class="history-footer">
          <a-button 
            type="text" 
            size="small"
            @click="clearAllHistories"
            class="clear-all-btn"
          >
            <template #icon>
              <icon-delete />
            </template>
            清空全部
          </a-button>
        </div>
      </div>
    </template>
    
    <a-button type="text" size="small" class="history-trigger-btn">
      <template #icon>
        <icon-history />
      </template>
    </a-button>
  </a-popover>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Message } from '@arco-design/web-vue'
import { 
  IconHistory, 
  IconDelete 
} from '@arco-design/web-vue/es/icon'

const props = defineProps({
  configKey: {
    type: String,
    required: true
  },
  currentValue: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['select'])

const visible = ref(false)
const histories = ref([])

// 获取存储键名
const storageKey = computed(() => `address-history-${props.configKey}`)

// 加载历史记录
const loadHistories = () => {
  try {
    const stored = localStorage.getItem(storageKey.value)
    if (stored) {
      histories.value = JSON.parse(stored)
    }
  } catch (error) {
    console.error('加载历史记录失败:', error)
    histories.value = []
  }
}

// 保存历史记录
const saveHistories = () => {
  try {
    localStorage.setItem(storageKey.value, JSON.stringify(histories.value))
  } catch (error) {
    console.error('保存历史记录失败:', error)
  }
}

// 添加历史记录
const addHistory = (url) => {
  if (!url || !url.trim()) return
  
  const trimmedUrl = url.trim()
  
  // 检查是否已存在
  const existingIndex = histories.value.findIndex(item => item.url === trimmedUrl)
  if (existingIndex !== -1) {
    // 如果已存在，移到最前面并更新时间
    const existing = histories.value.splice(existingIndex, 1)[0]
    existing.timestamp = Date.now()
    histories.value.unshift(existing)
  } else {
    // 添加新记录
    histories.value.unshift({
      url: trimmedUrl,
      timestamp: Date.now()
    })
  }
  
  // 保持最多10条记录
  if (histories.value.length > 10) {
    histories.value = histories.value.slice(0, 10)
  }
  
  saveHistories()
}

// 选择历史记录
const selectHistory = (item) => {
  emit('select', item.url)
  visible.value = false
  Message.success('已填充历史配置')
}

// 删除单个历史记录
const deleteHistory = (index) => {
  histories.value.splice(index, 1)
  saveHistories()
  Message.success('已删除历史记录')
}

// 清空所有历史记录
const clearAllHistories = () => {
  histories.value = []
  saveHistories()
  visible.value = false
  Message.success('已清空所有历史记录')
}

// 格式化时间
const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date
  
  if (diff < 60000) { // 1分钟内
    return '刚刚'
  } else if (diff < 3600000) { // 1小时内
    return `${Math.floor(diff / 60000)}分钟前`
  } else if (diff < 86400000) { // 1天内
    return `${Math.floor(diff / 3600000)}小时前`
  } else if (diff < 604800000) { // 1周内
    return `${Math.floor(diff / 86400000)}天前`
  } else {
    return date.toLocaleDateString()
  }
}

// 监听当前值变化，自动保存到历史记录
watch(() => props.currentValue, (newValue, oldValue) => {
  if (oldValue && oldValue.trim() && newValue !== oldValue) {
    addHistory(oldValue)
  }
}, { flush: 'post' })

// 暴露添加历史记录的方法
defineExpose({
  addHistory
})

// 初始化
loadHistories()
</script>

<style scoped>
.history-trigger-btn {
  color: var(--color-text-3);
  transition: all 0.3s ease;
}

.history-trigger-btn:hover {
  color: var(--color-primary-6);
  background-color: var(--color-primary-light-1);
}

.address-history-content {
  width: 380px;
  max-height: 400px;
  background: white;
  border-radius: 8px;
  overflow: hidden;
}

.history-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--color-bg-2);
  border-bottom: 1px solid var(--color-border-2);
}

.history-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-1);
}

.history-count {
  font-size: 12px;
  color: var(--color-text-3);
  background: var(--color-fill-2);
  padding: 2px 6px;
  border-radius: 4px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: var(--color-text-3);
}

.empty-icon {
  font-size: 32px;
  margin-bottom: 8px;
  opacity: 0.5;
}

.empty-text {
  font-size: 14px;
}

.history-list {
  max-height: 300px;
  overflow-y: auto;
}

.history-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 1px solid var(--color-border-3);
}

.history-item:hover {
  background: var(--color-bg-2);
}

.history-item:last-child {
  border-bottom: none;
}

.history-content {
  flex: 1;
  min-width: 0;
  margin-right: 8px;
}

.history-url {
  font-size: 13px;
  color: var(--color-text-1);
  word-break: break-all;
  line-height: 1.4;
  margin-bottom: 4px;
}

.history-time {
  font-size: 11px;
  color: var(--color-text-3);
}

.delete-btn {
  color: var(--color-text-4);
  opacity: 0;
  transition: all 0.2s ease;
}

.history-item:hover .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  color: var(--color-danger-6);
  background-color: var(--color-danger-light-1);
}

.history-footer {
  padding: 8px 16px;
  background: var(--color-bg-1);
  border-top: 1px solid var(--color-border-2);
  text-align: center;
}

.clear-all-btn {
  color: var(--color-text-3);
  font-size: 12px;
}

.clear-all-btn:hover {
  color: var(--color-danger-6);
  background-color: var(--color-danger-light-1);
}

/* 滚动条样式 */
.history-list::-webkit-scrollbar {
  width: 4px;
}

.history-list::-webkit-scrollbar-track {
  background: var(--color-bg-2);
}

.history-list::-webkit-scrollbar-thumb {
  background: var(--color-border-3);
  border-radius: 2px;
}

.history-list::-webkit-scrollbar-thumb:hover {
  background: var(--color-border-2);
}
</style>