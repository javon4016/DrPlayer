<template>
  <div class="home-container">
    <!-- 固定头部区域 -->
    <div class="dashboard-header">
      <div class="header-content">
        <div class="welcome-section">
          <h1 class="dashboard-title">
            <icon-home class="title-icon" />
            数据看板
          </h1>
          <p class="dashboard-subtitle">欢迎回来，今天也要愉快地追剧哦～</p>
        </div>
        <div class="quick-stats">
          <div class="stat-item">
            <div class="stat-value">{{ todayStats.watchCount }}</div>
            <div class="stat-label">今日观看</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ Math.round(todayStats.totalWatchTime / 60) }}</div>
            <div class="stat-label">总时长(分钟)</div>
          </div>
          <div class="stat-item">
            <div class="stat-value" :class="{ 'positive': growthRate > 0, 'negative': growthRate < 0 }">
              {{ growthRate > 0 ? '+' : '' }}{{ growthRate }}%
            </div>
            <div class="stat-label">增长率</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 可滚动内容区域 -->
    <div class="dashboard-content">
      <div class="content-grid">
        <!-- 最近观看统计 -->
        <div class="dashboard-card watch-stats-card">
          <div class="card-header">
            <h3 class="card-title">
              <icon-bar-chart class="card-icon" />
              最近观看统计
            </h3>
            <a-select v-model="statsTimeRange" size="small" style="width: 100px;" @change="updateStatsChart">
              <a-option value="week">本周</a-option>
              <a-option value="month">本月</a-option>
            </a-select>
          </div>
          <div class="card-content">
            <v-chart class="chart" :option="watchStatsOption" />
          </div>
        </div>

        <!-- 更新日志 -->
        <div class="dashboard-card update-log-card">
          <div class="card-header">
            <h3 class="card-title">
              <icon-history class="card-icon" />
              更新日志
            </h3>
            <a-link @click="handleViewAllLogs" size="small">查看全部</a-link>
          </div>
          <div class="card-content">
            <a-timeline>
              <a-timeline-item
                v-for="log in recentUpdateLogs"
                :key="log.id"
                :dot-color="getUpdateTypeColor(log.type)"
              >
                <div class="timeline-content">
                  <div class="timeline-header">
                    <span class="version-tag">{{ log.version }}</span>
                    <span class="update-date">{{ formatUpdateDate(log.date) }}</span>
                  </div>
                  <h4 class="update-title">{{ log.title }}</h4>
                  <p class="update-description">{{ log.description }}</p>
                  <div class="update-changes">
                    <a-tag
                      v-for="(change, index) in log.changes.slice(0, 2)"
                      :key="index"
                      size="small"
                      :color="getUpdateTypeTagColor(log.type)"
                    >
                      {{ change }}
                    </a-tag>
                    <span v-if="log.changes.length > 2" class="more-changes">
                      +{{ log.changes.length - 2 }}项更新
                    </span>
                  </div>
                </div>
              </a-timeline-item>
            </a-timeline>
          </div>
        </div>

        <!-- 猜你喜欢 -->
        <div class="dashboard-card recommend-card">
          <div class="card-header">
            <h3 class="card-title">
              <icon-heart class="card-icon" />
              猜你喜欢
            </h3>
            <a-select v-model="recommendType" size="small" style="width: 80px;" @change="updateRecommendations">
              <a-option value="hot">热门</a-option>
              <a-option value="trending">趋势</a-option>
              <a-option value="random">随机</a-option>
            </a-select>
          </div>
          <div class="card-content">
            <div class="recommend-grid">
              <div
                v-for="item in recommendations"
                :key="item.id"
                class="recommend-item"
                @click="handleRecommendClick(item)"
              >
                <div class="recommend-poster">
                  <div class="poster-placeholder" :style="{ backgroundColor: getTypeColor(item.type) }">
                    {{ item.title.substring(0, 2) }}
                  </div>
                  <div class="recommend-overlay">
                    <icon-play-arrow class="play-icon" />
                  </div>
                  <div v-if="item.trending" class="trending-badge">
                    🔥 热门
                  </div>
                </div>
                <div class="recommend-info">
                  <h4 class="recommend-title">{{ item.title }}</h4>
                  <div class="recommend-meta">
                    <a-tag size="small" :color="getTypeTagColor(item.type)">
                      {{ item.type }}
                    </a-tag>
                    <span class="recommend-rating">
                      <icon-star-fill />
                      {{ item.rating }}
                    </span>
                  </div>
                  <div class="recommend-tags">
                    <a-tag
                      v-for="tag in item.tags.slice(0, 2)"
                      :key="tag"
                      size="mini"
                      color="gray"
                    >
                      {{ tag }}
                    </a-tag>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 热搜关键词 -->
        <div class="dashboard-card keywords-card">
          <div class="card-header">
            <h3 class="card-title">
              <icon-fire class="card-icon" />
              热搜关键词
            </h3>
            <a-link @click="handleMoreKeywords" size="small">更多</a-link>
          </div>
          <div class="card-content">
            <div class="keywords-list">
              <div
                v-for="(keyword, index) in hotKeywords"
                :key="keyword.keyword"
                class="keyword-item"
                @click="handleKeywordClick(keyword)"
              >
                <div class="keyword-rank" :class="{ 'top-three': index < 3 }">
                  {{ index + 1 }}
                </div>
                <div class="keyword-content">
                  <span class="keyword-text">{{ keyword.keyword }}</span>
                  <div class="keyword-meta">
                    <span class="keyword-count">{{ formatCount(keyword.count) }}</span>
                    <span class="keyword-trend" :class="keyword.trend">
                      <icon-arrow-up v-if="keyword.trend === 'up'" />
                      <icon-arrow-down v-else-if="keyword.trend === 'down'" />
                      <icon-minus v-else />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 系统状态 -->
        <div class="dashboard-card system-status-card">
          <div class="card-header">
            <h3 class="card-title">
              <icon-computer class="card-icon" />
              系统状态
            </h3>
          </div>
          <div class="card-content">
            <div class="status-grid">
              <div class="status-item">
                <div class="status-icon online">
                  <icon-check-circle />
                </div>
                <div class="status-info">
                  <div class="status-label">播放服务</div>
                  <div class="status-value">正常</div>
                </div>
              </div>
              <div class="status-item">
                <div class="status-icon online">
                  <icon-check-circle />
                </div>
                <div class="status-info">
                  <div class="status-label">数据同步</div>
                  <div class="status-value">正常</div>
                </div>
              </div>
              <div class="status-item">
                <div class="status-icon warning">
                  <icon-exclamation-circle />
                </div>
                <div class="status-info">
                  <div class="status-label">存储空间</div>
                  <div class="status-value">85%</div>
                </div>
              </div>
              <div class="status-item">
                <div class="status-icon online">
                  <icon-check-circle />
                </div>
                <div class="status-info">
                  <div class="status-label">网络连接</div>
                  <div class="status-value">良好</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Action 文档卡片 -->
        <ActionDocCard />
      </div>
    </div>
  </div>

  <!-- 更新日志弹窗 -->
  <a-modal
    v-model:visible="showUpdateLogModal"
    title="更新日志"
    width="800px"
    :footer="false"
    @cancel="closeUpdateLogModal"
  >
    <div class="update-log-modal">
      <a-timeline>
        <a-timeline-item
          v-for="log in allUpdateLogs"
          :key="log.id"
          :dot-color="getUpdateTypeColor(log.type)"
        >
          <div class="timeline-content">
            <div class="timeline-header">
              <span class="version-tag">{{ log.version }}</span>
              <span class="update-date">{{ formatUpdateDate(log.date) }}</span>
              <a-tag
                size="small"
                :color="getUpdateTypeTagColor(log.type)"
                class="type-tag"
              >
                {{ getUpdateTypeConfig()[log.type]?.label || log.type }}
              </a-tag>
            </div>
            <h4 class="update-title">{{ log.title }}</h4>
            <p class="update-description">{{ log.description }}</p>
            <div class="update-changes">
              <a-tag
                v-for="(change, index) in log.changes"
                :key="index"
                size="small"
                :color="getUpdateTypeTagColor(log.type)"
                class="change-tag"
              >
                {{ change }}
              </a-tag>
            </div>
          </div>
        </a-timeline-item>
      </a-timeline>
    </div>
  </a-modal>

  <!-- 热搜关键词弹窗 -->
  <a-modal
    v-model:visible="showKeywordsModal"
    title="热搜关键词"
    width="600px"
    :footer="false"
    @cancel="closeKeywordsModal"
  >
    <div class="keywords-modal">
      <div class="keywords-list">
        <div
          v-for="(keyword, index) in allKeywords"
          :key="keyword.keyword"
          class="keyword-item"
          @click="handleKeywordClick(keyword)"
        >
          <div class="keyword-rank" :class="{ 'top-three': index < 3 }">
            {{ index + 1 }}
          </div>
          <div class="keyword-content">
            <span class="keyword-text">{{ keyword.keyword }}</span>
            <div class="keyword-meta">
              <span class="keyword-count">{{ formatCount(keyword.count) }}</span>
              <span class="keyword-trend" :class="keyword.trend">
                <icon-arrow-up v-if="keyword.trend === 'up'" />
                <icon-arrow-down v-else-if="keyword.trend === 'down'" />
                <icon-minus v-else />
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </a-modal>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart, LineChart, PieChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent
} from 'echarts/components'
import VChart from 'vue-echarts'
import {
  IconHome,
  IconBarChart,
  IconHistory,
  IconHeart,
  IconComputer,
  IconFire,
  IconPlayArrow,
  IconStarFill,
  IconArrowUp,
  IconArrowDown,
  IconMinus,
  IconCheckCircle,
  IconExclamationCircle
} from '@arco-design/web-vue/es/icon'

