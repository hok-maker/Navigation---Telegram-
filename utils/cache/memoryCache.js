/**
 * 二级内存缓存模块
 * 用于缓存热门数据，避免频繁访问Redis
 * 适合高频访问的数据（如首页频道列表）
 */

// 使用 Map 存储缓存数据
const cache = new Map()

// 默认TTL：30秒（比Redis缓存短，确保数据相对新鲜）
const DEFAULT_TTL = 30 * 1000 // 30秒

/**
 * 获取内存缓存
 * @param {string} key - 缓存键
 * @returns {any|null} 缓存数据或null
 */
export function getMemCache(key) {
  const item = cache.get(key)
  
  if (!item) {
    return null
  }
  
  // 检查是否过期
  if (Date.now() > item.expiry) {
    cache.delete(key)
    return null
  }
  
  return item.data
}

/**
 * 设置内存缓存
 * @param {string} key - 缓存键
 * @param {any} data - 缓存数据
 * @param {number} ttl - 过期时间（毫秒），默认30秒
 */
export function setMemCache(key, data, ttl = DEFAULT_TTL) {
  cache.set(key, {
    data,
    expiry: Date.now() + ttl
  })
}

/**
 * 删除内存缓存
 * @param {string} key - 缓存键
 */
export function deleteMemCache(key) {
  cache.delete(key)
}

/**
 * 清空所有内存缓存
 */
export function clearMemCache() {
  cache.clear()
}

/**
 * 获取缓存统计信息
 */
export function getMemCacheStats() {
  let validCount = 0
  let expiredCount = 0
  const now = Date.now()
  
  for (const item of cache.values()) {
    if (now > item.expiry) {
      expiredCount++
    } else {
      validCount++
    }
  }
  
  return {
    total: cache.size,
    valid: validCount,
    expired: expiredCount
  }
}

/**
 * 定期清理过期缓存（防止内存泄漏）
 */
function cleanupExpiredCache() {
  const now = Date.now()
  const keysToDelete = []
  
  for (const [key, item] of cache.entries()) {
    if (now > item.expiry) {
      keysToDelete.push(key)
    }
  }
  
  keysToDelete.forEach(key => cache.delete(key))
  
  if (keysToDelete.length > 0) {
    console.log(`🧹 内存缓存清理: 移除 ${keysToDelete.length} 个过期项`)
  }
}

// 每分钟清理一次过期缓存
setInterval(cleanupExpiredCache, 60 * 1000)

