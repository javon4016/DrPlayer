<template>
  <div class="video-list-container">
    <!-- 分类导航 -->
    <CategoryNavigation
      :classList="classList"
      :trigger="trigger"
      :hasRecommendVideos="hasRecommendVideos"
      :activeKey="activeKey"
      @tab-change="handleTabChange"
      @open-category-modal="openCategoryModal"
    />

    <!-- 内容区域 -->
    <div class="content-area">
      <!-- 推荐分类内容 -->
      <div v-if="activeKey === 'recommendTuijian404'" class="tab-content">
        <VideoGrid
          :videos="listData[activeKey] || []"
          :loading="loadingMore[activeKey] || false"
          :hasMore="pageData[activeKey]?.hasNext || false"
          :statsText="`推荐视频：共 ${listData[activeKey]?.length || 0} 条`"
          @load-more="loadMoreData(activeKey)"
        />
      </div>

      <!-- 其他分类内容 -->
      <div v-else class="tab-content">
        <!-- 筛选区域 -->
        <FilterSection
           v-if="getFiltersForCategory(activeKey)"
           :filters="getFiltersForCategory(activeKey)"
           :selectedFilters="selectedFilters[activeKey] || {}"
           :visible="filterVisible[activeKey] || false"
           @update:visible="(val) => filterVisible[activeKey] = val"
           @toggle-filter="(filterKey, filterValue, filterName) => toggleFilter(filterKey, filterValue, filterName)"
           @reset-filters="resetFilters(activeKey)"
         />

        <!-- 视频网格 -->
        <VideoGrid
          :videos="listData[activeKey] || []"
          :loading="loadingMore[activeKey] || false"
          :hasMore="pageData[activeKey]?.hasNext || false"
          @load-more="loadMoreData(activeKey)"
        />
      </div>
    </div>

    <!-- 分类弹窗 -->
    <CategoryModal
      :visible="categoryModalVisible"
      @update:visible="(val) => categoryModalVisible = val"
      :classList="classList"
      :hasRecommendVideos="hasRecommendVideos"
      :activeKey="activeKey"
      @select-category="selectCategory"
    />
  </div>
</template>

<script setup>
import { videoService, siteService } from "@/api/services";
import { ref, reactive, onMounted, watch, computed } from "vue";
import { usePaginationStore } from '@/stores/paginationStore';
import CategoryNavigation from './CategoryNavigation.vue';
import FilterSection from './FilterSection.vue';
import VideoGrid from './VideoGrid.vue';
import CategoryModal from './CategoryModal.vue';

const props = defineProps({
  classList: Object,
  recommendVideos: {
    type: Array,
    default: () => []
  },
  trigger: {
    type: String,
    default: "click",
  },
});

// 使用翻页统计store
const paginationStore = usePaginationStore();

// 响应式数据
const activeKey = ref("");
const listData = reactive({});
const pageData = reactive({});
const loadingMore = reactive({});
const filterVisible = reactive({});
const selectedFilters = reactive({});
const categoryModalVisible = ref(false);

// 计算属性
const hasRecommendVideos = computed(() => {
  return props.recommendVideos && props.recommendVideos.length > 0;
});

// 计算默认的activeKey
const getDefaultActiveKey = () => {
  if (hasRecommendVideos.value) {
    return "recommendTuijian404";
  }
  if (props.classList?.class && props.classList.class.length > 0) {
    return props.classList.class[0].type_id;
  }
  return "recommendTuijian404";
};

// 筛选相关方法
const getFiltersForCategory = (categoryId) => {
  if (!props.classList?.filters || !props.classList.filters[categoryId]) {
    return null;
  }
  return props.classList.filters[categoryId];
};

const toggleFilter = (filterKey, filterValue, filterName) => {
  if (!selectedFilters[activeKey.value]) {
    selectedFilters[activeKey.value] = {};
  }
  
  // 如果已选中，则取消选择
  if (selectedFilters[activeKey.value][filterKey] === filterValue) {
    delete selectedFilters[activeKey.value][filterKey];
    // 如果没有任何筛选条件了，删除整个分类的筛选对象
    if (Object.keys(selectedFilters[activeKey.value]).length === 0) {
      delete selectedFilters[activeKey.value];
    }
  } else {
    // 否则选择该筛选条件
    selectedFilters[activeKey.value][filterKey] = filterValue;
  }
  
  // 重新获取数据
  refreshCategoryData(activeKey.value);
};

const resetFilters = (categoryId) => {
  delete selectedFilters[categoryId];
  refreshCategoryData(categoryId);
};

const refreshCategoryData = (categoryId) => {
  // 清除当前分类的所有数据，强制重新加载
  delete listData[categoryId];
  delete pageData[categoryId];
  
  // 重置加载状态
  loadingMore[categoryId] = false;
  
  // 如果是当前激活的分类，立即重新获取数据（强制重新加载）
  if (activeKey.value === categoryId) {
    getListData(categoryId, true);
  }
};

// 获取统计文本
const getStatsText = (categoryId) => {
  const categoryName = props.classList?.class?.find(item => item.type_id === categoryId)?.type_name || '';
  const currentPage = pageData[categoryId]?.page || 1;
  const loadedCount = listData[categoryId]?.length || 0;
  const totalCount = pageData[categoryId]?.total;
  
  let text = `${categoryName}：当前第 ${currentPage} 页，已加载 ${loadedCount} 条`;
  if (totalCount) {
    text += ` / 共 ${totalCount} 条`;
  }
  return text;
};

