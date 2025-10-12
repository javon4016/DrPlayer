<template>
  <a-modal
    v-model:visible="visible"
    title="书签管理"
    width="600px"
    :footer="false"
    @cancel="handleClose"
  >
    <div class="bookmark-dialog">
      <!-- 添加书签区域 -->
      <div class="add-bookmark-section">
        <div class="section-title">
          <icon-bookmark />
          添加书签
        </div>
        <div class="add-bookmark-form">
          <a-input
            v-model="newBookmarkTitle"
            placeholder="输入书签标题（可选）"
            class="bookmark-input"
            @keyup.enter="handleAddBookmark"
          />
          <a-button type="primary" @click="handleAddBookmark">
            <template #icon>
              <icon-plus />
            </template>
            添加
          </a-button>
        </div>
      </div>

      <!-- 书签列表 -->
      <div class="bookmarks-section">
        <div class="section-title">
          <icon-list />
          书签列表 ({{ bookmarks.length }})
        </div>
        
        <div v-if="bookmarks.length === 0" class="empty-state">
          <icon-bookmark />
          <p>暂无书签</p>
          <p class="empty-tip">在阅读时添加书签，方便快速定位</p>
        </div>

        <div v-else class="bookmark-list">
          <div
            v-for="bookmark in sortedBookmarks"
            :key="bookmark.id"
            class="bookmark-item"
            @click="handleBookmarkClick(bookmark)"
          >
            <div class="bookmark-content">
              <div class="bookmark-title">{{ bookmark.title }}</div>
              <div class="bookmark-meta">
                <span class="bookmark-progress">{{ bookmark.percentage.toFixed(1) }}%</span>
                <span class="bookmark-time">{{ formatTime(bookmark.createdAt) }}</span>
              </div>
            </div>
            <div class="bookmark-actions">
              <a-button
                type="text"
                size="small"
                @click.stop="handleEditBookmark(bookmark)"
                title="编辑"
              >
                <template #icon>
                  <icon-edit />
                </template>
              </a-button>
              <a-button
                type="text"
                size="small"
                status="danger"
                @click.stop="handleDeleteBookmark(bookmark.id)"
                title="删除"
              >
                <template #icon>
                  <icon-delete />
                </template>
              </a-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 编辑书签对话框 -->
    <a-modal
      v-model:visible="showEditDialog"
      title="编辑书签"
      width="400px"
      @ok="handleSaveEdit"
      @cancel="handleCancelEdit"
    >
      <a-input
        v-model="editingTitle"
        placeholder="输入书签标题"
        @keyup.enter="handleSaveEdit"
      />
    </a-modal>
  </a-modal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Message } from '@arco-design/web-vue'
import {
  IconBookmark,
  IconList,
  IconPlus,
  IconEdit,
  IconDelete
} from '@arco-design/web-vue/es/icon'

// Props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  bookmarks: {
    type: Array,
    default: () => []
  }
})

// Emits
const emit = defineEmits([
  'update:visible',
  'bookmark-selected',
  'bookmark-added',
  'bookmark-deleted',
  'bookmark-updated'
])

// 响应式数据
const visible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

const newBookmarkTitle = ref('')
const showEditDialog = ref(false)
const editingBookmark = ref(null)
const editingTitle = ref('')

// 计算属性
const sortedBookmarks = computed(() => {
  return [...props.bookmarks].sort((a, b) => b.createdAt - a.createdAt)
})

// 方法
const handleClose = () => {
  visible.value = false
}

const handleAddBookmark = () => {
  if (!newBookmarkTitle.value.trim()) {
    newBookmarkTitle.value = `书签 ${props.bookmarks.length + 1}`
  }
  
  emit('bookmark-added', {
    title: newBookmarkTitle.value.trim()
  })
  
  newBookmarkTitle.value = ''
}

const handleBookmarkClick = (bookmark) => {
  emit('bookmark-selected', bookmark)
}

const handleEditBookmark = (bookmark) => {
  editingBookmark.value = bookmark
  editingTitle.value = bookmark.title
  showEditDialog.value = true
}

const handleSaveEdit = () => {
  if (!editingTitle.value.trim()) {
    Message.warning('书签标题不能为空')
    return
  }
  
  emit('bookmark-updated', {
    id: editingBookmark.value.id,
    title: editingTitle.value.trim()
  })
  
  showEditDialog.value = false
  editingBookmark.value = null
  editingTitle.value = ''
}

const handleCancelEdit = () => {
  showEditDialog.value = false
  editingBookmark.value = null
  editingTitle.value = ''
}

const handleDeleteBookmark = (bookmarkId) => {
  emit('bookmark-deleted', bookmarkId)
}

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

// 监听对话框关闭
watch(visible, (newVisible) => {
  if (!newVisible) {
    newBookmarkTitle.value = ''
  }
})
</script>

<style scoped>
.bookmark-dialog {
  max-height: 500px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-1);
  margin-bottom: 12px;
}

.add-bookmark-section {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--color-border-2);
}

.add-bookmark-form {
  display: flex;
  gap: 8px;
  align-items: center;
}

.bookmark-input {
  flex: 1;
}

.bookmarks-section {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: var(--color-text-3);
  text-align: center;
}

.empty-state .arco-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-state p {
  margin: 4px 0;
}

.empty-tip {
  font-size: 12px;
  color: var(--color-text-4);
}

.bookmark-list {
  flex: 1;
  overflow-y: auto;
  max-height: 300px;
}

.bookmark-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  border: 1px solid var(--color-border-2);
  border-radius: 6px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.bookmark-item:hover {
  border-color: var(--color-primary-light-4);
  background: var(--color-primary-light-1);
}

.bookmark-content {
  flex: 1;
  min-width: 0;
}

.bookmark-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-1);
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bookmark-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: var(--color-text-3);
}

.bookmark-progress {
  color: var(--color-primary-6);
  font-weight: 500;
}

.bookmark-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.bookmark-item:hover .bookmark-actions {
  opacity: 1;
}

/* 滚动条样式 */
.bookmark-list::-webkit-scrollbar {
  width: 6px;
}

.bookmark-list::-webkit-scrollbar-track {
  background: var(--color-fill-1);
  border-radius: 3px;
}

.bookmark-list::-webkit-scrollbar-thumb {
  background: var(--color-fill-3);
  border-radius: 3px;
}

.bookmark-list::-webkit-scrollbar-thumb:hover {
  background: var(--color-fill-4);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .add-bookmark-form {
    flex-direction: column;
    align-items: stretch;
  }
  
  .bookmark-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .bookmark-actions {
    opacity: 1;
    align-self: flex-end;
  }
}
</style>