/**
 * 观看统计数据服务
 * 管理用户观看历史和统计数据
 */

// 本地存储键名
const STORAGE_KEYS = {
  WATCH_HISTORY: 'drplayer_watch_history',
  DAILY_STATS: 'drplayer_daily_stats',
  WEEKLY_STATS: 'drplayer_weekly_stats'
}

/**
 * 获取今日日期字符串
 */
const getTodayString = () => {
  return new Date().toISOString().split('T')[0]
}

/**
 * 获取昨日日期字符串
 */
const getYesterdayString = () => {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return yesterday.toISOString().split('T')[0]
}

/**
 * 获取本周日期范围
 */
const getWeekRange = () => {
  const today = new Date()
  const dayOfWeek = today.getDay()
  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() - dayOfWeek)
  
  const weekDates = []
  for (let i = 0; i < 7; i++) {
    const date = new Date(startOfWeek)
    date.setDate(startOfWeek.getDate() + i)
    weekDates.push(date.toISOString().split('T')[0])
  }
  
  return weekDates
}

/**
 * 从本地存储获取数据
 */
const getStorageData = (key, defaultValue = {}) => {
  try {
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : defaultValue
  } catch (error) {
    console.error('获取存储数据失败:', error)
    return defaultValue
  }
}

/**
 * 保存数据到本地存储
 */
const setStorageData = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (error) {
    console.error('保存存储数据失败:', error)
  }
}

/**
 * 记录观看行为
 */
export const recordWatchActivity = (videoInfo) => {
  const today = getTodayString()
  const timestamp = new Date().toISOString()
  
  // 获取观看历史
  const watchHistory = getStorageData(STORAGE_KEYS.WATCH_HISTORY, [])
  
  // 添加新的观看记录
  const newRecord = {
    id: Date.now(),
    videoId: videoInfo.id,
    videoTitle: videoInfo.title,
    episode: videoInfo.episode || 1,
    duration: videoInfo.duration || 0,
    watchTime: videoInfo.watchTime || 0,
    date: today,
    timestamp: timestamp
  }
  
  watchHistory.push(newRecord)
  
  // 保持最近1000条记录
  if (watchHistory.length > 1000) {
    watchHistory.splice(0, watchHistory.length - 1000)
  }
  
  setStorageData(STORAGE_KEYS.WATCH_HISTORY, watchHistory)
  
  // 更新每日统计
  updateDailyStats(today)
  
  return newRecord
}

/**
 * 更新每日统计
 */
const updateDailyStats = (date) => {
  const dailyStats = getStorageData(STORAGE_KEYS.DAILY_STATS, {})
  const watchHistory = getStorageData(STORAGE_KEYS.WATCH_HISTORY, [])
  
  // 计算指定日期的观看集数
  const dayWatchCount = watchHistory.filter(record => record.date === date).length
  
  dailyStats[date] = {
    date: date,
    watchCount: dayWatchCount,
    totalWatchTime: watchHistory
      .filter(record => record.date === date)
      .reduce((total, record) => total + (record.watchTime || 0), 0),
    updatedAt: new Date().toISOString()
  }
  
  setStorageData(STORAGE_KEYS.DAILY_STATS, dailyStats)
}

/**
 * 获取今日观看统计
 */
export const getTodayStats = () => {
  const today = getTodayString()
  const dailyStats = getStorageData(STORAGE_KEYS.DAILY_STATS, {})
  
  if (!dailyStats[today]) {
    updateDailyStats(today)
    return dailyStats[today] || { date: today, watchCount: 0, totalWatchTime: 0 }
  }
  
  return dailyStats[today]
}

/**
 * 获取昨日观看统计
 */
export const getYesterdayStats = () => {
  const yesterday = getYesterdayString()
  const dailyStats = getStorageData(STORAGE_KEYS.DAILY_STATS, {})
  
  if (!dailyStats[yesterday]) {
    updateDailyStats(yesterday)
    return dailyStats[yesterday] || { date: yesterday, watchCount: 0, totalWatchTime: 0 }
  }
  
  return dailyStats[yesterday]
}

/**
 * 获取本周观看统计
 */
export const getWeekStats = () => {
  const weekDates = getWeekRange()
  const dailyStats = getStorageData(STORAGE_KEYS.DAILY_STATS, {})
  
  const weekStats = weekDates.map((date, index) => {
    const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    const dayStats = dailyStats[date] || { date, watchCount: 0, totalWatchTime: 0 }
    
    return {
      day: dayNames[index],
      date: date,
      count: dayStats.watchCount,
      totalWatchTime: dayStats.totalWatchTime
    }
  })
  
  return weekStats
}

