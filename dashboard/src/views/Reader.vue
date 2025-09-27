<template>
  <div class="reader-container">
    <!-- 简化的标题显示 -->
    <div class="simple-header">
      <span class="navigation-title">Reader</span>
    </div>

    <!-- 内容区域 -->
    <div class="main-content">
      <h1 class="content-title">书画柜</h1>
      <p class="content-description">这是书籍和漫画页面的内容。</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Reader'
};
</script>

<style scoped>
.reader-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.simple-header {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 16px 20px;
  background: var(--color-bg-3);
  border-bottom: 1px solid var(--color-border-2);
  box-sizing: border-box;
}

.navigation-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-1);
  white-space: nowrap;
}

.main-content {
  flex: 1;
  padding: 20px;
  background: var(--color-bg-2);
  border-radius: 8px;
  margin-top: 16px;
}

.content-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--color-text-1);
  margin-bottom: 16px;
}

.content-description {
  font-size: 16px;
  color: var(--color-text-2);
  line-height: 1.6;
}
</style>
