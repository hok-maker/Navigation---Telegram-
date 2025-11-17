import { NextResponse } from 'next/server'

/**
 * Telegram Mini App + Cloudflare Tunnel 优化中间件
 * 基于旧server.js中的telegramMiniAppMiddleware实现
 * @param {Request} request - Next.js 请求对象
 * @returns {NextResponse|null} - 返回修改后的响应或null继续执行
 */
export function telegramOptimization(request) {
  const url = new URL(request.url)
  
  // 创建响应对象
  const response = NextResponse.next()
  
  // 🎯 1. CORS 响应头 - 专门为 Telegram Mini App 优化
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  
  // 🛡️ 2. 安全响应头 - Telegram 要求
  response.headers.set('X-Frame-Options', 'ALLOWALL') // 允许在 iframe 中显示
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // ☁️ 3. Cloudflare Tunnel 优化 - 防止缓存问题
  if (isHtmlPage(url.pathname)) {
    // HTML 页面：不缓存，确保总是最新
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    response.headers.set('Last-Modified', new Date().toUTCString())
  } else if (isStaticAsset(url.pathname)) {
    // 静态资源：允许短期缓存，但确保能及时更新
    response.headers.set('Cache-Control', 'public, max-age=300, must-revalidate') // 5分钟缓存
    response.headers.set('Vary', 'Accept-Encoding')
  }
  
  // 📱 4. Mini App 专用头 - 防止白屏
  response.headers.set('X-UA-Compatible', 'IE=edge')
  
  // ☁️ 5. Cloudflare 缓存控制
  response.headers.set('CF-Cache-Status', 'BYPASS')
  response.headers.set('CF-No-Cache', '1')
  
  // 📊 6. 添加自定义调试头
  response.headers.set('X-Telegram-Optimized', 'true')
  response.headers.set('X-Next-Middleware', 'telegram-optimization')
  
  // 🔄 7. 处理 OPTIONS 预检请求
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: response.headers
    })
  }
  
  return response
}

/**
 * 检查是否为HTML页面
 * @param {string} pathname 
 * @returns {boolean}
 */
function isHtmlPage(pathname) {
  // 根路径或没有扩展名的路径通常是HTML页面
  return pathname === '/' || 
         pathname.endsWith('.html') || 
         (!pathname.includes('.') && !pathname.startsWith('/api/') && !pathname.startsWith('/_next/'))
}

/**
 * 检查是否为静态资源
 * @param {string} pathname 
 * @returns {boolean}
 */
function isStaticAsset(pathname) {
  const staticExtensions = [
    '.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg',
    '.woff', '.woff2', '.ttf', '.eot', '.webp', '.avif', '.mp4', '.webm'
  ]
  
  return staticExtensions.some(ext => pathname.endsWith(ext)) ||
         pathname.startsWith('/_next/static/') ||
         pathname.startsWith('/favicon.ico')
}
