import ChannelList from './components/ChannelList'
import { getChannelsData, searchChannels } from './Actions'
import { getHomeMetadata } from '@/utils/seo'
import styles from './home.module.css'

export const dynamic = 'force-dynamic'

/**
 * ⭐ SEO Metadata
 */
export const metadata = getHomeMetadata()

/**
 * 首页 - 展示 Telegram 频道
 * 符合规范：只负责UI渲染，数据获取通过Actions.js
 * ⭐ 支持 URL 参数（刷新时保持搜索状态）
 */
export default async function HomePage({ searchParams }) {
  // ⭐ 从 URL 获取搜索关键词
  const keyword = searchParams?.search || ''
  
  // ⭐ 根据是否有搜索关键词，决定加载哪些数据
  const result = keyword 
    ? await searchChannels({ keyword, page: 1, pageSize: 20 })
    : await getChannelsData({ page: 1, pageSize: 20 })
  
  // ⭐ 无论是否搜索，都获取全局统计数据（用于头部显示）
  const globalStats = keyword 
    ? await getChannelsData({ page: 1, pageSize: 1 }) // 只获取统计，不需要完整数据
    : result
  
  // 使用默认值处理（符合规范：总是假设数据可能为空）
  const { 
    channels = [], 
    pagination = { page: 1, pageSize: 20, total: 0, hasMore: false }
  } = result?.data || {}
  
  // ⭐ 统计数据始终来自全局（不受搜索影响）
  const stats = globalStats?.data?.stats || { total: 0, totalMembers: 0 }

  return (
    <div className={styles.container}>
      {/* 头部 */}
      <header className={styles.header}>
        {/* ⭐ 多个闪烁水印 - 散布在两侧 */}
        <div className={styles.watermark} style={{ top: '20%', left: '10%', animationDelay: '0s' }}>996007.net</div>
        <div className={styles.watermark} style={{ top: '60%', left: '5%', animationDelay: '2s' }}>996007.net</div>
        <div className={styles.watermark} style={{ top: '80%', left: '15%', animationDelay: '4s' }}>996007.net</div>
        <div className={styles.watermark} style={{ top: '15%', right: '10%', animationDelay: '1s' }}>996007.net</div>
        <div className={styles.watermark} style={{ top: '50%', right: '5%', animationDelay: '3s' }}>996007.net</div>
        <div className={styles.watermark} style={{ top: '75%', right: '15%', animationDelay: '5s' }}>996007.net</div>
        
        <h1 className={styles.title}>
          <span className={styles.emoji}>📱</span>
          Telegram 频道导航
        </h1>
        <p className={styles.subtitle}>
          发现优质 Telegram 频道，探索有趣的内容
        </p>
        
        {/* 统计信息 - 使用安全访问和默认值 */}
        <div className={styles.stats}>
          <div className={styles.statItem}>
            <div className={styles.statValue}>{stats?.total || 0}</div>
            <div className={styles.statLabel}>频道总数</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statValue}>
              {(stats?.totalMembers || 0) > 0 
                ? ((stats.totalMembers / 1000000).toFixed(1) + 'M')
                : '0'}
            </div>
            <div className={styles.statLabel}>总订阅数</div>
          </div>
        </div>
      </header>

      {/* 频道列表（⭐ 无限滚动 + 服务端搜索） */}
      <main className={styles.main}>
        <ChannelList 
          initialChannels={channels} 
          initialPagination={pagination}
          searchKeyword={keyword}
        />
      </main>

      {/* 底部 */}
      <footer className={styles.footer}>
        <p>数据来源于公开的 Telegram 频道</p>
        <p className={styles.updateTime}>
          最后更新：{new Date().toLocaleString('zh-CN')}
        </p>
      </footer>
    </div>
  )
}

