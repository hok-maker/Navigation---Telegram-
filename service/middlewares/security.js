import { NextResponse } from 'next/server'

/**
 * 基础安全头设置中间件
 * 注意：真正的Telegram环境检测在客户端TelegramProvider中进行
 * 恶意请求过滤在requestFilter中进行，这里只设置基础安全头
 * @param {Request} request - Next.js 请求对象
 * @returns {NextResponse|null} - 返回带安全头的响应或null继续执行
 */
export function telegramSecurity(request) {
  // 开发环境跳过安全头设置
  if (process.env.NODE_ENV !== 'production') {
    return null
  }
  
  // 只设置基础安全头，不做重定向（重定向由requestFilter和TelegramProvider处理）
  const response = NextResponse.next()
  
  // 设置基础安全头
  response.headers.set('X-Frame-Options', 'SAMEORIGIN')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // 允许 Telegram 和 Adsterra 广告的 CSP
  // ⚠️ 对 Adsterra 使用宽松策略：允许所有 HTTPS 连接（广告网络通常使用多个域名）
  response.headers.set(
    'Content-Security-Policy', 
    "default-src 'self'; script-src 'self' 'unsafe-inline' https://telegram.org https://static.cloudflareinsights.com https://pl28074035.effectivegatecpm.com https://*.effectivegatecpm.com; connect-src 'self' https: wss:; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; frame-src 'self' https://*.effectivegatecpm.com;"
  )
  
  return response
}

// 注意：原来的恶意请求检测已移至 requestFilter.js 避免重复
