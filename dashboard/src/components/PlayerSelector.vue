<template>
  <a-modal
    v-model:visible="visible"
    title="选择播放器"
    :width="500"
    :mask-closable="false"
    @ok="handleConfirm"
    @cancel="handleCancel"
  >
    <div class="player-selector">
      <div class="player-list">
        <div
          v-for="player in playerTypes"
          :key="player.value"
          class="player-item"
          :class="{ active: selectedPlayer === player.value }"
          @click="selectedPlayer = player.value"
        >
          <div class="player-info">
            <div class="player-icon">
              <icon-play-circle v-if="player.value === 'art'" />
              <icon-code v-else-if="player.value === 'ijk'" />
              <icon-mobile v-else-if="player.value === 'exo'" />
              <icon-desktop v-else-if="player.value === 'mpv'" />
              <icon-video-camera v-else-if="player.value === 'vlc'" />
              <icon-play-arrow v-else />
            </div>
            <div class="player-details">
              <div class="player-name">{{ player.label }}</div>
              <div class="player-desc">{{ player.description }}</div>
            </div>
          </div>
          <div class="player-check">
            <icon-check-circle v-if="selectedPlayer === player.value" class="check-icon" />
          </div>
        </div>
      </div>
    </div>
  </a-modal>
</template>

<script setup>
import { ref, watch } from 'vue'
import {
  IconPlayCircle,
  IconCode,
  IconMobile,
  IconDesktop,
  IconVideoCamera,
  IconPlayArrow,
  IconCheckCircle
} from '@arco-design/web-vue/es/icon'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  playerTypes: {
    type: Array,
    default: () => []
  },
  currentPlayer: {
    type: String,
    default: 'ijk'
  }
})

const emit = defineEmits(['update:visible', 'confirm'])

const visible = ref(props.visible)
const selectedPlayer = ref(props.currentPlayer)

// 监听props变化
watch(() => props.visible, (newVal) => {
  visible.value = newVal
})

watch(() => props.currentPlayer, (newVal) => {
  selectedPlayer.value = newVal
})

watch(visible, (newVal) => {
  emit('update:visible', newVal)
})

const handleConfirm = () => {
  emit('confirm', selectedPlayer.value)
  visible.value = false
}

const handleCancel = () => {
  selectedPlayer.value = props.currentPlayer // 恢复原始值
  visible.value = false
}
</script>

<style scoped>
.player-selector {
  padding: 16px 0;
}

.player-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.player-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #ffffff;
}

.player-item:hover {
  border-color: #3b82f6;
  background: #f8faff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
}

.player-item.active {
  border-color: #3b82f6;
  background: linear-gradient(135deg, #f8faff 0%, #eff6ff 100%);
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.2);
}

.player-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.player-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  color: white;
  font-size: 24px;
}

.player-item.active .player-icon {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
}

.player-details {
  flex: 1;
}

.player-name {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 4px;
}

.player-desc {
  font-size: 14px;
  color: #6b7280;
  line-height: 1.4;
}

.player-check {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.check-icon {
  font-size: 24px;
  color: #3b82f6;
}

/* 响应式设计 */
@media (max-width: 640px) {
  .player-item {
    padding: 12px;
  }
  
  .player-icon {
    width: 40px;
    height: 40px;
    font-size: 20px;
  }
  
  .player-info {
    gap: 12px;
  }
  
  .player-name {
    font-size: 15px;
  }
  
  .player-desc {
    font-size: 13px;
  }
}
</style>