import { NextResponse } from 'next/server'
import { getClientIP } from '@/utils/security/rateLimiter.js'

/**
 * IP限流中间件（防爬虫）
 * 
 * 限流策略：
 * 1. 全局限流：每IP每分钟最多60次请求
 * 2. 页面限流：每IP每分钟最多访问10页（频道列表、搜索）
 * 
 * ⚠️ 注意：使用动态导入避免Edge Runtime限制
 * @param {Request} request - Next.js请求对象
 * @returns {NextResponse|null} - 返回限流响应或null继续执行
 */
export async function ipRateLimitMiddleware(request) {
  // 开发环境跳过IP限流
  if (process.env.NODE_ENV !== 'production') {
    return null
  }
  
  const url = new URL(request.url)
  const pathname = url.pathname
  
  // 获取客户端IP
  const clientIP = getClientIP(request)
  
  if (clientIP === 'unknown') {
    // IP无法识别，谨慎放行（可能是本地开发或特殊情况）
    return null
  }
  
  // ⭐ 动态导入限流函数（避免Edge Runtime问题）
  const { checkGlobalIPRateLimit, checkPageAccessRateLimit } = await import('@/utils/security/rateLimiter.js')
  
  // 1️⃣ 全局IP限流（所有路径）
  const globalAllowed = await checkGlobalIPRateLimit(clientIP)
  if (!globalAllowed) {
    console.log(`⛔ IP全局限流: ${clientIP} (60次/分钟)`)
    return new NextResponse(
      JSON.stringify({ 
        success: false,
        message: '请求过于频繁，请稍后再试',
        code: 'RATE_LIMIT_GLOBAL'
      }), 
      { 
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': '60'
        }
      }
    )
  }
  
  // 2️⃣ 页面访问限流（频道列表、搜索页面）
  const isPageAccess = 
    pathname.includes('/01-telegram-home') ||
    pathname.includes('/02-channel-share')
  
  if (isPageAccess) {
    const pageAllowed = await checkPageAccessRateLimit(clientIP)
    if (!pageAllowed) {
      console.log(`⛔ IP页面限流: ${clientIP} (10页/分钟)`)
      return new NextResponse(
        JSON.stringify({ 
          success: false,
          message: '翻页过快，请稍后再试',
          code: 'RATE_LIMIT_PAGE'
        }), 
        { 
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '60'
          }
        }
      )
    }
  }
  
  // ✅ 通过所有限流检查
  return null
}