// 导入数据服务
import watchStatsService from '@/api/services/watchStatsService'
import updateLogService from '@/api/services/updateLogService'
import recommendService from '@/api/services/recommendService'
import { usePageStateStore } from '@/stores/pageStateStore'
import { useRoute, useRouter } from 'vue-router'

// 导入组件
import ActionDocCard from '@/components/ActionDocCard.vue'

// 注册 ECharts 组件
use([
  CanvasRenderer,
  BarChart,
  LineChart,
  PieChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent
])

// 初始化stores和router
const pageStateStore = usePageStateStore()
const route = useRoute()
const router = useRouter()

// 响应式数据
const statsTimeRange = ref('week')
const recommendType = ref('hot')

// 观看统计数据
const todayStats = ref({ watchCount: 0, totalWatchTime: 0 })
const yesterdayStats = ref({ watchCount: 0, totalWatchTime: 0 })
const weekStats = ref([])
const growthRate = ref(0)

// 更新日志数据
const recentUpdateLogs = ref([])

// 推荐数据
const recommendations = ref([])

// 热搜关键词
const hotKeywords = ref([])

// 观看统计图表配置
const watchStatsOption = computed(() => {
  const data = weekStats.value.map(item => item.count)
  const labels = weekStats.value.map(item => item.day)
  
  return {
    title: {
      text: statsTimeRange.value === 'week' ? '本周观看统计' : '本月观看统计',
      textStyle: {
        fontSize: 14,
        color: '#1D2129'
      }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      formatter: function(params) {
        const data = params[0]
        return `${data.name}<br/>${data.seriesName}: ${data.value}集`
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: labels,
      axisLabel: {
        color: '#86909C'
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        color: '#86909C'
      }
    },
    series: [
      {
        name: '观看集数',
        type: 'bar',
        data: data,
        itemStyle: {
          color: '#165DFF'
        },
        barWidth: '60%'
      }
    ]
  }
})

// 工具函数
const getUpdateTypeColor = (type) => {
  const typeConfig = updateLogService.getUpdateTypeConfig()
  return typeConfig[type]?.color || '#86909c'
}

const getUpdateTypeConfig = () => {
  return updateLogService.getUpdateTypeConfig()
}

const getUpdateTypeTagColor = (type) => {
  const colors = {
    feature: 'green',
    improvement: 'blue',
    optimization: 'orange',
    security: 'red',
    bugfix: 'purple',
    release: 'gold'
  }
  return colors[type] || 'gray'
}

const getTypeColor = (type) => {
  const colors = {
    '电影': '#4A90E2',
    '电视剧': '#50C878',
    '动漫': '#FF6B6B',
    '小说': '#9B59B6'
  }
  return colors[type] || '#86909C'
}

const getTypeTagColor = (type) => {
  const colors = {
    '电影': 'blue',
    '电视剧': 'green',
    '动漫': 'orange',
    '小说': 'purple'
  }
  return colors[type] || 'gray'
}

const formatUpdateDate = (dateString) => {
  return updateLogService.formatDate(dateString)
}

const formatCount = (count) => {
  if (count >= 10000) {
    return (count / 10000).toFixed(1) + 'w'
  } else if (count >= 1000) {
    return (count / 1000).toFixed(1) + 'k'
  }
  return count.toString()
}

// 事件处理
const updateStatsChart = () => {
  // 这里可以根据时间范围更新图表数据
  console.log('更新统计图表:', statsTimeRange.value)
}

const updateRecommendations = () => {
  switch (recommendType.value) {
    case 'hot':
      recommendations.value = recommendService.getHotRecommendations(8)
      break
    case 'trending':
      recommendations.value = recommendService.getTrendingRecommendations(8)
      break
    case 'random':
      recommendations.value = recommendService.getRandomRecommendations(8)
      break
  }
}

const handleRecommendClick = (item) => {
  console.log('点击推荐内容:', item)
  // 这里可以跳转到详情页或播放页面
}

const handleKeywordClick = (keyword) => {
  console.log('点击热搜关键词:', keyword)
  // 这里可以跳转到搜索页面
}

// 弹窗相关的响应式数据
const showUpdateLogModal = ref(false)
const showKeywordsModal = ref(false)
const allUpdateLogs = ref([])
const allKeywords = ref([])

// 弹窗事件处理函数
const handleViewAllLogs = () => {
  // 获取所有更新日志
  allUpdateLogs.value = updateLogService.getAllUpdateLogs()
  showUpdateLogModal.value = true
}

const handleMoreKeywords = () => {
  // 获取所有热搜关键词
  allKeywords.value = recommendService.getAllKeywords()
  showKeywordsModal.value = true
}

const closeUpdateLogModal = () => {
  showUpdateLogModal.value = false
}

const closeKeywordsModal = () => {
  showKeywordsModal.value = false
}

// 初始化数据
const initData = () => {
  // 初始化模拟数据（仅在开发环境）
  if (import.meta.env.DEV) {
    watchStatsService.initMockData()
  }
  
  // 获取观看统计数据
  todayStats.value = watchStatsService.getTodayStats()
  yesterdayStats.value = watchStatsService.getYesterdayStats()
  weekStats.value = watchStatsService.getWeekStats()
  growthRate.value = watchStatsService.calculateGrowthRate()
  
  // 获取更新日志
  recentUpdateLogs.value = updateLogService.getRecentUpdateLogs(4)
  
  // 获取推荐内容
  updateRecommendations()
  
  // 获取热搜关键词
  hotKeywords.value = recommendService.getHotKeywords(8)
}

// 生命周期
onMounted(() => {
  // 检查是否需要恢复搜索状态
  const restoreSearch = route.query._restoreSearch;
  
  if (restoreSearch === 'true') {
    // 恢复搜索状态
    const savedSearchState = pageStateStore.getPageState('search');
    if (savedSearchState && savedSearchState.keyword && !pageStateStore.isStateExpired('search')) {
      console.log('Home页面恢复搜索状态:', savedSearchState);
      
      // 这里可以触发搜索功能，但由于Home页面可能没有搜索功能
      // 我们可以跳转到Video页面并恢复搜索
      router.replace({
        name: 'Video',
        query: { _restoreSearch: 'true' }
      });
      return;
    }
    
    // 清除URL中的恢复参数
    const newQuery = { ...route.query };
    delete newQuery._restoreSearch;
    router.replace({ query: newQuery });
  }
  
  initData()
  console.log('主页看板加载完成')
})
</script>

<style scoped>
.home-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: 100%; /* 使用100%最小高度，继承父容器 */
}

