import { notFound } from 'next/navigation'
import { getChannel } from './Actions'
import { getChannelMetadata } from '@/utils/seo'
import ChannelDisplay from './ChannelDisplay'
import ShareButtons from './ShareButtons'
import styles from './share.module.css'

export const dynamic = 'force-dynamic'

/**
 * ⭐ 动态生成 SEO Metadata
 */
export async function generateMetadata({ params }) {
  const { username } = params
  const result = await getChannel(username)
  
  if (!result?.success) {
    return {
      title: '频道未找到',
      description: '抱歉，您访问的频道不存在或已被删除。',
      robots: { index: false, follow: false },
    }
  }
  
  const { channel } = result.data
  return getChannelMetadata(channel)
}

/**
 * 频道分享页面（⭐ 极简设计，核心功能突出）
 * URL: /02-channel-share/[username]
 * 
 * 设计理念：
 * 1. 极简布局 - 移除多余的header/footer/提示卡片
 * 2. 内容居中 - 让频道卡片成为视觉焦点
 * 3. 核心功能 - 点赞支持 + 分享按钮
 * 4. 品牌露出 - 右下角淡水印，不干扰阅读
 */
export default async function ChannelSharePage({ params }) {
  const { username } = params
  
  // 获取频道信息
  const result = await getChannel(username)
  
  // 如果找不到频道，显示 404
  if (!result?.success) {
    notFound()
  }

  const { channel } = result.data

  return (
    <div className={styles.container}>
      {/* 主体内容 */}
      <main className={styles.main}>
        {/* ⭐ 单一水印 - 右下角固定位置 */}
        <div className={styles.watermark}>996007.net</div>
        
        {/* 频道展示区域 */}
        <ChannelDisplay channel={channel} />

        {/* 操作按钮组 */}
        <ShareButtons username={username} channelName={channel.name} />
      </main>
    </div>
  )
}

