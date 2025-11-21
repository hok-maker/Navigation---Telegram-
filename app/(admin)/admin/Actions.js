'use server'

import { withServerAction, success, error, db6, connectDB6 } from '@/utils'

/**
 * 获取频道列表（管理后台专用）
 * 包含禁用的频道
 */
export const getAdminChannelsData = withServerAction(async ({ 
  page = 1, 
  pageSize = 20,
  sortBy = 'weight.value',
  showDisabled = true  // 是否显示禁用的频道
} = {}) => {
  await connectDB6()
  
  const skip = (page - 1) * pageSize
  
  // ⭐ 构建查询条件（使用 adminHidden 字段）
  const query = showDisabled ? {} : { 
    $or: [
      { 'meta.adminHidden': { $exists: false } },  // 字段不存在（默认显示）
      { 'meta.adminHidden': false }                 // 或明确设置为 false
    ]
  }
  
  // ⭐ 获取频道和统计（统计始终基于全部频道，不受筛选影响）
  const [channels, stats] = await Promise.all([
    // 频道列表（应用筛选）
    db6.channels
      .find(query)
      .sort({ [sortBy]: -1 })
      .skip(skip)
      .limit(pageSize)
      .toArray(),
    
    // 统计信息（始终查询所有频道，不应用 showDisabled 筛选）
    db6.channels.aggregate([
      { $match: {} },  // ⭐ 空条件，查询所有频道
      { 
        $group: { 
          _id: null, 
          total: { $sum: 1 },
          totalMembers: { $sum: '$stats.members' },
          activeCount: {
            $sum: { $cond: [
              { $or: [
                { $eq: ['$meta.adminHidden', false] },
                { $not: ['$meta.adminHidden'] }
              ]}, 
              1, 
              0 
            ]}
          },
          disabledCount: {
            $sum: { $cond: [{ $eq: ['$meta.adminHidden', true] }, 1, 0] }
          }
        } 
      }
    ]).toArray()
  ])

  // 转换头像路径
  const channelsWithAvatarUrl = channels.map(channel => ({
    ...channel,
    avatar: channel.avatar && !channel.avatar.startsWith('http') 
      ? `/api/avatar/${channel.avatar}`
      : channel.avatar
  }))

  // 序列化数据
  const serializedChannels = JSON.parse(JSON.stringify(channelsWithAvatarUrl))
  const serializedStats = stats?.[0] || { 
    total: 0, 
    totalMembers: 0,
    activeCount: 0,
    disabledCount: 0
  }

  return success({
    channels: serializedChannels,
    stats: serializedStats,
    pagination: {
      page,
      pageSize,
      total: serializedStats.total,
      hasMore: skip + pageSize < serializedStats.total
    }
  }, '获取频道数据成功')
})

/**
 * 更新频道权重
 */
export const updateChannelWeight = withServerAction(async (username, newWeight) => {
  if (!username) {
    return error('缺少频道用户名')
  }
  
  if (typeof newWeight !== 'number') {
    return error('权重必须是数字')
  }
  
  await connectDB6()
  
  // 检查频道是否存在
  const channel = await db6.channels.findOne({ username })
  if (!channel) {
    return error('频道不存在')
  }
  
  // 更新权重
  await db6.channels.updateOne(
    { username },
    {
      $set: {
        'weight.value': newWeight,
        'weight.lastCalculated': new Date(),
        'weight.calculationReason': '管理员手动修改',
        updatedAt: new Date()
      }
    }
  )
  
  return success({ 
    username, 
    newWeight 
  }, '权重更新成功')
})

/**
 * 更新频道点赞数
 */