/**
 * 计算同比增长率
 */
export const calculateGrowthRate = () => {
  const todayStats = getTodayStats()
  const yesterdayStats = getYesterdayStats()
  
  if (yesterdayStats.watchCount === 0) {
    return todayStats.watchCount > 0 ? 100 : 0
  }
  
  const growth = ((todayStats.watchCount - yesterdayStats.watchCount) / yesterdayStats.watchCount) * 100
  return Math.round(growth)
}

/**
 * 获取观看历史
 */
export const getWatchHistory = (limit = 50) => {
  const watchHistory = getStorageData(STORAGE_KEYS.WATCH_HISTORY, [])
  return watchHistory
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, limit)
}

/**
 * 获取热门观看内容
 */
export const getPopularContent = (limit = 10) => {
  const watchHistory = getStorageData(STORAGE_KEYS.WATCH_HISTORY, [])
  
  // 统计每个视频的观看次数
  const contentStats = {}
  watchHistory.forEach(record => {
    const key = record.videoId
    if (!contentStats[key]) {
      contentStats[key] = {
        videoId: record.videoId,
        videoTitle: record.videoTitle,
        watchCount: 0,
        lastWatched: record.timestamp
      }
    }
    contentStats[key].watchCount++
    if (new Date(record.timestamp) > new Date(contentStats[key].lastWatched)) {
      contentStats[key].lastWatched = record.timestamp
    }
  })
  
  // 按观看次数排序
  return Object.values(contentStats)
    .sort((a, b) => b.watchCount - a.watchCount)
    .slice(0, limit)
}

/**
 * 清理过期数据
 */
export const cleanupOldData = (daysToKeep = 30) => {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)
  const cutoffString = cutoffDate.toISOString().split('T')[0]
  
  // 清理观看历史
  const watchHistory = getStorageData(STORAGE_KEYS.WATCH_HISTORY, [])
  const filteredHistory = watchHistory.filter(record => record.date >= cutoffString)
  setStorageData(STORAGE_KEYS.WATCH_HISTORY, filteredHistory)
  
  // 清理每日统计
  const dailyStats = getStorageData(STORAGE_KEYS.DAILY_STATS, {})
  const filteredStats = {}
  Object.keys(dailyStats).forEach(date => {
    if (date >= cutoffString) {
      filteredStats[date] = dailyStats[date]
    }
  })
  setStorageData(STORAGE_KEYS.DAILY_STATS, filteredStats)
  
  console.log(`清理了 ${daysToKeep} 天前的数据`)
}

/**
 * 初始化模拟数据（用于演示）
 */
export const initMockData = () => {
  const mockVideos = [
    { id: 'video_1', title: '斗罗大陆', episode: 1 },
    { id: 'video_2', title: '庆余年', episode: 2 },
    { id: 'video_3', title: '流浪地球2', episode: 1 },
    { id: 'video_4', title: '鬼灭之刃', episode: 5 },
    { id: 'video_5', title: '三体', episode: 3 }
  ]
  
  // 生成过去7天的模拟数据
  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    
    // 每天随机观看1-5个视频
    const dailyWatchCount = Math.floor(Math.random() * 5) + 1
    
    for (let j = 0; j < dailyWatchCount; j++) {
      const randomVideo = mockVideos[Math.floor(Math.random() * mockVideos.length)]
      const mockRecord = {
        ...randomVideo,
        duration: Math.floor(Math.random() * 3600) + 1200, // 20-80分钟
        watchTime: Math.floor(Math.random() * 3000) + 600   // 10-60分钟
      }
      
      // 设置特定日期的时间戳
      const timestamp = new Date(date)
      timestamp.setHours(Math.floor(Math.random() * 24))
      timestamp.setMinutes(Math.floor(Math.random() * 60))
      
      recordWatchActivity({
        ...mockRecord,
        timestamp: timestamp.toISOString()
      })
    }
  }
  
  console.log('模拟数据初始化完成')
}

// 默认导出服务对象
export default {
  recordWatchActivity,
  getTodayStats,
  getYesterdayStats,
  getWeekStats,
  calculateGrowthRate,
  getWatchHistory,
  getPopularContent,
  cleanupOldData,
  initMockData
}