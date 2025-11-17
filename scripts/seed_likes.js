/**
 * 批量添加随机点赞数脚本（运营策略）
 * 用于正式服务器冷启动点赞功能
 * 
 * 策略：根据频道订阅数设置合理的随机点赞数
 * ⭐ V2架构：只更新 channelLikes 集合的统计信息
 * ⭐ 不生成假的 channelLikeRecords 记录（避免数据污染）
 * 
 * 命令：node --env-file=.env scripts/seed_likes.js
 */

import { db6, connectDB6 } from '../utils/db/index.js';

// 点赞数范围配置（根据频道规模）
const LIKES_RANGES = {
  mega: {          // 超大频道（10M+）
    min: 500,
    max: 2000,
    description: '超大频道'
  },
  large: {         // 大频道（1M-10M）
    min: 200,
    max: 1000,
    description: '大频道'
  },
  medium: {        // 中型频道（100K-1M）
    min: 50,
    max: 500,
    description: '中型频道'
  },
  small: {         // 小频道（10K-100K）
    min: 10,
    max: 100,
    description: '小频道'
  },
  tiny: {          // 微型频道（1K-10K）
    min: 3,
    max: 50,
    description: '微型频道'
  },
  mini: {          // 迷你频道（<1K）
    min: 1,
    max: 20,
    description: '迷你频道'
  }
};

/**
 * 根据订阅数确定频道规模
 */
function getChannelSize(members) {
  if (members >= 10000000) return 'mega';      // 10M+
  if (members >= 1000000) return 'large';      // 1M-10M
  if (members >= 100000) return 'medium';      // 100K-1M
  if (members >= 10000) return 'small';        // 10K-100K
  if (members >= 1000) return 'tiny';          // 1K-10K
  return 'mini';                                // <1K
}

/**
 * 生成随机点赞数
 */
function generateRandomLikes(members) {
  const size = getChannelSize(members);
  const range = LIKES_RANGES[size];
  
  // 在范围内生成随机数
  const likes = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
  
  return likes;
}

/**
 * 格式化数字（带单位）
 */
function formatNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(2) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(2) + 'K';
  }
  return num.toFixed(0);
}

/**
 * 主函数
 */
