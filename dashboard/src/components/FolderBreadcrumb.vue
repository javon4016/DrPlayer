<template>
  <div class="folder-breadcrumb" v-if="breadcrumbs.length > 0">
    <div class="breadcrumb-container">
      <a-breadcrumb separator=">">
        <a-breadcrumb-item 
          v-for="(item, index) in breadcrumbs" 
          :key="item.vod_id"
          class="breadcrumb-item"
          :class="{ 'is-current': index === breadcrumbs.length - 1 }"
        >
          <span 
            v-if="index === breadcrumbs.length - 1"
            class="current-item"
          >
            {{ item.vod_name }}
          </span>
          <a 
            v-else
            @click="handleBreadcrumbClick(item, index)"
            class="breadcrumb-link"
          >
            {{ item.vod_name }}
          </a>
        </a-breadcrumb-item>
      </a-breadcrumb>
    </div>
    
    <!-- 操作按钮 -->
    <div class="breadcrumb-actions">
      <a-button 
        size="small" 
        type="text" 
        @click="handleGoBack"
        :disabled="breadcrumbs.length <= 1"
        class="action-btn"
      >
        <template #icon>
          <icon-left />
        </template>
        返回上级
      </a-button>
      
      <a-button 
        size="small" 
        type="text" 
        @click="handleGoHome"
        :disabled="breadcrumbs.length <= 1"
        class="action-btn"
      >
        <template #icon>
          <icon-home />
        </template>
        返回根目录
      </a-button>
      
      <a-button 
        size="small" 
        type="primary" 
        @click="handleExitFolder"
        class="action-btn exit-btn"
      >
        <template #icon>
          <icon-close />
        </template>
        退出目录模式
      </a-button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { IconLeft, IconHome, IconClose } from '@arco-design/web-vue/es/icon';

const props = defineProps({
  breadcrumbs: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['navigate', 'go-back', 'go-home', 'exit-folder']);

// 处理面包屑点击
const handleBreadcrumbClick = (item, index) => {
  console.log('🗂️ [DEBUG] 面包屑点击:', item, index);
  emit('navigate', item, index);
};

// 返回上级
const handleGoBack = () => {
  if (props.breadcrumbs.length > 1) {
    const parentIndex = props.breadcrumbs.length - 2;
    const parentItem = props.breadcrumbs[parentIndex];
    console.log('🗂️ [DEBUG] 返回上级:', parentItem);
    emit('go-back', parentItem, parentIndex);
  }
};

// 返回根目录
const handleGoHome = () => {
  if (props.breadcrumbs.length > 1) {
    const rootItem = props.breadcrumbs[0];
    console.log('🗂️ [DEBUG] 返回根目录:', rootItem);
    emit('go-home', rootItem, 0);
  }
};

// 退出Folder模式
const handleExitFolder = () => {
  console.log('🗂️ [DEBUG] 退出Folder模式');
  emit('exit-folder');
};
</script>

<style scoped>
.folder-breadcrumb {
  background: #f8f9fa;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.breadcrumb-container {
  flex: 1;
  min-width: 0;
}

.breadcrumb-item {
  font-size: 14px;
}

.breadcrumb-link {
  color: #1890ff;
  text-decoration: none;
  cursor: pointer;
  transition: color 0.2s ease;
  padding: 4px 8px;
  border-radius: 4px;
  display: inline-block;
}

.breadcrumb-link:hover {
  color: #40a9ff;
  background-color: rgba(24, 144, 255, 0.06);
}

.current-item {
  color: #262626;
  font-weight: 500;
  padding: 4px 8px;
  background-color: rgba(24, 144, 255, 0.1);
  border-radius: 4px;
  display: inline-block;
}

.breadcrumb-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.action-btn {
  color: #6b7280;
  border: 1px solid #d1d5db;
  background: white;
  transition: all 0.2s ease;
}

.action-btn:hover:not(:disabled) {
  color: #1890ff;
  border-color: #1890ff;
  background: rgba(24, 144, 255, 0.04);
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.exit-btn {
  background: #ff4d4f !important;
  border-color: #ff4d4f !important;
  color: white !important;
}

.exit-btn:hover:not(:disabled) {
  background: #ff7875 !important;
  border-color: #ff7875 !important;
  color: white !important;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .folder-breadcrumb {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  
  .breadcrumb-actions {
    justify-content: center;
  }
  
  .action-btn {
    flex: 1;
    max-width: 120px;
  }
}

/* 面包屑溢出处理 */
.breadcrumb-container :deep(.arco-breadcrumb) {
  overflow: hidden;
}

.breadcrumb-container :deep(.arco-breadcrumb-item) {
  max-width: 200px;
  overflow: hidden;
}

.breadcrumb-container :deep(.arco-breadcrumb-item) .breadcrumb-link,
.breadcrumb-container :deep(.arco-breadcrumb-item) .current-item {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}
</style>