.dashboard-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--color-border-2);
  padding: 20px 0; /* 移除左右padding，让内容完全填充 */
  margin: 0 -24px; /* 抵消Layout的padding */
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: none; /* 移除最大宽度限制 */
  margin: 0;
  padding: 0 24px; /* 在这里添加左右padding */
}

.welcome-section {
  flex: 1;
}

.dashboard-title {
  font-size: 28px;
  font-weight: 600;
  color: var(--color-text-1);
  margin: 0 0 8px 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.title-icon {
  color: var(--color-primary-6);
  font-size: 32px;
}

.dashboard-subtitle {
  font-size: 14px;
  color: var(--color-text-3);
  margin: 0;
}

.quick-stats {
  display: flex;
  gap: 32px;
  align-items: center;
}

.dashboard-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px 0; /* 移除左右padding */
  margin: 0 -24px; /* 抵消Layout的padding */
}

.content-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 24px;
  max-width: none; /* 移除最大宽度限制 */
  margin: 0;
  padding: 0 24px; /* 在这里添加左右padding */
}

.dashboard-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border: 1px solid var(--color-border-2);
  overflow: hidden;
  transition: all 0.3s ease;
}

.dashboard-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.card-header {
  padding: 20px 24px 16px;
  border-bottom: 1px solid var(--color-border-2);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-1);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-icon {
  color: var(--color-primary-6);
  font-size: 18px;
}

