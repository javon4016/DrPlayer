<template>
  <div
    class="video-card"
    @click="handleCardClick"
  >
    <div class="card-poster">
      <img :src="cardImage" :alt="cardTitle" @error="handleImageError" />
      <!-- vod_remarks 浮层 (仅video类型显示) -->
      <div v-if="props.type === 'video' && item.vod_remarks" class="video-remarks-overlay" v-html="item.vod_remarks"></div>
      <div class="card-overlay">
        <a-button type="primary" size="small" class="play-btn">
          <template #icon>
            <icon-play-arrow />
          </template>
          播放
        </a-button>
        <a-button 
          v-if="props.type !== 'video'"
          type="outline" 
          size="small" 
          class="image-btn"
          @click.stop="handleImageClick"
        >
          <template #icon>
            <icon-eye />
          </template>
        </a-button>
        <a-button 
          v-if="showActionButton"
          type="outline" 
          size="small" 
          :class="actionButtonClass"
          @click.stop="handleActionClick"
        >
          <template #icon>
            <component :is="actionButtonIcon" />
          </template>
        </a-button>
      </div>
    </div>
    <div class="card-info">
      <h3 class="card-title" :title="cardTitle">{{ cardTitle }}</h3>
      <div class="card-meta">
        <a-tag v-if="item.type_name" size="small" color="blue">{{ item.type_name }}</a-tag>
        <a-tag v-if="item.year" size="small" color="green">{{ item.year }}</a-tag>
        <a-tag v-if="item.area" size="small" color="orange">{{ item.area }}</a-tag>
      </div>
      <!-- 历史记录特有信息 -->
      <div v-if="showHistoryInfo" class="card-history">
        <div class="history-episode">
          <icon-play-arrow />
          <span>{{ item.current_route_name }} - {{ item.current_episode_name }}</span>
        </div>
      </div>
      <div v-if="showSourceInfo" class="card-source">
        <icon-link />
        <span>{{ item.api_info.site_name }}</span>
      </div>
      <div v-if="showTimeInfo" class="card-time">
        {{ timeLabel }} {{ formatDate(item[timeField]) }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import {
  IconPlayArrow,
  IconEye,
  IconHeartFill,
  IconDelete
} from '@arco-design/web-vue/es/icon'

const props = defineProps({
  item: {
    type: Object,
    required: true
  },
  type: {
    type: String,
    default: 'favorite', // 'favorite' | 'history' | 'video'
    validator: (value) => ['favorite', 'history', 'video'].includes(value)
  }
})

const emit = defineEmits(['card-click', 'image-click', 'action-click'])

// 计算属性
const showHistoryInfo = computed(() => props.type === 'history')

const showSourceInfo = computed(() => props.type !== 'video')

const showTimeInfo = computed(() => props.type !== 'video')

const showActionButton = computed(() => {
  return props.type === 'favorite' || props.type === 'history'
})

const actionButtonClass = computed(() => {
  return props.type === 'favorite' ? 'remove-btn' : 'delete-btn'
})

const actionButtonIcon = computed(() => {
  return props.type === 'favorite' ? IconHeartFill : IconDelete
})

const timeLabel = computed(() => {
  return props.type === 'favorite' ? '收藏于' : '观看于'
})

const timeField = computed(() => {
  return props.type === 'favorite' ? 'created_at' : 'updated_at'
})

// 处理不同数据格式
const cardImage = computed(() => {
  return props.type === 'video' ? props.item.vod_pic : props.item.pic
})

const cardTitle = computed(() => {
  return props.type === 'video' ? props.item.vod_name : props.item.name
})

// 事件处理
const handleCardClick = () => {
  emit('card-click', props.item)
}

const handleImageClick = () => {
  emit('image-click', props.item)
}

const handleActionClick = () => {
  emit('action-click', props.item)
}

const handleImageError = (event) => {
  event.target.src = '/default-poster.svg'
  event.target.style.objectFit = 'contain'
  event.target.style.backgroundColor = '#f7f8fa'
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}
</script>

<style scoped>
.video-card {
  background: var(--color-bg-2);
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: pointer;
  border: 1px solid var(--color-border-2);
}

.video-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  border-color: var(--color-primary-light-3);
}

.card-poster {
  position: relative;
  width: 100%;
  height: 240px;
  overflow: hidden;
}

.card-poster img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.video-card:hover .card-poster img {
  transform: scale(1.05);
}

.card-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.video-card:hover .card-overlay {
  opacity: 1;
}

.play-btn {
  background: var(--color-primary);
  border: none;
}

.image-btn, .remove-btn, .delete-btn {
  background: rgba(255, 255, 255, 0.9);
  border: none;
  color: var(--color-text-1);
}

.remove-btn:hover {
  background: var(--color-danger);
  color: white;
}

.delete-btn:hover {
  background: var(--color-danger);
  color: white;
}

.card-info {
  padding: 16px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: var(--color-text-1);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-meta {
  display: flex;
  gap: 4px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.card-history {
  margin-bottom: 8px;
}

.history-episode {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--color-primary);
  background: var(--color-primary-light-1);
  padding: 4px 8px;
  border-radius: 4px;
}

.card-source {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--color-text-3);
  margin-bottom: 4px;
}

.card-time {
  font-size: 12px;
  color: var(--color-text-4);
}

.video-remarks-overlay {
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
</style>