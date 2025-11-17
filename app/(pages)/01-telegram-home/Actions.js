'use server'

import { 
  withServerAction, 
  success, 
  error, 
  db6, 
  connectDB6,
  // 安全工具
  checkLikeRateLimit,
  checkSearchRateLimit,
  sanitizeSearchKeyword,
  validateUsername,
  validateFingerprint,
  validatePage,
  validatePageSize,
  validateSortBy
} from '@/utils'
import { 
  getCachedChannels, 
  setCachedChannels, 
  clearAllChannelsCache,
  getCachedSearch,
  setCachedSearch
} from '@/utils/cache/channelCache.js'
import { initServices } from '@/service/initServices.js'

// ⭐ 自动初始化服务（Redis等）
// 在模块加载时立即执行，确保缓存系统可用
initServices().catch(err => {
  console.error('⚠️ 服务初始化失败（已降级）:', err.message)
})

/**
 * 通过用户名获取单个频道
 * ⭐ 供 02-channel-share 模块使用（独立分享页面）
 * ⚠️ 01 模块不再使用此函数
 */
export const getChannelByUsername = withServerAction(async (username) => {
  if (!username) {
    return error('缺少频道用户名参数')
  }

  await connectDB6()
  
  // 查询指定频道
  const channel = await db6.channels.findOne({
    username: username.toLowerCase().replace('@', ''),
    'meta.isActive': true
  })

  if (!channel) {
    return error('未找到该频道')
  }

  // 转换头像路径
  const channelWithAvatarUrl = {
    ...channel,
    avatar: channel.avatar && !channel.avatar.startsWith('http') 
      ? `/api/avatar/${channel.avatar}`
      : channel.avatar
  }

  // 序列化数据
  const serializedChannel = JSON.parse(JSON.stringify(channelWithAvatarUrl))

  return success({
    channel: serializedChannel,
    shareMode: true
  }, '获取频道成功')
})

/**
 * 获取频道列表和统计数据（⭐ 分页优化版本 + 安全加固）
 * 符合规范：使用 withServerAction 包装，返回 success/error 格式
 */
export const getChannelsData = withServerAction(async ({ 
  page = 1, 
  pageSize = 20,
  sortBy = 'weight.value'
} = {}) => {
  // ⭐ 输入验证
  page = validatePage(page)
  pageSize = validatePageSize(pageSize)
  sortBy = validateSortBy(sortBy)
  
  // ⭐ 尝试从缓存获取（二级缓存：内存30s + Redis5min）
  const cachedData = await getCachedChannels({ sortBy, page, pageSize })
  if (cachedData) {
    console.log('🎯 从缓存读取频道列表')
    return success(cachedData, '获取频道数据成功（缓存）')
  }
  
  // 确保数据库已连接
  await connectDB6()
  
  const skip = (page - 1) * pageSize
  
  // 获取频道和统计
  const [channels, stats] = await Promise.all([
    // ⭐ 分页查询（只显示未被管理员隐藏的频道）
    // ⭐ 优化：只查询必要字段，减少数据传输量
    db6.channels
      .find({ 
        'meta.isActive': true,  // 爬虫维护：频道可访问
        $or: [
          { 'meta.adminHidden': { $exists: false } },  // 字段不存在（默认显示）
          { 'meta.adminHidden': false }                 // 或明确未隐藏
        ]
      })
      .project({
        // 只查询列表页需要的字段
        username: 1,
        name: 1,
        avatar: 1,
        description: 1,  // 前端会自动截断显示
        'stats.members': 1,
        'stats.posts': 1,
        'weight.value': 1,
        'meta.isVerified': 1,
        'meta.isActive': 1,
        createdAt: 1,
        updatedAt: 1
      })
      .sort({ [sortBy]: -1 })      // 按指定字段排序
      .skip(skip)                   // 跳过前面的页
      .limit(pageSize)              // 只取当前页
      .toArray(),
    
    // 获取总体统计（只查一次）
    db6.channels.aggregate([
      { $match: { 
        'meta.isActive': true,
        $or: [
          { 'meta.adminHidden': { $exists: false } },
          { 'meta.adminHidden': false }
        ]
      }},
      { 
        $group: { 
          _id: null, 
          total: { $sum: 1 },
          totalMembers: { $sum: '$stats.members' }
        } 
      }
    ]).toArray()
  ])

  // 转换头像路径：文件名 → API URL
  const channelsWithAvatarUrl = channels.map(channel => ({
    ...channel,
    avatar: channel.avatar && !channel.avatar.startsWith('http') 
      ? `/api/avatar/${channel.avatar}`
      : channel.avatar
  }))

  // 序列化数据（处理MongoDB ObjectId等特殊类型）
  const serializedChannels = JSON.parse(JSON.stringify(channelsWithAvatarUrl))
  const serializedStats = stats?.[0] || { total: 0, totalMembers: 0 }

  const result = {
    channels: serializedChannels,
    stats: serializedStats,
    pagination: {
      page,
      pageSize,
      total: serializedStats.total,
      hasMore: skip + pageSize < serializedStats.total
    }
  }
  
  // ⭐ 写入Redis缓存
  await setCachedChannels({ sortBy, page, pageSize }, result)
  
  return success(result, '获取频道数据成功')
})

