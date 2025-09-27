/**
 * 更新日志服务
 * 管理系统更新日志和版本信息
 */

// 更新日志数据
const UPDATE_LOGS = [
  {
    id: 'v2.1.0',
    version: 'v2.1.0',
    date: '2024-01-15',
    title: '主页看板功能上线',
    type: 'feature',
    description: '全新的数据看板界面，提供观看统计、更新日志和推荐功能',
    changes: [
      '新增观看统计图表，支持今日/昨日对比',
      '新增更新日志时间线展示',
      '新增猜你喜欢推荐模块',
      '优化主页布局，支持固定头部滚动内容',
      '集成ECharts图表库'
    ],
    author: 'DrPlayer Team',
    importance: 'major'
  },
  {
    id: 'v2.0.5',
    version: 'v2.0.5',
    date: '2024-01-12',
    title: '视频详情页优化',
    type: 'improvement',
    description: '优化视频详情页的用户体验和界面交互',
    changes: [
      '修复下拉选择框滚动跟随问题',
      '优化选择框文本显示宽度',
      '改进选择框定位策略',
      '增强响应式布局适配'
    ],
    author: 'UI Team',
    importance: 'minor'
  },
  {
    id: 'v2.0.4',
    version: 'v2.0.4',
    date: '2024-01-10',
    title: '播放器功能增强',
    type: 'feature',
    description: '播放器新增多项实用功能，提升观看体验',
    changes: [
      '新增播放速度调节功能',
      '支持自定义快进/快退时间',
      '新增画质切换选项',
      '优化全屏播放体验',
      '修复音量控制问题'
    ],
    author: 'Player Team',
    importance: 'major'
  },
  {
    id: 'v2.0.3',
    version: 'v2.0.3',
    date: '2024-01-08',
    title: '性能优化',
    type: 'optimization',
    description: '全面优化系统性能，提升加载速度',
    changes: [
      '优化视频列表加载性能',
      '减少首屏加载时间',
      '优化图片懒加载策略',
      '压缩静态资源大小',
      '改进缓存策略'
    ],
    author: 'Performance Team',
    importance: 'minor'
  },
  {
    id: 'v2.0.2',
    version: 'v2.0.2',
    date: '2024-01-05',
    title: '安全性更新',
    type: 'security',
    description: '重要安全更新，修复多个安全漏洞',
    changes: [
      '修复XSS安全漏洞',
      '加强用户输入验证',
      '更新依赖包到安全版本',
      '改进API接口安全性',
      '增强数据传输加密'
    ],
    author: 'Security Team',
    importance: 'critical'
  },
  {
    id: 'v2.0.1',
    version: 'v2.0.1',
    date: '2024-01-03',
    title: 'Bug修复',
    type: 'bugfix',
    description: '修复用户反馈的多个问题',
    changes: [
      '修复视频无法播放的问题',
      '解决搜索功能异常',
      '修复移动端适配问题',
      '解决内存泄漏问题',
      '修复数据同步异常'
    ],
    author: 'Bug Fix Team',
    importance: 'minor'
  },
  {
    id: 'v2.0.0',
    version: 'v2.0.0',
    date: '2024-01-01',
    title: 'DrPlayer 2.0 正式发布',
    type: 'release',
    description: '全新的DrPlayer 2.0版本正式发布，带来全新的用户体验',
    changes: [
      '全新的UI设计语言',
      '重构的播放器内核',
      '支持更多视频格式',
      '新增用户个人中心',
      '支持多设备同步',
      '新增离线下载功能',
      '优化搜索算法',
      '支持弹幕功能'
    ],
    author: 'DrPlayer Team',
    importance: 'major'
  }
]

/**
 * 获取更新日志类型配置
 */
export const getUpdateTypeConfig = () => {
  return {
    feature: {
      label: '新功能',
      color: '#00b42a',
      icon: '🚀'
    },
    improvement: {
      label: '功能优化',
      color: '#165dff',
      icon: '⚡'
    },
    optimization: {
      label: '性能优化',
      color: '#ff7d00',
      icon: '🔧'
    },
    security: {
      label: '安全更新',
      color: '#f53f3f',
      icon: '🔒'
    },
    bugfix: {
      label: 'Bug修复',
      color: '#722ed1',
      icon: '🐛'
    },
    release: {
      label: '版本发布',
      color: '#f7ba1e',
      icon: '🎉'
    }
  }
}