.card-content {
  padding: 20px 24px 24px;
}

/* 观看统计卡片 */
.watch-stats-card {
  grid-column: span 2;
}

.stat-item {
  text-align: center;
  min-width: 80px;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: var(--color-text-1);
  line-height: 1;
  margin-bottom: 4px;
}

.stat-value.positive {
  color: var(--color-success-6);
}

.stat-value.negative {
  color: var(--color-danger-6);
}

.stat-label {
  font-size: 12px;
  color: var(--color-text-3);
  line-height: 1;
}

.chart {
  width: 100%;
  height: 300px;
}

/* 更新日志卡片 */
.update-log-card {
  grid-column: span 1;
}

.timeline-content {
  margin-bottom: 16px;
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.version-tag {
  background: var(--color-primary-1);
  color: var(--color-primary-6);
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.update-date {
  font-size: 12px;
  color: var(--color-text-3);
}

.update-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-1);
  margin: 0 0 8px 0;
}

.update-description {
  font-size: 13px;
  color: var(--color-text-2);
  margin: 0 0 12px 0;
  line-height: 1.5;
}

.update-changes {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.more-changes {
  font-size: 12px;
  color: var(--color-text-3);
}

/* 推荐卡片 */
.recommend-card {
  grid-column: span 2;
}

.recommend-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 16px;
}

