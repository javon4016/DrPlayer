<template>
  <!-- Toast提示 - 直接使用ActionRenderer中验证可用的样式 -->
  <Teleport to="body">
    <Transition name="action-toast">
      <div v-if="toastState.show" class="action-toast" :class="toastState.type">
        {{ toastState.message }}
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { toastState } from '@/stores/toast'
</script>

<style scoped>
/* Toast样式 - 直接复制ActionRenderer中的样式 */
.action-toast {
  position: fixed !important;
  top: 20px !important;
  left: 50% !important;
  transform: translateX(-50%) !important;
  padding: 12px 24px;
  border-radius: 6px;
  color: white;
  font-size: 14px;
  z-index: 99999 !important;
  max-width: 400px;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  pointer-events: none;
}

.action-toast.success {
  background: #52c41a;
}

.action-toast.error {
  background: #f5222d;
}

.action-toast.warning {
  background: #faad14;
}

.action-toast.info {
  background: #1890ff;
}

/* Toast动画 */
.action-toast-enter-active,
.action-toast-leave-active {
  transition: all 0.3s ease;
}

.action-toast-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(-20px);
}

.action-toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-20px);
}
</style>