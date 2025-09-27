<template>
  <a-modal
    :visible="visible"
    title="全部分类"
    :footer="false"
    width="80%"
    class="category-modal"
    @cancel="handleClose"
  >
    <div class="category-modal-content">
      <!-- 推荐分类 -->
      <div 
        v-if="hasRecommendVideos"
        class="category-item"
        :class="{ active: activeKey === 'recommendTuijian404' }"
        @click="handleSelectCategory('recommendTuijian404')"
      >
        推荐
      </div>
      
      <!-- 其他分类 -->
      <div 
        v-for="item in classList.class"
        :key="item.type_id"
        class="category-item"
        :class="{ active: activeKey === item.type_id }"
        @click="handleSelectCategory(item.type_id)"
      >
        {{ item.type_name }}
      </div>
    </div>
  </a-modal>
</template>

<script setup>
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  classList: {
    type: Object,
    required: true
  },
  hasRecommendVideos: {
    type: Boolean,
    default: false
  },
  activeKey: {
    type: String,
    required: true
  }
});

const emit = defineEmits(['update:visible', 'select-category']);

const handleClose = () => {
  emit('update:visible', false);
};

const handleSelectCategory = (categoryId) => {
  emit('select-category', categoryId);
  handleClose();
};
</script>

<style scoped>
.category-modal-content {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
  max-height: 60vh;
  overflow-y: auto;
  padding: 16px 0;
}

.category-item {
  padding: 12px 16px;
  background: #f7f8fa;
  border: 1px solid #e5e6eb;
  border-radius: 8px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
  font-weight: 500;
  color: #1d2129;
}

.category-item:hover {
  background: #e8f3ff;
  border-color: #7bc4ff;
  color: #165dff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.category-item.active {
  background: #165dff !important;
  border-color: #165dff !important;
  color: white !important;
  font-weight: 600;
}

.category-item.active:hover {
  background: #4080ff !important;
  border-color: #4080ff !important;
  color: white !important;
}

/* 滚动条样式 */
.category-modal-content::-webkit-scrollbar {
  width: 6px;
}

.category-modal-content::-webkit-scrollbar-track {
  background: #f7f8fa;
  border-radius: 3px;
}

.category-modal-content::-webkit-scrollbar-thumb {
  background: #c9cdd4;
  border-radius: 3px;
}

.category-modal-content::-webkit-scrollbar-thumb:hover {
  background: #a9aeb8;
}

/* 暗色主题适配 */
@media (prefers-color-scheme: dark) {
  .category-item {
    background: #2a2a2b;
    border-color: #3a3a3c;
    color: #ffffff;
  }

  .category-item:hover {
    background: #1a3a5c;
    border-color: #4080ff;
    color: #7bc4ff;
  }

  .category-modal-content::-webkit-scrollbar-track {
    background: #2a2a2b;
  }

  .category-modal-content::-webkit-scrollbar-thumb {
    background: #4a4a4c;
  }

  .category-modal-content::-webkit-scrollbar-thumb:hover {
    background: #5a5a5c;
  }
}
</style>