.recommend-item {
  cursor: pointer;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s ease;
  background: var(--color-bg-2);
}

.recommend-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
}

.recommend-poster {
  position: relative;
  width: 100%;
  height: 120px;
  overflow: hidden;
}

.poster-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
  font-weight: 600;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.recommend-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.recommend-item:hover .recommend-overlay {
  opacity: 1;
}

.play-icon {
  color: white;
  font-size: 32px;
}

.trending-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  background: linear-gradient(45deg, #ff6b6b, #ff8e53);
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 500;
}

.recommend-info {
  padding: 12px;
}

.recommend-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-1);
  margin: 0 0 8px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.recommend-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.recommend-rating {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 12px;
  color: var(--color-text-2);
}

.recommend-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

/* 热搜关键词卡片 */
.keywords-card {
  grid-column: span 1;
}

.keywords-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.keyword-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.keyword-item:hover {
  background: var(--color-bg-2);
}

.keyword-rank {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  background: var(--color-fill-3);
  color: var(--color-text-2);
}

.keyword-rank.top-three {
  background: linear-gradient(45deg, #ff6b6b, #ff8e53);
  color: white;
}

.keyword-content {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.keyword-text {
  font-size: 14px;
  color: var(--color-text-1);
  font-weight: 500;
}

.keyword-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.keyword-count {
  font-size: 12px;
  color: var(--color-text-3);
}

.keyword-trend {
  display: flex;
  align-items: center;
}

.keyword-trend.up {
  color: var(--color-success-6);
}

.keyword-trend.down {
  color: var(--color-danger-6);
}

.keyword-trend.stable {
  color: var(--color-text-3);
}

/* 系统状态卡片 */
.system-status-card {
  grid-column: span 1;
}

.status-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  background: var(--color-bg-2);
}

.status-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.status-icon.online {
  background: var(--color-success-1);
  color: var(--color-success-6);
}

.status-icon.warning {
  background: var(--color-warning-1);
  color: var(--color-warning-6);
}

.status-icon.error {
  background: var(--color-danger-1);
  color: var(--color-danger-6);
}

.status-info {
  flex: 1;
}

.status-label {
  font-size: 12px;
  color: var(--color-text-3);
  margin-bottom: 2px;
}

.status-value {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-1);
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
  
  .watch-stats-card,
  .recommend-card {
    grid-column: span 1;
  }
  
  .quick-stats {
    gap: 20px;
  }
}

