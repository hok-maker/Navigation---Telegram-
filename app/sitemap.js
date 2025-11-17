import { siteConfig } from '@/utils/seo'
import { getAllChannels } from '@/app/(pages)/01-telegram-home/Actions'

/**
 * 动态生成 Sitemap
 * Next.js 会自动将这个文件转换为 /sitemap.xml
 */
export default async function sitemap() {
  const baseUrl = siteConfig.url

  // 静态页面
  const staticPages = [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ]

  // 动态频道页面
  let channelPages = []
  
  try {
    // 获取所有频道（用于生成 sitemap）
    const result = await getAllChannels()
    
    if (result?.success && result?.data?.channels) {
      channelPages = result.data.channels.map((channel) => ({
        url: `${baseUrl}/${channel.username}`,
        lastModified: new Date(channel.updatedAt || Date.now()),
        changeFrequency: 'weekly',
        priority: 0.8,
      }))
    }
  } catch (error) {
    console.error('生成 sitemap 时获取频道失败:', error)
  }

  return [...staticPages, ...channelPages]
}

