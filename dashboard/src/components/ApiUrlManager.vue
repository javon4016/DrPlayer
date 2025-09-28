<template>
  <a-modal
    v-model:visible="visible"
    title="API地址批量修改"
    width="800px"
    :footer="false"
    @cancel="handleCancel"
  >
    <div class="api-manager">
      <!-- 说明文档 -->
      <a-alert
        type="info"
        show-icon
        style="margin-bottom: 16px"
      >
        <template #title>使用说明</template>
        <div>
          <p>此功能用于批量修改收藏和历史记录中的API地址，适用于API服务提供方更换域名、端口或密码的情况。</p>
          <p>系统会自动分析现有数据中的API地址模式，您可以选择要替换的地址模式并设置新的地址。</p>
        </div>
      </a-alert>

      <!-- 数据统计 -->
      <div class="stats-section">
        <a-row :gutter="16">
          <a-col :span="8">
            <a-statistic title="收藏记录" :value="favoriteCount" />
          </a-col>
          <a-col :span="8">
            <a-statistic title="历史记录" :value="historyCount" />
          </a-col>
          <a-col :span="8">
            <a-statistic title="不同API地址" :value="uniqueApiUrls.length" />
          </a-col>
        </a-row>
      </div>

      <!-- API地址分析 -->
      <div class="analysis-section">
        <h3>现有API地址分析</h3>
        <a-table
          :data="apiUrlAnalysis"
          :pagination="false"
          :scroll="{ y: 300 }"
          size="small"
        >
          <template #columns>
            <a-table-column title="API地址" data-index="url" :width="400">
              <template #cell="{ record }">
                <a-typography-text copyable style="font-family: monospace; font-size: 12px;">
                  {{ record.url }}
                </a-typography-text>
              </template>
            </a-table-column>
            <a-table-column title="使用次数" data-index="count" :width="100" align="center">
              <template #cell="{ record }">
                <a-tag color="blue">{{ record.count }}</a-tag>
              </template>
            </a-table-column>
            <a-table-column title="域名" data-index="domain" :width="150">
              <template #cell="{ record }">
                <a-tag color="green">{{ record.domain }}</a-tag>
              </template>
            </a-table-column>
            <a-table-column title="操作" :width="100" align="center">
              <template #cell="{ record }">
                <a-button
                  type="text"
                  size="small"
                  @click="selectForReplacement(record)"
                >
                  选择替换
                </a-button>
              </template>
            </a-table-column>
          </template>
        </a-table>
      </div>

      <!-- 替换配置 -->
      <div class="replacement-section" v-if="selectedApiUrl">
        <h3>配置替换规则</h3>
        <a-form :model="replacementForm" layout="vertical">
          <a-row :gutter="16">
            <a-col :span="12">
              <a-form-item label="原始地址" required>
                <a-input
                  v-model="replacementForm.oldUrl"
                  placeholder="要替换的API地址"
                  readonly
                />
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="新地址" required>
                <a-input
                  v-model="replacementForm.newUrl"
                  placeholder="新的API地址"
                  @input="validateNewUrl"
                />
              </a-form-item>
            </a-col>
          </a-row>

          <!-- 替换模式选择 -->
          <a-form-item label="替换模式">
            <a-radio-group v-model="replacementForm.mode">
              <a-radio value="exact">精确匹配</a-radio>
              <a-radio value="domain">仅替换域名</a-radio>
              <a-radio value="pattern">模式匹配</a-radio>
            </a-radio-group>
          </a-form-item>

          <!-- 模式匹配配置 -->
          <div v-if="replacementForm.mode === 'pattern'">
            <a-form-item label="匹配模式">
              <a-input
                v-model="replacementForm.pattern"
                placeholder="例如: http://localhost:5757 (将匹配所有以此开头的地址)"
              />
            </a-form-item>
            <a-form-item label="替换为">
              <a-input
                v-model="replacementForm.replacement"
                placeholder="例如: http://localhost:5759"
              />
            </a-form-item>
          </div>

          <!-- 预览影响 -->
          <a-form-item label="影响预览">
            <div class="preview-section">
              <a-alert
                type="warning"
                :title="`将影响 ${affectedCount} 条记录`"
                :description="previewText"
                show-icon
              />
            </div>
          </a-form-item>
        </a-form>
      </div>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <a-space>
          <a-button @click="handleCancel">取消</a-button>
          <a-button
            type="primary"
            :disabled="!canExecuteReplacement"
            :loading="isExecuting"
            @click="executeReplacement"
          >
            执行替换
          </a-button>
        </a-space>
      </div>
    </div>
  </a-modal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Message } from '@arco-design/web-vue'
