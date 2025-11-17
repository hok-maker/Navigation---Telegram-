/**
 * 前台机器人的数据库统一导出文件
 * 
 * 所有数据库都设置数据库级别的 Change Stream 监听器
 * 并导出 Change Stream 监听器以供其他模块使用
 * 
 * 重构说明：
 * - 将原来的 db.js 拆分为多个独立文件
 * - 保持原有的导入接口（命名导出）
 * - 支持从 db.js 平滑迁移到 db/index.js
 */

// 导入各个数据库模块（ESM）
import * as scheduleDB from './db_schedule.js';
import * as pointsDB from './db2_points.js';
import * as allianceDB from './db3_federation.js';
import * as echoBotDB from './db5_echoBot.js';
import * as userActivityStatsDB from './db4_userActivityStats.js';
import * as crawlerDB from './db6_crawler.js';
import * as redisDB from './redis.js'; // ⭐ 已启用：Navigation 缓存系统

// 统一导出，保持原有接口（命名导出）
export const db = scheduleDB.db;                   // 课表数据库的集合引用
export const db2 = pointsDB.db2;                   // 积分数据库的集合引用
export const db3 = allianceDB.db3;                 // 联盟设置数据库的集合引用
export const dbEchoBot = echoBotDB.dbEchoBot;      // 回声机器人数据库的集合引用
export const db4 = userActivityStatsDB.db4;        // 用户活跃度统计数据库的集合引用
export const db6 = crawlerDB.db6;                 // 爬虫数据库的集合引用
// 数据库客户端（用于事务）
export const client = scheduleDB.client;         // 课表数据库的客户端
export const client3 = allianceDB.client3;         // 联盟设置数据库的客户端
export const client6 = crawlerDB.client6;         // 爬虫数据库的客户端
// 数据库连接函数
export const connectDB = scheduleDB.connectDB;             // 课表数据库的连接函数
export const connectDB2 = pointsDB.connectDB2;             // 积分数据库的连接函数
export const connectDB3 = allianceDB.connectDB3;           // 联盟设置数据库的连接函数
export const connectEchoBotDB = echoBotDB.connectEchoBotDB; // 回声机器人数据库的连接函数
export const connectDB4 = userActivityStatsDB.connectDB4;  // 用户活跃度统计数据库的连接函数
export const connectDB6 = crawlerDB.connectDB6;           // 爬虫数据库的连接函数
// ⭐ Redis连接函数（Navigation 缓存系统）
export const initRedis = redisDB.initRedis;                // Redis连接初始化函数
export const getRedis = redisDB.getRedis;                  // 获取Redis实例
export const isRedisAvailable = redisDB.isRedisAvailable;  // 检查Redis连接状态

// Change Stream 监听器
export const getScheduleChangeStream = scheduleDB.getScheduleChangeStream; // 课表数据库的Change Stream 监听器
export const getAllianceChangeStream = allianceDB.getAllianceChangeStream; // 联盟设置数据库的Change Stream 监听器
export const getPointsChangeStream = pointsDB.getPointsChangeStream;       // 积分数据库的Change Stream 监听器
export const getEchoBotChangeStream = echoBotDB.getEchoBotChangeStream;    // 回声机器人数据库的Change Stream 监听器
export const getUserActivityStatsChangeStream = userActivityStatsDB.getUserActivityStatsChangeStream; // 用户活跃度统计数据库的Change Stream 监听器
export const getCrawlerChangeStream = crawlerDB.getCrawlerChangeStream;           // 爬虫数据库的Change Stream 监听器
/**
* 文件使用说明:
* -------------------------------
* // 从 db 导入数据库功能（保持原有接口的命名导出）
* import {
*   db,                      // 课表数据库的集合引用
*   db2,                     // 积分数据库的集合引用
*   db3,                     // 联盟设置数据库的集合引用
*   db4,                     // 用户活跃度统计数据库的集合引用
*   dbEchoBot,               // 回声机器人数据库的集合引用
*   connectDB,               // 课表数据库的连接函数
*   connectDB2,              // 积分数据库的连接函数
*   connectDB3,              // 联盟设置数据库的连接函数
*   connectDB4,              // 用户活跃度统计数据库的连接函数
*   connectEchoBotDB,        // 回声机器人数据库的连接函数
*   initRedis,               // Redis连接初始化函数
*   getScheduleChangeStream, // 课表数据库的Change Stream 监听器
*   getAllianceChangeStream, // 联盟设置数据库的Change Stream 监听器
*   getPointsChangeStream,   // 积分数据库的Change Stream 监听器
*   getUserActivityStatsChangeStream, // 用户活跃度统计数据库的Change Stream 监听器
*   getEchoBotChangeStream,  // 回声机器人数据库的Change Stream 监听器
* } from './utils/db/index.js';
* -------------------------------
*/
