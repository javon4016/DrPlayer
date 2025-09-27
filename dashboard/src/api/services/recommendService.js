/**
 * 推荐服务
 * 管理内容推荐和热搜数据
 */

// 热门推荐数据
const HOT_RECOMMENDATIONS = {
  movies: [
    {
      id: 'movie_1',
      title: '流浪地球2',
      type: '电影',
      category: '科幻',
      rating: 9.2,
      year: 2023,
      description: '太阳即将毁灭，人类在地球表面建造出巨大的推进器，寻找新的家园。',
      poster: 'https://img.alicdn.com/imgextra/i1/O1CN01qJdqKd1Ks8zNjp3wP_!!6000000001218-0-tps-300-400.jpg',
      tags: ['科幻', '灾难', '中国'],
      hotScore: 95,
      trending: true
    },
    {
      id: 'movie_2',
      title: '满江红',
      type: '电影',
      category: '剧情',
      rating: 8.8,
      year: 2023,
      description: '南宋绍兴年间，岳飞死后四年，秦桧率兵与金国会谈。',
      poster: 'https://img.alicdn.com/imgextra/i2/O1CN01YjQKjC1Ks8zNjp3wQ_!!6000000001218-0-tps-300-400.jpg',
      tags: ['剧情', '历史', '悬疑'],
      hotScore: 88,
      trending: true
    },
    {
      id: 'movie_3',
      title: '深海',
      type: '电影',
      category: '动画',
      rating: 8.5,
      year: 2023,
      description: '一个现代女孩意外进入梦幻的深海世界。',
      poster: 'https://img.alicdn.com/imgextra/i3/O1CN01YjQKjC1Ks8zNjp3wR_!!6000000001218-0-tps-300-400.jpg',
      tags: ['动画', '奇幻', '治愈'],
      hotScore: 82,
      trending: false
    },
    {
      id: 'movie_4',
      title: '阿凡达：水之道',
      type: '电影',
      category: '科幻',
      rating: 8.9,
      year: 2022,
      description: '杰克·萨利一家在潘多拉星球上的新冒险。',
      poster: 'https://img.alicdn.com/imgextra/i4/O1CN01YjQKjC1Ks8zNjp3wS_!!6000000001218-0-tps-300-400.jpg',
      tags: ['科幻', '冒险', '3D'],
      hotScore: 90,
      trending: false
    }
  ],
  tvShows: [
    {
      id: 'tv_1',
      title: '狂飙',
      type: '电视剧',
      category: '犯罪',
      rating: 9.1,
      year: 2023,
      description: '一线刑警安欣和黑恶势力的较量。',
      poster: 'https://img.alicdn.com/imgextra/i1/O1CN01qJdqKd1Ks8zNjp3wT_!!6000000001218-0-tps-300-400.jpg',
      tags: ['犯罪', '悬疑', '国产'],
      hotScore: 96,
      trending: true,
      episodes: 39
    },
    {
      id: 'tv_2',
      title: '三体',
      type: '电视剧',
      category: '科幻',
      rating: 8.7,
      year: 2023,
      description: '基于刘慈欣同名科幻小说改编。',
      poster: 'https://img.alicdn.com/imgextra/i2/O1CN01YjQKjC1Ks8zNjp3wU_!!6000000001218-0-tps-300-400.jpg',
      tags: ['科幻', '悬疑', '国产'],
      hotScore: 89,
      trending: true,
      episodes: 30
    },
    {
      id: 'tv_3',
      title: '庆余年2',
      type: '电视剧',
      category: '古装',
      rating: 8.4,
      year: 2024,
      description: '范闲的新冒险继续展开。',
      poster: 'https://img.alicdn.com/imgextra/i3/O1CN01YjQKjC1Ks8zNjp3wV_!!6000000001218-0-tps-300-400.jpg',
      tags: ['古装', '喜剧', '权谋'],
      hotScore: 85,
      trending: true,
      episodes: 36
    },
    {
      id: 'tv_4',
      title: '漫长的季节',
      type: '电视剧',
      category: '悬疑',
      rating: 9.4,
      year: 2023,
      description: '一个跨越时空的悬疑故事。',
      poster: 'https://img.alicdn.com/imgextra/i4/O1CN01YjQKjC1Ks8zNjp3wW_!!6000000001218-0-tps-300-400.jpg',
      tags: ['悬疑', '剧情', '国产'],
      hotScore: 94,
      trending: false,
      episodes: 12
    }
  ],
  anime: [
    {
      id: 'anime_1',
      title: '鬼灭之刃 锻刀村篇',
      type: '动漫',
      category: '热血',
      rating: 9.3,
      year: 2023,
      description: '炭治郎前往锻刀村修复日轮刀。',
      poster: 'https://img.alicdn.com/imgextra/i1/O1CN01qJdqKd1Ks8zNjp3wX_!!6000000001218-0-tps-300-400.jpg',
      tags: ['热血', '战斗', '日本'],
      hotScore: 93,
      trending: true,
      episodes: 11
    },
    {
      id: 'anime_2',
      title: '斗罗大陆',
      type: '动漫',
      category: '玄幻',
      rating: 8.6,
      year: 2023,
      description: '唐三在斗罗大陆的修炼之路。',
      poster: 'https://img.alicdn.com/imgextra/i2/O1CN01YjQKjC1Ks8zNjp3wY_!!6000000001218-0-tps-300-400.jpg',
      tags: ['玄幻', '冒险', '国产'],
      hotScore: 86,
      trending: true,
      episodes: 200
    },
    {
      id: 'anime_3',
      title: '咒术回战 第二季',
      type: '动漫',
      category: '超自然',
      rating: 9.0,
      year: 2023,
      description: '虎杖悠仁与咒灵的战斗继续。',
      poster: 'https://img.alicdn.com/imgextra/i3/O1CN01YjQKjC1Ks8zNjp3wZ_!!6000000001218-0-tps-300-400.jpg',
      tags: ['超自然', '战斗', '日本'],
      hotScore: 90,
      trending: true,
      episodes: 23
    },
    {
      id: 'anime_4',
      title: '间谍过家家',
      type: '动漫',
      category: '喜剧',
      rating: 8.8,
      year: 2023,
      description: '间谍、杀手和超能力者组成的伪装家庭。',
      poster: 'https://img.alicdn.com/imgextra/i4/O1CN01YjQKjC1Ks8zNjp3wa_!!6000000001218-0-tps-300-400.jpg',
      tags: ['喜剧', '日常', '温馨'],
      hotScore: 88,
      trending: false,
      episodes: 25
    }
  ],
  novels: [
    {
      id: 'novel_1',
      title: '三体',
      type: '小说',
      category: '科幻',
      rating: 9.5,
      year: 2006,
      description: '刘慈欣的科幻巨作，探讨文明与宇宙的终极问题。',
      author: '刘慈欣',
      tags: ['科幻', '硬科幻', '获奖'],
      hotScore: 95,
      trending: true,
      status: '完结'
    },
    {
      id: 'novel_2',
      title: '庆余年',
      type: '小说',
      category: '穿越',
      rating: 8.9,
      year: 2007,
      description: '现代青年穿越到古代的权谋故事。',
      author: '猫腻',
      tags: ['穿越', '权谋', '古代'],
      hotScore: 89,
      trending: true,
      status: '完结'
    },
    {
      id: 'novel_3',
      title: '斗破苍穹',
      type: '小说',
      category: '玄幻',
      rating: 8.5,
      year: 2009,
      description: '萧炎的修炼逆袭之路。',
      author: '天蚕土豆',
      tags: ['玄幻', '修炼', '热血'],
      hotScore: 85,
      trending: false,
      status: '完结'
    },
    {
      id: 'novel_4',
      title: '诡秘之主',
      type: '小说',
      category: '克苏鲁',
      rating: 9.2,
      year: 2018,
      description: '蒸汽与机械的时代，神秘学的世界。',
      author: '爱潜水的乌贼',
      tags: ['克苏鲁', '神秘', '蒸汽朋克'],
      hotScore: 92,
      trending: true,
      status: '完结'
    }
  ]
}

