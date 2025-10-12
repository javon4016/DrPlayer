<template>
  <div class="search-results-container">
    <!-- 搜索状态头部 -->
    <div class="search-header">
      <div class="search-info">
        <span v-if="keyword" class="search-keyword">
          搜索结果：{{ keyword }}
        </span>
        <span v-if="videos.length > 0" class="search-count">
          共找到 {{ videos.length }} 个结果
        </span>
      </div>
      <div class="search-actions">
        <a-button type="outline" size="small" @click="exitSearch">
          <template #icon>
            <icon-close />
          </template>
          清除搜索
        </a-button>
      </div>
    </div>

    <!-- 搜索结果网格 -->
    <div class="search-grid-container" ref="containerRef">
      <SearchVideoGrid
        ref="scrollbarRef"
        :videos="processedVideos"
        :loading="loading"
        :error="error"
        :has-more="hasMore"
        :scroll-height="`${scrollAreaHeight}px`"
        variant="search-results"
        default-poster="/default-poster.svg"
        @video-click="handleVideoClick"
        @load-more="handleLoadMore"
        @retry="handleRetry"
        @scroll="handleScroll"
      />
    </div>

    <!-- ActionRenderer组件 -->
    <ActionRenderer
      v-if="showActionRenderer"
      ref="actionRendererRef"
      :action-data="currentActionData"
      :module="props.module"
      :extend="props.extend"
      :api-url="props.apiUrl"
      @close="handleActionClose"

      @special-action="handleSpecialAction"
    />
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted, onBeforeUnmount, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Message } from '@arco-design/web-vue'
import { usePaginationStore } from '@/stores/paginationStore'
import { usePageStateStore } from '@/stores/pageStateStore'
import { useVisitedStore } from '@/stores/visitedStore'
import ActionRenderer from '@/components/actions/ActionRenderer.vue'
import SearchVideoGrid from '@/components/SearchVideoGrid.vue'
import { getFileTypeIcon, isFolder, isDirectoryFile } from '@/utils/fileTypeUtils'

const router = useRouter()
const paginationStore = usePaginationStore()
const pageStateStore = usePageStateStore()
const visitedStore = useVisitedStore()

// Props
const props = defineProps({
  keyword: {
    type: String,
    default: ''
  },
  videos: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: null
  },
  currentPage: {
    type: Number,
    default: 1
  },
  totalPages: {
    type: Number,
    default: 1
  },
  hasMore: {
    type: Boolean,
    default: false
  },
  // 新增：来源页面信息
  sourceRoute: {
    type: Object,
    default: () => ({})
  },
  // 新增：滚动位置
  scrollPosition: {
    type: Number,
    default: 0
  },
  // 模块名称，用于T4接口调用
  module: {
    type: String,
    default: ''
  },
  // 扩展参数，用于T4接口调用
  extend: {
    type: [Object, String],
    default: ''
  },
  // API URL，用于直接调用站点API
  apiUrl: {
    type: String,
    default: ''
  }
})

// Emits
const emit = defineEmits(['video-click', 'exit-search', 'load-more', 'refresh-list'])

const containerRef = ref(null)
const scrollbarRef = ref(null)
const scrollAreaHeight = ref(0)

// 处理视频数据，添加文件类型信息
const processedVideos = computed(() => {
  return props.videos.map(video => ({
    ...video,
    type_name: isFolder(video) ? 'folder' : (isDirectoryFile(video) ? getFileTypeIcon(video.vod_name) : null)
  }))
})

// ActionRenderer相关
const actionRendererRef = ref(null)
const showActionRenderer = ref(false)
const currentActionData = ref(null)

// 滚动事件处理
const handleScroll = (e) => {
  // 获取真正的滚动容器（arco-scrollbar内部容器）
  const rawTarget = e?.target || e?.srcElement;
  const container = rawTarget?.closest ? rawTarget.closest('.arco-scrollbar-container') : rawTarget;
  if (!container) return;

  const scrollHeight = container.scrollHeight - container.clientHeight;
  const scrollTop = container.scrollTop;
  
  // 当滚动到距离底部50px以内时触发加载
  if (scrollHeight - scrollTop < 50 && props.hasMore && !props.loading) {
    emit('load-more');
  }
};

