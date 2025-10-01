import { ref } from 'vue'

// 全局Toast状态
export const toastState = ref({
  show: false,
  message: '',
  type: 'success', // success, error, warning, info
  duration: 3000
})

// 显示Toast的方法
export function showToast(message, type = 'success', duration = 3000) {
  toastState.value = {
    show: true,
    message,
    type,
    duration
  }
  
  // 自动隐藏
  setTimeout(() => {
    hideToast()
  }, duration)
}

// 隐藏Toast的方法
export function hideToast() {
  toastState.value.show = false
}