/**
 * 频道数据缓存模块
 * 封装频道列表、搜索结果、点赞状态的缓存逻辑
 * 
 * 缓存策略（二级缓存）：
 * 1. 内存缓存（30秒）- 热数据快速访问
 * 2. Redis缓存（5-10分钟）- 持久化缓存
 * 3. 数据库 - 源数据
 */

import { getCache, setCache, deleteCache, getRedis } from '../db/redis.js'
import { getMemCache, setMemCache, deleteMemCache, clearMemCache } from './memoryCache.js'

// ==================== 缓存键前缀 ====================
const CACHE_PREFIX = {
  CHANNELS: 'nav:channels',      // 频道列表
  SEARCH: 'nav:search',          // 搜索结果
  LIKE_STATUS: 'nav:like',       // 点赞状态
}

// ==================== 缓存 TTL（秒）====================
const CACHE_TTL = {
  CHANNELS: 300,      // 频道列表：5分钟（优化：从60秒提升，数据变化不频繁）
  SEARCH: 600,        // 搜索结果：10分钟（优化：从5分钟提升）
  LIKE_STATUS: 300,   // 点赞状态：5分钟
}

// ==================== 频道列表缓存 ====================

/**
 * 生成频道列表缓存键
 * @param {Object} params - 查询参数 { sortBy, page, pageSize }
 * @returns {string} 缓存键
 */
function getChannelsListKey({ sortBy = 'weight.value', page = 1, pageSize = 20 }) {
  return `${CACHE_PREFIX.CHANNELS}:${sortBy}:${page}:${pageSize}`
}

/**
 * 获取频道列表缓存（二级缓存）
 * 优先从内存读取，未命中则从Redis读取
 */
export async function getCachedChannels(params) {
  const key = getChannelsListKey(params)
  
  // 1. 先尝试内存缓存（30秒，超快）
  const memData = getMemCache(key)
  if (memData) {
    return memData
  }
  
  // 2. 内存未命中，尝试Redis缓存（5分钟）
  const redisData = await getCache(key)
  if (redisData) {
    // 回写到内存缓存，下次更快
    setMemCache(key, redisData)
    return redisData
  }
  
  return null
}

/**
 * 设置频道列表缓存（同时写入内存和Redis）
 */
export async function setCachedChannels(params, data) {
  const key = getChannelsListKey(params)
  
  // 同时写入内存和Redis
  setMemCache(key, data)
  await setCache(key, data, CACHE_TTL.CHANNELS)
}

/**
 * 清除所有频道列表缓存（同时清除内存和Redis）
 * 用于：点赞、权重变化、管理员操作后
 */
export async function clearAllChannelsCache() {
  // 1. 清除内存缓存
  clearMemCache()
  
  // 2. 清除Redis缓存
  const redis = getRedis()
  if (!redis) return
  
  try {
    const keys = await redis.keys(`${CACHE_PREFIX.CHANNELS}:*`)
    if (keys.length > 0) {
      await redis.del(...keys)
      console.log(`🗑️  已清除 ${keys.length} 个频道列表缓存（内存+Redis）`)
    }
  } catch (error) {
    console.error('清除频道缓存失败:', error)
  }
}

// ==================== 搜索结果缓存 ====================

/**
 * 生成搜索结果缓存键
 * @param {Object} params - { keyword, page, pageSize }
 */
function getSearchKey({ keyword, page = 1, pageSize = 20 }) {
  return `${CACHE_PREFIX.SEARCH}:${keyword.toLowerCase()}:${page}:${pageSize}`
}

/**
 * 获取搜索结果缓存（二级缓存）
 */
export async function getCachedSearch(params) {
  const key = getSearchKey(params)
  
  // 1. 先尝试内存缓存
  const memData = getMemCache(key)
  if (memData) {
    return memData
  }
  
  // 2. 尝试Redis缓存
  const redisData = await getCache(key)
  if (redisData) {
    setMemCache(key, redisData)
    return redisData
  }
  
  return null
}

/**
 * 设置搜索结果缓存（同时写入内存和Redis）
 */
export async function setCachedSearch(params, data) {
  const key = getSearchKey(params)
  
  setMemCache(key, data)
  await setCache(key, data, CACHE_TTL.SEARCH)
}

/**
 * 清除某个关键词的搜索缓存
 */
export async function clearSearchCache(keyword) {
  const redis = getRedis()
  if (!redis) return
  
  try {
    const keys = await redis.keys(`${CACHE_PREFIX.SEARCH}:${keyword.toLowerCase()}:*`)
    if (keys.length > 0) {
      await redis.del(...keys)
    }
  } catch (error) {
    console.error('清除搜索缓存失败:', error)
  }
}

// ==================== 点赞状态缓存 ====================

/**
 * 生成点赞状态缓存键
 * @param {string} username - 频道用户名
 * @param {string} fingerprint - 设备指纹
 */
function getLikeStatusKey(username, fingerprint) {
  return `${CACHE_PREFIX.LIKE_STATUS}:${username}:${fingerprint}`
}

/**
 * 获取点赞状态缓存
 */
export async function getCachedLikeStatus(username, fingerprint) {
  const key = getLikeStatusKey(username, fingerprint)
  return await getCache(key)
}

/**
 * 设置点赞状态缓存
 */
export async function setCachedLikeStatus(username, fingerprint, data) {
  const key = getLikeStatusKey(username, fingerprint)
  await setCache(key, data, CACHE_TTL.LIKE_STATUS)
}

/**
 * 清除某个频道的所有点赞状态缓存
 */
export async function clearLikeStatusCache(username) {
  const redis = getRedis()
  if (!redis) return
  
  try {
    const keys = await redis.keys(`${CACHE_PREFIX.LIKE_STATUS}:${username}:*`)
    if (keys.length > 0) {
      await redis.del(...keys)
    }
  } catch (error) {
    console.error('清除点赞缓存失败:', error)
  }
}

/**
 * 清除特定用户的点赞状态缓存
 */
export async function clearUserLikeCache(username, fingerprint) {
  const key = getLikeStatusKey(username, fingerprint)
  await deleteCache(key)
}

// ==================== 综合清理 ====================

/**
 * 清除所有缓存（慎用）
 */
export async function clearAllCache() {
  const redis = getRedis()
  if (!redis) return
  
  try {
    const keys = await redis.keys('nav:*')
    if (keys.length > 0) {
      await redis.del(...keys)
      console.log(`🗑️  已清除所有导航缓存 (${keys.length} 个)`)
    }
  } catch (error) {
    console.error('清除所有缓存失败:', error)
  }
}

