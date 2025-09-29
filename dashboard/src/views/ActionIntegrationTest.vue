<template>
  <div class="action-integration-test">
    <div class="test-header">
      <h1>Action功能集成测试</h1>
      <p>测试VideoGrid和SearchResults组件中的action功能</p>
    </div>

    <div class="test-sections">
      <!-- VideoGrid测试 -->
      <div class="test-section">
        <h2>VideoGrid组件Action测试</h2>
        <p>点击下面的action项目应该弹出ActionRenderer组件：</p>
        <VideoGrid 
          :videos="testVideosWithAction" 
          :loading="false" 
          :hasMore="false"
        />
      </div>

      <!-- SearchResults测试 -->
      <div class="test-section">
        <h2>SearchResults组件Action测试</h2>
        <p>搜索结果中的action项目测试：</p>
        <SearchResults
          keyword="action测试"
          :videos="testVideosWithAction"
          :loading="false"
          :error="null"
          :currentPage="1"
          :totalPages="1"
          :hasMore="false"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import VideoGrid from '@/components/VideoGrid.vue'
import SearchResults from '@/components/SearchResults.vue'

// 测试数据 - 包含action类型的视频
const testVideosWithAction = ref([
  // 普通视频
  {
    vod_id: '1',
    vod_name: '普通视频1',
    vod_pic: 'https://via.placeholder.com/300x400/4CAF50/white?text=Normal+Video',
    vod_remarks: '正常视频',
    vod_tag: 'normal'
  },
  // Action视频 - 单项输入
  {
    vod_id: JSON.stringify({
      actionId: '单项输入测试',
      type: 'input',
      title: '请输入内容',
      tip: '请输入您的姓名',
      value: '',
      msg: '这是一个单项输入测试',
      button: 2
    }),
    vod_name: 'Action: 单项输入',
    vod_pic: 'https://via.placeholder.com/300x400/2196F3/white?text=Input+Action',
    vod_remarks: 'Action',
    vod_tag: 'action'
  },
  // Action视频 - 消息弹窗
  {
    vod_id: JSON.stringify({
      actionId: '消息弹窗测试',
      type: 'msgbox',
      title: '提示信息',
      msg: '这是一个消息弹窗测试\n\n点击确定关闭',
      button: 1
    }),
    vod_name: 'Action: 消息弹窗',
    vod_pic: 'https://via.placeholder.com/300x400/FF9800/white?text=MsgBox+Action',
    vod_remarks: 'Action',
    vod_tag: 'action'
  },
  // Action视频 - 单项选择
  {
    vod_id: JSON.stringify({
      actionId: '单项选择测试',
      type: 'menu',
      title: '请选择选项',
      msg: '请从下面的选项中选择一个：',
      column: 2,
      option: [
        { name: '选项1', action: 'option1' },
        { name: '选项2', action: 'option2' },
        { name: '选项3', action: 'option3' },
        { name: '选项4', action: 'option4' }
      ]
    }),
    vod_name: 'Action: 单项选择',
    vod_pic: 'https://via.placeholder.com/300x400/9C27B0/white?text=Menu+Action',
    vod_remarks: 'Action',
    vod_tag: 'action'
  },
  // 更多普通视频
  {
    vod_id: '2',
    vod_name: '普通视频2',
    vod_pic: 'https://via.placeholder.com/300x400/4CAF50/white?text=Normal+Video+2',
    vod_remarks: '正常视频',
    vod_tag: 'normal'
  }
])
</script>

<style scoped>
.action-integration-test {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.test-header {
  text-align: center;
  margin-bottom: 40px;
}

.test-header h1 {
  color: var(--color-text-1);
  margin-bottom: 10px;
}

.test-header p {
  color: var(--color-text-3);
  font-size: 16px;
}

.test-sections {
  display: flex;
  flex-direction: column;
  gap: 40px;
}

.test-section {
  border: 1px solid var(--color-border-2);
  border-radius: 8px;
  padding: 20px;
  background: var(--color-bg-2);
}

.test-section h2 {
  color: var(--color-text-1);
  margin-bottom: 10px;
  font-size: 20px;
}

.test-section p {
  color: var(--color-text-3);
  margin-bottom: 20px;
  font-size: 14px;
}
</style>