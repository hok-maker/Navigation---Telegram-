import { getAboutMetadata } from '@/utils/seo'
import { 
  HiOutlineServer, 
  HiOutlineChartBar, 
  HiOutlineShieldCheck,
  HiOutlineLightBulb,
  HiOutlineExclamationCircle,
  HiOutlineBan,
  HiOutlineQuestionMarkCircle
} from 'react-icons/hi'
import styles from './about.module.css'

export const dynamic = 'force-dynamic'

/**
 * SEO Metadata
 */
export const metadata = getAboutMetadata()

/**
 * 网站说明页面
 */
export default function AboutPage() {
  return (
    <div className={styles.container}>
      {/* 页面头部 */}
      <header className={styles.header}>
        <h1 className={styles.title}>关于 996007.net</h1>
        <p className={styles.subtitle}>了解我们的自动收录机制和权重算法</p>
      </header>

      {/* 主要内容 */}
      <main className={styles.main}>
        {/* 自动收录机制 */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <HiOutlineServer className={styles.sectionIcon} />
            <h2 className={styles.sectionTitle}>自动收录机制</h2>
          </div>
          <div className={styles.sectionContent}>
            <p>本站所有频道/群组均由<strong>爬虫系统</strong>自动从网络抓取，24小时不间断运行。</p>
            
            <h3 className={styles.subTitle}>数据来源</h3>
            <div className={styles.featureList}>
              <div className={styles.featureItem}>
                <div className={styles.featureDot}></div>
                <span>社交媒体平台（Twitter、Reddit等）的分享链接</span>
              </div>
              <div className={styles.featureItem}>
                <div className={styles.featureDot}></div>
                <span>GitHub开源项目中的频道推荐列表</span>
              </div>
              <div className={styles.featureItem}>
                <div className={styles.featureDot}></div>
                <span>其他导航网站的公开数据</span>
              </div>
              <div className={styles.featureItem}>
                <div className={styles.featureDot}></div>
                <span>已收录的高权重频道发布的链接（优先级最高）</span>
              </div>
            </div>

            <div className={styles.notice}>
              <HiOutlineBan className={styles.noticeIcon} />
              <span>我们不接受人工主动提交，所有收录均为自动化抓取</span>
            </div>
          </div>
        </section>

        {/* 权重计算规则 */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <HiOutlineChartBar className={styles.sectionIcon} />
            <h2 className={styles.sectionTitle}>权重计算规则</h2>
          </div>
          <div className={styles.sectionContent}>
            <p>我们的智能算法综合考虑多个维度，动态计算每个频道的权重分数：</p>

            {/* 基础权重 */}
            <div className={styles.factorGroup}>
              <h3 className={styles.factorTitle}>基础权重（首次抓取）</h3>
              <p className={styles.factorDesc}>
                当频道首次被我们的爬虫发现时，<strong>当时的订阅人数</strong>将成为该频道的基础权重。
                这个数值是权重系统的起点，后续所有权重调整都基于此展开。
              </p>
            </div>

            {/* 正向因素 */}
            <div className={styles.factorGroup}>
              <h3 className={styles.factorTitle}>正向权重因素</h3>
              <div className={styles.factorList}>
                <div className={styles.factorItem}>
                  <span className={styles.factorLabel}>稳定增长</span>
                  <span className={styles.factorDesc}>订阅人数持续稳定增长，每次扫描都会获得正向加分</span>
                </div>
                <div className={styles.factorItem}>
                  <span className={styles.factorLabel}>用户点赞</span>
                  <span className={styles.factorDesc}>真实用户的点赞行为，直接提升权重</span>
                </div>
                <div className={styles.factorItem}>
                  <span className={styles.factorLabel}>持续活跃</span>
                  <span className={styles.factorDesc}>定期发布优质内容，保持频道活跃度</span>
                </div>
              </div>
            </div>

            {/* 异常检测与惩罚 */}
            <div className={styles.warningBox}>
              <HiOutlineExclamationCircle className={styles.warningIcon} />
              <div>
                <h4 className={styles.warningTitle}>异常行为检测</h4>
                <p className={styles.warningDesc}>以下行为会触发我们的异常检测机制：</p>
                
                <div className={styles.abnormalCase}>
                  <h5>1. 创建时间与订阅数不匹配</h5>
                  <p>
                    如果频道创建仅1个月，却拥有100万订阅，这明显不符合正常增长规律。
                    系统会判定为批量导入或购买粉丝行为。
                  </p>
                </div>

                <div className={styles.abnormalCase}>
                  <h5>2. 内容发布模式异常</h5>
                  <p>
                    频道创建初期短时间内发布大量内容（内容时间戳集中），之后长期不更新。
                    这是典型的爬虫批量导入垃圾内容的特征。
                  </p>
                </div>

                <div className={styles.abnormalCase}>
                  <h5>3. 订阅数突变</h5>
                  <p>
                    短时间内订阅数暴涨或暴跌（例如一天增长50%或减少30%），
                    会被判定为刷量或批量取消关注。
                  </p>
                </div>

                <div className={styles.penaltyNote}>
                  <strong>权重计算机制：</strong>
                  <p className={styles.mechanismDesc}>
                    <strong>重要：</strong>我们不会"标记"或"拉黑"任何频道。
                    权重是<strong>每次程序扫描时实时计算</strong>的结果。
                  </p>
                  <ul>
                    <li><strong>实时评估：</strong>每次扫描都会重新检测频道是否存在异常行为</li>
                    <li><strong>持续降权：</strong>只要异常特征仍然存在，每次扫描都会因此降低权重</li>
                    <li><strong>无需申诉：</strong>我们不接受人工申诉或取消"标记"（因为我们根本不做标记）</li>
                    <li><strong>自动恢复：</strong>当程序判定频道已恢复正常运营时，会自动开始正向权重计算</li>
                    <li><strong>恢复缓慢：</strong>即使开始正常运营，由于历史数据中的异常记录，正向权重增加会非常缓慢</li>
                    <li><strong>长期影响：</strong>这个过程可能需要数月甚至数年，最终权重可能<strong>远低于预期</strong></li>
                  </ul>
                  <p className={styles.mechanismNote}>
                    这就是为什么有些频道运营者会发现：明明已经开始正常发布内容、订阅也在增长，
                    但权重依然很低或无法获得正向加分。原因是程序仍在基于历史异常数据进行计算。
                  </p>
                </div>
              </div>
            </div>

            {/* 其他参考因素 */}
            <div className={styles.factorGroup}>
              <h3 className={styles.factorTitle}>其他参考维度</h3>
              <div className={styles.factorList}>
                <div className={styles.factorItem}>
                  <span className={styles.factorLabel}>频道历史</span>
                  <span className={styles.factorDesc}>创建时间越久的频道，信誉度加成越高</span>
                </div>
                <div className={styles.factorItem}>
                  <span className={styles.factorLabel}>推荐网络</span>
                  <span className={styles.factorDesc}>被其他高权重频道推荐的次数</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 收录标准 */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <HiOutlineShieldCheck className={styles.sectionIcon} />
            <h2 className={styles.sectionTitle}>收录标准</h2>
          </div>
          <div className={styles.sectionContent}>
            <p>我们的爬虫系统会收录所有能够访问的<strong>公开频道和群组</strong>。</p>
            
            <div className={styles.criteriaBox}>
              <h4 className={styles.criteriaTitle}>✓ 可被收录</h4>
              <ul className={styles.criteriaList}>
                <li><strong>所有公开频道/群组</strong> - 无需达到任何订阅数门槛</li>
                <li>无论内容类型、语言、地区，只要公开即会被收录</li>
                <li>收录后的排名由权重系统自动决定</li>
              </ul>
            </div>

            <div className={styles.criteriaBox}>
              <h4 className={styles.criteriaTitle}>✗ 不予收录</h4>
              <ul className={styles.criteriaList}>
                <li><strong>私有频道/群组</strong> - 由于技术限制，爬虫程序无法访问需要验证或邀请的频道</li>
                <li><strong>严重违法内容</strong> - 涉及儿童色情、恐怖主义等违反国际法的频道，系统检测后将不予收录</li>
              </ul>
            </div>

            <div className={styles.warningBox}>
              <HiOutlineExclamationCircle className={styles.warningIcon} />
              <div>
                <h4 className={styles.warningTitle}>特殊权重处理</h4>
                <p>
                  <strong>矩阵频道（Matrix Channels）：</strong>
                  如果系统检测到大量内容相同或高度相似的频道（如批量复制、镜像频道），
                  这类频道的权重会被自动降级至<strong>正常频道的10%</strong>。
                </p>
                <p>
                  这是为了防止整个导航网站充斥重复内容，确保用户能发现真正有价值的原创频道。
                </p>
              </div>
            </div>

            <div className={styles.notice}>
              <HiOutlineBan className={styles.noticeIcon} />
              <span>我们不对频道内容进行人工审核，所有收录和权重计算均为自动化</span>
            </div>
          </div>
        </section>

        {/* 为什么未被收录 */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <HiOutlineQuestionMarkCircle className={styles.sectionIcon} />
            <h2 className={styles.sectionTitle}>为什么我的频道未被收录？</h2>
          </div>
          <div className={styles.sectionContent}>
            <p>如果您的频道长时间未出现在本站，可能的原因包括：</p>

            <div className={styles.factorGroup}>
              <h3 className={styles.factorTitle}>常见原因</h3>
              <div className={styles.factorList}>
                <div className={styles.factorItem}>
                  <span className={styles.factorLabel}>曝光度不足</span>
                  <span className={styles.factorDesc}>
                    您的频道链接尚未被我们的爬虫在网络上发现。
                    爬虫只能抓取到在Twitter、GitHub、导航网站等公开平台上分享的频道。
                  </span>
                </div>
                <div className={styles.factorItem}>
                  <span className={styles.factorLabel}>频道设置为私有</span>
                  <span className={styles.factorDesc}>
                    爬虫无法访问需要验证或邀请的频道。
                    请确保您的频道设置为公开（Public）。
                  </span>
                </div>
                <div className={styles.factorItem}>
                  <span className={styles.factorLabel}>刚刚创建</span>
                  <span className={styles.factorDesc}>
                    新创建的频道需要一定时间才能被网络记录和爬虫发现。
                  </span>
                </div>
              </div>
            </div>

            <div className={styles.importantNote}>
              <h4>💡 如何提高被收录的机会？</h4>
              <p>
                <strong>最有效的方式：</strong>请求<strong>高权重频道</strong>发布您的频道链接。
              </p>
              <p>
                因为高权重频道被我们的爬虫<strong>扫描的频率远高于普通频道</strong>
                （热门频道每天扫描，普通频道可能几天甚至一周才扫描一次），
                在这些频道中分享您的链接，被发现的速度会快得多。
              </p>
              <ul>
                <li>在相关领域的热门频道中推广</li>
                <li>在 Twitter、Reddit 等社交平台分享</li>
                <li>将频道添加到 GitHub 的公开频道列表项目中</li>
                <li>在其他 Telegram 导航网站提交（如果接受提交）</li>
              </ul>
            </div>

            <div className={styles.shareExampleBox}>
              <h4>⭐ 提升权重的最有效方式</h4>
              <p>
                一旦您的频道被收录，<strong>获得用户点赞</strong>是提升权重最直接、最有效的方式。
              </p>
              <div className={styles.exampleSection}>
                <h5>如何操作：</h5>
                <ol>
                  <li>访问您频道的分享页面（格式：<code>https://996007.net/您的频道用户名(没有@符号)</code>）</li>
                  <li>复制该分享链接，在您的频道或社交媒体发布</li>
                  <li>请求用户访问链接并点击"点赞"按钮</li>
                  <li>每个真实用户的点赞都会<strong>直接提升您的权重</strong></li>
                </ol>
                
                <div className={styles.exampleDemo}>
                  <p><strong>示例：</strong>Telegram 创始人 Pavel Durov 的分享页面</p>
                  <a 
                    href="https://996007.net/durov" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={styles.demoLink}
                  >
                    https://996007.net/durov
                  </a>
                  <p className={styles.exampleNote}>
                    访问此页面，您可以看到点赞按钮的实际效果。
                    每个点赞都会实时影响频道在导航中的排名位置。
                  </p>
                </div>
              </div>

              <div className={styles.tipsNote}>
                <strong>提示：</strong>
                <ul>
                  <li>点赞权重会立即生效，影响排序结果</li>
                  <li>这是合法的推广方式，不会被系统判定为异常</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* 如何提升排名 */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <HiOutlineLightBulb className={styles.sectionIcon} />
            <h2 className={styles.sectionTitle}>正确的运营策略</h2>
          </div>
          <div className={styles.sectionContent}>
            <div className={styles.tipsGrid}>
              <div className={styles.tipBox}>
                <h4 className={styles.tipTitle}>有效的正向行为</h4>
                <ul className={styles.tipList}>
                  <li><strong>持续稳定增长：</strong>避免暴涨暴跌，保持自然增长曲线</li>
                  <li><strong>优质内容产出：</strong>定期发布原创、高质量内容</li>
                  <li><strong>获得真实互动：</strong>鼓励用户自然点赞、评论、转发</li>
                  <li><strong>建立长期信誉：</strong>频道运营时间越长，权重基础越稳固</li>
                  <li><strong>获得推荐：</strong>被其他高权重频道提及或推荐</li>
                </ul>
              </div>
              
              <div className={styles.tipBox}>
                <h4 className={styles.tipTitle}>必须避免的行为</h4>
                <ul className={styles.tipList}>
                  <li><strong>刷订阅数：</strong>任何形式的快速增粉都会被检测</li>
                  <li><strong>批量导入内容：</strong>短时间发布大量历史内容</li>
                  <li><strong>购买互动数据：</strong>虚假点赞、评论、转发</li>
                  <li><strong>频繁改名：</strong>试图通过改名提升搜索曝光</li>
                  <li><strong>长期不更新：</strong>建立后就放任不管</li>
                </ul>
              </div>
            </div>

            <div className={styles.importantNote}>
              <h4>⚠️ 特别提醒</h4>
              <p>
                一旦频道被标记为异常，即使后续采取正确的运营策略，
                <strong>权重恢复周期也可能长达数月甚至数年</strong>。
                在此期间，即便订阅数持续增长，权重提升也会非常缓慢。
              </p>
              <p>
                因此，<strong>从一开始就采用正确的运营方式</strong>，
                远比后期补救要有效得多。
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* 页脚 */}
      <footer className={styles.footer}>
        <a href="/" className={styles.backLink}>← 返回首页</a>
        <p className={styles.disclaimer}>
          本站数据仅供参考，最终解释权归本站所有
        </p>
      </footer>
    </div>
  )
}

