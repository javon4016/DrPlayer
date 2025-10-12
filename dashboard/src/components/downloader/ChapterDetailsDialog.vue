<template>
  <a-modal
    :visible="visible"
    :title="`章节详情 - ${task?.novelTitle || ''}`"
    width="900px"
    :footer="false"
    @cancel="$emit('close')"
  >
    <div class="chapter-details" v-if="task">
      <!-- 统计信息 -->
      <div class="stats-section">
        <div class="stat-card">
          <div class="stat-number">{{ task.totalChapters }}</div>
          <div class="stat-label">总章节</div>
        </div>
        <div class="stat-card success">
          <div class="stat-number">{{ completedCount }}</div>
          <div class="stat-label">已完成</div>
        </div>
        <div class="stat-card warning">
          <div class="stat-number">{{ downloadingCount }}</div>
          <div class="stat-label">下载中</div>
        </div>
        <div class="stat-card danger">
          <div class="stat-number">{{ failedCount }}</div>
          <div class="stat-label">失败</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ pendingCount }}</div>
          <div class="stat-label">等待中</div>
        </div>
      </div>

      <!-- 过滤器 -->
      <div class="filter-section">
        <a-radio-group v-model="statusFilter" type="button" size="small">
          <a-radio value="all">全部</a-radio>
          <a-radio value="completed">已完成</a-radio>
          <a-radio value="downloading">下载中</a-radio>
          <a-radio value="failed">失败</a-radio>
          <a-radio value="pending">等待中</a-radio>
        </a-radio-group>
        
        <div class="search-box">
          <a-input
            v-model="searchKeyword"
            placeholder="搜索章节名称"
            size="small"
            style="width: 200px"
          >
            <template #prefix>
              <icon-search />
            </template>
          </a-input>
        </div>
      </div>

      <!-- 章节列表 -->
      <div class="chapter-list">
        <div class="list-header">
          <div class="header-cell index">序号</div>
          <div class="header-cell name">章节名称</div>
          <div class="header-cell status">状态</div>
          <div class="header-cell size">大小</div>
          <div class="header-cell time">时间</div>
          <div class="header-cell actions">操作</div>
        </div>
        
        <div class="list-body">
          <div 
            v-for="(chapter, index) in filteredChapters" 
            :key="index"
            class="chapter-row"
            :class="getChapterStatusClass(chapter)"
          >
            <div class="cell index">{{ index + 1 }}</div>
            <div class="cell name">
              <span class="chapter-title">{{ chapter.name || `第${index + 1}章` }}</span>
              <div v-if="chapter.error" class="error-message">
                {{ chapter.error }}
              </div>
            </div>
            <div class="cell status">
              <a-tag :color="getStatusColor(chapter.status)">
                {{ getStatusText(chapter.status) }}
              </a-tag>
              <div v-if="chapter.status === 'downloading'" class="progress-mini">
                <a-progress 
                  :percent="chapter.progress || 0" 
                  size="mini"
                  :show-text="false"
                />
              </div>
            </div>
            <div class="cell size">
              {{ formatSize(chapter.size) }}
            </div>
            <div class="cell time">
              <div v-if="chapter.startTime" class="time-info">
                开始: {{ formatTime(chapter.startTime) }}
              </div>
              <div v-if="chapter.completeTime" class="time-info">
                完成: {{ formatTime(chapter.completeTime) }}
              </div>
            </div>
            <div class="cell actions">
              <a-button 
                v-if="chapter.status === 'failed'"
                size="mini" 
                type="primary"
                @click="retryChapter(index)"
              >
                重试
              </a-button>
              <a-button 
                v-if="chapter.status === 'completed'"
                size="mini"
                @click="previewChapter(chapter)"
              >
                预览
              </a-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 批量操作 -->
      <div class="batch-actions" v-if="failedCount > 0">
        <a-button type="primary" @click="retryAllFailed">
          重试所有失败章节
        </a-button>
      </div>
    </div>

    <!-- 章节预览对话框 -->
    <a-modal
      v-model:visible="showPreview"
      title="章节预览"
      width="600px"
      :footer="false"
    >
      <div class="chapter-preview" v-if="previewChapterData">
        <h3>{{ previewChapterData.name }}</h3>
        <div class="preview-content">
          {{ previewChapterData.content || '暂无内容' }}
        </div>
      </div>
    </a-modal>
  </a-modal>
</template>

<script setup>
import { ref, computed } from 'vue'
import { IconSearch } from '@arco-design/web-vue/es/icon'

// Props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  task: {
    type: Object,
    default: null
  }
})

// Emits
const emit = defineEmits(['close', 'retry-chapter'])

// 响应式数据
const statusFilter = ref('all')
const searchKeyword = ref('')
const showPreview = ref(false)
const previewChapterData = ref(null)

// 计算属性
const completedCount = computed(() => {
  return props.task?.chapters?.filter(ch => ch.status === 'completed').length || 0
})

