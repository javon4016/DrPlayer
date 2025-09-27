<template>
  <div v-if="filters" class="filter-section">
    <div class="filter-header">
      <a-button 
        type="text" 
        @click="toggleVisible"
        class="filter-toggle-btn"
      >
        <template #icon>
          <icon-filter />
        </template>
        筛选条件
        <icon-down v-if="!visible" />
        <icon-up v-else />
      </a-button>
      <a-button 
        v-if="hasActiveFilters"
        type="text" 
        size="small"
        @click="handleResetFilters"
        class="filter-reset-btn"
      >
        重置
      </a-button>
    </div>
    
    <transition name="collapse">
      <div v-show="visible" class="filter-content">
        <div 
          v-for="filterGroup in filters" 
          :key="filterGroup.key"
          class="filter-group"
        >
          <div class="filter-group-row">
            <div class="filter-group-title">{{ filterGroup.name }}</div>
            <div class="filter-options-container">
              <div class="filter-options">
                <a-tag
                  v-for="option in filterGroup.value"
                  :key="option.v"
                  :color="isSelected(filterGroup.key, option.v) ? 'green' : ''"
                  :checkable="true"
                  :checked="isSelected(filterGroup.key, option.v)"
                  @check="handleToggleFilter(filterGroup.key, option.v, option.n)"
                  class="filter-option-tag"
                >
                  {{ option.n }}
                </a-tag>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { IconFilter, IconDown, IconUp } from '@arco-design/web-vue/es/icon';

const props = defineProps({
  filters: {
    type: Array,
    default: null
  },
  selectedFilters: {
    type: Object,
    default: () => ({})
  },
  visible: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:visible', 'update:selectedFilters', 'toggle-filter', 'reset-filters']);

const hasActiveFilters = computed(() => {
  return props.selectedFilters && Object.keys(props.selectedFilters).length > 0;
});

const isSelected = (filterKey, filterValue) => {
  return props.selectedFilters?.[filterKey] === filterValue;
};

const toggleVisible = () => {
  emit('update:visible', !props.visible);
};

const handleToggleFilter = (filterKey, filterValue, filterName) => {
  emit('toggle-filter', filterKey, filterValue, filterName);
};

const handleResetFilters = () => {
  emit('reset-filters');
};
</script>

<style scoped>
.filter-section {
  flex-shrink: 0;
  background: white;
  z-index: 99;
  border-bottom: 1px solid var(--color-border-2);
  margin-bottom: 8px;
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
}

.filter-toggle-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 500;
}

.filter-reset-btn {
  color: var(--color-text-3);
  font-size: 12px;
}

.filter-reset-btn:hover {
  color: var(--color-primary-6);
}

.filter-content {
  padding: 0 16px 8px;
}

.filter-group {
  margin-bottom: 4px;
  padding: 4px 12px;
  background: var(--color-fill-1);
  border-radius: 6px;
  border-left: 3px solid var(--color-primary-light-3);
}

.filter-group:last-child {
  margin-bottom: 0;
}

.filter-group-row {
  display: flex;
  align-items: center;
  gap: 16px;
  min-height: 28px;
}

.filter-group-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-2);
  white-space: nowrap;
  flex-shrink: 0;
  min-width: 70px;
  text-align: left;
  background: var(--color-fill-3);
  padding: 4px 8px 4px 20px;
  border-radius: 4px;
  border: 1px solid var(--color-border-2);
  position: relative;
}

.filter-group-title::before {
  content: '';
  position: absolute;
  left: 6px;
  top: 50%;
  transform: translateY(-50%);
  width: 8px;
  height: 8px;
  background: var(--color-primary-light-4);
  border-radius: 2px;
  border: 1px solid var(--color-primary-light-2);
}

.filter-options-container {
  flex: 1;
  overflow: hidden;
}

.filter-options {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 2px 0;
  scrollbar-width: thin;
  scrollbar-color: var(--color-border-3) transparent;
}

.filter-options::-webkit-scrollbar {
  height: 4px;
}

.filter-options::-webkit-scrollbar-track {
  background: transparent;
}

.filter-options::-webkit-scrollbar-thumb {
  background: var(--color-border-3);
  border-radius: 2px;
}

.filter-options::-webkit-scrollbar-thumb:hover {
  background: var(--color-border-2);
}

.filter-option-tag {
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  flex-shrink: 0;
}

.filter-option-tag:hover {
  transform: translateY(-1px);
}

/* 折叠动画 */
.collapse-enter-active,
.collapse-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.collapse-enter-from,
.collapse-leave-to {
  max-height: 0;
  opacity: 0;
  padding-top: 0;
  padding-bottom: 0;
}

.collapse-enter-to,
.collapse-leave-from {
  max-height: 500px;
  opacity: 1;
}
</style>