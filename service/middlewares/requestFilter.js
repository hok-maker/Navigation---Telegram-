import { NextResponse } from 'next/server'

/**
 * 恶意请求过滤中间件
 * 基于旧server.js中的请求过滤逻辑实现
 * @param {Request} request - Next.js 请求对象
 * @returns {NextResponse|null} - 返回重定向响应或null继续执行
 */
export function requestFilter(request) {
  const url = new URL(request.url)
  const pathname = url.pathname.toLowerCase()
  const userAgent = request.headers.get('user-agent')?.toLowerCase() || ''
  
  // 🚫 1. 过滤PHP文件请求（与旧版本一致）
  if (pathname.endsWith('.php') || pathname.includes('.php?')) {
    console.log('⛔ 过滤PHP请求:', pathname)
    return new NextResponse(null, { status: 404 })
  }
  
  // 🚫 2. 过滤其他常见的恶意请求（与旧版本一致）
  const maliciousPatterns = [
    '.asp', '.aspx', '.jsp', '.cgi',
    'wp-admin', 'wp-login', 'phpmyadmin',
    'admin.php', 'login.php', 'config.php',
    'wp-content', 'wp-includes', 'xmlrpc.php',
    '.env', 'backup', 'database'
  ]
  
  const isMaliciousPath = maliciousPatterns.some(pattern => 
    pathname.includes(pattern)
  )
  
  if (isMaliciousPath) {
    console.log('⛔ 过滤恶意路径请求:', pathname)
    return new NextResponse(null, { status: 404 })
  }
  
  // 🚫 3. 过滤恶意User-Agent（⭐ 修复：不误伤搜索引擎）
  
  // ✅ 白名单：合法的搜索引擎爬虫（优先检查）
  const legitimateBots = [
    'googlebot',      // Google
    'bingbot',        // Bing
    'baiduspider',    // 百度
    'yandexbot',      // Yandex
    'duckduckbot',    // DuckDuckGo
    'slurp',          // Yahoo
    'facebookexternalhit',  // Facebook
    'twitterbot',     // Twitter
    'linkedinbot',    // LinkedIn
    'telegrambot'     // Telegram
  ]
  
  // 检查是否是合法爬虫
  const isLegitimateBot = legitimateBots.some(bot => 
    userAgent.includes(bot)
  )
  
  // 如果是合法爬虫，直接放行
  if (isLegitimateBot) {
    return null
  }
  
  // ⚠️ 黑名单：恶意爬虫和工具
  const maliciousUserAgents = [
    'scrapy',         // Python爬虫框架
    'selenium',       // 自动化工具
    'phantomjs',      // 无头浏览器
    'wget',           // 下载工具
    'curl',           // 命令行工具
    'python-requests', // Python库
    'java/',          // Java爬虫
    'go-http-client', // Go爬虫
    'libwww',         // Perl库
    'masscan',        // 扫描工具
    'nmap',           // 扫描工具
    'sqlmap',         // 注入工具
    'nikto',          // 安全扫描
    'gobuster',       // 目录爆破
    'httpx'           // HTTP工具
  ]
  
  const isMaliciousUA = maliciousUserAgents.some(pattern => 
    userAgent.includes(pattern)
  )
  
  // 只在生产环境过滤恶意UA
  if (isMaliciousUA && process.env.NODE_ENV === 'production') {
    console.log('⛔ 过滤恶意UA:', userAgent.substring(0, 50))
    return NextResponse.redirect('https://www.google.com')
  }
  
  // 🚫 4. 过滤可疑的请求方法
  const allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD']
  if (!allowedMethods.includes(request.method)) {
    console.log('⛔ 过滤不支持的请求方法:', request.method)
    return new NextResponse(null, { status: 405 })
  }
  
  // 🚫 5. 过滤过长的URL（防止缓冲区溢出攻击）
  if (url.href.length > 2048) {
    console.log('⛔ 过滤过长URL:', url.href.length)
    return new NextResponse(null, { status: 414 })
  }
  
  // 🚫 6. 过滤包含恶意字符的请求
  const maliciousChars = ['<script', 'javascript:', 'data:', 'vbscript:']
  const fullUrl = decodeURIComponent(url.href)
  
  const hasMaliciousChars = maliciousChars.some(char => 
    fullUrl.toLowerCase().includes(char)
  )
  
  if (hasMaliciousChars) {
    console.log('⛔ 过滤包含恶意字符的请求')
    return new NextResponse(null, { status: 400 })
  }
  
  // ✅ 通过所有过滤检查
  return null
}