import { useFavoriteStore } from '@/stores/favoriteStore'
import { useHistoryStore } from '@/stores/historyStore'

// Props
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['update:modelValue', 'completed'])

// Stores
const favoriteStore = useFavoriteStore()
const historyStore = useHistoryStore()

// 响应式数据
const visible = ref(false)
const selectedApiUrl = ref(null)
const isExecuting = ref(false)

// 替换表单
const replacementForm = ref({
  oldUrl: '',
  newUrl: '',
  mode: 'exact',
  pattern: '',
  replacement: ''
})

// 监听 modelValue 变化
watch(() => props.modelValue, (newVal) => {
  visible.value = newVal
  if (newVal) {
    initializeData()
  }
})

watch(visible, (newVal) => {
  emit('update:modelValue', newVal)
})

// 计算属性
const favoriteCount = computed(() => favoriteStore.favorites.length)
const historyCount = computed(() => historyStore.histories.length)

// 获取所有唯一的API地址
const uniqueApiUrls = computed(() => {
  const urls = new Set()
  
  // 收集收藏中的API地址
  favoriteStore.favorites.forEach(item => {
    if (item.api_info?.api_url) {
      urls.add(item.api_info.api_url)
    }
  })
  
  // 收集历史中的API地址
  historyStore.histories.forEach(item => {
    if (item.api_info?.api_url) {
      urls.add(item.api_info.api_url)
    }
  })
  
  return Array.from(urls)
})

// API地址分析
const apiUrlAnalysis = computed(() => {
  const analysis = {}
  
  // 统计每个API地址的使用次数
  const countUrl = (url) => {
    if (!analysis[url]) {
      analysis[url] = {
        url,
        count: 0,
        domain: extractDomain(url)
      }
    }
    analysis[url].count++
  }
  
  // 统计收藏
  favoriteStore.favorites.forEach(item => {
    if (item.api_info?.api_url) {
      countUrl(item.api_info.api_url)
    }
  })
  
  // 统计历史
  historyStore.histories.forEach(item => {
    if (item.api_info?.api_url) {
      countUrl(item.api_info.api_url)
    }
  })
  
  return Object.values(analysis).sort((a, b) => b.count - a.count)
})

// 提取域名
const extractDomain = (url) => {
  try {
    const urlObj = new URL(url)
    return `${urlObj.protocol}//${urlObj.host}`
  } catch {
    return '无效URL'
  }
}

// 计算受影响的记录数量
const affectedCount = computed(() => {
  if (!selectedApiUrl.value || !replacementForm.value.oldUrl) return 0
  
  let count = 0
  const { mode, oldUrl, pattern } = replacementForm.value
  
  const checkMatch = (url) => {
    switch (mode) {
      case 'exact':
        return url === oldUrl
      case 'domain':
        return extractDomain(url) === extractDomain(oldUrl)
      case 'pattern':
        return pattern && url.startsWith(pattern)
      default:
        return false
    }
  }
  
  // 统计收藏
  favoriteStore.favorites.forEach(item => {
    if (item.api_info?.api_url && checkMatch(item.api_info.api_url)) {
      count++
    }
  })
  
  // 统计历史
  historyStore.histories.forEach(item => {
    if (item.api_info?.api_url && checkMatch(item.api_info.api_url)) {
      count++
    }
  })
  
  return count
})

// 预览文本
const previewText = computed(() => {
  if (!selectedApiUrl.value) return ''
  
  const { mode, oldUrl, newUrl, pattern, replacement } = replacementForm.value
  
  switch (mode) {
    case 'exact':
      return `精确替换: ${oldUrl} → ${newUrl}`
    case 'domain':
      return `域名替换: ${extractDomain(oldUrl)} → ${extractDomain(newUrl)}`
    case 'pattern':
      return `模式替换: 以 "${pattern}" 开头的地址将替换为 "${replacement}"`
    default:
      return ''
  }
})

// 是否可以执行替换
const canExecuteReplacement = computed(() => {
  const { mode, oldUrl, newUrl, pattern, replacement } = replacementForm.value
  
  if (!selectedApiUrl.value || affectedCount.value === 0) return false
  
  switch (mode) {
    case 'exact':
      return oldUrl && newUrl && oldUrl !== newUrl
    case 'domain':
      return oldUrl && newUrl && extractDomain(oldUrl) !== extractDomain(newUrl)
    case 'pattern':
      return pattern && replacement && pattern !== replacement
    default:
      return false
  }
})

// 方法
const initializeData = () => {
  selectedApiUrl.value = null
  replacementForm.value = {
    oldUrl: '',
    newUrl: '',
    mode: 'exact',
    pattern: '',
    replacement: ''
  }
}

const selectForReplacement = (record) => {
  selectedApiUrl.value = record
  replacementForm.value.oldUrl = record.url
  replacementForm.value.newUrl = record.url
  replacementForm.value.pattern = extractDomain(record.url)
  replacementForm.value.replacement = extractDomain(record.url)
}

const validateNewUrl = () => {
  // 可以添加URL验证逻辑
}

const executeReplacement = async () => {
  if (!canExecuteReplacement.value) return
  
  isExecuting.value = true
  
  try {
    const { mode, oldUrl, newUrl, pattern, replacement } = replacementForm.value
    let replacedCount = 0
    
    const performReplacement = (url) => {
      switch (mode) {
        case 'exact':
          return url === oldUrl ? newUrl : url
        case 'domain':
          if (extractDomain(url) === extractDomain(oldUrl)) {
            return url.replace(extractDomain(oldUrl), extractDomain(newUrl))
          }
          return url
        case 'pattern':
          if (url.startsWith(pattern)) {
            return url.replace(pattern, replacement)
          }
          return url
        default:
          return url
      }
    }
    
    // 更新收藏数据
    favoriteStore.favorites.forEach(item => {
      if (item.api_info?.api_url) {
        const newApiUrl = performReplacement(item.api_info.api_url)
        if (newApiUrl !== item.api_info.api_url) {
          item.api_info.api_url = newApiUrl
          replacedCount++
        }
      }
    })
    
    // 更新历史数据
    historyStore.histories.forEach(item => {
      if (item.api_info?.api_url) {
        const newApiUrl = performReplacement(item.api_info.api_url)
        if (newApiUrl !== item.api_info.api_url) {
          item.api_info.api_url = newApiUrl
          replacedCount++
        }
      }
    })
    
    // 保存更新后的数据
    favoriteStore.saveFavorites()
    historyStore.saveHistories()
    
    Message.success(`成功替换 ${replacedCount} 条记录的API地址`)
    
    // 通知父组件完成
    emit('completed', { replacedCount, mode })
    
    // 关闭弹窗
    handleCancel()
    
  } catch (error) {
    console.error('执行API地址替换失败:', error)
    Message.error('替换失败，请稍后重试')
  } finally {
    isExecuting.value = false
  }
}

const handleCancel = () => {
  visible.value = false
  initializeData()
}
</script>

<style scoped>
.api-manager {
  max-height: 70vh;
  overflow-y: auto;
}

.stats-section {
  margin: 16px 0;
  padding: 16px;
  background: var(--color-fill-1);
  border-radius: 6px;
}

.analysis-section {
  margin: 16px 0;
}

.analysis-section h3 {
  margin-bottom: 12px;
  font-size: 16px;
  font-weight: 600;
}

.replacement-section {
  margin: 16px 0;
  padding: 16px;
  border: 1px solid var(--color-border-2);
  border-radius: 6px;
  background: var(--color-bg-1);
}

.replacement-section h3 {
  margin-bottom: 16px;
  font-size: 16px;
  font-weight: 600;
}

.preview-section {
  margin-top: 8px;
}

.action-buttons {
  margin-top: 24px;
  text-align: right;
  border-top: 1px solid var(--color-border-2);
  padding-top: 16px;
}

:deep(.arco-table-cell) {
  padding: 8px 12px !important;
}

:deep(.arco-typography) {
  margin-bottom: 0 !important;
}
</style>