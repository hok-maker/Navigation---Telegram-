'use server'

import { MongoClient, ObjectId } from 'mongodb'

const MONGODB_URI = process.env.MONGODB_URI
const DB_NAME = '06_DB_crawler'  // 使用爬虫数据库

let cachedClient = null

async function connectDB() {
  if (cachedClient) {
    return cachedClient
  }

  const client = new MongoClient(MONGODB_URI)
  await client.connect()
  cachedClient = client
  return client
}

/**
 * 获取所有搜索关键词
 */
export async function getSearchKeywords() {
  try {
    const client = await connectDB()
    const db = client.db(DB_NAME)

    const keywords = await db
      .collection('searchKeywords')
      .find({})
      .sort({ priority: 1, createdAt: -1 })
      .toArray()

    // 统计
    const stats = {
      total: keywords.length,
      active: keywords.filter((k) => k.status === 'active').length,
      pending: keywords.filter((k) => k.status === 'pending').length,
      completed: keywords.filter((k) => k.status === 'completed').length
    }

    // 转换 _id 为字符串
    const serializedKeywords = keywords.map((k) => ({
      ...k,
      _id: k._id.toString(),
      createdAt: k.createdAt.toISOString(),
      updatedAt: k.updatedAt ? k.updatedAt.toISOString() : null,
      schedule: k.schedule ? {
        ...k.schedule,
        nextSearchAt: k.schedule.nextSearchAt ? k.schedule.nextSearchAt.toISOString() : null,
        lastSearchAt: k.schedule.lastSearchAt ? k.schedule.lastSearchAt.toISOString() : null
      } : null
    }))

    return {
      success: true,
      data: {
        keywords: serializedKeywords,
        stats
      }
    }
  } catch (error) {
    console.error('获取搜索关键词失败:', error)
    return { success: false, message: error.message }
  }
}

/**
 * 添加单个搜索关键词
 */
export async function addSearchKeyword(keyword, priority = 5) {
  try {
    const client = await connectDB()
    const db = client.db(DB_NAME)

    // 检查是否已存在
    const existing = await db
      .collection('searchKeywords')
      .findOne({ keyword: keyword.trim() })

    if (existing) {
      return { success: false, message: `关键词"${keyword}"已存在` }
    }

    // 插入（与 BotSearchCrawler 的 KeywordManager 结构一致）
    const now = new Date()
    const result = await db.collection('searchKeywords').insertOne({
      keyword: keyword.trim(),
      priority: parseInt(priority),
      status: 'active',
      source: 'admin',
      
      schedule: {
        lastSearchAt: null,
        nextSearchAt: now  // 立即搜索
      },
      
      stats: {
        totalSearches: 0,
        totalChannelsFound: 0,
        newChannelsLastRun: 0,
        lastRunDuration: 0
      },
      
      createdAt: now,
      updatedAt: now
    })

    return {
      success: true,
      message: '添加成功',
      data: { id: result.insertedId.toString() }
    }
  } catch (error) {
    console.error('添加搜索关键词失败:', error)
    return { success: false, message: error.message }
  }
}

/**
 * 批量添加搜索关键词
 */
export async function addSearchKeywordsBatch(keywords, priority = 5) {
  try {
    const client = await connectDB()
    const db = client.db(DB_NAME)

    // 去重
    const uniqueKeywords = [...new Set(keywords.map((k) => k.trim()))].filter(
      (k) => k
    )

    if (uniqueKeywords.length === 0) {
      return { success: false, message: '没有有效的关键词' }
    }

    // 检查已存在
    const existing = await db
      .collection('searchKeywords')
      .find({ keyword: { $in: uniqueKeywords } })
      .toArray()

    const existingKeywords = existing.map((k) => k.keyword)
    const newKeywords = uniqueKeywords.filter(
      (k) => !existingKeywords.includes(k)
    )

    if (newKeywords.length === 0) {
      return {
        success: false,
        message: `所有关键词都已存在（${existingKeywords.slice(0, 5).join(', ')}...）`
      }
    }

    // 批量插入（与 BotSearchCrawler 的 KeywordManager 结构一致）
    const now = new Date()
    const docs = newKeywords.map((keyword) => ({
      keyword,
      priority: parseInt(priority),
      status: 'active',
      source: 'admin',
      
      schedule: {
        lastSearchAt: null,
        nextSearchAt: now  // 立即搜索
      },
      
      stats: {
        totalSearches: 0,
        totalChannelsFound: 0,
        newChannelsLastRun: 0,
        lastRunDuration: 0
      },
      
      createdAt: now,
      updatedAt: now
    }))

    const result = await db.collection('searchKeywords').insertMany(docs)

    let message = `成功添加 ${result.insertedCount} 个关键词`
    if (existingKeywords.length > 0) {
      message += `\n已跳过 ${existingKeywords.length} 个已存在的关键词`
    }

    return {
      success: true,
      message,
      data: {
        addedCount: result.insertedCount,
        skippedCount: existingKeywords.length,
        skipped: existingKeywords
      }
    }
  } catch (error) {
    console.error('批量添加搜索关键词失败:', error)
    return { success: false, message: error.message }
  }
}

/**
 * 更新搜索关键词
 */
export async function updateSearchKeyword(id, keyword, priority) {
  try {
    const client = await connectDB()
    const db = client.db(DB_NAME)

    // 检查新关键词是否与其他关键词重复
    const existing = await db.collection('searchKeywords').findOne({
      keyword: keyword.trim(),
      _id: { $ne: new ObjectId(id) }
    })

    if (existing) {
      return { success: false, message: `关键词"${keyword}"已存在` }
    }

    const result = await db.collection('searchKeywords').updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          keyword: keyword.trim(),
          priority: parseInt(priority),
          updatedAt: new Date()
        }
      }
    )

    if (result.matchedCount === 0) {
      return { success: false, message: '关键词不存在' }
    }

    return { success: true, message: '更新成功' }
  } catch (error) {
    console.error('更新搜索关键词失败:', error)
    return { success: false, message: error.message }
  }
}

/**
 * 切换关键词状态（启用/暂停）
 */
export async function toggleSearchKeywordStatus(id) {
  try {
    const client = await connectDB()
    const db = client.db(DB_NAME)

    const keyword = await db
      .collection('searchKeywords')
      .findOne({ _id: new ObjectId(id) })

    if (!keyword) {
      return { success: false, message: '关键词不存在' }
    }

    const newStatus = keyword.status === 'active' ? 'pending' : 'active'

    await db.collection('searchKeywords').updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          status: newStatus,
          updatedAt: new Date()
        }
      }
    )

    return {
      success: true,
      message: newStatus === 'active' ? '已启用' : '已暂停'
    }
  } catch (error) {
    console.error('切换状态失败:', error)
    return { success: false, message: error.message }
  }
}

/**
 * 删除搜索关键词
 */
export async function deleteSearchKeyword(id) {
  try {
    const client = await connectDB()
    const db = client.db(DB_NAME)

    const result = await db
      .collection('searchKeywords')
      .deleteOne({ _id: new ObjectId(id) })

    if (result.deletedCount === 0) {
      return { success: false, message: '关键词不存在' }
    }

    return { success: true, message: '删除成功' }
  } catch (error) {
    console.error('删除搜索关键词失败:', error)
    return { success: false, message: error.message }
  }
}