async function main() {
  try {
    await connectDB6();
    console.log('✅ 已连接到数据库\n');
    
    // ==================== 第1步：查询需要添加点赞的频道 ====================
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📊 第1步：查询活跃频道');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    const allActiveChannels = await db6.channels.find({
      'meta.isActive': true,
      $or: [
        { 'meta.adminHidden': { $exists: false } },
        { 'meta.adminHidden': false }
      ]
    }).toArray();
    
    console.log(`📈 总活跃频道: ${allActiveChannels.length} 个\n`);
    
    // 统计各规模频道数量
    const sizeStats = {
      mega: 0,
      large: 0,
      medium: 0,
      small: 0,
      tiny: 0,
      mini: 0
    };
    
    allActiveChannels.forEach(ch => {
      const size = getChannelSize(ch.stats?.members || 0);
      sizeStats[size]++;
    });
    
    console.log('📊 频道规模分布：\n');
    Object.entries(sizeStats).forEach(([size, count]) => {
      const range = LIKES_RANGES[size];
      console.log(`   ${range.description}: ${count} 个 (点赞范围: ${range.min}-${range.max})`);
    });
    console.log('');
    
    // ==================== 第2步：显示策略 ====================
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🎯 第2步：点赞添加策略');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    console.log('策略：根据频道订阅数设置合理的随机点赞数\n');
    
    // 预览前20个频道的点赞数
    const top20 = allActiveChannels
      .sort((a, b) => (b.stats?.members || 0) - (a.stats?.members || 0))
      .slice(0, 20);
    
    console.log('📈 预览：前20个频道的点赞数：\n');
    
    // ⭐ V2架构：批量查询点赞数（提高性能）
    const top20Usernames = top20.map(ch => ch.username);
    const likeDocs = await db6.channelLikes.find({
      channelUsername: { $in: top20Usernames }
    }).toArray();
    
    const likesMap = new Map(
      likeDocs.map(doc => [doc.channelUsername, doc.stats?.totalLikes || 0])
    );
    
    top20.forEach((ch, idx) => {
      const members = ch.stats?.members || 0;
      const currentLikes = likesMap.get(ch.username) || 0;
      const newLikes = generateRandomLikes(members);
      const size = getChannelSize(members);
      const range = LIKES_RANGES[size];
      
      console.log(`${idx + 1}. ${ch.name || ch.username}`);
      console.log(`   @${ch.username}`);
      console.log(`   订阅: ${formatNumber(members)} | 规模: ${range.description}`);
      console.log(`   当前点赞: ${currentLikes} → 新点赞: ${newLikes}\n`);
    });
    
    // ==================== 第3步：执行更新 ====================
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🚀 第3步：批量添加点赞');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    console.log(`即将为 ${allActiveChannels.length} 个频道添加随机点赞数\n`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    const errors = [];
    
    // 统计点赞数分布
    const likesStats = {
      total: 0,
      min: Infinity,
      max: 0,
      bySize: {}
    };
    
    console.log('正在添加点赞...\n');
    
    for (const channel of allActiveChannels) {
      try {
        // ⭐ 检查是否已经有真实点赞记录
        const existingLikeDoc = await db6.channelLikes.findOne({ 
          channelUsername: channel.username 
        });
        
        // 如果已经有点赞记录，跳过
        if (existingLikeDoc && existingLikeDoc.stats?.totalLikes > 0) {
          skippedCount++;
          continue;
        }
        
        const members = channel.stats?.members || 0;
        const newLikes = generateRandomLikes(members);
        const size = getChannelSize(members);
        
        // ⭐ 创建或更新真实的点赞文档（channelLikes 集合 - V2架构）
        await db6.channelLikes.updateOne(
          { channelUsername: channel.username },
          {
            $set: {
              stats: {
                totalLikes: newLikes,
                uniqueDevices: newLikes,  // 假设每个点赞都是独立设备
                lastLikeAt: new Date(),
                seeded: true,             // ⭐ 标记为种子点赞（运营策略）
                seededAt: new Date()
              },
              updatedAt: new Date()
            },
            $setOnInsert: {
              channelUsername: channel.username,
              createdAt: new Date()
            }
          },
          { upsert: true }
        );
        
        updatedCount++;
        
        // 统计
        likesStats.total += newLikes;
        likesStats.min = Math.min(likesStats.min, newLikes);
        likesStats.max = Math.max(likesStats.max, newLikes);
        likesStats.bySize[size] = (likesStats.bySize[size] || 0) + newLikes;
        
        // 每1000个显示进度
        if (updatedCount % 1000 === 0) {
          console.log(`   已更新: ${updatedCount} / ${allActiveChannels.length}`);
        }
        
      } catch (error) {
        errors.push({
          username: channel.username,
          error: error.message
        });
      }
    }
    
    console.log(`\n✅ 更新完成！`);
    console.log(`   成功: ${updatedCount} 个`);
    console.log(`   跳过: ${skippedCount} 个（已有点赞）`);
    console.log(`   失败: ${errors.length} 个\n`);
    
    if (errors.length > 0 && errors.length <= 10) {
      console.log('❌ 失败列表：');
      errors.forEach(err => {
        console.log(`   - @${err.username}: ${err.error}`);
      });
      console.log('');
    } else if (errors.length > 10) {
      console.log(`❌ 失败列表（前10个）：`);
      errors.slice(0, 10).forEach(err => {
        console.log(`   - @${err.username}: ${err.error}`);
      });
      console.log(`   ... 还有 ${errors.length - 10} 个失败\n`);
    }
    
    // ==================== 第4步：验证结果 ====================
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ 第4步：验证结果');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    // 查询新的Top 20
    const newTop20 = await db6.channels.find({
      'meta.isActive': true,
      $or: [
        { 'meta.adminHidden': { $exists: false } },
        { 'meta.adminHidden': false }
      ]
    }).sort({ 'weight.value': -1 }).limit(20).toArray();
    
    console.log('🏆 新的排名前20（带点赞数）：\n');
    
    // ⭐ V2架构：从 channelLikes 集合获取点赞数
    for (const [idx, ch] of newTop20.entries()) {
      const weight = ch.weight?.value || 0;
      const members = ch.stats?.members || 0;
      
      // 查询点赞数
      const likeDoc = await db6.channelLikes.findOne({ 
        channelUsername: ch.username 
      });
      const likes = likeDoc?.stats?.totalLikes || 0;
      
      console.log(`${idx + 1}. ${ch.name || ch.username}`);
      console.log(`   @${ch.username}`);
      console.log(`   订阅: ${formatNumber(members)} | 权重: ${formatNumber(weight)} | 👍 ${likes}\n`);
    }
    
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📊 点赞统计：\n');
    
    const avgLikes = likesStats.total / updatedCount;
    
    console.log(`总点赞数: ${likesStats.total.toLocaleString()}`);
    console.log(`平均点赞: ${avgLikes.toFixed(2)}`);
    console.log(`最小点赞: ${likesStats.min}`);
    console.log(`最大点赞: ${likesStats.max}\n`);
    
    console.log('各规模频道点赞总数：');
    Object.entries(likesStats.bySize).forEach(([size, total]) => {
      const range = LIKES_RANGES[size];
      const count = sizeStats[size];
      const avg = total / count;
      console.log(`   ${range.description}: ${total.toLocaleString()} (平均: ${avg.toFixed(1)})`);
    });
    
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('🎉 全部完成！');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    console.log('✅ 下一步：');
    console.log('   1. 刷新首页查看点赞数');
    console.log('   2. 如需清除点赞，运行: node scripts/clear_likes.js');
    console.log('   3. 如需重新生成，先清除再重新运行本脚本\n');
    
    console.log('💡 提示：');
    console.log('   - ⭐ V2架构：只更新 channelLikes 统计集合');
    console.log('   - 不生成假的 channelLikeRecords 记录（保持数据真实性）');
    console.log('   - 点赞数已根据频道规模合理分配');
    console.log('   - 用户可以继续点赞，点赞数会累加');
    console.log('   - 已标记为种子点赞（stats.seeded: true）\n');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ 执行失败:', error);
    process.exit(1);
  }
}

// 执行
main();

