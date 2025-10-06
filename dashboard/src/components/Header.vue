<template>
  <a-layout-header class="header">
    <!-- 左侧控制按钮 -->
    <div class="header-left">
      <a-button shape="circle" @click="goBack">
        <template #icon>
          <icon-left/>
        </template>
      </a-button>
      <a-button shape="circle" @click="goForward">
        <template #icon>
          <icon-right/>
        </template>
      </a-button>
      <a-button shape="circle" @click="refreshPage">
        <template #icon>
          <icon-refresh/>
        </template>
      </a-button>
    </div>

    <!-- 中间搜索框 -->
    <div class="header-center" v-if="searchAggregationEnabled">
      <a-input-search
          placeholder="搜索内容..."
          enter-button="搜索"
          @search="onSearch"
      />
    </div>

    <!-- 右侧控制按钮 -->
    <div class="header-right">
      <a-button shape="circle" @click="minimize">
        <template #icon>
          <icon-shrink/>
        </template>
      </a-button>
      <a-button shape="circle" @click="maximize">
        <template #icon>
          <icon-expand/>
        </template>
      </a-button>
      <a-button shape="circle" @click="showCloseConfirm">
        <template #icon>
          <icon-close/>
        </template>
      </a-button>
    </div>

    <!-- 全屏居中确认弹窗 -->
    <div v-if="showConfirmModal" class="confirm-modal-overlay" @click="hideCloseConfirm">
      <div class="confirm-modal" @click.stop>
        <div class="modal-header">
          <icon-exclamation-circle-fill class="warning-icon" />
          <h3 class="modal-title">确认关闭</h3>
        </div>
        <div class="modal-content">
          <p class="modal-message">你确认要关闭当前应用吗？</p>
          <p class="modal-submessage">关闭后将退出应用程序</p>
        </div>
        <div class="modal-footer">
          <a-button class="cancel-btn" @click="hideCloseConfirm">
            取消
          </a-button>
          <a-button type="primary" status="danger" class="confirm-btn" @click="confirmClose">
            确认关闭
          </a-button>
        </div>
      </div>
    </div>
  </a-layout-header>
</template>

<script>
import {defineComponent, ref, computed} from 'vue';
import {Message} from '@arco-design/web-vue';

export default defineComponent({
  components: {},
  setup() {
    const showConfirmModal = ref(false);
    
    // 从localStorage获取聚搜功能状态
    const getSearchAggregationStatus = () => {
      try {
        const appSettings = localStorage.getItem('appSettings');
        if (appSettings) {
          const settings = JSON.parse(appSettings);
          return settings.searchAggregation || false;
        }
      } catch (error) {
        console.error('获取聚搜状态失败:', error);
      }
      return false;
    };
    
    // 响应式的聚搜状态
    const searchAggregationEnabled = ref(getSearchAggregationStatus());
    
    // 监听localStorage变化
    const updateSearchAggregationStatus = () => {
      searchAggregationEnabled.value = getSearchAggregationStatus();
    };
    
    // 监听storage事件
    window.addEventListener('storage', updateSearchAggregationStatus);
    
    // 定期检查状态变化（用于同一页面内的状态更新）
    const checkInterval = setInterval(updateSearchAggregationStatus, 1000);
    
    return {
      showConfirmModal,
      searchAggregationEnabled
    };
  },
  methods: {
    goBack() {
      Message.info("前进按钮");
      // 执行前进逻辑
    },
    goForward() {
      Message.info("后退按钮");
      // 执行后退逻辑
    },
    refreshPage() {
      Message.info("刷新页面");
      // 刷新页面逻辑
      window.location.reload();
    },
    onSearch(value) {
      Message.info(`搜索内容: ${value}`);
      // 执行搜索逻辑
    },
    minimize() {
      Message.info("最小化窗口");
      // 最小化窗口的逻辑，可以通过调用系统接口来实现
      this.exitFullScreen()
    },
    maximize() {
      Message.info("最大化窗口");
      // 最大化窗口的逻辑
      this.enterFullScreen()
    },
    showCloseConfirm() {
      this.showConfirmModal = true;
    },
    hideCloseConfirm() {
      this.showConfirmModal = false;
    },
    confirmClose() {
      this.showConfirmModal = false;
      Message.info("正在关闭应用...");
      
      // 尝试多种关闭方式
      try {
        // 方式1: 尝试关闭当前窗口
        if (window.opener) {
          window.close();
        } else {
          // 方式2: 如果是主窗口，尝试使用about:blank方式
          window.open('about:blank', '_self');
          window.close();
        }
        
        // 方式3: 如果上述方式都失败，提供备用方案
        setTimeout(() => {
          // 检查窗口是否已关闭
          if (!window.closed) {
            Message.warning("无法自动关闭窗口，请手动关闭浏览器标签页");
            // 可以考虑跳转到一个关闭页面
            window.location.href = 'about:blank';
          }
        }, 500);
        
      } catch (error) {
        console.error('关闭窗口失败:', error);
        Message.error("关闭失败，请手动关闭浏览器标签页");
      }
    },
    enterFullScreen() {
      let element = document.documentElement;
      if (element.requestFullscreen) {
        element.requestFullscreen();
      } else if (element.mozRequestFullScreen) { /* Firefox */
        element.mozRequestFullScreen();
      } else if (element.webkitRequestFullscreen) { /* Chrome, Safari & Opera */
        element.webkitRequestFullscreen();
      } else if (element.msRequestFullscreen) { /* IE/Edge */
        element.msRequestFullscreen();
      }
    },
    exitFullScreen() {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.mozCancelFullScreen) { /* Firefox */
        document.mozCancelFullScreen();
      } else if (document.webkitExitFullscreen) { /* Chrome, Safari and Opera */
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) { /* IE/Edge */
        document.msExitFullscreen();
      }
    },
  }
});
</script>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  height: 64px;
  padding: 0;
  background: var(--color-bg-3);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  border-bottom: 1px solid var(--color-border-2);
  border: none;
}

