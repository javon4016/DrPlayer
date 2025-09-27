<template>
  <div class="category-nav-wrapper" ref="navWrapperRef">
    <!-- 分类tabs -->
    <a-tabs 
       v-model:active-key="activeKey" 
       class="category-tabs"
       type="line"
       size="large"
       position="top"
       :editable="false"
       @change="handleTabChange"
     >
      <a-tab-pane v-if="hasRecommendVideos" key="recommendTuijian404" title="推荐" />
      <a-tab-pane 
         v-for="item in classList?.class || []" 
         :key="item.type_id" 
         :title="item.type_name" 
       />
    </a-tabs>
    
    <!-- 分类管理按钮 -->
    <div class="category-manage" @click="openCategoryModal">
      <icon-apps />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { IconApps } from '@arco-design/web-vue/es/icon';

const props = defineProps({
  classList: {
    type: Object,
    default: () => ({})
  },
  trigger: {
    type: String,
    default: 'click'
  },
  hasRecommendVideos: {
    type: Boolean,
    default: false
  },
  activeKey: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['tab-change', 'open-category-modal']);

// 计算默认的activeKey
const getDefaultActiveKey = () => {
  if (props.hasRecommendVideos) {
    return "recommendTuijian404";
  }
  if (props.classList?.class && props.classList.class.length > 0) {
    return props.classList.class[0].type_id;
  }
  return "recommendTuijian404";
};

// 响应式数据
const activeKey = ref(props.activeKey || getDefaultActiveKey());
const navWrapperRef = ref(null);
let wheelHandler = null;

// 监听props变化，更新activeKey
watch(() => [props.hasRecommendVideos, props.classList, props.activeKey], () => {
  const newActiveKey = props.activeKey || getDefaultActiveKey();
  if (activeKey.value !== newActiveKey) {
    activeKey.value = newActiveKey;
    // 只有当activeKey不是从外部传入时才触发change事件
    if (!props.activeKey) {
      handleTabChange(newActiveKey);
    }
  }
}, { immediate: true });

const handleTabChange = (key) => {
  activeKey.value = key;
  emit('tab-change', key);
};

const openCategoryModal = () => {
  emit('open-category-modal');
};

onMounted(() => {
  const wrapper = navWrapperRef.value;
  if (!wrapper) return;
  const list = wrapper.querySelector('.arco-tabs-nav-tab-list');
  if (!list) return;
  // 将垂直滚轮转换为水平滚动，提升可用性
  wheelHandler = (ev) => {
    // 仅当垂直滚动明显时处理
    if (Math.abs(ev.deltaY) > Math.abs(ev.deltaX)) {
      list.scrollLeft += ev.deltaY;
      ev.preventDefault();
    }
  };
  list.addEventListener('wheel', wheelHandler, { passive: false });
});

onBeforeUnmount(() => {
  const wrapper = navWrapperRef.value;
  const list = wrapper?.querySelector?.('.arco-tabs-nav-tab-list');
  if (list && wheelHandler) {
    list.removeEventListener('wheel', wheelHandler);
  }
});
</script>

<style scoped>
.category-nav-wrapper {
  display: flex;
  align-items: center;
  padding: 0 16px;
  background: white;
  border-bottom: 1px solid #f0f0f0;
}

.category-tabs {
  flex: 1;
  overflow: hidden;
  min-width: 0; /* 允许在flex布局中收缩 */
}

/* 确保tabs的高度与管理按钮对齐 */
.category-tabs :deep(.arco-tabs-nav-wrap) {
  height: 40px;
  display: flex;
  align-items: center;
}

.category-tabs :deep(.arco-tabs-tab) {
  height: 40px;
  display: flex;
  align-items: center;
}

/* 启用tabs横向滚动 */
.category-tabs :deep(.arco-tabs-nav) {
  overflow: visible; /* 允许内部列表展示溢出部分 */
}

.category-tabs :deep(.arco-tabs-nav-tab-list) {
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
  -ms-overflow-style: none;
  scroll-behavior: smooth;
  display: flex;
  flex-wrap: nowrap;
  white-space: nowrap;
}

.category-tabs :deep(.arco-tabs-nav-tab-list)::-webkit-scrollbar {
  display: none;
}

.category-tabs :deep(.arco-tabs-tab) {
  flex-shrink: 0;
  white-space: nowrap;
  min-width: auto;
}

.category-manage {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: #f5f5f5;
  cursor: pointer;
  transition: all 0.2s;
  margin-left: 16px;
  flex-shrink: 0;
  transform: translateY(-6px);
}

.category-manage:hover {
  background: #e6f7ff;
  color: #1890ff;
}
</style>