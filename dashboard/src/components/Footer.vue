<template>
  <div class="footer-content">
    <!-- 翻页统计信息 -->
    <div v-if="paginationStore.shouldShow" class="pagination-stats">
      <span class="stats-text">{{ paginationStore.statsText }}</span>
    </div>
    <!-- 默认底部工具条内容 -->
    <div v-else class="default-footer">
      <span>底部工具条</span>
    </div>
  </div>
</template>

<script setup>
import { usePaginationStore } from '@/stores/paginationStore';

// 使用翻页统计store
const paginationStore = usePaginationStore();
</script>

<style scoped>
.footer-content {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pagination-stats {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.stats-text {
  font-size: 13px;
  color: var(--color-text-2);
  font-weight: 500;
}

.default-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  color: var(--color-text-2);
  font-size: 14px;
}
</style>
