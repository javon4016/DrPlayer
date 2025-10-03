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
import { onMounted, nextTick, ref, onBeforeUnmount, watch } from 'vue';
import { useRouter } from 'vue-router';
import { Message } from '@arco-design/web-vue';
import { useVisitedStore } from '@/stores/visitedStore';
import ActionRenderer from '@/components/actions/ActionRenderer.vue';
import videoService from '@/api/services/video';
import { showToast } from '@/stores/toast.js'

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
  },
  // T4接口调用相关参数
  module: {
    type: String,
    default: ''
  },
  extend: {
    type: Object,
    default: () => ({})
  },
  apiUrl: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['load-more', 'scroll-bottom', 'refresh-list']);

const router = useRouter();
const visitedStore = useVisitedStore();
const containerRef = ref(null);
const scrollbarRef = ref(null);
const scrollAreaHeight = ref(0);

// ActionRenderer相关
const actionRendererRef = ref(null);
const showActionRenderer = ref(false);
const currentActionData = ref(null);


// 视频点击处理
const handleVideoClick = async (video) => {
  if (video && video.vod_id) {
    // 检查是否为action类型
    if (video.vod_tag === 'action') {
      try {
        // 尝试解析vod_id中的JSON字符串获取action配置
        const actionConfig = JSON.parse(video.vod_id);
        console.log('VideoGrid解析action配置:', actionConfig);
        
        // 传递解析后的action配置给ActionRenderer
        currentActionData.value = actionConfig;
        showActionRenderer.value = true;
        return;
      } catch (error) {
        console.log('VideoGrid vod_id不是JSON格式，调用T4 action接口:', video.vod_id);
        
        // 如果解析失败，说明vod_id是普通文本，需要调用T4 action接口获取真正的action配置
        await handleT4ActionCall(video.vod_id);
        return;
      }
    }
    
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
      sourceRouteQuery: JSON.stringify(props.sourceRoute?.query || {}),
      // 添加来源图片信息，用于详情页图片备用
      sourcePic: video.vod_pic
    }
    
    router.push({
        name: 'VideoDetail',
        params: { id: video.vod_id },
        query: routeQuery
      });
  }
};

// T4 Action接口调用处理
const handleT4ActionCall = async (actionName) => {
  try {
    // 使用 videoService 执行 T4 action
    const result = await videoService.executeT4Action(
      props.module || 'default', 
      actionName,
      {
        apiUrl: props.apiUrl,
        extend: props.extend.ext
      }
    );

    console.log('result:', result);
    
    // 检查返回结果是否包含action配置
    if (result && result.action) {
      // 传递解析后的action配置给ActionRenderer
      currentActionData.value = result.action;
      showActionRenderer.value = true;
    } else if(result){
      showToast('执行源内搜索', 'success')
    }else {
      // 如果没有返回action配置，显示错误提示
      Message.error({
        content: `无法获取动作配置: ${actionName}`,
        duration: 3000,
        closable: true
      });
    }
  } catch (error) {
    console.error('T4 action执行失败:', error);
    Message.error({
      content: `动作执行失败: ${error.message}`,
      duration: 3000,
      closable: true
    });
  }
};

