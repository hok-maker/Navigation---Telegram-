/**
 * SEO 配置文件
 * 统一管理站点的 SEO 信息
 */

export const siteConfig = {
  name: 'Telegram 频道导航',
  domain: '996007.net',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://996007.net',
  description: '发现优质 Telegram 频道，探索科技、新闻、娱乐等各类优质内容。收录上千个热门频道，实时更新，精准搜索。',
  keywords: [
    'Telegram',
    'Telegram频道',
    'TG频道',
    '电报频道',
    '频道导航',
    '频道推荐',
    'Telegram导航',
    '中文频道',
    '科技频道',
    '新闻频道'
  ],
  author: '996007.net',
  locale: 'zh_CN',
  type: 'website',
}

/**
 * 生成完整的 Open Graph 图片 URL
 * @param {string} path - 图片路径
 * @returns {string} 完整的 URL
 */
export function getImageUrl(path) {
  if (!path) return `${siteConfig.url}/og-default.png`
  if (path.startsWith('http')) return path
  return `${siteConfig.url}${path}`
}

/**
 * 生成页面完整 URL
 * @param {string} path - 页面路径
 * @returns {string} 完整的 URL
 */
export function getPageUrl(path = '') {
  return `${siteConfig.url}${path}`
}

/**
 * 生成首页 Metadata
 * @returns {Object} Next.js Metadata 对象
 */
export function getHomeMetadata() {
  return {
    title: `${siteConfig.name} - 发现优质内容`,
    description: siteConfig.description,
    keywords: siteConfig.keywords,
    authors: [{ name: siteConfig.author }],
    creator: siteConfig.author,
    publisher: siteConfig.author,
    
    openGraph: {
      type: 'website',
      locale: siteConfig.locale,
      url: getPageUrl('/'),
      siteName: siteConfig.name,
      title: `${siteConfig.name} - 发现优质内容`,
      description: siteConfig.description,
      images: [
        {
          url: getImageUrl('/og-home.png'),
          width: 1200,
          height: 630,
          alt: siteConfig.name,
        }
      ],
    },
    
    twitter: {
      card: 'summary_large_image',
      title: `${siteConfig.name} - 发现优质内容`,
      description: siteConfig.description,
      images: [getImageUrl('/og-home.png')],
      creator: '@996007net',
    },
    
    alternates: {
      canonical: getPageUrl('/'),
    },
    
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  }
}

/**
 * 生成频道分享页 Metadata
 * @param {Object} channel - 频道信息
 * @returns {Object} Next.js Metadata 对象
 */
export function getChannelMetadata(channel) {
  const {
    username = '',
    name = '未知频道',
    description = '',
    avatar = '',
    stats = {},
    isVerified = false,
  } = channel || {}

  const title = `${name} (@${username}) - ${siteConfig.name}`
  const desc = description || `加入 ${name} 频道，当前订阅者：${stats.members || 0}。${siteConfig.description}`
  const pageUrl = getPageUrl(`/${username}`)
  const imageUrl = avatar ? getImageUrl(avatar) : getImageUrl('/og-default.png')

  return {
    title,
    description: desc,
    keywords: [
      ...siteConfig.keywords,
      name,
      username,
      `${name} Telegram`,
      `${username} 频道`,
      isVerified ? '认证频道' : '',
    ].filter(Boolean),
    authors: [{ name: siteConfig.author }],
    creator: siteConfig.author,
    publisher: siteConfig.author,
    
    openGraph: {
      type: 'profile',
      locale: siteConfig.locale,
      url: pageUrl,
      siteName: siteConfig.name,
      title,
      description: desc,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `${name} 频道头像`,
        }
      ],
      profile: {
        username: username,
      },
    },
    
    twitter: {
      card: 'summary_large_image',
      title,
      description: desc,
      images: [imageUrl],
      creator: '@996007net',
    },
    
    alternates: {
      canonical: pageUrl,
    },
    
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    
    other: {
      'telegram:channel': `@${username}`,
    },
  }
}

/**
 * 生成网站说明页 Metadata
 * @returns {Object} Next.js Metadata 对象
 */
export function getAboutMetadata() {
  const title = `关于我们 - ${siteConfig.name}`
  const desc = '了解我们的自动收录机制和权重算法，发现如何提升频道排名。'
  const pageUrl = getPageUrl('/about')

  return {
    title,
    description: desc,
    keywords: [
      ...siteConfig.keywords,
      '收录标准',
      '权重算法',
      '频道排名',
      '自动收录',
      'Telegram爬虫',
    ],
    authors: [{ name: siteConfig.author }],
    creator: siteConfig.author,
    publisher: siteConfig.author,
    
    openGraph: {
      type: 'website',
      locale: siteConfig.locale,
      url: pageUrl,
      siteName: siteConfig.name,
      title,
      description: desc,
      images: [
        {
          url: getImageUrl('/og-about.png'),
          width: 1200,
          height: 630,
          alt: '关于 996007.net',
        }
      ],
    },
    
    twitter: {
      card: 'summary_large_image',
      title,
      description: desc,
      images: [getImageUrl('/og-about.png')],
      creator: '@996007net',
    },
    
    alternates: {
      canonical: pageUrl,
    },
    
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  }
}

/**
 * 生成 404 页面 Metadata
 * @returns {Object} Next.js Metadata 对象
 */
export function getNotFoundMetadata() {
  return {
    title: `页面未找到 - ${siteConfig.name}`,
    description: '抱歉，您访问的页面不存在或已被删除。',
    robots: {
      index: false,
      follow: false,
    },
  }
}

