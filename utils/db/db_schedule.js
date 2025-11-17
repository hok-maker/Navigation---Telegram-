/**
 * 课表数据库连接和配置
 */
import { MongoClient } from 'mongodb';
import debug from 'debug';

const debugDB = { log: debug('DB') };

/**
 * 数据库 URI 和名称
 * 使用统一的MONGODB_URI
 * 通过数据库名称来隔离不同的数据库
 * 该文件的命名:01_DB_CeShi
 * 01 为前缀,方便我将所有同类项数据库放在一起
 * 01 代表是该程序独享的数据库
 * DB 为后缀,防止命名过于通用与其他文件冲突
 * CeShi 虽然名为测试,但是它其实是地区,或者某个数据库的名称
 * 例如:珠海的机器人,就会使用 01_DB_ZhuHai 作为前缀
 * 例如:防护机器人就会使用 01_DB_FangHu 作为前缀
 * 例如:MiniApp 就会使用 01_DB_MiniApp 作为前缀
 * 例如:admin-panel 就会使用 01_DB_AdminPanel 作为前缀
 */
const uri = process.env.MONGODB_URI; // 使用统一的MONGODB_URI
const DB_NAME_SCHEDULE = "01_DB_MiniApp"; // 数据库名称区分数据库**重要**

// 数据库客户端和集合
const client = new MongoClient(uri);
export { client };   // 导出数据库客户端，用于事务操作
export const db = {};
let scheduleChangeStream;

/**
 * 连接课表数据库
 */
export async function connectDB() {
  try {
    await client.connect();
    console.log('成功连接到 课表服务器');

    // 🔧 修复：在连接成功后添加client引用，支持事务操作
    db.client = client;
    
    // 现有集合初始化
    const database = client.db(DB_NAME_SCHEDULE);

    // ----------------------  聊天功能集合  ----------------------
    db.ChatMessages = database.collection('ChatMessages');       // 聊天消息
    db.ChatChannels = database.collection('ChatChannels');       // 聊天频道
    db.ChatPermissions = database.collection('ChatPermissions'); // 用户权限
    db.ChatUsers = database.collection('ChatUsers');             // 用户统计（可选）
    // ----------------------  聊天功能集合  ----------------------

    // ----------------------  V2.0论坛功能集合  ----------------------
    db.ForumSections = database.collection('ForumSections');     // 论坛板块
    db.ForumPosts = database.collection('ForumPosts');           // 论坛帖子
    db.ForumComments = database.collection('ForumComments');     // 论坛评论
    db.ForumUsers = database.collection('ForumUsers');           // 论坛用户
    // ----------------------  V2.0论坛功能集合  ----------------------

    // ----------------------  用户收藏功能集合  ----------------------
    db.UserBookmarks = database.collection('UserBookmarks');     // 用户收藏数据
    // ----------------------  用户收藏功能集合  ----------------------
    db.StickerSets = database.collection('StickerSets');           // 贴纸包集合

    console.log('✅ 聊天功能集合已初始化');
    console.log('✅ V2.0论坛功能集合已初始化');

    // 设置数据库级别的 Change Stream 监听器
    scheduleChangeStream = client.db(DB_NAME_SCHEDULE).watch();
    debugDB.log('课表数据库 Change Stream 已设置');
  } catch (error) {
    console.error('连接到 课表服务器 失败:', error);
  }
}

/**
 * 获取课表数据库的 Change Stream 监听器
 */
export function getScheduleChangeStream() {
  return scheduleChangeStream;
} 