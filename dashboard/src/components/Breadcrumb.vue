<template>
  <div class="breadcrumb-container">
    <!-- 左侧区域：导航标题和操作按钮 -->
    <div class="header-left">
      <span class="navigation-title">{{ navigation_title }}</span>
      <a-button type="outline" status="success" shape="round" @click="handleOpenForm">
        <template #icon>
          <icon-apps />
        </template>
        <template #default>{{ now_site_title }}</template>
      </a-button>

      <a-button type="outline" status="success" shape="round" @click="refreshPage">
        <template #icon>
          <icon-refresh />
        </template>
        <template #default>重载源</template>
      </a-button>
    </div>

    <!-- 中间搜索框 -->
    <div class="header-center">
      <a-input-search
        v-model="searchValue"
        placeholder="搜索视频"
        enter-button
        @search="onSearch"
        @press-enter="onSearch"
      />
    </div>

    <!-- 右侧控制按钮和时间 -->
    <div class="header-right">
      <a-button type="outline" status="success" shape="round" @click="minimize">
        <template #icon>
          <icon-bug />
        </template>
        <template #default>调试</template>
      </a-button>

      <a-button type="outline" status="success" shape="round" @click="maximize">
        <template #icon>
          <icon-settings />
        </template>
        <template #default>设置</template>
      </a-button>
      
      <a-button type="outline" status="success" shape="round" @click="closeWindow">
        <template #icon>
          <icon-user />
        </template>
        <template #default>用户设置</template>
      </a-button>
      
      <!-- 时间显示插槽 -->
      <slot name="default"></slot>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  navigation_title: {
    type: String,
    default: "Video",
  },

  now_site_title: String,
});
const emit = defineEmits([
  "handleOpenForm",
  "closeWindow",
  "maximize",
  "minimize",
  "refreshPage",
  "onSearch",
]);

const searchValue = ref('')

const handleOpenForm = () => {
  emit("handleOpenForm");
};
const refreshPage = () => {
  emit("refreshPage");
};
const onSearch = (value) => {
  // 如果value是字符串，使用它；否则使用当前输入框的值
  const searchTerm = typeof value === 'string' ? value : searchValue.value
  if (searchTerm && typeof searchTerm === 'string' && searchTerm.trim()) {
    emit("onSearch", searchTerm.trim());
  }
};

const closeWindow = () => {
  emit("closeWindow");
};
const minimize = () => {
  emit("minimize");
};
const maximize = () => {
  emit("maximize");
};
</script>

<style scoped>
.breadcrumb-container {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 16px 20px;
  background: var(--color-bg-3);
  border-bottom: 1px solid var(--color-border-2);
  box-sizing: border-box;
}

.header-left {
  display: flex;
  align-items: center;
  flex: 0 0 auto;
  min-width: 0;
}

.navigation-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-1);
  margin-right: 16px;
  white-space: nowrap;
}

.header-left button {
  margin-right: 12px;
}

.header-center {
  flex: 1;
  display: flex;
  justify-content: center;
  padding: 0 20px;
  min-width: 0;
}

.header-center :deep(.arco-input-search) {
  max-width: 400px;
  width: 100%;
}

.header-right {
  display: flex;
  align-items: center;
  flex: 0 0 auto;
  min-width: 0;
}

.header-right button {
  margin-right: 12px;
}

.header-right button:last-of-type {
  margin-right: 16px;
}

/* 时间显示样式 */
.header-right :deep(.current-time) {
  font-size: 14px;
  color: var(--color-text-2);
  white-space: nowrap;
  margin-left: 8px;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .header-center :deep(.arco-input-search) {
    max-width: 300px;
  }
}

@media (max-width: 768px) {
  .breadcrumb-container {
    padding: 12px 16px;
  }
  
  .navigation-title {
    font-size: 14px;
    margin-right: 12px;
  }
  
  .header-center {
    padding: 0 12px;
  }
  
  .header-center :deep(.arco-input-search) {
    max-width: 250px;
  }
  
  .header-left button,
  .header-right button {
    margin-right: 8px;
  }
}
</style>
