# Next.js 中间件系统

基于旧server.js的中间件逻辑重新实现，专门针对Telegram Mini App优化。

## 🏗️ **中间件架构**

```
middleware.js (主入口)
    ↓
smartMiddlewares() (智能选择器)
    ↓
runMiddlewares() / runDevelopmentMiddlewares()
    ↓
三阶段执行：安全检查 → 请求过滤 → Telegram优化
```

## 🔧 **中间件列表**

### **1. telegramSecurity.js - Telegram安全检查**
- **功能**: 基础恶意UA检测
- **生产环境**: 过滤恶意爬虫，重定向到Google
- **开发环境**: 跳过检查

### **2. requestFilter.js - 恶意请求过滤**
基于旧server.js的请求过滤逻辑：
- 过滤PHP文件请求 (`.php`, `wp-admin`等)
- 过滤恶意路径 (`.asp`, `.jsp`, `phpmyadmin`等)
- 过滤恶意User-Agent (bot, crawler, scraper等)
- 过滤不支持的HTTP方法
- 过滤过长URL (>2048字符)
- 过滤恶意字符 (`<script`, `javascript:`等)

### **3. telegramOptimization.js - Telegram优化**
基于旧server.js的`telegramMiniAppMiddleware`：

#### **CORS配置**
```javascript
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With
Access-Control-Allow-Credentials: true
```

#### **安全头配置**
```javascript
X-Frame-Options: ALLOWALL          // 允许iframe嵌入
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
X-UA-Compatible: IE=edge
```

#### **Cloudflare优化**
```javascript
// HTML页面 - 不缓存
Cache-Control: no-cache, no-store, must-revalidate, max-age=0
Pragma: no-cache
Expires: 0

// 静态资源 - 短期缓存
Cache-Control: public, max-age=300, must-revalidate  // 5分钟

// Cloudflare专用头
CF-Cache-Status: BYPASS
CF-No-Cache: 1
```

## 🔄 **执行顺序**

### **生产环境**
```
1. telegramSecurity() - 基础安全检查
   ↓
2. requestFilter() - 恶意请求过滤  
   ↓
3. telegramOptimization() - 响应头优化
```

### **开发环境**
```
1. requestFilter() - 基本过滤
   ↓
2. telegramOptimization() - 响应头优化
```

## 🎯 **关键特性**

### **智能环境适配**
- **开发环境**: 跳过安全检查，便于调试
- **生产环境**: 完整安全防护

### **Telegram专用优化**
- **iframe支持**: 允许在Telegram内嵌显示
- **缓存策略**: 针对Mini App优化的缓存配置
- **Cloudflare兼容**: 专门适配Cloudflare Tunnel

### **安全防护**
- **多层过滤**: 从UA到路径到内容的全方位过滤
- **恶意请求拦截**: 自动识别和阻止攻击请求
- **资源保护**: 防止敏感文件访问

## 📊 **调试信息**

所有响应都包含调试头：
```javascript
X-Telegram-Optimized: true
X-Next-Middleware: telegram-optimization
```

## 🔧 **配置说明**

### **中间件匹配规则**
```javascript
// middleware.js
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ]
}
```

### **静态资源检测**
```javascript
// 自动识别静态资源
.js, .css, .png, .jpg, .jpeg, .gif, .ico, .svg
.woff, .woff2, .ttf, .eot, .webp, .avif
/_next/static/*, /favicon.ico
```

## ⚡ **性能优化**

1. **短路执行**: 中间件链一旦匹配立即返回
2. **环境分离**: 开发环境跳过重型检查
3. **缓存策略**: 差异化的资源缓存配置
4. **头部优化**: 最小化必要的响应头

## 🚀 **与旧版本对比**

| 功能 | 旧server.js | 新middleware |
|------|-------------|--------------|
| **恶意请求过滤** | ✅ Express中间件 | ✅ Next.js中间件 |
| **Telegram优化** | ✅ 专用中间件 | ✅ 专用中间件 |
| **Cloudflare适配** | ✅ 响应头配置 | ✅ 响应头配置 |
| **缓存策略** | ✅ 按文件类型 | ✅ 按文件类型 |
| **开发模式** | ❌ 无差异 | ✅ 智能适配 |
| **调试信息** | ❌ 有限 | ✅ 完整头部 |

**完美迁移旧版本的所有优化配置！** 🎉
