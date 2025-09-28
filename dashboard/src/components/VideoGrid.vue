<template>
  <div class="video-grid-container" ref="containerRef">
    <a-scrollbar
      @scroll="handleScroll"
      class="video-scroll-container"
      ref="scrollbarRef"
      :style="'height:' + scrollAreaHeight + 'px; overflow: auto;'"
    >
      <a-grid :cols="{ xs: 2, sm: 3, md: 4, lg: 5, xl: 6, xxl: 8 }" :rowGap="16" :colGap="12">
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
      
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-container">
        <a-spin />
        <div class="loading-text">加载更多...</div>
      </div>
      
      <!-- 没有更多数据提示 -->
      <div v-else-if="!hasMore && videos.length > 0" class="no-more-data">
        没有更多数据了
      </div>
      
      <!-- 空状态 -->
      <div v-else-if="videos.length === 0 && !loading" class="empty-state">
        暂无视频数据
      </div>
      
      <div class="bottom-spacer"></div>
    </a-scrollbar>
  </div>
</template>

<script setup>
import { onMounted, nextTick, ref, onBeforeUnmount, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useVisitedStore } from '@/stores/visitedStore';

const props = defineProps({
  videos: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  hasMore: {
    type: Boolean,
    default: false
  },
  statsText: {
    type: String,
    default: ''
  },
  showStats: {
    type: Boolean,
    default: false
  },
  // 新增：来源页面信息
  sourceRoute: {
    type: Object,
    default: () => ({})
  }
});

const emit = defineEmits(['load-more', 'scroll-bottom']);

const router = useRouter();
const visitedStore = useVisitedStore();
const containerRef = ref(null);
const scrollbarRef = ref(null);
const scrollAreaHeight = ref(0);


// 视频点击处理
const handleVideoClick = (video) => {
  if (video && video.vod_id) {
    // 记录最后点击的视频
    visitedStore.setLastClicked(video.vod_id, video.vod_name)
    
    const routeQuery = {
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
      sourceRouteName: props.sourceRoute?.name || '',
      sourceRouteParams: JSON.stringify(props.sourceRoute?.params || {}),
      sourceRouteQuery: JSON.stringify(props.sourceRoute?.query || {})
    }
    
    router.push({
        name: 'VideoDetail',
        params: { id: video.vod_id },
        query: routeQuery
      });
  }
};

const updateScrollAreaHeight = () => {
  nextTick(() => {
    setTimeout(() => {
      const container = containerRef.value;
      if (!container) return;

      // 参考mock版本的实现，查找父级内容区域
      const contentArea = container.closest('.content-area') || container.parentElement;
      const footer = container.querySelector('.stats-footer');
      const footerHeight = (props.showStats && footer) ? footer.offsetHeight : 0;

      let containerHeight = contentArea ? contentArea.offsetHeight : 0;
      if (containerHeight <= 0) {
        // 备用方案：使用窗口高度减去导航栏等固定元素高度
        containerHeight = Math.max(window.innerHeight - 120, 500);
      }

      // 根据视频内容动态调整高度减值
      // 如果没有视频或视频很少，减去100px强制触发滚动条
      // 如果有足够视频内容，只减去少量padding空间
      const hasEnoughContent = props.videos && props.videos.length >= 17;
      const heightReduction = hasEnoughContent ? 4 : 100;
      
      const newHeight = Math.max(containerHeight - footerHeight - heightReduction, 400);
      console.log(`视频数量: ${props.videos?.length || 0}, 内容充足: ${hasEnoughContent}, 高度减值: ${heightReduction}, 最终高度: ${newHeight}`);
      scrollAreaHeight.value = newHeight;
    }, 100); // 增加延迟确保DOM完全渲染
  });
};

const handleScroll = (e) => {
  // 获取真正的滚动容器（arco-scrollbar内部容器）
  const rawTarget = e?.target || e?.srcElement;
  const container = rawTarget?.closest ? rawTarget.closest('.arco-scrollbar-container') : rawTarget;
  if (!container) return;

  const scrollHeight = container.scrollHeight - container.clientHeight;
  const scrollTop = container.scrollTop;
  
  // 当滚动到距离底部50px以内时触发加载
  if (scrollHeight - scrollTop < 50) {
    emit('scroll-bottom');
    emit('load-more');
  }
};

// 检测文本是否超出容器宽度
const checkTextOverflow = () => {
  nextTick(() => {
    setTimeout(() => {
      const titleElements = document.querySelectorAll('.video_list_item_title .title-text');
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

onMounted(() => {
  checkTextOverflow();
  updateScrollAreaHeight();
  window.addEventListener('resize', updateScrollAreaHeight);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateScrollAreaHeight);
});

// 当视频数据或显示统计信息变化时，更新高度和检测文本溢出
watch(() => [props.videos, props.showStats], () => {
  updateScrollAreaHeight();
  checkTextOverflow();
});

// 滚动位置恢复方法
const restoreScrollPosition = (scrollPosition) => {
  if (scrollPosition && scrollbarRef.value) {
    // 使用requestAnimationFrame确保DOM已渲染
    requestAnimationFrame(() => {
      const scrollContainer = scrollbarRef.value?.$el?.querySelector('.arco-scrollbar-container');
      if (scrollContainer) {
        // 使用平滑滚动
        scrollContainer.scrollTo({
          top: scrollPosition,
          behavior: 'smooth'
        });
        console.log('VideoGrid恢复滚动位置:', scrollPosition);
      }
    });
  }
};

// 获取当前滚动位置
const getCurrentScrollPosition = () => {
  if (scrollbarRef.value) {
    const scrollContainer = scrollbarRef.value?.$el?.querySelector('.arco-scrollbar-container');
    return scrollContainer?.scrollTop || 0;
  }
  return 0;
};

// 暴露方法给父组件
defineExpose({
  checkTextOverflow,
  restoreScrollPosition,
  getCurrentScrollPosition
});
</script>

<style scoped>
.video-grid-container {
  flex: 1;
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  height: 100%;
  min-height: 0; /* 确保flex子元素可以收缩 */
}

.video-scroll-container {
  width: 100%;
  flex: 1; /* 使用flex让scrollbar占满剩余空间 */
  padding: 2px 20px 2px 16px; /* 大幅减少上下padding，让scrollbar占用更多空间 */
}

.video_list_hover {
  transition: transform 0.2s ease;
}

.video_list_hover:hover {
  transform: translateY(-2px);
}

.video_list_item {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  background: white;
  box-shadow: 0 1px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  height: auto;
  display: flex;
  flex-direction: column;
  cursor: pointer;
}

.video_list_item:hover {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
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

.video_list_item:hover .title-text {
  color: #1890ff;
}

.loading-container {
  text-align: center;
  padding: 20px;
}

.loading-text {
  margin-top: 8px;
  color: var(--color-text-3);
  font-size: 14px;
}

.no-more-data {
  text-align: center;
  padding: 20px;
  color: var(--color-text-3);
  font-size: 14px;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: var(--color-text-3);
  font-size: 16px;
}

.bottom-spacer {
  height: 8px;
}
</style>