// 数据获取方法
const getListData = async (key, forceReload = false) => {
  console.log(key, "选中分类id");
  if (!listData.hasOwnProperty(key) || forceReload) {
    try {
      const currentSite = await siteService.getCurrentSite();
      
      let videoList, pagination;
      if (key === "recommendTuijian404") {
        // 使用传入的推荐视频数据 - 首页推荐数据不允许翻页
        videoList = props.recommendVideos || [];
        // 推荐视频数据不允许翻页
        pagination = { page: 1, hasNext: false };
      } else {
        // 获取分类视频，包含筛选参数
        const filters = selectedFilters[key] || {};
        const categoryData = await videoService.getCategoryVideos(currentSite.key, {
          typeId: key,
          page: 1,
          filters: filters,
          extend: currentSite.ext,
          apiUrl: currentSite.api
        });
        videoList = categoryData.videos || [];
        pagination = categoryData.pagination || { page: 1, hasNext: false };
      }
      
      listData[key] = videoList;
      pageData[key] = pagination;
      loadingMore[key] = false;
      
      // 更新全局翻页统计信息
      if (key === activeKey.value) {
        paginationStore.updateStats(getStatsText(key));
      }
    } catch (error) {
      console.error("获取视频列表失败:", error);
      listData[key] = [];
      pageData[key] = { page: 1, hasNext: false };
      loadingMore[key] = false;
    }
  }
};

// 检查是否为无效数据（防无限翻页）
const isInvalidData = (videos) => {
  if (!videos || videos.length === 0) return true;
  return videos.some(video => video.vod_id === 'no_data');
};

// 检查数据是否与上一页重复
const isDuplicateData = (currentList, newVideos) => {
  if (!newVideos || newVideos.length === 0) return true;
  if (!currentList || currentList.length === 0) return false;
  
  const currentIds = currentList.slice(-newVideos.length).map(v => v.vod_id);
  const newIds = newVideos.map(v => v.vod_id);
  
  return JSON.stringify(currentIds) === JSON.stringify(newIds);
};

// 加载更多数据
const loadMoreData = async (key) => {
  if (loadingMore[key] || !pageData[key]?.hasNext) {
    return;
  }
  
  loadingMore[key] = true;
  
  try {
    const currentSite = await siteService.getCurrentSite();
    const nextPage = pageData[key].page + 1;
    
    let newVideos = [];
    let newPagination = { page: nextPage, hasNext: false };
    
    if (key === "recommendTuijian404") {
      // 推荐视频不允许翻页，直接返回
      return;
    } else {
      // 分类视频翻页
      const filters = selectedFilters[key] || {};
      const categoryData = await videoService.getCategoryVideos(currentSite.key, {
        typeId: key,
        page: nextPage,
        filters: filters,
        extend: currentSite.ext,
        apiUrl: currentSite.api
      });
      newVideos = categoryData.videos || [];
      newPagination = categoryData.pagination || { page: nextPage, hasNext: false };
    }
    
    if (isInvalidData(newVideos) || isDuplicateData(listData[key], newVideos)) {
      console.log("检测到无效数据或重复数据，停止翻页");
      pageData[key] = { 
        ...pageData[key], 
        hasNext: false 
      };
      return;
    }
    
    listData[key] = [...listData[key], ...newVideos];
    pageData[key] = newPagination;
    
    // 更新全局翻页统计信息
    if (key === activeKey.value) {
      paginationStore.updateStats(getStatsText(key));
    }
  } catch (error) {
    console.error("加载更多数据失败:", error);
    pageData[key] = { 
      ...pageData[key], 
      hasNext: false 
    };
  } finally {
    loadingMore[key] = false;
  }
};

// 事件处理方法
const handleTabChange = (key) => {
  activeKey.value = key;
  getListData(key);
};

const openCategoryModal = () => {
  categoryModalVisible.value = true;
};

const selectCategory = (categoryId) => {
  activeKey.value = categoryId;
  getListData(categoryId);
  // 更新全局翻页统计信息
  setTimeout(() => {
    paginationStore.updateStats(getStatsText(categoryId));
  }, 100);
};

// 监听器
watch(() => props.recommendVideos, (newVideos) => {
  if (newVideos && newVideos.length > 0) {
    listData["recommendTuijian404"] = newVideos;
    pageData["recommendTuijian404"] = { page: 1, hasNext: false };
    loadingMore["recommendTuijian404"] = false;
    console.log("推荐数据已更新:", newVideos.length, "条");
  } else {
    listData["recommendTuijian404"] = [];
    pageData["recommendTuijian404"] = { page: 1, hasNext: false };
    loadingMore["recommendTuijian404"] = false;
  }
  
  const newActiveKey = getDefaultActiveKey();
  if (activeKey.value !== newActiveKey) {
    activeKey.value = newActiveKey;
    getListData(newActiveKey);
  }
}, { immediate: true });

watch(() => props.classList, (newClassList, oldClassList) => {
  if (newClassList !== oldClassList) {
    // 清除筛选状态
    Object.keys(selectedFilters).forEach(key => {
      delete selectedFilters[key];
    });
    Object.keys(filterVisible).forEach(key => {
      delete filterVisible[key];
    });
  }
  
  const newActiveKey = getDefaultActiveKey();
  if (activeKey.value !== newActiveKey) {
    activeKey.value = newActiveKey;
    getListData(newActiveKey);
  }
}, { immediate: true });

onMounted(() => {
  activeKey.value = getDefaultActiveKey();
  getListData(activeKey.value);
});
</script>

<style scoped>
.video-list-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.content-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.tab-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
</style>
