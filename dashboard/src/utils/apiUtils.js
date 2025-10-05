/**
 * API相关的工具函数
 */

/**
 * 处理extend参数
 * 如果extend是对象类型，转换为JSON字符串；如果已经是字符串，直接返回
 * @param {any} extend - extend参数
 * @returns {string|undefined} 处理后的extend参数
 */
export const processExtendParam = (extend) => {
  if (!extend) {
    return undefined
  }
  
  // 如果extend是对象类型，转换为JSON字符串
  if (typeof extend === 'object' && extend !== null) {
    try {
      return JSON.stringify(extend)
    } catch (error) {
      console.warn('extend参数JSON序列化失败:', error)
      return undefined
    }
  }
  
  // 如果已经是字符串，直接返回
  return extend
}