// 热搜关键词
const HOT_KEYWORDS = [
  { keyword: '流浪地球2', count: 15420, trend: 'up' },
  { keyword: '狂飙', count: 12890, trend: 'up' },
  { keyword: '三体', count: 11560, trend: 'stable' },
  { keyword: '鬼灭之刃', count: 9870, trend: 'up' },
  { keyword: '庆余年2', count: 8940, trend: 'up' },
  { keyword: '满江红', count: 7650, trend: 'down' },
  { keyword: '漫长的季节', count: 6780, trend: 'stable' },
  { keyword: '咒术回战', count: 5890, trend: 'up' },
  { keyword: '间谍过家家', count: 4560, trend: 'stable' },
  { keyword: '诡秘之主', count: 3890, trend: 'up' }
]

/**
 * 获取所有推荐内容
 */
export const getAllRecommendations = () => {
  return HOT_RECOMMENDATIONS
}

/**
 * 根据类型获取推荐内容
 */
export const getRecommendationsByType = (type) => {
  return HOT_RECOMMENDATIONS[type] || []
}

/**
 * 获取热门推荐（综合所有类型）
 */
export const getHotRecommendations = (limit = 12) => {
  const allItems = [
    ...HOT_RECOMMENDATIONS.movies,
    ...HOT_RECOMMENDATIONS.tvShows,
    ...HOT_RECOMMENDATIONS.anime,
    ...HOT_RECOMMENDATIONS.novels
  ]
  
  return allItems
    .sort((a, b) => b.hotScore - a.hotScore)
    .slice(0, limit)
}

