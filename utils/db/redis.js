/**
文件模块命名：Redis连接管理 - 基础连接版
统一说明：为miniapp提供Redis基础连接能力
功能说明：连接Redis，为将来的缓存优化预留接口
注意：报告功能已迁移到MongoDB V3.0架构，相关代码已注释
*/

// ----------------------  导入模块  ----------------------
import Redis from "ioredis";
// import fs from "fs/promises";  // 报告文件操作已废弃
import path from "path";         // 保留基础path功能
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// ----------------------  导入模块  ----------------------

// ----------------------  Redis配置  ----------------------
/**
 * 解析 REDIS_URL 或使用单独的配置
 * 支持格式：redis://localhost:6379 或 REDIS_HOST + REDIS_PORT
 */
function getRedisConfig() {
  const redisUrl = process.env.REDIS_URL;
  
  if (redisUrl) {
    // 使用 REDIS_URL（例如：redis://localhost:6379）
    return {
      url: redisUrl,
      db: 2, // 使用db2（Navigation专用缓存）
      retryDelayOnFailure: function (times) {
        return Math.min(times * 50, 2000);
      },
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    };
  } else {
    // 使用单独的 REDIS_HOST 和 REDIS_PORT
    return {
  host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      db: 2,
  retryDelayOnFailure: function (times) {
    return Math.min(times * 50, 2000);
  },
  maxRetriesPerRequest: 3,
  lazyConnect: true,
};
  }
}

const REDIS_CONFIG = getRedisConfig();

// 本地文件备份路径 - 保留配置以备将来使用
// const REPORTS_DATA_PATH = process.env.REPORTS_DATA_PATH || '/Volumes/Bot程序磁盘/.data/reports';
// ----------------------  Redis配置  ----------------------

// ----------------------  Redis实例  ----------------------
let redis = null;
let isConnected = false;

/**
 * 初始化Redis连接
 */
async function initRedis() {
  try {
    redis = new Redis(REDIS_CONFIG);
    
    redis.on('connect', () => {
      console.log('✅ Redis连接成功 (DB2) - Navigation缓存已启用');
      isConnected = true;
    });
    
    redis.on('error', (error) => {
      console.error('❌ Redis连接错误:', error.message);
      isConnected = false;
    });
    
    redis.on('close', () => {
      console.warn('⚠️ Redis连接关闭');
      isConnected = false;
    });
    
    // 测试连接
    await redis.ping();
    console.log('🚀 Redis Ping 成功 - 缓存系统已就绪');
    
    return redis;
  } catch (error) {
    console.error('❌ Redis初始化失败:', error.message);
    console.warn('⚠️ Redis不可用，某些缓存功能可能受限');
    return null;
  }
}

/**
 * 获取Redis连接实例
 */
function getRedis() {
  return redis;
}

/**
 * 检查Redis连接状态
 */
function isRedisAvailable() {
  return isConnected;
}
// ----------------------  Redis实例  ----------------------

// ----------------------  废弃的报告操作 (MongoDB V3.0已替代)  ----------------------
/*
// 以下代码已迁移到MongoDB V3.0架构，注释保留以备参考

async function getReport(uuid) {
  // 报告查询已迁移到MongoDB V3.0
  // 使用 FedDB.Reports.findOne({ uuid }) 替代
  console.warn('⚠️ getReport已废弃，请使用MongoDB查询');
  return null;
}

async function getBatchReportsByStatuses(statuses, region) {
  // 批量查询已迁移到MongoDB V3.0聚合管道
  // 使用 FedDB.Reports.aggregate() 替代
  console.warn('⚠️ getBatchReportsByStatuses已废弃，请使用MongoDB聚合查询');
  return { success: false, error: '功能已迁移到MongoDB V3.0' };
}

async function fallbackFileScanning(statuses, region) {
  // 文件降级已废弃，MongoDB提供更好的可靠性
  console.warn('⚠️ fallbackFileScanning已废弃，MongoDB无需降级');
  return { success: false, error: '功能已迁移到MongoDB V3.0' };
}
*/
// ----------------------  废弃的报告操作  ----------------------

// ----------------------  将来的缓存功能预留接口  ----------------------
/**
 * 通用缓存设置 - 为将来的功能预留
 * @param {string} key - 缓存键
 * @param {any} value - 缓存值  
 * @param {number} ttl - 过期时间(秒)，默认300秒
 */
async function setCache(key, value, ttl = 300) {
  if (!isRedisAvailable()) return false;
  
  try {
    const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);
    if (ttl > 0) {
      await redis.setex(key, ttl, serializedValue);
    } else {
      await redis.set(key, serializedValue);
    }
    return true;
  } catch (error) {
    console.error('❌ 缓存设置失败:', error.message);
    return false;
  }
}

/**
 * 通用缓存获取 - 为将来的功能预留
 * @param {string} key - 缓存键
 */
async function getCache(key) {
  if (!isRedisAvailable()) return null;
  
  try {
    const value = await redis.get(key);
    if (!value) return null;
    
    // 尝试JSON解析，失败则返回原字符串
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  } catch (error) {
    console.error('❌ 缓存获取失败:', error.message);
    return null;
  }
}

/**
 * 删除缓存 - 为将来的功能预留
 * @param {string} key - 缓存键
 */
async function deleteCache(key) {
  if (!isRedisAvailable()) return false;
  
  try {
    await redis.del(key);
    return true;
  } catch (error) {
    console.error('❌ 缓存删除失败:', error.message);
    return false;
  }
}
// ----------------------  将来的缓存功能预留接口  ----------------------

// ----------------------  导出接口  ----------------------
export {
  initRedis,
  getRedis,
  isRedisAvailable,
  // 将来的缓存功能
  setCache,
  getCache,
  deleteCache
  
  // 已废弃的报告功能：
  // getReport,                    // 已迁移到MongoDB V3.0
  // getBatchReportsByStatuses,    // 已迁移到MongoDB V3.0  
  // fallbackFileScanning          // 已废弃，MongoDB更可靠
};
// ----------------------  导出接口  ---------------------- 