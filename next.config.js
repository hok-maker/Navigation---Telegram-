/** @type {import('next').NextConfig} */
const nextConfig = {
  // 外部包配置 - 新的配置项名称
  serverExternalPackages: ['mongodb', 'ioredis'],
  
  // 🔒 安全配置：禁用 Source Maps，防止源代码暴露
  productionBrowserSourceMaps: false,
  
  // 开发时的配置
  env: {
    CUSTOM_KEY: process.env.NODE_ENV || 'development',
  },
  
  // 静态资源配置
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.t.me',
      },
      {
        protocol: 'https',
        hostname: 't.me',
      },
    ],
    domains: ['localhost', 't.me'],
  },
  
  // 🔒 编译配置：优化生产构建
  compiler: {
    // 生产环境移除 console
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'], // 保留 error 和 warn
    } : false,
  },
  
  // 🔧 Webpack 配置 - 彻底禁用 Source Maps
  webpack: (config, { isServer }) => {
    // 🔒 客户端构建完全禁用 Source Maps（开发+生产环境）
    if (!isServer) {
      config.devtool = false; // 完全禁用，DevTools 看不到源代码
    }
    return config;
  },
  
  // 🔗 URL 重写规则 - 简化所有URL，去掉序号前缀
  async rewrites() {
    return {
      beforeFiles: [
        // 1. 首页路由 - / 重写到 /01-telegram-home
        {
          source: '/',
          destination: '/01-telegram-home',
        },
        // 2. 关于页面 - /about 重写到 /03-about
        {
          source: '/about',
          destination: '/03-about',
        },
        // 3. 管理后台路由 - /neoneo 重写到 /admin
        {
          source: '/neoneo',
          destination: '/admin',
        },
        {
          source: '/neoneo/:path*',
          destination: '/admin/:path*',
        },
      ],
      afterFiles: [
        // 4. 频道分享页 - /:username 重写到 /02-channel-share/:username
        // afterFiles 确保上面的具体路由（/, /about, /neoneo）优先匹配
        {
          source: '/:username',
          destination: '/02-channel-share/:username',
        },
      ],
    };
  },
  
  // 🔒 HTTP Headers 配置
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // ⭐ Permissions-Policy: 移除不支持的 browsing-topics，避免警告
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          },
        ],
      },
      // ⚡ 静态资源缓存优化
      {
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig
