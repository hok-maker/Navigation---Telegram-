/**
 * 限流模块 - 防止恶意刷接口
 * 基于Redis实现的滑动窗口限流
 */

import { getRedis } from '../db/redis.js'

/**
 * 检查操作频率限制
 * @param {string} key - 限制键（如：like:fingerprint）
 * @param {number} maxRequests - 时间窗口内最大请求数
 * @param {number} windowSeconds - 时间窗口（秒）
 * @returns {Promise<boolean>} true=允许访问，false=超过限制
 */
export async function checkRateLimit(key, maxRequests, windowSeconds) {
  const redis = getRedis()
  
  // Redis不可用时放行（降级策略）
  if (!redis) {
    return true
  }
  
  try {
    const fullKey = `ratelimit:${key}`
    
    // 增加计数
    const current = await redis.incr(fullKey)
    
    // 如果是第一次访问，设置过期时间
    if (current === 1) {
      await redis.expire(fullKey, windowSeconds)
    }
    
    // 判断是否超过限制
    return current <= maxRequests
  } catch (error) {
    console.error('限流检查失败:', error)
    return true // 出错时放行
  }
}

/**
 * 点赞操作限流
 * 限制：1分钟内最多20次点赞操作
 * @param {string} fingerprint - 设备指纹
 */
export async function checkLikeRateLimit(fingerprint) {
  return await checkRateLimit(
    `like:${fingerprint}`,
    20,  // 20次
    60   // 1分钟
  )
}

/**
 * 搜索操作限流
 * 限制：1分钟内最多30次搜索
 * @param {string} fingerprint - 设备指纹
 */
export async function checkSearchRateLimit(fingerprint) {
  return await checkRateLimit(
    `search:${fingerprint}`,
    30,  // 30次
    60   // 1分钟
  )
}

/**
 * 管理员操作限流
 * 限制：1分钟内最多50次管理操作（更宽松）
 * @param {string} identifier - 管理员标识
 */
export async function checkAdminRateLimit(identifier) {
  return await checkRateLimit(
    `admin:${identifier}`,
    50,  // 50次
    60   // 1分钟
  )
}

/**
 * 获取剩余配额
 * @param {string} key - 限制键
 * @param {number} maxRequests - 最大请求数
 * @returns {Promise<number>} 剩余配额（-1表示无法获取）
 */
export async function getRemainingQuota(key, maxRequests) {
  const redis = getRedis()
  if (!redis) return -1
  
  try {
    const fullKey = `ratelimit:${key}`
    const current = await redis.get(fullKey)
    
    if (!current) {
      return maxRequests
    }
    
    const remaining = maxRequests - parseInt(current)
    return Math.max(0, remaining)
  } catch (error) {
    return -1
  }
}

// ==================== IP限流（防爬虫）====================

/**
 * 全局IP限流
 * 限制：每IP每分钟最多60次请求（任何路径）
 * @param {string} ip - IP地址
 * @returns {Promise<boolean>} true=允许访问，false=超过限制
 */
export async function checkGlobalIPRateLimit(ip) {
  return await checkRateLimit(
    `ip:global:${ip}`,
    60,  // 60次请求
    60   // 1分钟
  )
}

/**
 * 页面访问限流（防止快速翻页爬取数据）
 * 限制：每IP每分钟最多访问10页
 * @param {string} ip - IP地址
 * @returns {Promise<boolean>} true=允许访问，false=超过限制
 */
export async function checkPageAccessRateLimit(ip) {
  return await checkRateLimit(
    `ip:page:${ip}`,
    10,  // 10页
    60   // 1分钟
  )
}

/**
 * API接口限流（防止批量下载资源）
 * 限制：每IP每小时最多100次API调用
 * @param {string} ip - IP地址
 * @param {string} endpoint - API端点（如：avatar）
 * @returns {Promise<boolean>} true=允许访问，false=超过限制
 */
export async function checkAPIRateLimit(ip, endpoint = 'api') {
  return await checkRateLimit(
    `ip:api:${endpoint}:${ip}`,
    100,    // 100次
    3600    // 1小时
  )
}

/**
 * 从请求中提取真实IP地址
 * 考虑代理、CDN等情况
 * @param {Request} request - Next.js请求对象
 * @returns {string} IP地址
 */
export function getClientIP(request) {
  // 1. 检查 X-Forwarded-For（常见代理头）
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    // 可能是逗号分隔的IP列表，取第一个
    return forwarded.split(',')[0].trim()
  }
  
  // 2. 检查 X-Real-IP（Nginx常用）
  const realIP = request.headers.get('x-real-ip')
  if (realIP) {
    return realIP.trim()
  }
  
  // 3. 检查 CF-Connecting-IP（Cloudflare）
  const cfIP = request.headers.get('cf-connecting-ip')
  if (cfIP) {
    return cfIP.trim()
  }
  
  // 4. 检查 X-Client-IP
  const clientIP = request.headers.get('x-client-ip')
  if (clientIP) {
    return clientIP.trim()
  }
  
  // 5. 回退到连接IP（可能不准确）
  return request.headers.get('x-forwarded-for') || 
         request.ip || 
         'unknown'
}

