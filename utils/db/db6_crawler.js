/**
 * 爬虫数据库连接和配置 (ESM)
 * 
 * 数据库: 06_DB_crawler
 * 集合:
 *   - channels: 频道数据
 *   - accounts: Telegram 账号
 *   - crawl_logs: 爬取日志
 *   - searchKeywords: 搜索关键词
 *   - channelLikes: 频道点赞统计
 *   - channelLikeRecords: 点赞详细记录
 */
import { MongoClient } from "mongodb";

/**
 * 数据库 URI 和名称
 * 使用统一的 MONGODB_URI 环境变量
 * 通过数据库名称来隔离不同的数据库
 */
const crawlerDbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME_CRAWLER = "06_DB_crawler";

// 数据库客户端和集合（使用缓存避免 HMR 泄漏）
let cachedClient = null;
let cachedDb = null;
let crawlerChangeStream;

export let db6 = {};

/**
 * 连接爬虫数据库（HMR 安全）
 */
export async function connectDB6() {
  // 检查缓存的连接是否有效
  if (cachedDb && cachedClient?.topology?.isConnected()) {
    // ⭐ 更新 db6 的所有属性（而不是重新赋值）
    Object.assign(db6, cachedDb);
    return { client: cachedClient, db6 };
  }

  // 如果有旧连接但已断开，关闭它
  if (cachedClient) {
    try {
      await cachedClient.close();
      console.log("🔄 关闭旧的数据库连接");
    } catch (err) {
      console.warn('关闭旧连接失败:', err.message);
    }
  }

  try {
    // 创建新连接
    cachedClient = new MongoClient(crawlerDbUri, {
      maxPoolSize: 10,
      minPoolSize: 2,
    });

    await cachedClient.connect();
    console.log("✅ 成功连接到爬虫数据库 (06_DB_crawler)");

    // 初始化集合
    const dbInstance = cachedClient.db(DB_NAME_CRAWLER);
    
    cachedDb = {
      channels: dbInstance.collection("channels"),                      // 频道集合
      accounts: dbInstance.collection("accounts"),                      // 账号集合
      crawlLogs: dbInstance.collection("crawl_logs"),                   // 爬取日志集合
      searchKeywords: dbInstance.collection("searchKeywords"),          // 搜索关键词集合
      channelLikes: dbInstance.collection("channelLikes"),              // 频道点赞统计集合
      channelLikeRecords: dbInstance.collection("channelLikeRecords"),  // 点赞详细记录集合
      demoteKeywords: dbInstance.collection("demoteKeywords"),          // 降权关键词集合
    };
    
    // ⭐ 更新 db6 的所有属性（保持引用不变）
    Object.assign(db6, cachedDb);
    
    return { client: cachedClient, db6 };
  } catch (error) {
    console.error("❌ 连接到爬虫数据库失败:", error);
    throw error;
  }
}

/**
 * 获取数据库客户端（向后兼容）
 */
export function getClient6() {
  return cachedClient;
}

// ⚠️ 为了向后兼容，导出一个 Proxy 对象
export const client6 = new Proxy({}, {
  get(target, prop) {
    if (!cachedClient) {
      throw new Error('数据库未连接，请先调用 connectDB6()');
    }
    return cachedClient[prop];
  }
});

/**
 * 获取爬虫数据库的 Change Stream 监听器
 */
export function getCrawlerChangeStream() {
  return crawlerChangeStream;
}

/**
 * 确保数据库已连接（辅助函数）
 */
export async function ensureConnected() {
  if (!cachedClient?.topology?.isConnected()) {
    await connectDB6();
  }
  return db6;
} 