// 动态计算滚动区域高度
const updateScrollAreaHeight = () => {
  nextTick(() => {
    setTimeout(() => {
      const container = containerRef.value;
      if (!container) return;

      // 查找父级内容区域
      const contentArea = container.closest('.content-area') || container.parentElement;
      
      let containerHeight = contentArea ? contentArea.offsetHeight : 0;
      if (containerHeight <= 0) {
        // 备用方案：使用窗口高度减去导航栏等固定元素高度
        containerHeight = Math.max(window.innerHeight - 120, 500);
      }

      // 减去搜索标题区域的高度
      const searchHeader = document.querySelector('.search-header');
      const headerHeight = searchHeader ? searchHeader.offsetHeight : 60;

      // 简化的高度计算逻辑：直接使用可用高度减去固定的边距
      const availableHeight = containerHeight - headerHeight;
      const newHeight = Math.max(availableHeight - 20, 300); // 减去20px的边距，最小高度300px
      
      console.log(`搜索结果容器高度计算: 容器高度=${containerHeight}px, 标题高度=${headerHeight}px, 最终高度=${newHeight}px`);
      scrollAreaHeight.value = newHeight;
    }, 100); // 延迟确保DOM完全渲染
  });
};

// 生成搜索结果统计信息文本
const getSearchStatsText = () => {
  if (!props.keyword) return '';
  
  const totalCount = props.videos.length;
  const currentPage = props.currentPage;
  const hasMore = props.hasMore;
  
  if (totalCount === 0) {
    return `搜索"${props.keyword}"：无结果`;
  }
  
  let statsText = `搜索"${props.keyword}"：第${currentPage}页，共${totalCount}条`;
  if (hasMore) {
    statsText += '，可继续加载';
  } else {
    statsText += '，已全部加载';
  }
  
  return statsText;
};

// 更新全局统计信息
const updateGlobalStats = () => {
  const statsText = getSearchStatsText();
  if (statsText) {
    paginationStore.updateStats(statsText);
  }
};

// 检测文本是否超出容器宽度
const checkTextOverflow = () => {
  nextTick(() => {
    setTimeout(() => {
      const titleElements = document.querySelectorAll('.search-results-container .title-text');
      titleElements.forEach(element => {
        const container = element.parentElement;
        const containerWidth = container.offsetWidth - 16; // 减去padding
        const textWidth = element.scrollWidth;
        
        // 如果文本宽度超过容器宽度，添加overflow属性启用跑马灯
        if (textWidth > containerWidth) {
          element.setAttribute('data-overflow', 'true');
        } else {
          element.removeAttribute('data-overflow');
        }
      });
    }, 100); // 延迟确保DOM渲染完成
  });
};

// 视频点击处理
const handleVideoClick = (video) => {
  if (video && video.vod_id) {
    // 检查是否为action类型
    if (video.vod_tag === 'action') {
      try {
        // 尝试解析vod_id中的JSON字符串获取action配置
        const actionConfig = JSON.parse(video.vod_id);
        console.log('SearchResults解析action配置:', actionConfig);
        
        // 传递解析后的action配置给ActionRenderer
        currentActionData.value = actionConfig;
        showActionRenderer.value = true;
        return;
      } catch (error) {
        console.log('SearchResults vod_id不是JSON格式，作为普通文本处理:', video.vod_id);
        
        // 如果解析失败，说明vod_id是普通文本，显示Toast提示
        Message.info({
          content: video.vod_id,
          duration: 3000,
          closable: true
        });
        return;
      }
    }
    
    // 记录最后点击的视频
    visitedStore.setLastClicked(video.vod_id, video.vod_name)
    
    // 保存当前搜索状态
    if (props.keyword) {
      // 正确获取滚动位置
      const currentScrollPosition = scrollbarRef.value?.getScrollTop() || 0;
      
      pageStateStore.saveSearchState(
        props.keyword,
        props.currentPage,
        props.videos,
        props.hasMore,
        props.loading,
        currentScrollPosition
      );
      console.log('保存搜索状态:', {
        keyword: props.keyword,
        currentPage: props.currentPage,
        videosCount: props.videos.length,
        scrollPosition: currentScrollPosition
      });
    }
    
    router.push({
        name: 'VideoDetail',
        params: { id: video.vod_id },
        query: {
          name: video.vod_name,
          pic: video.vod_pic,
          year: video.vod_year,
          area: video.vod_area,
          type: video.vod_type,
          remarks: video.vod_remarks,
          content: video.vod_content,
          actor: video.vod_actor,
          director: video.vod_director,
          // 添加来源页面信息
          sourceRouteName: props.sourceRoute?.name,
          sourceRouteParams: JSON.stringify(props.sourceRoute?.params || {}),
          sourceRouteQuery: JSON.stringify(props.sourceRoute?.query || {}),
          fromSearch: 'true', // 标识来自搜索结果
          // 添加来源图片信息，用于详情页图片备用
          sourcePic: video.vod_pic
        }
      });
  }
}