/**
 * 获取趋势推荐（正在热播/热门）
 */
export const getTrendingRecommendations = (limit = 8) => {
  const allItems = [
    ...HOT_RECOMMENDATIONS.movies,
    ...HOT_RECOMMENDATIONS.tvShows,
    ...HOT_RECOMMENDATIONS.anime,
    ...HOT_RECOMMENDATIONS.novels
  ]
  
  return allItems
    .filter(item => item.trending)
    .sort((a, b) => b.hotScore - a.hotScore)
    .slice(0, limit)
}

/**
 * 根据分类获取推荐
 */
export const getRecommendationsByCategory = (category, limit = 6) => {
  const allItems = [
    ...HOT_RECOMMENDATIONS.movies,
    ...HOT_RECOMMENDATIONS.tvShows,
    ...HOT_RECOMMENDATIONS.anime,
    ...HOT_RECOMMENDATIONS.novels
  ]
  
  return allItems
    .filter(item => item.category === category)
    .sort((a, b) => b.hotScore - a.hotScore)
    .slice(0, limit)
}

/**
 * 根据标签获取推荐
 */
export const getRecommendationsByTag = (tag, limit = 6) => {
  const allItems = [
    ...HOT_RECOMMENDATIONS.movies,
    ...HOT_RECOMMENDATIONS.tvShows,
    ...HOT_RECOMMENDATIONS.anime,
    ...HOT_RECOMMENDATIONS.novels
  ]
  
  return allItems
    .filter(item => item.tags.includes(tag))
    .sort((a, b) => b.hotScore - a.hotScore)
    .slice(0, limit)
}

/**
 * 搜索推荐内容
 */
export const searchRecommendations = (keyword) => {
  const lowerKeyword = keyword.toLowerCase()
  const allItems = [
    ...HOT_RECOMMENDATIONS.movies,
    ...HOT_RECOMMENDATIONS.tvShows,
    ...HOT_RECOMMENDATIONS.anime,
    ...HOT_RECOMMENDATIONS.novels
  ]
  
  return allItems
    .filter(item => {
      return (
        item.title.toLowerCase().includes(lowerKeyword) ||
        item.description.toLowerCase().includes(lowerKeyword) ||
        item.tags.some(tag => tag.toLowerCase().includes(lowerKeyword)) ||
        (item.author && item.author.toLowerCase().includes(lowerKeyword))
      )
    })
    .sort((a, b) => b.hotScore - a.hotScore)
}

/**
 * 获取所有热搜关键词
 */
export const getAllKeywords = () => {
  return HOT_KEYWORDS.sort((a, b) => b.count - a.count)
}

/**
 * 获取热搜关键词
 */
export const getHotKeywords = (limit = 10) => {
  return HOT_KEYWORDS
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}

