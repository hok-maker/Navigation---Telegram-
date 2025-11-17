/**
 * 联盟设置数据库连接和配置
 */
import { MongoClient } from 'mongodb';
import debug from 'debug';
// Next.js 自动加载 .env 文件，无需 dotenv

const debugDB3 = { log: debug('DB3') };

/**
 * 数据库 URI 和名称
 * 使用统一的MONGODB_URI
 * 通过数据库名称来隔离不同的数据库
 * 该文件的命名:03_DB_Fed
 * 03 为前缀,方便我将所有同类项数据库放在一起
 * DB 为后缀,防止命名过于通用与其他文件冲突
 * Fed 为数据库名称,方便我们区分不同的数据库
 */
const allianceDbUri = process.env.MONGODB_URI; // 使用统一的MONGODB_URI
const DB_NAME_ALLIANCE = "03_DB_Fed"; // 数据库名称区分数据库**重要**

// 数据库客户端和集合
export const client3 = new MongoClient(allianceDbUri);
export const db3 = {};
let allianceChangeStream;

/**
 * 连接联盟设置数据库
 */
export async function connectDB3() {
  try {
    await client3.connect();
    console.log('成功连接到 联盟设置数据库');
    db3.Reports = client3.db(DB_NAME_ALLIANCE).collection('Reports'); // 老师报告
    db3.draftReports = client3.db(DB_NAME_ALLIANCE).collection('draftReports'); // 编辑中报告
    db3.similarReports = client3.db(DB_NAME_ALLIANCE).collection('similarReports'); // 查重结构

    // 联盟设置
    db3.shezhi = client3.db(DB_NAME_ALLIANCE).collection('shezhi'); // 设置集合
    // 用户资料
    db3.upAdmins = client3.db(DB_NAME_ALLIANCE).collection('upAdmins'); // 上级管理员
    db3.FedAdmins = client3.db(DB_NAME_ALLIANCE).collection('FedAdmins'); // 联盟管理员
    db3.Fedteachers = client3.db(DB_NAME_ALLIANCE).collection('Fedteachers'); // 联盟教师集合
    // 搜索APP
    db3.SearchTags = client3.db(DB_NAME_ALLIANCE).collection('SearchTags'); // 搜索标签集合
    db3.fenGroups = client3.db(DB_NAME_ALLIANCE).collection('fenGroups'); // 联盟群组集合
   // 设置数据库级别的 Change Stream 监听器
    allianceChangeStream = client3.db(DB_NAME_ALLIANCE).watch();
    debugDB3.log('联盟设置数据库 Change Stream 已设置');
  } catch (error) {
    console.error('连接到 联盟设置数据库 失败:', error);
  }
}

/**
 * 获取联盟设置数据库的 Change Stream 监听器
 */
export function getAllianceChangeStream() {
  return allianceChangeStream;
} 