.header-left {
  display: flex;
  align-items: center;
  padding-left: 20px;
  min-width: 200px;
  gap: 8px;
}

.header-center {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  max-width: 600px;
  margin: 0 20px;
}

.header-right {
  display: flex;
  align-items: center;
  padding-right: 20px;
  min-width: 200px;
  justify-content: flex-end;
  gap: 8px;
}

.header-left :deep(.arco-btn),
.header-right :deep(.arco-btn) {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: 1px solid var(--color-border-2);
  background: var(--color-bg-2);
  color: var(--color-text-1);
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.header-left :deep(.arco-btn:hover),
.header-right :deep(.arco-btn:hover) {
  background: var(--color-fill-3);
  border-color: var(--color-border-3);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header-left :deep(.arco-btn:active),
.header-right :deep(.arco-btn:active) {
  transform: translateY(0);
  background: var(--color-fill-4);
}

/* 特殊样式：关闭按钮 */
.header-right :deep(.arco-btn:last-child) {
  background: #ff4757;
  border-color: #ff3742;
  color: white;
}

.header-right :deep(.arco-btn:last-child:hover) {
  background: #ff3742;
  border-color: #ff2f3a;
  box-shadow: 0 2px 8px rgba(255, 71, 87, 0.3);
}

/* 搜索框样式 */
.header-center :deep(.arco-input-search) {
  width: 100%;
  max-width: 400px;
  border-radius: 8px;
  background: var(--color-bg-1);
  border: 1px solid var(--color-border-2);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
}

.header-center :deep(.arco-input-search:hover) {
  border-color: var(--color-border-3);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header-center :deep(.arco-input-search:focus-within) {
  border-color: var(--color-primary-6);
  box-shadow: 0 0 0 2px var(--color-primary-1);
}

.header-center :deep(.arco-input-wrapper) {
  border-radius: 8px;
  background: transparent;
  border: none;
}

.header-center :deep(.arco-input) {
  background: transparent;
  border: none;
  color: var(--color-text-1);
  font-size: 14px;
}

.header-center :deep(.arco-input::placeholder) {
  color: var(--color-text-3);
}

.header-center :deep(.arco-input-search-btn) {
  border-radius: 0 8px 8px 0;
  background: var(--color-primary-6);
  border: none;
  color: white;
  transition: background-color 0.2s ease;
}

.header-center :deep(.arco-input-search-btn:hover) {
  background: var(--color-primary-7);
}

/* 全屏居中确认弹窗样式 */
.confirm-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  animation: fadeIn 0.3s ease-out;
}

.confirm-modal {
  background: var(--color-bg-1);
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  min-width: 400px;
  max-width: 500px;
  padding: 0;
  animation: slideIn 0.3s ease-out;
  border: 1px solid var(--color-border-2);
}

.modal-header {
  display: flex;
  align-items: center;
  padding: 24px 24px 16px;
  border-bottom: 1px solid var(--color-border-2);
}

.warning-icon {
  font-size: 24px;
  color: #ff6b35;
  margin-right: 12px;
}

.modal-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-1);
}

.modal-content {
  padding: 20px 24px;
}

.modal-message {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: var(--color-text-1);
  line-height: 1.5;
}

.modal-submessage {
  margin: 0;
  font-size: 14px;
  color: var(--color-text-3);
  line-height: 1.4;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px 24px;
  border-top: 1px solid var(--color-border-2);
}

.cancel-btn {
  min-width: 80px;
  height: 36px;
  border-radius: 6px;
  font-weight: 500;
}

.confirm-btn {
  min-width: 100px;
  height: 36px;
  border-radius: 6px;
  font-weight: 500;
}

/* 动画效果 */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .header-left,
  .header-right {
    min-width: 120px;
  }
  
  .header-center {
    margin: 0 10px;
  }
  
  .header-center :deep(.arco-input-search) {
    max-width: 250px;
  }
  
  .confirm-modal {
    min-width: 320px;
    max-width: 90vw;
    margin: 20px;
  }
}

@media (max-width: 480px) {
  .header-left,
  .header-right {
    min-width: 80px;
    gap: 4px;
  }
  
  .header-left {
    padding-left: 10px;
  }
  
  .header-right {
    padding-right: 10px;
  }
  
  .header-center {
    margin: 0 5px;
  }
  
  .header-center :deep(.arco-input-search) {
    max-width: 200px;
  }
  
  .header-left :deep(.arco-btn),
  .header-right :deep(.arco-btn) {
    width: 28px;
    height: 28px;
  }
  
  .confirm-modal {
    min-width: 280px;
    margin: 16px;
  }
  
  .modal-header,
  .modal-content,
  .modal-footer {
    padding-left: 20px;
    padding-right: 20px;
  }
  
  .modal-footer {
    flex-direction: column;
    gap: 8px;
  }
  
  .cancel-btn,
  .confirm-btn {
    width: 100%;
  }
}
</style>
