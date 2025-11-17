import { NextResponse } from 'next/server'
import { telegramSecurity } from './security.js'
import { telegramOptimization } from './telegramOptimization.js'
import { requestFilter } from './requestFilter.js'
import { ipRateLimitMiddleware } from './ipRateLimit.js'

/**
 * 中间件链执行器 - 优化后的职责分工
 * 执行顺序：恶意请求过滤 → IP限流 → 安全头设置 → Telegram优化
 * 注意：真正的Telegram环境检测在客户端TelegramProvider中进行
 * @param {Request} request - Next.js 请求对象
 * @returns {NextResponse} - 最终响应
 */
export async function runMiddlewares(request) {
  // 🚫 阶段1：恶意请求过滤（最高优先级，可能直接阻止请求）
  const filterResult = requestFilter(request)
  if (filterResult) {
    return filterResult
  }
  
  // 🛡️ 阶段2：IP限流检查（防爬虫，防资源消耗）
  const rateLimitResult = await ipRateLimitMiddleware(request)
  if (rateLimitResult) {
    return rateLimitResult
  }
  
  // 🔒 阶段3：设置安全头（只设置HTTP头，不阻止请求）
  const securityResult = telegramSecurity(request)
  
  // 🚀 阶段4：Telegram Mini App 优化（最后执行，可能修改响应头）
  const optimizationResult = telegramOptimization(request)
  if (optimizationResult) {
    // 如果有优化结果，合并安全头
    if (securityResult) {
      // 复制安全头到优化结果
      securityResult.headers.forEach((value, key) => {
        optimizationResult.headers.set(key, value)
      })
    }
    return optimizationResult
  }
  
  // ✅ 返回安全头设置的响应，或默认响应
  return securityResult || NextResponse.next()
}

/**
 * 开发模式中间件 - 简化版本
 * 开发环境跳过大部分安全检查，只保留基本过滤
 */
export function runDevelopmentMiddlewares(request) {
  // 开发环境只执行基本的请求过滤和优化
  const filterResult = requestFilter(request)
  if (filterResult) {
    return filterResult
  }
  
  const optimizationResult = telegramOptimization(request)
  if (optimizationResult) {
    return optimizationResult
  }
  
  return NextResponse.next()
}

/**
 * 智能中间件选择器
 * 根据环境自动选择合适的中间件链
 * ⚠️ 注意：runMiddlewares 是异步的，需要返回Promise
 */
export function smartMiddlewares(request) {
  if (process.env.NODE_ENV === 'development') {
    return runDevelopmentMiddlewares(request)
  } else {
    return runMiddlewares(request)
  }
}

// 导出所有中间件模块
export { telegramSecurity } from './security.js'
export { telegramOptimization } from './telegramOptimization.js'
export { requestFilter } from './requestFilter.js'
export { ipRateLimitMiddleware } from './ipRateLimit.js'