export const updateChannelLikes = withServerAction(async (username, newLikes) => {
  if (!username) {
    return error('缺少频道用户名')
  }
  
  if (typeof newLikes !== 'number' || newLikes < 0) {
    return error('点赞数必须是非负整数')
  }
  
  await connectDB6()
  
  // 检查频道是否存在
  const channel = await db6.channels.findOne({ username })
  if (!channel) {
    return error('频道不存在')
  }
  
  // 查找或创建点赞文档
  let likeDoc = await db6.channelLikes.findOne({ channelUsername: username })
  
  if (!likeDoc) {
    // 创建新文档
    likeDoc = {
      channelUsername: username,
      stats: {
        totalLikes: newLikes,
        uniqueDevices: newLikes,  // 假设每个赞来自不同设备
        lastLikeAt: new Date()
      },
      likes: [],  // 空数组，因为是手动设置
      createdAt: new Date(),
      updatedAt: new Date()
    }
    await db6.channelLikes.insertOne(likeDoc)
  } else {
    // 更新现有文档
    await db6.channelLikes.updateOne(
      { channelUsername: username },
      {
        $set: {
          'stats.totalLikes': newLikes,
          'stats.uniqueDevices': newLikes,
          'stats.lastLikeAt': new Date(),
          updatedAt: new Date()
        }
      }
    )
  }
  
  // 计算新的点赞加分
  const newLikeBonus = Math.min(newLikes * 100, 5000000)
  
  // 更新频道文档中的点赞数和权重
  await db6.channels.updateOne(
    { username },
    {
      $set: {
        'stats.likes': newLikes,
        'weight.likeBonus': newLikeBonus,
        'weight.lastCalculated': new Date(),
        'weight.calculationReason': `管理员手动修改点赞数: ${newLikes}个赞 = +${newLikeBonus}权重`,
        updatedAt: new Date()
      }
    }
  )
  
  return success({ 
    username, 
    newLikes,
    likeBonus: newLikeBonus
  }, '点赞数更新成功')
})

/**
 * 切换频道启用/禁用状态
 * ⭐ 使用 meta.adminHidden 字段（管理员手动隐藏）
 * ⭐ meta.isActive 保留给爬虫使用（表示频道是否可访问）
 */
export const toggleChannelStatus = withServerAction(async (username) => {
  if (!username) {
    return error('缺少频道用户名')
  }
  
  await connectDB6()
  
  // 获取当前状态
  const channel = await db6.channels.findOne({ username })
  if (!channel) {
    return error('频道不存在')
  }
  
  // ⭐ 使用 adminHidden 字段（默认 false = 不隐藏）
  const currentHidden = channel.meta?.adminHidden ?? false
  const newHidden = !currentHidden
  
  // 更新状态
  await db6.channels.updateOne(
    { username },
    {
      $set: {
        'meta.adminHidden': newHidden,  // ⭐ 管理员隐藏标记
        updatedAt: new Date()
      }
    }
  )
  
  return success({ 
    username, 
    isActive: !newHidden  // 返回"是否启用"（隐藏的反义）
  }, `频道已${newHidden ? '禁用' : '启用'}`)
})

/**
 * 批量降权 Server Action - ⭐ 支持多次降权
 * 按照百分比降低权重
 * 
 * 改进：
 * - 允许多次降权（每次基于当前权重）
 * - 保留完整的降权历史记录
 * - 记录最初的原始权重（用于恢复）
 * 
 * @param {Array<string>} usernames - 频道用户名数组
 * @param {number} percentage - 降权百分比 (0-100)，如 50 表示降低 50%
 */
export const batchDemoteChannels = withServerAction(async ({ usernames, percentage }) => {
  if (!Array.isArray(usernames) || usernames.length === 0) {
    return error('未选择频道')
  }
  
  if (percentage <= 0 || percentage > 100) {
    return error('降权百分比必须在 1-100 之间')
  }
  
  await connectDB6()
  
  const results = {
    success: [],
    failed: []
  }
  
  for (const username of usernames) {
    try {
      const channel = await db6.channels.findOne({ username })
      
      if (!channel) {
        results.failed.push({ username, reason: '频道不存在' })
        continue
      }
      
      const currentWeight = channel.weight?.value || 0
      const demotedWeight = Math.floor(currentWeight * (100 - percentage) / 100)
      
      // ⭐ 首次降权：记录原始权重
      const isFirstDemote = !channel.weight?.demoted
      const originalWeight = isFirstDemote ? currentWeight : (channel.weight?.originalWeight || currentWeight)
      
      // ⭐ 构建降权历史记录
      const demoteHistory = channel.weight?.demoteHistory || []
      demoteHistory.push({
        percentage,
        method: 'admin_batch',
        appliedAt: new Date(),
        beforeWeight: currentWeight,
        afterWeight: demotedWeight
      })
      
      // ⭐ 更新数据库
      await db6.channels.updateOne(
        { username },
        {
          $set: {
            'weight.originalWeight': originalWeight,  // 最初的权重（只在首次设置）
            'weight.value': demotedWeight,            // 降权后的新权重
            'weight.demoted': true,                   // 标记为已降权
            'weight.demoteHistory': demoteHistory,    // 完整的降权历史
            'weight.lastDemoteAt': new Date(),        // 最后降权时间
            'weight.demoteCount': demoteHistory.length,  // 降权次数
            'weight.lastCalculated': new Date(),
            'weight.calculationReason': `管理员批量降权 ${percentage}% (第${demoteHistory.length}次)`,
            updatedAt: new Date()
          }
        }
      )
      
      results.success.push({ 
        username, 
        name: channel.name,
        oldWeight: currentWeight,
        newWeight: demotedWeight,
        demoteCount: demoteHistory.length,
        isFirstDemote
      })
      
    } catch (error) {
      results.failed.push({ username, reason: error.message })
    }
  }
  
  return success(results, `批量降权完成: 成功 ${results.success.length} 个，失败 ${results.failed.length} 个`)
})