/**
 * 获取重要性配置
 */
export const getImportanceConfig = () => {
  return {
    critical: {
      label: '紧急',
      color: '#f53f3f',
      priority: 4
    },
    major: {
      label: '重要',
      color: '#ff7d00',
      priority: 3
    },
    minor: {
      label: '一般',
      color: '#165dff',
      priority: 2
    },
    trivial: {
      label: '轻微',
      color: '#86909c',
      priority: 1
    }
  }
}

/**
 * 获取所有更新日志
 */
export const getAllUpdateLogs = () => {
  return UPDATE_LOGS.sort((a, b) => new Date(b.date) - new Date(a.date))
}

/**
 * 根据类型筛选更新日志
 */
export const getUpdateLogsByType = (type) => {
  return UPDATE_LOGS
    .filter(log => log.type === type)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
}

/**
 * 根据重要性筛选更新日志
 */
export const getUpdateLogsByImportance = (importance) => {
  return UPDATE_LOGS
    .filter(log => log.importance === importance)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
}

/**
 * 获取最近的更新日志
 */
export const getRecentUpdateLogs = (limit = 5) => {
  return UPDATE_LOGS
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, limit)
}

/**
 * 根据日期范围获取更新日志
 */
export const getUpdateLogsByDateRange = (startDate, endDate) => {
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  return UPDATE_LOGS
    .filter(log => {
      const logDate = new Date(log.date)
      return logDate >= start && logDate <= end
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date))
}

/**
 * 搜索更新日志
 */
export const searchUpdateLogs = (keyword) => {
  const lowerKeyword = keyword.toLowerCase()
  
  return UPDATE_LOGS
    .filter(log => {
      return (
        log.title.toLowerCase().includes(lowerKeyword) ||
        log.description.toLowerCase().includes(lowerKeyword) ||
        log.version.toLowerCase().includes(lowerKeyword) ||
        log.changes.some(change => change.toLowerCase().includes(lowerKeyword))
      )
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date))
}

/**
 * 获取更新统计信息
 */
export const getUpdateStats = () => {
  const typeConfig = getUpdateTypeConfig()
  const importanceConfig = getImportanceConfig()
  
  // 按类型统计
  const typeStats = {}
  Object.keys(typeConfig).forEach(type => {
    typeStats[type] = UPDATE_LOGS.filter(log => log.type === type).length
  })
  
  // 按重要性统计
  const importanceStats = {}
  Object.keys(importanceConfig).forEach(importance => {
    importanceStats[importance] = UPDATE_LOGS.filter(log => log.importance === importance).length
  })
  
  // 按月份统计
  const monthlyStats = {}
  UPDATE_LOGS.forEach(log => {
    const month = log.date.substring(0, 7) // YYYY-MM
    monthlyStats[month] = (monthlyStats[month] || 0) + 1
  })
  
  return {
    total: UPDATE_LOGS.length,
    byType: typeStats,
    byImportance: importanceStats,
    byMonth: monthlyStats,
    latestVersion: UPDATE_LOGS[0]?.version || 'v1.0.0',
    latestDate: UPDATE_LOGS[0]?.date || new Date().toISOString().split('T')[0]
  }
}

/**
 * 格式化日期显示
 */
export const formatDate = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now - date)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 1) {
    return '昨天'
  } else if (diffDays <= 7) {
    return `${diffDays}天前`
  } else if (diffDays <= 30) {
    const weeks = Math.floor(diffDays / 7)
    return `${weeks}周前`
  } else {
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }
}

/**
 * 获取版本比较结果
 */
export const compareVersions = (version1, version2) => {
  const v1Parts = version1.replace('v', '').split('.').map(Number)
  const v2Parts = version2.replace('v', '').split('.').map(Number)
  
  for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
    const v1Part = v1Parts[i] || 0
    const v2Part = v2Parts[i] || 0
    
    if (v1Part > v2Part) return 1
    if (v1Part < v2Part) return -1
  }
  
  return 0
}

// 默认导出服务对象
export default {
  getAllUpdateLogs,
  getUpdateLogsByType,
  getUpdateLogsByImportance,
  getRecentUpdateLogs,
  getUpdateLogsByDateRange,
  searchUpdateLogs,
  getUpdateStats,
  getUpdateTypeConfig,
  getImportanceConfig,
  formatDate,
  compareVersions
}