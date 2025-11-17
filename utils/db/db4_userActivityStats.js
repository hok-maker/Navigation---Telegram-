/**
 * 用户活跃度统计数据库连接和配置
 */
import { MongoClient } from 'mongodb';
import debug from 'debug';
// Next.js 自动加载 .env 文件，无需 dotenv

const debugDB4 = { log: debug('DB4') };

/**
 * 数据库 URI 和名称
 * 使用统一的MONGODB_URI
 * 通过数据库名称来隔离不同的数据库
 * 该文件的命名:04_DB_UserStats
 * 04 为前缀,方便我将所有同类项数据库放在一起
 * 04 代表是该程序独享的数据库
 * DB 为后缀,防止命名过于通用与其他文件冲突
 * UserStats 为数据库名称,方便我们区分不同的数据库
 */
const userActivityStatsDbUri = process.env.MONGODB_URI; // 使用统一的MONGODB_URI
const DB_NAME_USER_ACTIVITY_STATS = "04_DB_UserStats"; // 数据库名称区分数据库**重要**

// 数据库客户端和集合
const client4 = new MongoClient(userActivityStatsDbUri);
export const db4 = {};
let userActivityStatsChangeStream;

/**
 * 连接用户活跃度统计数据库
 */
export async function connectDB4() {
  try {
    await client4.connect();
    console.log('成功连接到 用户活跃度统计数据库');

    // 初始化集合
    db4.userActivityStats = client4.db(DB_NAME_USER_ACTIVITY_STATS).collection('userActivityStats'); // 用户活跃度统计集合

    // 设置数据库级别的 Change Stream 监听器
    userActivityStatsChangeStream = client4.db(DB_NAME_USER_ACTIVITY_STATS).watch();
    debugDB4.log('用户活跃度统计数据库 Change Stream 已设置');
  } catch (error) {
    console.error('连接到 用户活跃度统计数据库 失败:', error);
  }
}

/**
 * 获取用户活跃度统计数据库的 Change Stream 监听器
 */
export function getUserActivityStatsChangeStream() {
  return userActivityStatsChangeStream;
} 