/**
 * 批量增加权重 Server Action
 * 按照百分比或固定值增加权重
 * 
 * @param {Array<string>} usernames - 频道用户名数组
 * @param {number} amount - 增加的数值
 * @param {string} mode - 增加模式：'percentage'（百分比）或 'fixed'（固定值）
 */
export const batchPromoteChannels = withServerAction(async ({ usernames, amount, mode = 'percentage' }) => {
  if (!Array.isArray(usernames) || usernames.length === 0) {
    return error('未选择频道')
  }
  
  if (amount <= 0) {
    return error(mode === 'percentage' ? '增加百分比必须大于 0' : '增加值必须大于 0')
  }
  
  if (mode === 'percentage' && amount > 1000) {
    return error('增加百分比不能超过 1000%')
  }
  
  await connectDB6()
  
  const results = {
    success: [],
    failed: []
  }
  
  for (const username of usernames) {
    try {
      const channel = await db6.channels.findOne({ username })
      
      if (!channel) {
        results.failed.push({ username, reason: '频道不存在' })
        continue
      }
      
      const originalWeight = channel.weight?.value || 0
      let newWeight
      
      if (mode === 'percentage') {
        // 百分比模式：增加 X%
        newWeight = Math.floor(originalWeight * (100 + amount) / 100)
      } else {
        // 固定值模式：直接增加数值
        newWeight = originalWeight + amount
      }
      
      await db6.channels.updateOne(
        { username },
        {
          $set: {
            'weight.value': newWeight,
            'weight.lastCalculated': new Date(),
            'weight.calculationReason': mode === 'percentage' 
              ? `管理员批量增加权重 ${amount}%`
              : `管理员批量增加权重 +${amount}`,
            updatedAt: new Date()
          }
        }
      )
      
      results.success.push({ 
        username, 
        name: channel.name,
        oldWeight: originalWeight,
        newWeight: newWeight,
        increased: newWeight - originalWeight
      })
      
    } catch (error) {
      results.failed.push({ username, reason: error.message })
    }
  }
  
  return success(results, `批量增加权重完成: 成功 ${results.success.length} 个，失败 ${results.failed.length} 个`)
})

/**
 * 批量恢复权重 Server Action - ⭐ 恢复到最初的原始权重
 * 一次性清除所有降权记录，恢复到最初状态
 * 
 * 改进：
 * - 恢复到最初的原始权重（而非最近一次降权前的权重）
 * - 清除所有降权历史
 * - 记录恢复信息
 * 
 * @param {Array<string>} usernames - 频道用户名数组
 */
export const batchRestoreChannels = withServerAction(async ({ usernames }) => {
  if (!Array.isArray(usernames) || usernames.length === 0) {
    return error('未选择频道')
  }
  
  await connectDB6()
  
  const results = {
    success: [],
    failed: [],
    skipped: []
  }
  
  for (const username of usernames) {
    try {
      const channel = await db6.channels.findOne({ username })
      
      if (!channel) {
        results.failed.push({ username, reason: '频道不存在' })
        continue
      }
      
      // 如果没有降权过，跳过
      if (!channel.weight?.demoted) {
        results.skipped.push({ username, reason: '未降权过' })
        continue
      }
      
      // ⭐ 获取最初的原始权重
      const originalWeight = channel.weight?.originalWeight || channel.weight?.beforeDemote || channel.weight?.value || 0
      const currentWeight = channel.weight?.value || 0
      const demoteCount = channel.weight?.demoteCount || 0
      
      // ⭐ 清除所有降权记录，恢复到最初状态
      await db6.channels.updateOne(
        { username },
        {
          $set: {
            'weight.value': originalWeight,
            'weight.lastCalculated': new Date(),
            'weight.calculationReason': `管理员恢复权重（清除${demoteCount}次降权）`,
            updatedAt: new Date()
          },
          $unset: {
            'weight.originalWeight': '',
            'weight.beforeDemote': '',
            'weight.demoted': '',
            'weight.demoteConfig': '',
            'weight.demoteHistory': '',
            'weight.lastDemoteAt': '',
            'weight.demoteCount': ''
          }
        }
      )
      
      results.success.push({ 
        username,
        name: channel.name,
        restoredWeight: originalWeight,
        beforeRestoreWeight: currentWeight,
        clearedDemoteCount: demoteCount
      })
      
    } catch (error) {
      results.failed.push({ username, reason: error.message })
    }
  }
  
  return success(results, `批量恢复完成: 成功 ${results.success.length} 个，跳过 ${results.skipped.length} 个，失败 ${results.failed.length} 个`)
})