/**
 * 获取上升趋势的关键词
 */
export const getTrendingUpKeywords = (limit = 5) => {
  return HOT_KEYWORDS
    .filter(item => item.trend === 'up')
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}

/**
 * 基于用户观看历史的个性化推荐
 */
export const getPersonalizedRecommendations = (watchHistory = [], limit = 8) => {
  // 分析用户偏好
  const preferences = analyzeUserPreferences(watchHistory)
  
  const allItems = [
    ...HOT_RECOMMENDATIONS.movies,
    ...HOT_RECOMMENDATIONS.tvShows,
    ...HOT_RECOMMENDATIONS.anime,
    ...HOT_RECOMMENDATIONS.novels
  ]
  
  // 根据偏好计算推荐分数
  const scoredItems = allItems.map(item => {
    let score = item.hotScore
    
    // 类型偏好加分
    if (preferences.types[item.type]) {
      score += preferences.types[item.type] * 10
    }
    
    // 分类偏好加分
    if (preferences.categories[item.category]) {
      score += preferences.categories[item.category] * 15
    }
    
    // 标签偏好加分
    item.tags.forEach(tag => {
      if (preferences.tags[tag]) {
        score += preferences.tags[tag] * 5
      }
    })
    
    return { ...item, recommendScore: score }
  })
  
  return scoredItems
    .sort((a, b) => b.recommendScore - a.recommendScore)
    .slice(0, limit)
}

/**
 * 分析用户偏好
 */
const analyzeUserPreferences = (watchHistory) => {
  const preferences = {
    types: {},
    categories: {},
    tags: {}
  }
  
  // 这里可以根据实际的观看历史数据进行分析
  // 目前返回默认偏好
  return {
    types: { '电视剧': 3, '动漫': 2, '电影': 2, '小说': 1 },
    categories: { '科幻': 3, '悬疑': 2, '热血': 2, '剧情': 1 },
    tags: { '国产': 2, '日本': 1, '热血': 2, '科幻': 3 }
  }
}

/**
 * 获取推荐统计信息
 */
export const getRecommendationStats = () => {
  const allItems = [
    ...HOT_RECOMMENDATIONS.movies,
    ...HOT_RECOMMENDATIONS.tvShows,
    ...HOT_RECOMMENDATIONS.anime,
    ...HOT_RECOMMENDATIONS.novels
  ]
  
  // 按类型统计
  const typeStats = {}
  Object.keys(HOT_RECOMMENDATIONS).forEach(type => {
    typeStats[type] = HOT_RECOMMENDATIONS[type].length
  })
  
  // 按分类统计
  const categoryStats = {}
  allItems.forEach(item => {
    categoryStats[item.category] = (categoryStats[item.category] || 0) + 1
  })
  
  // 趋势统计
  const trendingCount = allItems.filter(item => item.trending).length
  const averageRating = allItems.reduce((sum, item) => sum + item.rating, 0) / allItems.length
  
  return {
    total: allItems.length,
    byType: typeStats,
    byCategory: categoryStats,
    trending: trendingCount,
    averageRating: Math.round(averageRating * 10) / 10,
    hotKeywords: HOT_KEYWORDS.length
  }
}

/**
 * 获取随机推荐
 */
export const getRandomRecommendations = (limit = 6) => {
  const allItems = [
    ...HOT_RECOMMENDATIONS.movies,
    ...HOT_RECOMMENDATIONS.tvShows,
    ...HOT_RECOMMENDATIONS.anime,
    ...HOT_RECOMMENDATIONS.novels
  ]
  
  // 随机打乱数组
  const shuffled = allItems.sort(() => 0.5 - Math.random())
  return shuffled.slice(0, limit)
}

// 默认导出服务对象
export default {
  getAllRecommendations,
  getRecommendationsByType,
  getHotRecommendations,
  getTrendingRecommendations,
  getRecommendationsByCategory,
  getRecommendationsByTag,
  searchRecommendations,
  getAllKeywords,
  getHotKeywords,
  getTrendingUpKeywords,
  getPersonalizedRecommendations,
  getRecommendationStats,
  getRandomRecommendations
}