const downloadingCount = computed(() => {
  return props.task?.chapters?.filter(ch => ch.status === 'downloading').length || 0
})

const failedCount = computed(() => {
  return props.task?.chapters?.filter(ch => ch.status === 'failed').length || 0
})

const pendingCount = computed(() => {
  return props.task?.chapters?.filter(ch => ch.status === 'pending').length || 0
})

const filteredChapters = computed(() => {
  if (!props.task?.chapters) return []
  
  let chapters = props.task.chapters
  
  // 状态过滤
  if (statusFilter.value !== 'all') {
    chapters = chapters.filter(ch => ch.status === statusFilter.value)
  }
  
  // 关键词搜索
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    chapters = chapters.filter(ch => 
      (ch.name || '').toLowerCase().includes(keyword)
    )
  }
  
  return chapters
})

// 方法
const getChapterStatusClass = (chapter) => {
  return `status-${chapter.status || 'pending'}`
}

const getStatusColor = (status) => {
  const colors = {
    pending: 'gray',
    downloading: 'blue',
    completed: 'green',
    failed: 'red'
  }
  return colors[status] || 'gray'
}

const getStatusText = (status) => {
  const texts = {
    pending: '等待中',
    downloading: '下载中',
    completed: '已完成',
    failed: '失败'
  }
  return texts[status] || '未知'
}

const formatSize = (bytes) => {
  if (!bytes) return '-'
  const sizes = ['B', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
}

const formatTime = (timestamp) => {
  if (!timestamp) return '-'
  return new Date(timestamp).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const retryChapter = (chapterIndex) => {
  emit('retry-chapter', props.task.id, chapterIndex)
}

const retryAllFailed = () => {
  const failedChapters = props.task.chapters
    .map((ch, index) => ({ chapter: ch, index }))
    .filter(({ chapter }) => chapter.status === 'failed')
  
  failedChapters.forEach(({ index }) => {
    emit('retry-chapter', props.task.id, index)
  })
}

const previewChapter = (chapter) => {
  previewChapterData.value = chapter
  showPreview.value = true
}
</script>

<style scoped>
.chapter-details {
  max-height: 70vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.stats-section {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card {
  flex: 1;
  padding: 16px;
  background: var(--color-bg-2);
  border-radius: 8px;
  text-align: center;
  border: 1px solid var(--color-border-2);
}

.stat-card.success {
  border-color: var(--color-success-light-4);
  background: var(--color-success-light-1);
}

.stat-card.warning {
  border-color: var(--color-warning-light-4);
  background: var(--color-warning-light-1);
}

.stat-card.danger {
  border-color: var(--color-danger-light-4);
  background: var(--color-danger-light-1);
}

.stat-number {
  font-size: 24px;
  font-weight: 600;
  color: var(--color-text-1);
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: var(--color-text-3);
}

.filter-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--color-border-2);
}

.search-box {
  display: flex;
  align-items: center;
  gap: 8px;
}

.chapter-list {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.list-header {
  display: grid;
  grid-template-columns: 60px 1fr 100px 80px 120px 80px;
  gap: 12px;
  padding: 12px 16px;
  background: var(--color-bg-2);
  border-radius: 4px;
  font-weight: 600;
  font-size: 12px;
  color: var(--color-text-2);
  margin-bottom: 8px;
}

.list-body {
  flex: 1;
  overflow-y: auto;
}

.chapter-row {
  display: grid;
  grid-template-columns: 60px 1fr 100px 80px 120px 80px;
  gap: 12px;
  padding: 12px 16px;
  border: 1px solid var(--color-border-2);
  border-radius: 4px;
  margin-bottom: 4px;
  transition: all 0.2s ease;
}

.chapter-row:hover {
  background: var(--color-bg-1);
}

.status-completed {
  border-color: var(--color-success-light-4);
  background: var(--color-success-light-1);
}

.status-downloading {
  border-color: var(--color-primary-light-4);
  background: var(--color-primary-light-1);
}

.status-failed {
  border-color: var(--color-danger-light-4);
  background: var(--color-danger-light-1);
}

.cell {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: var(--color-text-2);
}

.cell.index {
  justify-content: center;
  font-weight: 600;
}

.cell.name {
  flex-direction: column;
  align-items: flex-start;
}

.chapter-title {
  font-weight: 500;
  color: var(--color-text-1);
  margin-bottom: 2px;
}

.error-message {
  font-size: 11px;
  color: var(--color-danger-6);
  margin-top: 2px;
}

.progress-mini {
  margin-top: 4px;
  width: 100%;
}

.time-info {
  font-size: 11px;
  color: var(--color-text-3);
  margin-bottom: 2px;
}

.batch-actions {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--color-border-2);
  text-align: center;
}

.chapter-preview {
  max-height: 400px;
  overflow-y: auto;
}

.chapter-preview h3 {
  margin: 0 0 16px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--color-border-2);
}

.preview-content {
  line-height: 1.6;
  color: var(--color-text-2);
  white-space: pre-wrap;
}
</style>