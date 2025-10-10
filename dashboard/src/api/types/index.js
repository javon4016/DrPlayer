/**
 * API类型定义
 * 定义接口相关的数据结构、枚举和常量
 */

// 视频类型枚举
export const VIDEO_TYPES = {
  MOVIE: 'movie',           // 电影
  TV: 'tv',                // 电视剧
  VARIETY: 'variety',       // 综艺
  CARTOON: 'cartoon',       // 动漫
  CHILD: 'child',          // 少儿
  DOCUMENTARY: 'doco',      // 纪录片
  CHOICE: 'choice'         // 精选
}

// 视频状态枚举
export const VIDEO_STATUS = {
  NORMAL: 'normal',         // 正常
  UPDATING: 'updating',     // 更新中
  COMPLETED: 'completed',   // 已完结
  PREVIEW: 'preview'        // 预告
}

// 排序方式枚举
export const SORT_TYPES = {
  TIME: 'time',            // 按时间排序
  NAME: 'name',            // 按名称排序
  HITS: 'hits',            // 按点击量排序
  SCORE: 'score'           // 按评分排序
}

// 排序顺序枚举
export const SORT_ORDER = {
  ASC: 'asc',              // 升序
  DESC: 'desc'             // 降序
}

// 地区枚举
export const REGIONS = {
  MAINLAND: 'mainland',     // 大陆
  HONGKONG: 'hongkong',    // 香港
  TAIWAN: 'taiwan',        // 台湾
  KOREA: 'korea',          // 韩国
  JAPAN: 'japan',          // 日本
  USA: 'usa',              // 美国
  UK: 'uk',                // 英国
  FRANCE: 'france',        // 法国
  GERMANY: 'germany',      // 德国
  OTHER: 'other'           // 其他
}

// 年份范围
export const YEAR_RANGES = {
  RECENT: '2020-2024',     // 近期
  CLASSIC: '2010-2019',    // 经典
  OLD: '2000-2009',        // 怀旧
  ANCIENT: '1990-1999'     // 古典
}

// 请求状态枚举
export const REQUEST_STATUS = {
  IDLE: 'idle',            // 空闲
  LOADING: 'loading',      // 加载中
  SUCCESS: 'success',      // 成功
  ERROR: 'error'           // 错误
}

// 缓存策略枚举
export const CACHE_STRATEGY = {
  NO_CACHE: 'no-cache',           // 不缓存
  CACHE_FIRST: 'cache-first',     // 缓存优先
  NETWORK_FIRST: 'network-first', // 网络优先
  CACHE_ONLY: 'cache-only'        // 仅缓存
}

/**
 * 视频信息数据结构
 */
export const createVideoInfo = () => ({
  vod_id: '',              // 视频ID
  vod_name: '',            // 视频名称
  vod_pic: '',             // 视频封面
  vod_remarks: '',         // 视频备注
  vod_content: '',         // 视频简介
  vod_play_from: '',       // 播放来源
  vod_play_url: '',        // 播放地址
  vod_time: '',            // 更新时间
  vod_year: '',            // 年份
  vod_area: '',            // 地区
  vod_lang: '',            // 语言
  vod_actor: '',           // 演员
  vod_director: '',        // 导演
  vod_writer: '',          // 编剧
  vod_blurb: '',           // 简介
  vod_class: '',           // 分类
  vod_tag: '',             // 标签
  vod_score: '',           // 评分
  vod_hits: 0,             // 点击量
  vod_duration: '',        // 时长
  vod_total: 0,            // 总集数
  vod_serial: 0,           // 当前集数
  vod_tv: '',              // 电视台
  vod_weekday: '',         // 播出时间
  vod_status: VIDEO_STATUS.NORMAL
})

/**
 * 分类信息数据结构
 */
export const createCategoryInfo = () => ({
  type_id: '',             // 分类ID
  type_name: '',           // 分类名称
  type_sort: 0,            // 排序
  type_status: 1           // 状态
})

/**
 * 筛选条件数据结构
 */
export const createFilterInfo = () => ({
  type: '',                // 类型
  area: '',                // 地区
  year: '',                // 年份
  lang: '',                // 语言
  sort: SORT_TYPES.TIME,   // 排序方式
  order: SORT_ORDER.DESC   // 排序顺序
})

/**
 * 分页信息数据结构
 */
export const createPaginationInfo = () => ({
  page: 1,                 // 当前页码
  pageSize: 20,            // 每页数量
  total: 0,                // 总数量
  totalPages: 0,           // 总页数
  hasNext: false,          // 是否有下一页
  hasPrev: false           // 是否有上一页
})

/**
 * 搜索参数数据结构
 */
export const createSearchParams = () => ({
  keyword: '',             // 搜索关键词
  type: '',                // 搜索类型
  page: 1,                 // 页码
  pageSize: 20,            // 每页数量
  filters: createFilterInfo() // 筛选条件
})

/**
 * API响应数据结构
 */
export const createApiResponse = () => ({
  code: 200,               // 状态码
  msg: '',                 // 消息
  data: null,              // 数据
  timestamp: Date.now()    // 时间戳
})

/**
 * 播放信息数据结构
 */
export const createPlayInfo = () => ({
  url: '',                 // 播放地址
  type: '',                // 播放类型
  headers: {},             // 请求头
  parse: false,            // 是否需要解析
  jx: ''                   // 解析器
})

/**
 * 站点信息数据结构
 */
export const createSiteInfo = () => ({
  key: '',                 // 站点标识
  name: '',                // 站点名称
  type: 0,                 // 站点类型
  api: '',                 // API地址
  searchable: 1,           // 是否可搜索
  quickSearch: 1,          // 是否支持快速搜索
  filterable: 1,           // 是否可筛选
  order: 0,                // 排序
  ext: '',                 // 扩展参数
  more: null               // 额外配置信息（包含actions等）
})

/**
 * 错误信息数据结构
 */
export const createErrorInfo = () => ({
  code: '',                // 错误码
  message: '',             // 错误信息
  details: null,           // 错误详情
  timestamp: Date.now()    // 时间戳
})

// 默认导出所有类型定义
export default {
  VIDEO_TYPES,
  VIDEO_STATUS,
  SORT_TYPES,
  SORT_ORDER,
  REGIONS,
  YEAR_RANGES,
  REQUEST_STATUS,
  CACHE_STRATEGY,
  createVideoInfo,
  createCategoryInfo,
  createFilterInfo,
  createPaginationInfo,
  createSearchParams,
  createApiResponse,
  createPlayInfo,
  createSiteInfo,
  createErrorInfo
}