/**
 * 批量添加频道
 * ⭐ 保持与 BotSearchCrawler 一致的数据结构
 * ⭐ 支持多种输入格式，一次添加多个频道
 */
export const addChannels = withServerAction(async ({ usernames }) => {
  if (!usernames || !usernames.trim()) {
    return error('请输入至少一个频道用户名')
  }
  
  await connectDB6()
  
  // 解析输入：支持换行、逗号、空格分隔
  const lines = usernames.split(/[\n,\s]+/).filter(line => line.trim())
  
  if (lines.length === 0) {
    return error('请输入至少一个频道用户名')
  }
  
  const results = {
    success: [],
    failed: [],
    skipped: []
  }
  
  for (const line of lines) {
    const input = line.trim()
    if (!input) continue
    
    // 提取 username（支持多种格式）
    let cleanUsername = input.toLowerCase()
    
    // 移除 https://t.me/ 或 http://t.me/ 或 t.me/
    cleanUsername = cleanUsername.replace(/^https?:\/\/t\.me\//, '')
    cleanUsername = cleanUsername.replace(/^t\.me\//, '')
    
    // 移除 @
    cleanUsername = cleanUsername.replace(/^@/, '')
    
    // 验证格式
    if (!/^[a-z0-9_]+$/.test(cleanUsername)) {
      results.failed.push({
        input,
        reason: '格式无效（只能包含字母、数字、下划线）'
      })
      continue
    }
    
    if (cleanUsername.length < 5) {
      results.failed.push({
        input,
        reason: '用户名至少需要5个字符'
      })
      continue
    }
    
    // 检查是否已存在
    const existing = await db6.channels.findOne({ username: cleanUsername })
    if (existing) {
      results.skipped.push({
        username: cleanUsername,
        reason: '已存在'
      })
      continue
    }
    
    try {
      // ⭐ 按照 BotSearchCrawler 的数据结构创建频道
      const channelDoc = {
        username: cleanUsername,
        entityType: 'channel',
        
        // === PreviewCrawler 负责的字段（初始化为 null）===
        name: null,
        description: null,
        avatar: null,
        
        // ⭐ 统计信息
        stats: {
          members: null,
          memberHistory: [],
          likes: 0,
          growth: {
            last7Days: 0,
            last30Days: 0,
            avgDailyGrowth: 0,
            growthRate: 0,
            isGrowing: false,
            lastCalculated: null
          }
        },
        
        // ⭐ 权重
        weight: {
          value: 0,
          baseWeight: 0,
          growthBonus: 0,
          abnormalPenalty: 0,
          likeBonus: 0,
          lastCalculated: null,
          calculationReason: '手动添加'
        },
        
        // === NetworkCrawler 负责的字段 ===
        discoveredLinks: [],
        
        crawlState: {
          lastMessageId: null,
          lastCrawlTime: null,
          isIndexChannel: null,
          totalMessagesRead: null
        },
        
        quality: {
          discoveredChannels: 0,
          qualityScore: 0,
          lastCalculated: null
        },
        
        // === 元数据 ===
        meta: {
          firstDiscoveredAt: new Date(),
          firstDiscoveredFrom: 'manual_admin',
          isActive: true,
          adminHidden: false,
          lastNetworkCrawl: null,
          previewCrawl: {
            lastChecked: null,
            lastSuccess: null,
            consecutiveFailures: 0
          }
        },
        
        // === 数据源标记 ===
        dataSources: {
          networkCrawler: {
            hasData: false,
            lastCrawl: null
          },
          previewPage: {
            hasData: false,  // ⭐ 标记为待爬取
            lastCrawl: null,
            firstUpdate: null,
            hasAvatar: false
          }
        },
        
        lastChecked: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      // 插入数据库
      await db6.channels.insertOne(channelDoc)
      
      results.success.push(cleanUsername)
    } catch (err) {
      results.failed.push({
        input,
        reason: err.message
      })
    }
  }
  
  // 构建结果消息
  const messages = []
  if (results.success.length > 0) {
    messages.push(`✅ 成功添加 ${results.success.length} 个频道`)
  }
  if (results.skipped.length > 0) {
    messages.push(`⏭️ 跳过 ${results.skipped.length} 个已存在的频道`)
  }
  if (results.failed.length > 0) {
    messages.push(`❌ ${results.failed.length} 个频道添加失败`)
  }
  
  return success({
    results,
    summary: {
      total: lines.length,
      success: results.success.length,
      skipped: results.skipped.length,
      failed: results.failed.length
    }
  }, messages.join('，'))
})

/**
 * 搜索频道（管理后台版本）
 * ⭐ 修复：添加 stats 字段，保持与 getAdminChannelsData 一致
 */
export const searchAdminChannels = withServerAction(async ({ 
  keyword = '', 
  page = 1, 
  pageSize = 20,
  sortBy = 'weight.value',
  showDisabled = true
} = {}) => {
  await connectDB6()
  
  // ⭐ 构建查询条件（使用 adminHidden 字段）
  const query = {}
  
  // 根据显示设置构建基础查询
  if (!showDisabled) {
    query.$and = [{
      $or: [
        { 'meta.adminHidden': { $exists: false } },
        { 'meta.adminHidden': false }
      ]
    }]
  }
  
  // 搜索频道名称或用户名
  if (keyword.trim()) {
    const searchCondition = {
      $or: [
        { name: { $regex: keyword.trim(), $options: 'i' } },
        { username: { $regex: keyword.trim(), $options: 'i' } }
      ]
    }
    
    if (query.$and) {
      query.$and.push(searchCondition)
    } else {
      Object.assign(query, searchCondition)
    }
  }
  
  const skip = (page - 1) * pageSize
  
  // ⭐ 并行查询：频道列表 + 搜索总数 + 全局统计
  const [channels, totalCount, stats] = await Promise.all([
    db6.channels
      .find(query)
      .sort({ [sortBy]: -1 })
      .skip(skip)
      .limit(pageSize)
      .toArray(),
    
    db6.channels.countDocuments(query),
    
    // ⭐ 统计信息（始终查询所有频道，不受搜索影响）
    db6.channels.aggregate([
      { $match: {} },  // 空条件，查询所有频道
      { 
        $group: { 
          _id: null, 
          total: { $sum: 1 },
          totalMembers: { $sum: '$stats.members' },
          activeCount: {
            $sum: { $cond: [
              { $or: [
                { $eq: ['$meta.adminHidden', false] },
                { $not: ['$meta.adminHidden'] }
              ]}, 
              1, 
              0 
            ]}
          },
          disabledCount: {
            $sum: { $cond: [{ $eq: ['$meta.adminHidden', true] }, 1, 0] }
          }
        } 
      }
    ]).toArray()
  ])
  
  // 转换头像路径
  const channelsWithAvatarUrl = channels.map(channel => ({
    ...channel,
    avatar: channel.avatar && !channel.avatar.startsWith('http') 
      ? `/api/avatar/${channel.avatar}`
      : channel.avatar
  }))
  
  // 序列化数据
  const serializedChannels = JSON.parse(JSON.stringify(channelsWithAvatarUrl))
  const serializedStats = stats?.[0] || { 
    total: 0, 
    totalMembers: 0,
    activeCount: 0,
    disabledCount: 0
  }
  
  return success({
    channels: serializedChannels,
    stats: serializedStats,  // ⭐ 添加 stats 字段
    pagination: {
      page,
      pageSize,
      total: totalCount,  // 注意：这是搜索结果的总数，不是全部频道总数
      hasMore: skip + pageSize < totalCount
    },
    keyword: keyword.trim()
  }, '搜索完成')
})

/**
 * 获取语言统计信息
 * 分析所有频道的语言分布
 */
export const getLanguageStatistics = withServerAction(async () => {
  await connectDB6()
  
  // 检测字符串是否包含中文
  const hasChinese = (str) => {
    if (!str) return false
    return /[\u4e00-\u9fa5]/.test(str)
  }
  
  // 检测语言类型（简化版）
  const detectLanguage = (name) => {
    if (!name) return 'other'
    
    // 中文
    if (hasChinese(name)) return 'zh'
    
    // 俄文（西里尔字母）
    if (/[\u0400-\u04FF]/.test(name)) return 'ru'
    
    // 阿拉伯文
    if (/[\u0600-\u06FF]/.test(name)) return 'ar'
    
    // 日文（假名）
    if (/[\u3040-\u309F\u30A0-\u30FF]/.test(name)) return 'ja'
    
    // 韩文
    if (/[\uAC00-\uD7AF]/.test(name)) return 'ko'
    
    // 泰文
    if (/[\u0E00-\u0E7F]/.test(name)) return 'th'
    
    // 越南文（带声调的拉丁字母）
    if (/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(name)) return 'vi'
    
    // 默认为英文（拉丁字母）
    return 'en'
  }
  
  // 获取所有频道
  const allChannels = await db6.channels.find({}).toArray()
  
  // 按语言分组统计
  const languageStats = {}
  
  allChannels.forEach(channel => {
    const lang = detectLanguage(channel.name)
    
    if (!languageStats[lang]) {
      languageStats[lang] = {
        code: lang,
        count: 0,
        totalWeight: 0,
        totalMembers: 0,
        channels: []
      }
    }
    
    languageStats[lang].count++
    languageStats[lang].totalWeight += channel.weight?.value || 0
    languageStats[lang].totalMembers += channel.stats?.members || 0
    languageStats[lang].channels.push(channel.username)
  })
  
  // 转换为数组并排序（按频道数量降序）
  const languages = Object.values(languageStats)
    .sort((a, b) => b.count - a.count)
  
  return success({
    languages,
    total: allChannels.length
  }, '语言统计完成')
})

/**
 * 批量语言降权
 * 根据语言类型，批量降低该语言所有频道的权重
 */
export const batchLanguageDemote = withServerAction(async ({ 
  languageCode,  // 语言代码（如 'en', 'ru', 'ja'）
  demotePercent  // 降权百分比（如 90 表示降权90%，保留10%）
}) => {
  await connectDB6()
  
  // 检测字符串是否包含中文
  const hasChinese = (str) => {
    if (!str) return false
    return /[\u4e00-\u9fa5]/.test(str)
  }
  
  // 检测语言类型
  const detectLanguage = (name) => {
    if (!name) return 'other'
    if (hasChinese(name)) return 'zh'
    if (/[\u0400-\u04FF]/.test(name)) return 'ru'
    if (/[\u0600-\u06FF]/.test(name)) return 'ar'
    if (/[\u3040-\u309F\u30A0-\u30FF]/.test(name)) return 'ja'
    if (/[\uAC00-\uD7AF]/.test(name)) return 'ko'
    if (/[\u0E00-\u0E7F]/.test(name)) return 'th'
    if (/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(name)) return 'vi'
    return 'en'
  }
  
  // 获取所有频道
  const allChannels = await db6.channels.find({}).toArray()
  
  // 筛选出指定语言的频道
  const targetChannels = allChannels.filter(channel => {
    return detectLanguage(channel.name) === languageCode
  })
  
  if (targetChannels.length === 0) {
    return error('未找到该语言的频道')
  }
  
  // 计算降权系数
  const demoteFactor = (100 - demotePercent) / 100  // 例如：降权90% → 系数0.1
  
  // ⭐ 使用 bulkWrite 批量更新（分批处理，避免超时）
  const batchSize = 1000  // 每批处理1000个
  let updated = 0
  
  // 准备批量更新操作
  const bulkOps = targetChannels.map(channel => {
    const oldWeight = channel.weight?.value || 0
    const newWeight = Math.floor(oldWeight * demoteFactor)
    
    return {
      updateOne: {
        filter: { username: channel.username },
        update: { 
          $set: { 
            'weight.value': newWeight,
            'weight.lastUpdated': new Date(),
            'weight.demoted': true,
            'weight.demoteReason': `语言降权${demotePercent}%`,
            'meta.lastModified': new Date()
          } 
        }
      }
    }
  })
  
  // 分批执行批量更新
  for (let i = 0; i < bulkOps.length; i += batchSize) {
    const batch = bulkOps.slice(i, i + batchSize)
    const result = await db6.channels.bulkWrite(batch, { ordered: false })
    updated += result.modifiedCount
  }
  
  return success({
    updated,
    total: targetChannels.length,
    languageCode,
    demotePercent,
    demoteFactor
  }, `成功降权 ${updated} 个频道`)
})

