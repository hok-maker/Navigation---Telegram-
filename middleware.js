import { smartMiddlewares } from '@/service/middlewares/index.js'

/**
 * Next.js 主中间件 - 智能调度器
 * 基于旧server.js的中间件逻辑重新实现
 * 自动根据环境选择合适的中间件链
 * 
 * ⭐ 使用 Node.js Runtime（需要Redis支持）
 */
export function middleware(request) {
  return smartMiddlewares(request)   // 智能选择中间件链
}

// 配置中间件匹配的路径和运行时
export const config = {
  // ⭐ 指定使用 Node.js Runtime（而不是Edge Runtime）
  // 因为我们的IP限流需要使用ioredis（Node.js API）
  runtime: 'nodejs',
  
  // 匹配所有路径，除了 API 路由、静态文件等
  matcher: [
    /*
     * 匹配所有请求路径，除了：
     * - api (API 路由)
     * - _next/static (静态文件)
     * - _next/image (图片优化)
     * - favicon.ico (图标)
     * - 其他静态资源
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