// 退出搜索
const exitSearch = () => {
  // 清除全局统计信息
  paginationStore.clearStats()
  emit('exit-search')
}

// 处理加载更多
const handleLoadMore = () => {
  emit('load-more')
}

// 处理重试
const handleRetry = () => {
  emit('refresh-list')
}

onMounted(() => {
  checkTextOverflow()
  updateScrollAreaHeight()
  updateGlobalStats()
  window.addEventListener('resize', updateScrollAreaHeight)
  
  // 恢复滚动位置
  if (props.scrollPosition > 0) {
    nextTick(() => {
      // 使用requestAnimationFrame确保DOM已渲染
      requestAnimationFrame(() => {
        if (scrollbarRef.value) {
          // 使用平滑滚动
          scrollbarRef.value.scrollTo({
            top: props.scrollPosition,
            behavior: 'smooth'
          });
          console.log('SearchResults恢复滚动位置:', props.scrollPosition);
        }
      });
    });
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateScrollAreaHeight)
})

// 当视频数据变化时，更新高度、检测文本溢出和更新统计信息
watch(() => props.videos, () => {
  updateScrollAreaHeight()
  checkTextOverflow()
  updateGlobalStats()
})

// 当搜索关键词、当前页或hasMore状态变化时，更新统计信息
watch([() => props.keyword, () => props.currentPage, () => props.hasMore], () => {
  updateGlobalStats()
})

// ActionRenderer事件处理
const handleActionClose = () => {
  showActionRenderer.value = false;
  currentActionData.value = null;
}

const handleActionSubmit = (result) => {
  console.log('Action提交结果:', result);
  showActionRenderer.value = false;
  currentActionData.value = null;
  // 可以在这里处理action的提交结果
}

const handleSpecialAction = (actionType, actionData) => {
  console.log('处理专项动作:', actionType, actionData);
  
  switch (actionType) {
    case '__self_search__':
      // 处理源内搜索
      console.log('执行源内搜索:', actionData);
      break;
    case 'detail':
      // 处理详情页跳转
      console.log('跳转到详情页:', actionData);
      break;
    case 'ktv-player':
      // 处理KTV播放
      console.log('启动KTV播放:', actionData);
      break;
    case 'refresh-list':
      // 处理刷新列表
      console.log('刷新列表:', actionData);
      // 可以触发父组件的刷新事件
      emit('refresh-list');
      break;
    default:
      console.log('未知的专项动作:', actionType, actionData);
      break;
  }
}
</script>

<style scoped>
.search-results-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--color-bg-1);
}

.search-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: var(--color-bg-2);
  border-bottom: 1px solid var(--color-border-2);
}

.search-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.search-keyword {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-1);
}

.search-count {
  font-size: 14px;
  color: var(--color-text-3);
}

.search-actions {
  display: flex;
  gap: 8px;
}

.search-grid-container {
  flex: 1;
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}


</style>