const updateScrollAreaHeight = () => {
  nextTick(() => {
    setTimeout(() => {
      const container = containerRef.value;
      if (!container) return;

      // 查找父级内容区域
      const contentArea = container.closest('.content-area') || container.parentElement;
      const footer = container.querySelector('.stats-footer');
      const footerHeight = (props.showStats && footer) ? footer.offsetHeight : 0;

      // 查找CategoryNavigation组件来获取其实际高度
      const categoryNav = document.querySelector('.category-nav-container');
      const categoryNavHeight = categoryNav ? categoryNav.offsetHeight : 0;

      let containerHeight = contentArea ? contentArea.offsetHeight : 0;
      if (containerHeight <= 0) {
        // 备用方案：使用窗口高度减去导航栏等固定元素高度
        // 考虑到CategoryNavigation的高度变化
        const baseHeight = Math.max(window.innerHeight - 120, 500);
        containerHeight = baseHeight;
      }

      console.log(`CategoryNavigation高度: ${categoryNavHeight}px, 内容区域高度: ${containerHeight}px`);

      // 改进的高度计算逻辑：
      // 1. 正确计算网格列数（基于容器宽度）
      // 2. 估算内容实际需要的高度
      // 3. 智能调整容器高度以确保滚动翻页正常工作
      
      const videoCount = props.videos ? props.videos.length : 0;
      
      // 获取容器宽度来计算列数
      const containerWidth = container.offsetWidth || Math.max(window.innerWidth - 240, 800); // 减去侧边栏宽度
      const itemWidth = 200; // 每个视频项的估算宽度
      const gridCols = Math.min(Math.floor(containerWidth / itemWidth), 8); // 基于宽度计算列数，最多8列
      
      const estimatedItemHeight = 328; // 根据F12实际测量的高度（图片+文字）
      const estimatedRows = videoCount > 0 ? Math.ceil(videoCount / Math.max(gridCols, 1)) : 0;
      const estimatedContentHeight = estimatedRows * estimatedItemHeight + 16; // 减少padding估算
      
      // 智能高度调整策略 - 考虑CategoryNavigation的动态高度
      let heightReduction = 4; // 默认只减去少量padding
      
      // 如果没有视频数据，使用保守的高度减值来为后续数据加载预留空间
      if (videoCount === 0) {
        // 对于空数据，需要确保有足够的滚动空间来触发翻页
        // 减去更多高度以确保滚动条出现
        heightReduction = Math.min(containerHeight * 0.4, 300); // 增加减值比例
        console.log(`无视频数据，使用保守高度减值: ${heightReduction}px`);
      } else if (estimatedContentHeight < containerHeight) {
        // 有数据但内容不足时，需要减少容器高度以触发滚动
        // 策略：容器高度 = 内容高度 - 150px（确保有足够滚动空间）
        const minDisplayHeight = Math.floor(estimatedItemHeight * 1.2) + 60; // 至少显示1.2行
        const idealHeight = estimatedContentHeight - 5; // 增加滚动空间
        const targetHeight = Math.max(idealHeight, minDisplayHeight, containerHeight * 0.3); // 降低最小比例
        heightReduction = Math.max(containerHeight - targetHeight, 50); // 增加最小减值
        console.log(`内容高度不足，估算内容高度: ${estimatedContentHeight}px, 理想高度: ${idealHeight}px, 最小显示高度: ${minDisplayHeight}px, 容器高度: ${containerHeight}px, 调整高度减值: ${heightReduction}px`);
      } else {
        // 内容充足时，减少一些高度确保滚动正常
        heightReduction = Math.min(containerHeight * 0.02, 20);
        console.log(`内容充足，使用标准高度减值: ${heightReduction}px`);
      }
      
      const newHeight = Math.max(containerHeight - footerHeight - heightReduction, 250); // 降低最小高度
      console.log(`视频数量: ${videoCount}, 估算行数: ${estimatedRows}, 列数: ${gridCols}, 容器宽度: ${containerWidth}px, 最终高度: ${newHeight}px`);
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
  
  // 监听筛选组件的高度变化
  const observeFilterChanges = () => {
    const categoryNav = document.querySelector('.category-nav-container');
    if (categoryNav) {
      const observer = new MutationObserver(() => {
        // 延迟执行以确保DOM更新完成
        setTimeout(() => {
          updateScrollAreaHeight();
        }, 100);
      });
      
      observer.observe(categoryNav, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'style']
      });
      
      // 保存observer引用以便清理
      containerRef.value._filterObserver = observer;
    }
  };
  
  // 延迟执行以确保DOM完全渲染
  setTimeout(observeFilterChanges, 200);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateScrollAreaHeight);
  
  // 清理MutationObserver
  if (containerRef.value?._filterObserver) {
    containerRef.value._filterObserver.disconnect();
  }
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

// ActionRenderer事件处理
const handleActionClose = () => {
  showActionRenderer.value = false;
  currentActionData.value = null;
};

const handleActionSubmit = (result) => {
  console.log('Action提交结果:', result);
  // 这里可以根据需要处理action的提交结果
  // 比如刷新列表、显示消息等
};

const handleSpecialAction = (actionType, actionData) => {
  console.log('VideoGrid处理专项动作:', actionType, actionData);
  
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