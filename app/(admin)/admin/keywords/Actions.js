'use server'

import { MongoClient, ObjectId } from 'mongodb'

const MONGODB_URI = process.env.MONGODB_URI
const DB_NAME = process.env.DB_NAME

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
 * 获取所有关键词
 */
export async function getKeywords() {
  try {
    const client = await connectDB()
    const db = client.db(DB_NAME)

    const keywords = await db
      .collection('demoteKeywords')
      .find({})
      .sort({ createdAt: -1 })
      .toArray()

    // 统计
    const stats = {
      total: keywords.length,
      active: keywords.filter((k) => k.status === 'active').length,
      disabled: keywords.filter((k) => k.status === 'disabled').length
    }

    // 转换 _id 为字符串
    const serializedKeywords = keywords.map((k) => ({
      ...k,
      _id: k._id.toString(),
      createdAt: k.createdAt.toISOString(),
      updatedAt: k.updatedAt.toISOString()
    }))

    return {
      success: true,
      data: {
        keywords: serializedKeywords,
        stats
      }
    }
  } catch (error) {
    console.error('获取关键词失败:', error)
    return { success: false, message: error.message }
  }
}

/**
 * 添加单个关键词
 */
export async function addKeyword(keyword, demotePercent = 65) {
  try {
    const client = await connectDB()
    const db = client.db(DB_NAME)

    // 检查是否已存在
    const existing = await db
      .collection('demoteKeywords')
      .findOne({ keyword: keyword.trim() })

    if (existing) {
      return { success: false, message: `关键词"${keyword}"已存在` }
    }

    // 插入
    const result = await db.collection('demoteKeywords').insertOne({
      keyword: keyword.trim(),
      demotePercent: parseInt(demotePercent),
      status: 'active',
      matchCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'admin'
    })

    return {
      success: true,
      message: '添加成功',
      data: { id: result.insertedId.toString() }
    }
  } catch (error) {
    console.error('添加关键词失败:', error)
    return { success: false, message: error.message }
  }
}

/**
 * 批量添加关键词
 */
export async function addKeywordsBatch(keywords, demotePercent = 65) {
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
      .collection('demoteKeywords')
      .find({ keyword: { $in: uniqueKeywords } })
      .toArray()

    const existingKeywords = existing.map((k) => k.keyword)
    const newKeywords = uniqueKeywords.filter(
      (k) => !existingKeywords.includes(k)
    )

    if (newKeywords.length === 0) {
      return {
        success: false,
        message: `所有关键词都已存在（${existingKeywords.join(', ')}）`
      }
    }

    // 批量插入
    const docs = newKeywords.map((keyword) => ({
      keyword,
      demotePercent: parseInt(demotePercent),
      status: 'active',
      matchCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'admin'
    }))

    const result = await db.collection('demoteKeywords').insertMany(docs)

    let message = `成功添加 ${result.insertedCount} 个关键词`
    if (existingKeywords.length > 0) {
      message += `\n已跳过 ${existingKeywords.length} 个已存在的关键词：${existingKeywords.join(', ')}`
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
    console.error('批量添加关键词失败:', error)
    return { success: false, message: error.message }
  }
}

/**
 * 更新关键词
 */
export async function updateKeyword(id, keyword, demotePercent) {
  try {
    const client = await connectDB()
    const db = client.db(DB_NAME)

    // 检查新关键词是否与其他关键词重复
    const existing = await db.collection('demoteKeywords').findOne({
      keyword: keyword.trim(),
      _id: { $ne: new ObjectId(id) }
    })

    if (existing) {
      return { success: false, message: `关键词"${keyword}"已存在` }
    }

    const result = await db.collection('demoteKeywords').updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          keyword: keyword.trim(),
          demotePercent: parseInt(demotePercent),
          updatedAt: new Date()
        }
      }
    )

    if (result.matchedCount === 0) {
      return { success: false, message: '关键词不存在' }
    }

    return { success: true, message: '更新成功' }
  } catch (error) {
    console.error('更新关键词失败:', error)
    return { success: false, message: error.message }
  }
}

/**
 * 切换关键词状态
 */
export async function toggleKeywordStatus(id) {
  try {
    const client = await connectDB()
    const db = client.db(DB_NAME)

    const keyword = await db
      .collection('demoteKeywords')
      .findOne({ _id: new ObjectId(id) })

    if (!keyword) {
      return { success: false, message: '关键词不存在' }
    }

    const newStatus = keyword.status === 'active' ? 'disabled' : 'active'

    await db.collection('demoteKeywords').updateOne(
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
      message: newStatus === 'active' ? '已启用' : '已禁用'
    }
  } catch (error) {
    console.error('切换状态失败:', error)
    return { success: false, message: error.message }
  }
}

/**
 * 删除关键词
 */
export async function deleteKeyword(id) {
  try {
    const client = await connectDB()
    const db = client.db(DB_NAME)

    const result = await db
      .collection('demoteKeywords')
      .deleteOne({ _id: new ObjectId(id) })

    if (result.deletedCount === 0) {
      return { success: false, message: '关键词不存在' }
    }

    return { success: true, message: '删除成功' }
  } catch (error) {
    console.error('删除关键词失败:', error)
    return { success: false, message: error.message }
  }
}

/**
 * 获取启用的关键词（用于 PreviewCrawler）
 */
export async function getActiveKeywords() {
  try {
    const client = await connectDB()
    const db = client.db(DB_NAME)

    const keywords = await db
      .collection('demoteKeywords')
      .find({ status: 'active' })
      .toArray()

    return {
      success: true,
      data: keywords.map((k) => ({
        keyword: k.keyword,
        demotePercent: k.demotePercent
      }))
    }
  } catch (error) {
    console.error('获取启用关键词失败:', error)
    return { success: false, message: error.message, data: [] }
  }
}