@media (max-width: 768px) {
  .dashboard-header {
    padding: 16px 0;
  }
  
  .header-content {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
    padding: 0 20px;
  }
  
  .quick-stats {
    align-self: stretch;
    justify-content: space-around;
  }
  
  .dashboard-content {
    padding: 16px 0;
  }
  
  .content-grid {
    padding: 0 20px;
  }
  
  .content-grid {
    gap: 16px;
  }
  
  .card-header,
  .card-content {
    padding: 16px 20px;
  }
  
  .recommend-grid {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 12px;
  }
  
  .status-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}

/* 弹窗样式 */
.update-log-modal {
  max-height: 500px;
  overflow-y: auto;
}

.update-log-modal .timeline-content {
  padding-bottom: 20px;
}

.update-log-modal .timeline-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.update-log-modal .type-tag {
  margin-left: auto;
}

.update-log-modal .update-title {
  margin: 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-1);
}

.update-log-modal .update-description {
  margin: 8px 0;
  color: var(--color-text-2);
  line-height: 1.5;
}

.update-log-modal .update-changes {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.update-log-modal .change-tag {
  margin: 0;
}

.keywords-modal {
  max-height: 500px;
  overflow-y: auto;
}

.keywords-modal .keywords-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.keywords-modal .keyword-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  border-radius: 8px;
  background: var(--color-bg-2);
  cursor: pointer;
  transition: all 0.2s ease;
}

.keywords-modal .keyword-item:hover {
  background: var(--color-bg-3);
  transform: translateY(-1px);
}

.keywords-modal .keyword-rank {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
  background: var(--color-fill-3);
  color: var(--color-text-2);
}

.keywords-modal .keyword-rank.top-three {
  background: linear-gradient(135deg, #ff6b6b, #ffa726);
  color: white;
}

.keywords-modal .keyword-content {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.keywords-modal .keyword-text {
  font-size: 16px;
  font-weight: 500;
  color: var(--color-text-1);
}

.keywords-modal .keyword-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.keywords-modal .keyword-count {
  font-size: 14px;
  color: var(--color-text-3);
}

.keywords-modal .keyword-trend {
  display: flex;
  align-items: center;
  font-size: 16px;
}

.keywords-modal .keyword-trend.up {
  color: var(--color-success-6);
}

.keywords-modal .keyword-trend.down {
  color: var(--color-danger-6);
}

.keywords-modal .keyword-trend.stable {
  color: var(--color-text-3);
}
</style>