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
      <a-scrollbar
        ref="scrollbarRef"
        @scroll="handleScroll"
        class="search-scroll-container"
        :style="'height:' + scrollAreaHeight + 'px; overflow: auto;'"
      >
        <!-- 错误状态 -->
        <div v-if="error" class="error-container">
          <icon-exclamation-circle class="error-icon" />
          <p class="error-text">{{ error }}</p>
        </div>

        <!-- 加载状态 -->
        <div v-else-if="loading && videos.length === 0" class="loading-container">
          <a-spin size="large" />
          <p class="loading-text">正在搜索...</p>
        </div>

        <!-- 搜索结果网格 -->
        <a-grid 
          v-else-if="videos.length > 0"
          :cols="{ xs: 2, sm: 3, md: 4, lg: 5, xl: 6, xxl: 8 }" 
          :rowGap="16" 
          :colGap="12"
        >
          <a-grid-item 
            v-for="video in videos" 
            :key="video.vod_id"
            class="video_list_hover"
          >
            <div class="video_list_item" @click="handleVideoClick(video)">
              <div class="video_list_item_img">
                <a-image
                  :preview="false"
                  class="video_list_item_img_cover"
                  fit="cover"
                  :src="video.vod_pic"
                />
                <!-- vod_remarks 浮层 -->
                <div v-if="video.vod_remarks" class="video_remarks_overlay" v-html="video.vod_remarks">
                </div>
              </div>
              <div class="video_list_item_title">
                <span class="title-text">{{ video.vod_name }}</span>
              </div>
            </div>
          </a-grid-item>
        </a-grid>

        <!-- 空状态 -->
        <div v-else-if="!loading && !error && keyword" class="empty-state">
          <icon-search class="empty-icon" />
          <p class="empty-text">没有找到相关内容</p>
          <p class="empty-desc">尝试使用其他关键词搜索</p>
        </div>

        <!-- 加载更多 -->
        <div v-if="loading && videos.length > 0" class="loading-container">
          <a-spin />
          <div class="loading-text">加载更多...</div>
        </div>
        
        <!-- 没有更多数据提示 -->
        <div v-else-if="!hasMore && videos.length > 0" class="no-more-data">
          没有更多数据了
        </div>

        <!-- 底部间距 -->
        <div class="bottom-spacer"></div>
      </a-scrollbar>
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
import { ref, nextTick, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Message } from '@arco-design/web-vue'
import { usePaginationStore } from '@/stores/paginationStore'
import { usePageStateStore } from '@/stores/pageStateStore'
import { useVisitedStore } from '@/stores/visitedStore'
import ActionRenderer from '@/components/actions/ActionRenderer.vue'

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
    type: String,
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

      // 改进的高度计算逻辑：
      // 1. 正确计算网格列数（基于容器宽度）
      // 2. 估算内容实际需要的高度
      // 3. 智能调整容器高度以确保滚动翻页正常工作
      
      const videoCount = props.videos ? props.videos.length : 0;
      
      // 获取容器宽度来计算列数
      const containerWidth = container.offsetWidth || Math.max(window.innerWidth - 240, 800); // 减去侧边栏宽度
      const itemWidth = 200; // 每个搜索结果项的估算宽度
      const gridCols = Math.min(Math.floor(containerWidth / itemWidth), 8); // 基于宽度计算列数，最多8列
      
      const estimatedItemHeight = 328; // 根据F12实际测量的高度（图片+文字）
      const estimatedRows = videoCount > 0 ? Math.ceil(videoCount / Math.max(gridCols, 1)) : 0;
      const estimatedContentHeight = estimatedRows * estimatedItemHeight + 80; // 减少padding估算
      
      // 智能高度调整策略
      let heightReduction = 4; // 默认只减去少量padding
      const availableHeight = containerHeight - headerHeight;
      
      // 如果没有搜索结果数据，使用保守的高度减值
      if (videoCount === 0) {
        heightReduction = Math.min(availableHeight * 0.3, 200); // 减去30%或200px，取较小值
        console.log(`无搜索结果数据，使用保守高度减值: ${heightReduction}px`);
      } else if (estimatedContentHeight < availableHeight) {
        // 有数据但内容不足时，需要减少容器高度以触发滚动
        // 策略：容器高度 = 内容高度 - 120px（确保有足够滚动空间）
        // 但如果这样会遮挡太多内容，则至少显示1.5行的高度
        const minDisplayHeight = Math.floor(estimatedItemHeight * 1.5) + 80; // 至少显示1.5行
        const idealHeight = estimatedContentHeight - 120; // 理想的滚动高度
        const targetHeight = Math.max(idealHeight, minDisplayHeight, availableHeight * 0.4); // 取最大值确保不会太小
        heightReduction = Math.max(availableHeight - targetHeight, 80); // 最少减去80px
        console.log(`搜索内容高度不足，估算内容高度: ${estimatedContentHeight}px, 理想高度: ${idealHeight}px, 最小显示高度: ${minDisplayHeight}px, 可用高度: ${availableHeight}px, 调整高度减值: ${heightReduction}px`);
      }
      
      const newHeight = Math.max(containerHeight - headerHeight - heightReduction, 300);
      console.log(`搜索结果数量: ${videoCount}, 估算行数: ${estimatedRows}, 列数: ${gridCols}, 容器宽度: ${containerWidth}px, 最终高度: ${newHeight}px`);
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
      const scrollContainer = scrollbarRef.value?.$el?.querySelector('.arco-scrollbar-container');
      const currentScrollPosition = scrollContainer?.scrollTop || 0;
      
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
          fromSearch: 'true' // 标识来自搜索结果
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
        const scrollContainer = scrollbarRef.value?.$el?.querySelector('.arco-scrollbar-container');
        if (scrollContainer) {
          // 使用平滑滚动
          scrollContainer.scrollTo({
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
    case 'self-search':
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

.search-scroll-container {
  width: 100%;
  flex: 1;
  padding: 16px 20px 8px 16px;
}

/* 视频列表项样式 - 与VideoGrid保持一致 */
.video_list_hover {
  transition: all 0.3s ease;
}

.video_list_hover:hover {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

.video_list_item {
  cursor: pointer;
  border-radius: 8px;
  overflow: hidden;
  background: var(--color-bg-2);
  transition: all 0.3s ease;
}

.video_list_item_img {
  position: relative;
  width: 100%;
  overflow: hidden;
  background: #f5f5f5;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
}

.video_list_item_img_cover {
  width: 100%;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  overflow: hidden;
  vertical-align: top;
  display: block;
}

.video_list_item::v-deep(.arco-image-img) {
  width: 100%;
  height: 300px;
  object-fit: cover;
}

.video_list_item:hover .video_list_item_img_cover {
  transform: scale(1.05);
}

.video_remarks_overlay {
  position: absolute;
  top: 4px;
  right: 4px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 3px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 500;
  max-width: 60%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(4px);
}

.video_list_item_title {
  padding: 6px 8px;
  background: white;
  flex-shrink: 0;
  height: auto;
  min-height: 16px;
  display: flex;
  align-items: center;
  overflow: hidden;
  position: relative;
}

.title-text {
  font-size: 12px;
  font-weight: 500;
  color: #2c2c2c;
  line-height: 1;
  white-space: nowrap;
  transition: color 0.2s ease;
  margin: 0;
  width: 100%;
  display: block;
}

/* 普通状态下隐藏溢出文本 */
.title-text:not([data-overflow="true"]) {
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 跑马灯效果 - 电子公告屏幕样式 */
.title-text[data-overflow="true"] {
  animation: marquee 10s linear infinite;
  animation-delay: 1s;
  width: max-content;
  min-width: 100%;
}

.title-text[data-overflow="true"]:hover {
  animation-play-state: paused;
  color: #1890ff;
}

@keyframes marquee {
  0% {
    transform: translateX(0);
  }
  15% {
    transform: translateX(0);
  }
  85% {
    transform: translateX(calc(-100% + 100px));
  }
  100% {
    transform: translateX(calc(-100% + 100px));
  }
}

/* 状态样式 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 16px;
}

.loading-text {
  color: var(--color-text-3);
  font-size: 14px;
  margin: 0;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.empty-icon {
  font-size: 48px;
  color: var(--color-text-4);
  margin-bottom: 16px;
}

.empty-text {
  font-size: 16px;
  color: var(--color-text-2);
  margin: 0 0 8px 0;
}

.empty-desc {
  font-size: 14px;
  color: var(--color-text-3);
  margin: 0;
}

.loading-more {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  gap: 8px;
}

.no-more-data {
  text-align: center;
  padding: 20px;
  color: var(--color-text-3);
  font-size: 14px;
}

.bottom-spacer {
  height: 20px;
}



/* 错误状态样式 */
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.error-icon {
  font-size: 48px;
  color: var(--color-danger-6);
  margin-bottom: 16px;
}

.error-text {
  font-size: 16px;
  color: var(--color-text-2);
  margin: 0;
}

/* 分页样式 */
.pagination-container {
  display: flex;
  justify-content: center;
  padding: 24px 0;
  border-top: 1px solid var(--color-border-2);
  margin-top: 16px;
}
</style>