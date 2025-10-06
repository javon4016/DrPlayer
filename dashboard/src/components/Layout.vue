<template>
  <div class="app-container">
    <!-- 固定的头部区域 -->
    <div class="fixed-header">
      <Header/> <!-- 引入头部组件 -->
    </div>

    <!-- 主要布局区域 -->
    <a-layout class="layout-demo">
      <a-layout-sider 
        collapsible 
        breakpoint="xl" 
        class="fixed-sider"
        @collapse="onSiderCollapse"
      >
        <div class="logo">
          <a-popover title="道长: 您好!">
          <a-image
              width="100%"
              :src="logoSrc"
              :alt="logoDesc"
              :preview="false"
              @click="()=>this.$message.success('欢迎使用Hipy定制版壳子')"
          />
            <template #content>
              <p>{{logoDesc}}</p>
            </template>
          </a-popover>
        </div>
        <a-menu
            :default-open-keys="['1']"
            :default-selected-keys="['1']"
            :style="{ width: '100%' }"
            @menu-item-click="onClickMenuItem"
        >
          <router-link
              v-for="(item, index) in menuItems"
              :key="index"
              :to="item.route"
              class="menu-item"
          >
            <a-menu-item :key="item.id">
              <!--            <IconHome></IconHome>-->
              <svg style="width: 16px; height: 16px; margin-right: 8px;">
                <use :href="`#${item.icon}`"></use>
              </svg>
              {{ item.name }}
            </a-menu-item>
          </router-link>
        </a-menu>
        <!-- trigger -->
        <template #trigger="{ collapsed }">
          <IconCaretRight v-if="collapsed"></IconCaretRight>
          <IconCaretLeft v-else></IconCaretLeft>
        </template>
      </a-layout-sider>

      <!-- 主内容区域 -->
      <div class="main-content" :class="{ 'sider-collapsed': siderCollapsed }">
        <div class="content-wrapper">
          <slot></slot> <!-- 插槽，用于插入页面内容 -->
        </div>
        
        <!-- 底部区域 -->
        <div class="fixed-footer">
          <Footer/>
        </div>
      </div>
    </a-layout>
  </div>
</template>

<script>
import { defineComponent, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { Message } from '@arco-design/web-vue';
import {
  IconCaretRight,
  IconCaretLeft,
  IconHome,
  IconCalendar,
} from '@arco-design/web-vue/es/icon';
import Header from './Header.vue'; // 引入头部组件
import Footer from './Footer.vue'; // 引入底部组件
import { usePaginationStore } from '@/stores/paginationStore';
import logo from '@/assets/logo.png';
import '@/assets/icon_font/iconfont.js';

export default defineComponent({
  components: {
    IconCaretRight,
    IconCaretLeft,
    IconHome,
    IconCalendar,
    Header,
    Footer,
  },
  setup() {
    const route = useRoute();
    const paginationStore = usePaginationStore();
    
    const siderCollapsed = ref(false);
    const menuItems = ref([
      {id: 1, name: '主页', icon: 'icon-zhuye', route: '/'},
      {id: 2, name: '点播', icon: 'icon-dianbo', route: '/video'},
      {id: 4, name: '直播', icon: 'icon-shipinzhibo', route: '/live'},
      {id: 5, name: '书画柜', icon: 'icon-shugui', route: '/book-gallery'},
      {id: 6, name: '解析', icon: 'icon-jiexi', route: '/parser'},
      {id: 7, name: '收藏', icon: 'icon-shoucang', route: '/collection'},
      {id: 8, name: '历史', icon: 'icon-lishi', route: '/history'},
      {id: 10, name: '测试', icon: 'icon-ceshi', route: '/action-test'},
      {id: 9, name: '设置', icon: 'icon-shezhi', route: '/settings'}
    ]);
    const logoSrc = ref(logo);
    const logoDesc = ref('欢迎使用DrPlayer');

    // 监听路由变化，更新翻页统计store的当前路由
    watch(() => route.path, (newPath) => {
      paginationStore.setCurrentRoute(newPath);
    }, { immediate: true });

    const onClickMenuItem = (key) => {
      let _name = menuItems.value.find(it => it.id === key).name;
      let _content = `You select ${key},${_name}`;
      console.log(_content);
      // Message.info({content: _content, showIcon: true});
    };

    const onSiderCollapse = (collapsed) => {
      siderCollapsed.value = collapsed;
      console.log('侧边栏折叠状态:', collapsed);
    };

    return {
      siderCollapsed,
      menuItems,
      logoSrc,
      logoDesc,
      onClickMenuItem,
      onSiderCollapse
    };
  }
});
</script>

<style scoped>
/* 应用容器 */
.app-container {
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  position: relative;
}

/* 固定的头部 */
.fixed-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  width: 100vw;
  height: 64px;
  background: var(--color-bg-3);
  border-bottom: 1px solid var(--color-border);
  z-index: 1000;
  padding: 0;
  display: flex;
  align-items: center;
}

/* 主布局区域 */
.layout-demo {
  height: calc(100vh - 64px); /* 减去header高度 */
  background: var(--color-fill-2);
  border: 1px solid var(--color-border);
  margin-top: 64px; /* 使用margin代替padding */
  display: flex;
}

/* 固定的侧边栏 */
.fixed-sider {
  position: fixed !important;
  left: 0;
  top: 64px; /* 在header下方 */
  bottom: 0;
  z-index: 999;
}

/* 主内容区域 */
.main-content {
  flex: 1;
  margin-left: 200px; /* 为侧边栏留出空间，默认展开宽度 */
  display: flex;
  flex-direction: column;
  height: 100%; /* 使用100%高度，继承父容器 */
  overflow: hidden;
  transition: margin-left 0.2s ease; /* 添加过渡动画 */
}

/* 侧边栏折叠时的内容区域样式 */
.main-content.sider-collapsed {
  margin-left: 48px; /* 收起后的侧边栏宽度 */
}

/* 内容包装器 */
.content-wrapper {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0 24px 16px 24px; /* 上右下左：减少下padding */
  background: var(--color-bg-3);
}

/* 固定的底部 */
.fixed-footer {
  height: 48px;
  background: var(--color-bg-3);
  border-top: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-2);
  font-weight: 400;
  font-size: 14px;
  flex-shrink: 0;
}

/* 侧边栏logo样式 */
.layout-demo :deep(.arco-layout-sider) .logo {
  margin: 12px 12px;
  background: rgba(255, 255, 255, 0.2);
  text-align: center;
  max-width: 100px;
}

.layout-demo :deep(.arco-layout-sider-light) .logo {
  background: var(--color-fill-2);
}

.layout-demo :deep(.arco-layout-sider-light) .logo img {
  max-width: 100px;
}

/* 响应式处理已通过JavaScript和class绑定实现 */

/* 移动端适配 */
@media (max-width: 768px) {
  .main-content {
    margin-left: 0;
  }
  
  .fixed-sider {
    transform: translateX(-100%);
    transition: transform 0.3s ease;
  }
  
  .layout-demo :deep(.arco-layout-sider-collapsed) {
    transform: translateX(0);
  }
}
</style>
