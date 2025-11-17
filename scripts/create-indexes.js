/**
 * MongoDB 索引创建脚本
 * 用途：为所有爬虫程序的数据库查询创建索引，提升性能
 * 
 * 使用方法：
 * 1. 确保 MongoDB 正在运行
 * 2. 运行: node scripts/create-indexes.js
 * 
 * 说明：所有索引基于实际代码查询需求，非猜测性索引
 */

const { MongoClient } = require('mongodb')

// 从环境变量读取，或使用默认值
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017,127.0.0.1:27018/?replicaSet=LocalRS_01'
const DB_NAME = '06_DB_crawler'

/**
 * 创建索引的辅助函数（带错误处理）
 * @param {Collection} collection - MongoDB 集合
 * @param {Object} keys - 索引字段
 * @param {Object} options - 索引选项
 */
async function createIndexSafely(collection, keys, options) {
  try {
    await collection.createIndex(keys, options)
    console.log('   ✅ 完成\n')
  } catch (error) {
    if (error.code === 85 || error.codeName === 'IndexOptionsConflict' || error.code === 11000) {
      console.log('   ⚠️  索引已存在，跳过\n')
    } else {
      throw error
    }
  }
}

async function createIndexes() {
  const client = new MongoClient(MONGODB_URI)
  
  try {
    console.log('🔗 连接数据库...')
    await client.connect()
    console.log('✅ 数据库连接成功\n')
    
    const db = client.db(DB_NAME)
    const channels = db.collection('channels')
    const channelLikes = db.collection('channelLikes')
    const channelLikeRecords = db.collection('channelLikeRecords')
    const searchKeywords = db.collection('searchKeywords')
    const demoteKeywords = db.collection('demoteKeywords')
    const accounts = db.collection('accounts')
    
    console.log('📊 开始创建索引...\n')
    console.log('=' .repeat(70))
    console.log('📁 Collection: channels')
    console.log('=' .repeat(70) + '\n')
    
    // ========================================
    // channels 集合索引
    // ========================================
    
    // 1. username唯一索引（⭐ 核心 - 所有程序频繁使用）
    console.log('1️⃣  创建唯一索引: username')
    await createIndexSafely(channels,
      { username: 1 },
      { name: 'username_unique_idx', unique: true, background: true }
    )
    
    // 2. Navigation首页 - 活跃状态 + 权重排序
    console.log('2️⃣  创建组合索引: meta.isActive + weight.value')
    await createIndexSafely(channels, 
      { 'meta.isActive': 1, 'weight.value': -1 },
      { name: 'active_weight_idx', background: true }
    )
    
    // 3. Navigation首页 - 活跃 + 隐藏状态 + 权重
    console.log('3️⃣  创建组合索引: meta.isActive + meta.adminHidden + weight.value')
    await createIndexSafely(channels, 
      { 'meta.isActive': 1, 'meta.adminHidden': 1, 'weight.value': -1 },
      { name: 'active_hidden_weight_idx', background: true }
    )
    
    // 4. Navigation首页 - 活跃 + 订阅数排序
    console.log('4️⃣  创建组合索引: meta.isActive + stats.members')
    await createIndexSafely(channels, 
      { 'meta.isActive': 1, 'stats.members': -1 },
      { name: 'active_members_idx', background: true }
    )
    
    // 5. Navigation首页 - 活跃 + 更新时间排序
    console.log('5️⃣  创建组合索引: meta.isActive + updatedAt')
    await createIndexSafely(channels, 
      { 'meta.isActive': 1, updatedAt: -1 },
      { name: 'active_updated_idx', background: true }
    )
    
    // 6. Navigation搜索 - 名称正则搜索（⭐ 核心）
    console.log('6️⃣  创建索引: name（正则搜索优化）')
    await createIndexSafely(channels,
      { name: 1 },
      { name: 'name_idx', background: true }
    )
    
    // 7. PreviewCrawler_New - 查找新频道
    console.log('7️⃣  创建组合索引: dataSources.previewPage.hasData + meta.firstDiscoveredAt')
    await createIndexSafely(channels,
      { 'dataSources.previewPage.hasData': 1, 'meta.firstDiscoveredAt': -1 },
      { name: 'preview_new_idx', background: true }
    )
    
    // 8. PreviewCrawler_Update - 查找需要更新的频道
    console.log('8️⃣  创建组合索引: dataSources.previewPage.hasData + meta.previewCrawl.lastChecked + stats.members')
    await createIndexSafely(channels,
      { 'dataSources.previewPage.hasData': 1, 'meta.previewCrawl.lastChecked': 1, 'stats.members': -1 },
      { name: 'preview_update_idx', background: true }
    )
    
    // 9. NetworkCrawler - 智能更新（新发现的频道）
    console.log('9️⃣  创建组合索引: meta.firstDiscoveredAt + lastChecked')
    await createIndexSafely(channels,
      { 'meta.firstDiscoveredAt': 1, lastChecked: 1 },
      { name: 'network_discovery_idx', background: true }
    )
    
    // 10. NetworkCrawler - 智能更新（质量评分）
    console.log('🔟 创建组合索引: lastChecked + quality.qualityScore')
    await createIndexSafely(channels,
      { lastChecked: 1, 'quality.qualityScore': 1 },
      { name: 'network_quality_idx', background: true }
    )
    
    // ========================================
    // searchKeywords 集合索引
    // ========================================
    console.log('=' .repeat(70))
    console.log('📁 Collection: searchKeywords')
    console.log('=' .repeat(70) + '\n')
    
    // 1. 关键词唯一索引（⭐ 核心）
    console.log('1️⃣  创建唯一索引: keyword')
    await createIndexSafely(searchKeywords,
      { keyword: 1 },
      { name: 'keyword_unique_idx', unique: true, background: true }
    )
    
    // 2. BotSearchCrawler调度 - 状态 + 下次搜索时间 + 优先级（⭐ 核心）
    console.log('2️⃣  创建组合索引: status + schedule.nextSearchAt + priority')
    await createIndexSafely(searchKeywords,
      { status: 1, 'schedule.nextSearchAt': 1, priority: 1 },
      { name: 'search_schedule_idx', background: true }
    )
    
    // 3. Navigation Admin - 优先级 + 创建时间排序
    console.log('3️⃣  创建组合索引: priority + createdAt')
    await createIndexSafely(searchKeywords,
      { priority: 1, createdAt: -1 },
      { name: 'priority_created_idx', background: true }
    )
    
    // ========================================
    // demoteKeywords 集合索引
    // ========================================
    console.log('=' .repeat(70))
    console.log('📁 Collection: demoteKeywords')
    console.log('=' .repeat(70) + '\n')
    
    // 1. 关键词唯一索引（⭐ 核心）
    console.log('1️⃣  创建唯一索引: keyword')
    await createIndexSafely(demoteKeywords,
      { keyword: 1 },
      { name: 'keyword_unique_idx', unique: true, background: true }
    )
    
    // 2. PreviewCrawler - 加载活跃关键词
    console.log('2️⃣  创建索引: status')
    await createIndexSafely(demoteKeywords,
      { status: 1 },
      { name: 'status_idx', background: true }
    )
    
    // 3. Navigation Admin - 优先级 + 创建时间排序
    console.log('3️⃣  创建组合索引: priority + createdAt')
    await createIndexSafely(demoteKeywords,
      { priority: 1, createdAt: -1 },
      { name: 'priority_created_idx', background: true }
    )
    
    // ========================================
    // channelLikes 集合索引
    // ========================================
    console.log('=' .repeat(70))
    console.log('📁 Collection: channelLikes')
    console.log('=' .repeat(70) + '\n')
    
    // 1. 频道用户名唯一索引（⭐ 核心）
    console.log('1️⃣  创建唯一索引: channelUsername')
    await createIndexSafely(channelLikes,
      { channelUsername: 1 },
      { name: 'channel_username_unique_idx', unique: true, background: true }
    )
    
    // ========================================
    // channelLikeRecords 集合索引
    // ========================================
    console.log('=' .repeat(70))
    console.log('📁 Collection: channelLikeRecords')
    console.log('=' .repeat(70) + '\n')
    
    // 1. Navigation点赞查询 - 频道 + 指纹（⭐ 核心）
    console.log('1️⃣  创建组合索引: channelUsername + fingerprint')
    await createIndexSafely(channelLikeRecords,
      { channelUsername: 1, fingerprint: 1 },
      { name: 'channel_fingerprint_idx', background: true }
    )
    
    // ========================================
    // accounts 集合索引
    // ========================================
    console.log('=' .repeat(70))
    console.log('📁 Collection: accounts')
    console.log('=' .repeat(70) + '\n')
    
    // 1. 单Worker模式 - 程序专属账号
    console.log('1️⃣  创建组合索引: assignedTo + status.isActive + meta.priority')
    await createIndexSafely(accounts,
      { assignedTo: 1, 'status.isActive': 1, 'meta.priority': -1 },
      { name: 'program_account_idx', background: true }
    )
    
    // 2. 多Worker模式 - 专属账号（⭐ 核心）
    console.log('2️⃣  创建组合索引: assignedTo + status.isActive + workerIndex + isShared')
    await createIndexSafely(accounts,
      { assignedTo: 1, 'status.isActive': 1, workerIndex: 1, isShared: 1 },
      { name: 'worker_account_idx', background: true }
    )
    
    // 3. 多Worker模式 - 共享账号
    console.log('3️⃣  创建组合索引: assignedTo + status.isActive + isShared')
    await createIndexSafely(accounts,
      { assignedTo: 1, 'status.isActive': 1, isShared: 1 },
      { name: 'shared_account_idx', background: true }
    )
    
    // ========================================
    // 查看所有索引
    // ========================================
    console.log('=' .repeat(70))
    console.log('📋 索引创建总结')
    console.log('=' .repeat(70) + '\n')
    
    console.log('📁 channels 集合:')
    const channelsIndexes = await channels.indexes()
    channelsIndexes.forEach((index, i) => {
      const uniqueFlag = index.unique ? ' [UNIQUE]' : ''
      console.log(`   ${i + 1}. ${index.name}${uniqueFlag}:`, JSON.stringify(index.key))
    })
    
    console.log('\n📁 searchKeywords 集合:')
    const keywordsIndexes = await searchKeywords.indexes()
    keywordsIndexes.forEach((index, i) => {
      const uniqueFlag = index.unique ? ' [UNIQUE]' : ''
      console.log(`   ${i + 1}. ${index.name}${uniqueFlag}:`, JSON.stringify(index.key))
    })
    
    console.log('\n📁 demoteKeywords 集合:')
    const demoteIndexes = await demoteKeywords.indexes()
    demoteIndexes.forEach((index, i) => {
      const uniqueFlag = index.unique ? ' [UNIQUE]' : ''
      console.log(`   ${i + 1}. ${index.name}${uniqueFlag}:`, JSON.stringify(index.key))
    })
    
    console.log('\n📁 channelLikes 集合:')
    const likesIndexes = await channelLikes.indexes()
    likesIndexes.forEach((index, i) => {
      const uniqueFlag = index.unique ? ' [UNIQUE]' : ''
      console.log(`   ${i + 1}. ${index.name}${uniqueFlag}:`, JSON.stringify(index.key))
    })
    
    console.log('\n📁 channelLikeRecords 集合:')
    const recordsIndexes = await channelLikeRecords.indexes()
    recordsIndexes.forEach((index, i) => {
      const uniqueFlag = index.unique ? ' [UNIQUE]' : ''
      console.log(`   ${i + 1}. ${index.name}${uniqueFlag}:`, JSON.stringify(index.key))
    })
    
    console.log('\n📁 accounts 集合:')
    const accountsIndexes = await accounts.indexes()
    accountsIndexes.forEach((index, i) => {
      const uniqueFlag = index.unique ? ' [UNIQUE]' : ''
      console.log(`   ${i + 1}. ${index.name}${uniqueFlag}:`, JSON.stringify(index.key))
    })
    
    console.log('\n🎉 所有索引创建完成！\n')
    
    // 统计信息
    const totalIndexes = channelsIndexes.length + keywordsIndexes.length + 
                        demoteIndexes.length + likesIndexes.length + 
                        recordsIndexes.length + accountsIndexes.length
    const uniqueIndexes = [
      ...channelsIndexes, ...keywordsIndexes, ...demoteIndexes,
      ...likesIndexes, ...recordsIndexes, ...accountsIndexes
    ].filter(idx => idx.unique).length
    
    console.log('📊 索引统计：')
    console.log(`   - 总索引数: ${totalIndexes}`)
    console.log(`   - 唯一索引: ${uniqueIndexes}`)
    console.log(`   - 组合索引: ${totalIndexes - uniqueIndexes - 6}`)  // 减去6个默认_id索引
    console.log()
    
    // 性能建议
    console.log('💡 性能优化建议：')
    console.log('   1. 定期运行 db.channels.stats() 查看索引使用情况')
    console.log('   2. 使用 explain() 分析查询性能')
    console.log('   3. 监控慢查询日志')
    console.log('   4. 根据实际查询模式调整索引')
    console.log('   5. 定期检查索引大小，避免过度索引\n')
    
  } catch (error) {
    console.error('❌ 创建索引失败:', error.message)
    console.error(error)
    process.exit(1)
  } finally {
    await client.close()
    console.log('👋 数据库连接已关闭')
  }
}

// 执行脚本
if (require.main === module) {
  createIndexes()
    .then(() => {
      console.log('\n✅ 脚本执行成功')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ 脚本执行失败:', error)
      process.exit(1)
    })
}

module.exports = { createIndexes }

