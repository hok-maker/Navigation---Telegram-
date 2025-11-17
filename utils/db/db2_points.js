/**
 * 积分数据库连接和配置
 */
import { MongoClient } from 'mongodb';
import debug from 'debug';
// Next.js 自动加载 .env 文件，无需 dotenv

const debugDB2 = { log: debug('DB2') };

/**
 * 数据库 URI 和名称
 * 使用统一的MONGODB_URI
 * 通过数据库名称来隔离不同的数据库
 * 该文件的命名:02_DB_Points
 * 02 为前缀,方便我将所有同类项数据库放在一起
 * 02 代表是该程序独享的数据库
 * DB 为后缀,防止命名过于通用与其他文件冲突
 * Points 为数据库名称,方便我们区分不同的数据库
 */
const pointsDbUri = process.env.MONGODB_URI; // 使用统一的MONGODB_URI
const DB_NAME_POINTS = "02_DB_Points"; // 数据库名称区分数据库**重要**

// 数据库客户端和集合
const client2 = new MongoClient(pointsDbUri);
export const db2 = {};
let pointsChangeStream;

/**
 * 连接积分数据库
 */
export async function connectDB2() {
  try {
    await client2.connect();
    console.log('成功连接到 积分服务器');

    // 初始化集合
    db2.messageCounts = client2.db(DB_NAME_POINTS).collection('messageCounts'); // 发言数集合
    db2.BackupmessageCounts = client2.db(DB_NAME_POINTS).collection('BackupmessageCounts'); // 发言数备份集合
    db2.dailyUserStats = client2.db(DB_NAME_POINTS).collection('dailyUserStats'); // 每日积分集合
    db2.dailyGroupStats = client2.db(DB_NAME_POINTS).collection('dailyGroupStats'); // 每日积分集合

    // 设置数据库级别的 Change Stream 监听器
    pointsChangeStream = client2.db(DB_NAME_POINTS).watch();
    debugDB2.log('积分数据库 Change Stream 已设置');
  } catch (error) {
    console.error('连接到 积分服务器 失败:', error);
  }
}

/**
 * 获取积分数据库的 Change Stream 监听器
 */
export function getPointsChangeStream() {
  return pointsChangeStream;
} 