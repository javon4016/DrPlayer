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
    <div class="header-center">
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
      <a-popconfirm content="你确认要关闭当前应用?" @ok="closeWindow">
        <a-button shape="circle">
          <template #icon>
            <icon-close/>
          </template>
        </a-button>
      </a-popconfirm>


    </div>
  </a-layout-header>
</template>

<script>
import {defineComponent} from 'vue';
import {Message} from '@arco-design/web-vue';

export default defineComponent({
  components: {},
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
    closeWindow() {
      Message.info("将在1秒后关闭窗口");
      // 关闭窗口的逻辑，可以通过调用系统接口来实现
      setTimeout(function () {
        window.open("about:blank", "_self").close()
      }, 1000)
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
}
</style>
