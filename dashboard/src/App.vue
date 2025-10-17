<template>
  <Layout>
    <!-- 使用 slot 渲染页面内容 -->
    <router-view />
  </Layout>
  <!-- 全局Toast组件 -->
  <GlobalToast />
  <!-- 全局悬浮iframe组件 -->
  <FloatingIframe 
    :default-url="'https://www.baidu.com'"
    :default-position="{ x: 33, y: 604 }"
    :default-size="{ width: 419, height: 883 }"
    button-title="打开浮窗浏览器"
    window-title="浮窗浏览器"
  />
</template>

<script>
import { onMounted } from 'vue';
import Layout from './components/Layout.vue';
import GlobalToast from './components/GlobalToast.vue';
import FloatingIframe from './components/FloatingIframe.vue';
import { useVisitedStore } from './stores/visitedStore';

export default {
  name: 'App',
  components: {
    Layout,
    GlobalToast,
    FloatingIframe,
  },
  setup() {
    const visitedStore = useVisitedStore();
    
    // 应用启动时加载访问记录
    onMounted(() => {
      visitedStore.loadFromStorage();
    });
    
    return {};
  }
};
</script>

<style>
/* 你可以在这里写一些全局样式 */
</style>
