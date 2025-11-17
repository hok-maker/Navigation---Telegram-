/**
 * 回声机器人数据库连接和配置
 */
import { MongoClient } from 'mongodb';
// Next.js 自动加载 .env 文件，无需 dotenv

/**
 * 数据库 URI 和名称
 * 使用统一的MONGODB_URI
 * 通过数据库名称来隔离不同的数据库
 * 该文件的命名:05_DB_EchoBot
 * 05 为前缀,方便我将所有同类项数据库放在一起
 * DB 为后缀,防止命名过于通用与其他文件冲突
 * EchoBot 为数据库名称,方便我们区分不同的数据库
 */
const echoBotDbUri = process.env.MONGODB_URI; // 使用统一的MONGODB_URI
const DB_NAME_ECHO_BOT = "05_DB_EchoBot"; // 数据库名称区分数据库**重要**

// 数据库客户端和集合
const clientEchoBot = new MongoClient(echoBotDbUri);
export const dbEchoBot = {};
let echoBotChangeStream;

/**
 * 连接回声机器人数据库
 */
export async function connectEchoBotDB() {
  try {
    await clientEchoBot.connect();
    console.log('成功连接到 回声机器人数据库');

    // 初始化回声机器人相关集合
    dbEchoBot.bots = clientEchoBot.db(DB_NAME_ECHO_BOT).collection('bots'); // 机器人集合
    dbEchoBot.botAdmins = clientEchoBot.db(DB_NAME_ECHO_BOT).collection('bot_admins'); // 机器人管理员
    dbEchoBot.userStates = clientEchoBot.db(DB_NAME_ECHO_BOT).collection('user_states'); // 用户状态
    dbEchoBot.topicMappings = clientEchoBot.db(DB_NAME_ECHO_BOT).collection('topic_mappings'); // 话题映射
    dbEchoBot.messageRates = clientEchoBot.db(DB_NAME_ECHO_BOT).collection('message_rates'); // 消息频率
    dbEchoBot.settings = clientEchoBot.db(DB_NAME_ECHO_BOT).collection('settings'); // 设置
    dbEchoBot.superAdmins = clientEchoBot.db(DB_NAME_ECHO_BOT).collection('super_admins'); // 超级管理员

    // 设置数据库级别的 Change Stream 监听器
    echoBotChangeStream = clientEchoBot.db(DB_NAME_ECHO_BOT).watch();
    console.log('回声机器人数据库 Change Stream 已设置');
  } catch (error) {
    console.error('连接到 回声机器人数据库 失败:', error);
  }
}

/**
 * 获取回声机器人数据库的 Change Stream 监听器
 */
export function getEchoBotChangeStream() {
  return echoBotChangeStream;
} 