/**
 * 搜索频道（⭐ 简化版 + 安全加固）
 * 符合规范：使用 withServerAction 包装，返回 success/error 格式
 */
export const searchChannels = withServerAction(async ({ 
  keyword = '', 
  page = 1, 
  pageSize = 20,
  sortBy = 'weight.value',
  fingerprint = null
} = {}) => {
  // ⭐ 输入验证和清洗
  page = validatePage(page)
  pageSize = validatePageSize(pageSize)
  sortBy = validateSortBy(sortBy)
  const cleanKeyword = sanitizeSearchKeyword(keyword)
  
  // ⭐ 搜索限流（可选：根据需要启用）
  // if (fingerprint && cleanKeyword) {
  //   const allowed = await checkSearchRateLimit(fingerprint)
  //   if (!allowed) {
  //     return error('搜索太频繁，请稍后再试', 'RATE_LIMIT')
  //   }
  // }
  
  // ⭐ 尝试从缓存获取（二级缓存）
  if (cleanKeyword) {
    const cachedData = await getCachedSearch({ keyword: cleanKeyword, page, pageSize })
    if (cachedData) {
      console.log('🎯 从缓存读取搜索结果')
      return success(cachedData, '搜索完成（缓存）')
    }
  }
  
  await connectDB6()
  
  // ⭐ 构建查询条件
  const query = {
    'meta.isActive': true,
    $or: [
      { 'meta.adminHidden': { $exists: false } },
      { 'meta.adminHidden': false }
    ]
  }
  
  // ⭐ 只搜索频道名称（已清洗，安全）
  if (cleanKeyword) {
    query.name = { $regex: cleanKeyword, $options: 'i' }
  }
  
  const skip = (page - 1) * pageSize
  
  // 并行查询：频道数据 + 总数
  const [channels, totalCount] = await Promise.all([
    db6.channels
      .find(query)
      .project({
        // ⭐ 优化：只查询必要字段
        username: 1,
        name: 1,
        avatar: 1,
        description: 1,
        'stats.members': 1,
        'stats.posts': 1,
        'weight.value': 1,
        'meta.isVerified': 1,
        'meta.isActive': 1,
        createdAt: 1,
        updatedAt: 1
      })
      .sort({ [sortBy]: -1 })
      .skip(skip)
      .limit(pageSize)
      .toArray(),
    
    db6.channels.countDocuments(query)
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
  
  const result = {
    channels: serializedChannels,
    pagination: {
      page,
      pageSize,
      total: totalCount,
      hasMore: skip + pageSize < totalCount
    },
    keyword: keyword.trim()
  }
  
  // ⭐ 写入Redis缓存（只缓存有关键词的搜索）
  if (keyword.trim()) {
    await setCachedSearch({ keyword: keyword.trim(), page, pageSize }, result)
  }
  
  return success(result, '搜索完成')
})

/**
 * 保存用户搜索关键词到数据库
 * 用于 BotSearchCrawler 自动搜索
 * 符合规范：使用 withServerAction 包装，返回 success/error 格式
 */
export const saveSearchKeyword = withServerAction(async (keyword) => {
  // 基本验证
  if (!keyword || typeof keyword !== 'string') {
    return error('关键词不能为空')
  }
  
  // 清理关键词（去空格，转小写）
  const cleanedKeyword = keyword.trim().toLowerCase()
  
  if (cleanedKeyword.length === 0) {
    return error('关键词不能为空')
  }
  
  if (cleanedKeyword.length > 50) {
    return error('关键词过长，最多50个字符')
  }
  
  // 确保数据库已连接
  await connectDB6()
  
  // 检查关键词是否已存在
  const existing = await db6.searchKeywords.findOne({ keyword: cleanedKeyword })
  
  if (existing) {
    // 关键词已存在，更新搜索次数和最后搜索时间
    await db6.searchKeywords.updateOne(
      { keyword: cleanedKeyword },
      { 
        $inc: { 'stats.totalSearches': 1 },  // 增加搜索次数
        $set: { 
          updatedAt: new Date(),
          'schedule.lastSearchAt': new Date()  // 更新最后搜索时间（用户搜索）
        }
      }
    )
    
    return success({ 
      keyword: cleanedKeyword,
      isNew: false 
    }, '关键词已记录')
  }
  
  // 新关键词，创建记录
  const now = new Date()
  const newKeyword = {
    keyword: cleanedKeyword,
    source: 'web_user_input',  // 来源：网页用户输入
    
    // 搜索状态
    status: 'active',
    priority: 3,  // 用户搜索的关键词优先级为中等
    
    // 定时调度（24小时搜索一次）
    schedule: {
      interval: 86400000,  // 24小时
      lastSearchAt: null,  // 机器人还未搜索
      nextSearchAt: now    // ⭐ 立即搜索！
    },
    
    // 搜索统计
    stats: {
      totalSearches: 1,  // 初始搜索次数
      totalChannelsFound: 0,
      newChannelsLastRun: 0,
      lastRunDuration: 0
    },
    
    // 机器人配置（默认使用 CJSY）
    bots: [
      {
        username: 'CJSY',
        enabled: true,
        lastSearchAt: null,
        stats: {
          totalSearches: 0,
          channelsFound: 0,
          avgChannelsPerSearch: 0,
          lastSuccess: null,
          lastError: null
        }
      }
    ],
    
    createdAt: now,
    updatedAt: now
  }
  
  await db6.searchKeywords.insertOne(newKeyword)
  
  return success({ 
    keyword: cleanedKeyword,
    isNew: true 
  }, '新关键词已添加到搜索队列')
})

/**
 * 获取所有频道（用于生成 sitemap）
 * 符合规范：使用 withServerAction 包装，返回 success/error 格式
 */
export const getAllChannels = withServerAction(async () => {
  await connectDB6()
  
  // ⭐ 获取所有活跃且未隐藏的频道（只需要 username 和 updatedAt）
  const channels = await db6.channels
    .find({ 
      'meta.isActive': true,
      $or: [
        { 'meta.adminHidden': { $exists: false } },
        { 'meta.adminHidden': false }
      ]
    })
    .project({ username: 1, updatedAt: 1 })
    .toArray()
  
  // 序列化数据
  const serializedChannels = JSON.parse(JSON.stringify(channels))
  
  return success({
    channels: serializedChannels
  }, '获取所有频道成功')
})

/**
 * 点赞频道（⭐ 安全加固版）
 * 符合规范：使用 withServerAction 包装，返回 success/error 格式
 */
export const likeChannel = withServerAction(async (username, fingerprint) => {
  // ⭐ 输入验证
  if (!validateUsername(username)) {
    return error('无效的频道用户名', 'INVALID_USERNAME')
  }
  
  if (!validateFingerprint(fingerprint)) {
    return error('无效的设备标识', 'INVALID_FINGERPRINT')
  }
  
  // ⭐ 点赞限流（防止恶意刷点赞）
  const allowed = await checkLikeRateLimit(fingerprint)
  if (!allowed) {
    return error('操作太频繁，请稍后再试', 'RATE_LIMIT')
  }
  
  // 确保数据库已连接
  await connectDB6()
  
  // 检查频道是否存在
  const channel = await db6.channels.findOne({ username })
  if (!channel) {
    return error('频道不存在')
  }
  
  // 查找或创建点赞记录
  let likeDoc = await db6.channelLikes.findOne({ channelUsername: username })
  
  if (!likeDoc) {
    // 首次点赞，创建统计文档（不再需要 likes 数组）
    likeDoc = {
      channelUsername: username,
      stats: {
        totalLikes: 0,
        uniqueDevices: 0,
        lastLikeAt: null
      },
      createdAt: new Date(),
      updatedAt: new Date()
    }
    await db6.channelLikes.insertOne(likeDoc)
  }
  
  // ⭐ V2: 从 channelLikeRecords 集合查询（O(1)）
  const existingLike = await db6.channelLikeRecords.findOne({
    channelUsername: username,
    fingerprint: fingerprint
  })
  
  if (existingLike) {
    // 已点赞，取消点赞
    // 1. 删除点赞记录
    await db6.channelLikeRecords.deleteOne({
      channelUsername: username,
      fingerprint: fingerprint
    })
    
    // 2. 更新统计
    await db6.channelLikes.updateOne(
      { channelUsername: username },
      {
        $inc: { 
          'stats.totalLikes': -1,
          'stats.uniqueDevices': -1
        },
        $set: { updatedAt: new Date() }
      }
    )
    
    // ⭐ 更新频道权重（减少点赞加分）
    await updateChannelWeightForLike(username, -1)
    
    // 4. 清除所有频道列表缓存（因为排序可能变化）
    await clearAllChannelsCache()
    
    return success({ 
      liked: false, 
      count: likeDoc.stats.totalLikes - 1 
    }, '已取消点赞')
  } else {
    // 未点赞，添加点赞
    // 1. 插入点赞记录
    await db6.channelLikeRecords.insertOne({
      channelUsername: username,
      fingerprint: fingerprint,
      likedAt: new Date()
    })
    
    // 2. 更新统计
    await db6.channelLikes.updateOne(
      { channelUsername: username },
      {
        $inc: { 
          'stats.totalLikes': 1,
          'stats.uniqueDevices': 1
        },
        $set: { 
          'stats.lastLikeAt': new Date(),
          updatedAt: new Date()
        }
      }
    )
    
    // ⭐ 更新频道权重（增加点赞加分）
    await updateChannelWeightForLike(username, 1)
    
    // 4. 清除所有频道列表缓存（因为排序可能变化）
    await clearAllChannelsCache()
    
    return success({ 
      liked: true, 
      count: likeDoc.stats.totalLikes + 1 
    }, '点赞成功')
  }
})

/**
 * 检查是否已点赞
 * 符合规范：使用 withServerAction 包装，返回 success/error 格式
 * 
 * ⭐ 修复逻辑：分两步查询
 * 1. 先查询频道的点赞文档（获取总点赞数）
 * 2. 再检查当前用户是否在 likes 数组中
 */
export const checkIfLiked = withServerAction(async (username, fingerprint) => {
  // ⭐ 输入验证
  if (!validateUsername(username)) {
    return error('无效的频道用户名', 'INVALID_USERNAME')
  }
  
  if (!validateFingerprint(fingerprint)) {
    return error('无效的设备标识', 'INVALID_FINGERPRINT')
  }
  
  await connectDB6()
  
  // ⭐ V2: 使用 channelLikeRecords 集合，O(1) 查询
  const [likeDoc, likeRecord] = await Promise.all([
    db6.channelLikes.findOne({ channelUsername: username }),
    db6.channelLikeRecords.findOne({ channelUsername: username, fingerprint: fingerprint })
  ])
  
  return success({ 
    liked: !!likeRecord,
    count: likeDoc?.stats?.totalLikes || 0
  })
})

/**
 * 更新频道权重（点赞影响）
 * 内部函数，不导出
 * 
 * ⭐ 使用增量更新，保留手动加分
 */
async function updateChannelWeightForLike(username, change) {
  // 获取频道当前权重
  const channel = await db6.channels.findOne({ username })
  if (!channel) return
  
  // 获取点赞数据
  const likeDoc = await db6.channelLikes.findOne({ channelUsername: username })
  const oldTotalLikes = likeDoc?.stats?.totalLikes || 0
  const newTotalLikes = oldTotalLikes + change
  
  // 计算旧的点赞加分
  // ⭐ 每1个赞 = +100权重，最多+5000000
  // 原因：Telegram 上订阅数容易造假（买僵尸粉），点赞更能反映真实质量
  const oldLikeBonus = Math.min(oldTotalLikes * 100, 5000000)
  
  // 计算新的点赞加分
  const newLikeBonus = Math.min(newTotalLikes * 100, 5000000)
  
  // 计算加分差值
  const likeBonusDelta = newLikeBonus - oldLikeBonus
  
  // ⭐ 使用 $inc 增量更新，保留手动加分
  await db6.channels.updateOne(
    { username },
    {
      $inc: {
        'weight.value': likeBonusDelta,  // ⭐ 增量更新，不覆盖
      },
      $set: {
        'weight.likeBonus': newLikeBonus,  // 记录点赞加分
        'weight.lastCalculated': new Date(),
        'weight.calculationReason': `点赞影响: ${newTotalLikes}个赞 = +${newLikeBonus}权重 (增量: ${likeBonusDelta > 0 ? '+' : ''}${likeBonusDelta})`,
        'stats.likes': newTotalLikes,  // 在频道文档中也记录点赞数
        updatedAt: new Date()
      }
    }
  )
}

