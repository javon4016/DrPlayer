<template>
  <Layout>
    <!-- 使用 slot 渲染页面内容 -->
    <router-view />
  </Layout>
</template>

<script>
import { onMounted } from 'vue';
import Layout from './components/Layout.vue';
import { useVisitedStore } from './stores/visitedStore';

export default {
  name: 'App',
  components: {
    Layout,
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
