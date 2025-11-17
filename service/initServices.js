/**
 * 服务初始化模块
 * 负责在应用启动时初始化所有必要的服务（Redis、数据库等）
 */

import { initRedis } from '@/utils/db/redis.js';

// 防止重复初始化
let isInitialized = false;

/**
 * 初始化所有服务
 * 此函数应该在应用启动时调用一次
 */
export async function initServices() {
  // 防止重复初始化
  if (isInitialized) {
    console.log('⚠️ 服务已经初始化，跳过重复初始化');
    return;
  }

  console.log('🚀 开始初始化 Navigation 服务...');
  
  try {
    // 1. 初始化 Redis 缓存
    console.log('📦 正在初始化 Redis 缓存系统...');
    await initRedis();
    
    // 标记为已初始化
    isInitialized = true;
    
    console.log('✅ Navigation 服务初始化完成！');
  } catch (error) {
    console.error('❌ 服务初始化失败:', error);
    console.warn('⚠️ 应用将以降级模式运行（无缓存）');
  }
}

/**
 * 检查服务是否已初始化
 */
export function isServicesInitialized() {
  return isInitialized;
}

