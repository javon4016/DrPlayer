<template>
  <!-- 直达底部按钮 -->
  <transition name="scroll-btn-fade">
    <div 
      v-show="showButton"
      class="scroll-to-bottom-btn"
      @click="scrollToBottom"
      :title="buttonText"
    >
      <icon-down class="scroll-btn-icon" />
    </div>
  </transition>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { IconDown } from '@arco-design/web-vue/es/icon'

// Props定义
const props = defineProps({
  // 滚动目标元素的ref或选择器
  target: {
    type: [Object, String],
    default: null
  },
  // 显示按钮的滚动阈值（px）
  showThreshold: {
    type: Number,
    default: 200
  },
  // 隐藏按钮的底部距离阈值（px）
  hideThreshold: {
    type: Number,
    default: 100
  },
  // 按钮文本
  buttonText: {
    type: String,
    default: '直达底部'
  },
  // 按钮位置
  position: {
    type: Object,
    default: () => ({
      right: '24px',
      bottom: '80px'
    })
  }
})

// 响应式数据
const showButton = ref(false)

// 获取滚动目标元素
const getTargetElement = () => {
  if (!props.target) {
    return document.documentElement || document.body
  }
  
  if (typeof props.target === 'string') {
    return document.querySelector(props.target)
  }
  
  // 如果是ref对象，需要检查value是否存在
  if (props.target && typeof props.target === 'object') {
    // Vue 3 ref对象
    if ('value' in props.target && props.target.value) {
      return props.target.value
    }
    // 直接是DOM元素
    if (props.target.nodeType) {
      return props.target
    }
  }
  
  // 如果都不匹配，返回null让调用者处理
  return null
}

// 滚动到底部函数
const scrollToBottom = () => {
  const targetElement = getTargetElement()
  if (targetElement) {
    targetElement.scrollTo({
      top: targetElement.scrollHeight,
      behavior: 'smooth'
    })
  }
}

// 滚动监听函数
const handleScroll = () => {
  const targetElement = getTargetElement()
  if (targetElement) {
    const { scrollTop, scrollHeight, clientHeight } = targetElement
    
    // 调试信息
    console.log('ScrollToBottom Debug:', {
      scrollTop,
      scrollHeight,
      clientHeight,
      showThreshold: props.showThreshold,
      hideThreshold: props.hideThreshold,
      condition1: scrollTop > props.showThreshold,
      condition2: scrollTop + clientHeight < scrollHeight - props.hideThreshold,
      targetElement: targetElement.className || targetElement.tagName
    })
    
    // 当滚动距离超过阈值时显示按钮，当接近底部时隐藏按钮
    const shouldShow = scrollTop > props.showThreshold && 
                      (scrollTop + clientHeight < scrollHeight - props.hideThreshold)
    showButton.value = shouldShow
  }
}

// 生命周期
onMounted(async () => {
  // 使用nextTick确保DOM已经渲染完成
  await nextTick()
  
  // 如果第一次获取失败，稍等一下再试
  let targetElement = getTargetElement()
  if (!targetElement && props.target) {
    await new Promise(resolve => setTimeout(resolve, 100))
    targetElement = getTargetElement()
  }
  
  console.log('ScrollToBottom mounted:', {
    target: props.target,
    targetElement,
    className: targetElement?.className,
    tagName: targetElement?.tagName
  })
  
  if (targetElement) {
    targetElement.addEventListener('scroll', handleScroll)
    // 初始检查一次
    handleScroll()
  } else {
    console.warn('ScrollToBottom: 无法获取目标滚动元素')
  }
})

onUnmounted(() => {
  const targetElement = getTargetElement()
  if (targetElement) {
    targetElement.removeEventListener('scroll', handleScroll)
  }
})
</script>

<style scoped>
/* 直达底部按钮样式 */
.scroll-to-bottom-btn {
  position: fixed;
  right: v-bind('position.right');
  bottom: v-bind('position.bottom');
  width: 48px;
  height: 48px;
  background: #6366f1;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
  transition: all 0.3s ease;
  z-index: 1000;
  user-select: none;
}

.scroll-to-bottom-btn:hover {
  background: #5855eb;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(99, 102, 241, 0.4);
}

.scroll-to-bottom-btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
}

.scroll-btn-icon {
  font-size: 20px;
  color: white;
  transition: transform 0.3s ease;
}

.scroll-to-bottom-btn:hover .scroll-btn-icon {
  transform: translateY(2px);
}

/* 按钮淡入淡出动画 */
.scroll-btn-fade-enter-active,
.scroll-btn-fade-leave-active {
  transition: all 0.3s ease;
}

.scroll-btn-fade-enter-from,
.scroll-btn-fade-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.8);
}

.scroll-btn-fade-enter-to,
.scroll-btn-fade-leave-from {
  opacity: 1;
  transform: translateY(0) scale(1);
}
</style>