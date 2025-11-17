/**
 * 恢复 Telegram 官方频道原始权重脚本
 * 用于回滚 boost_telegram_official.js 的操作
 */

import { db6, connectDB6 } from '../utils/db/index.js';

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
    
    // ==================== 第1步：查询已加成的官方频道 ====================
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📊 第1步：查询已加成的官方频道');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    const boostedChannels = await db6.channels.find({
      'weight.officialBoosted': true
    }).toArray();
    
    console.log(`找到 ${boostedChannels.length} 个已加成的官方频道\n`);
    
    if (boostedChannels.length === 0) {
      console.log('⚠️  没有需要恢复的频道');
      process.exit(0);
    }
    
    // 显示列表
    console.log('📋 频道列表：\n');
    boostedChannels.forEach((ch, idx) => {
      const currentWeight = ch.weight?.value || 0;
      const originalWeight = ch.weight?.originalValue || 0;
      console.log(`${idx + 1}. ${ch.name || ch.username}`);
      console.log(`   @${ch.username}`);
      console.log(`   当前: ${formatNumber(currentWeight)} → 恢复为: ${formatNumber(originalWeight)}\n`);
    });
    
    // ==================== 第2步：执行恢复 ====================
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🔄 第2步：执行恢复');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    console.log('正在恢复原始权重...\n');
    
    let restoredCount = 0;
    const errors = [];
    
    for (const channel of boostedChannels) {
      try {
        const originalWeight = channel.weight?.originalValue || 0;
        
        await db6.channels.updateOne(
          { _id: channel._id },
          {
            $set: {
              'weight.value': originalWeight
            },
            $unset: {
              'weight.originalValue': '',
              'weight.officialBoosted': '',
              'weight.officialBoostConfig': ''
            }
          }
        );
        
        restoredCount++;
        console.log(`   ✅ 恢复: @${channel.username} → ${formatNumber(originalWeight)}`);
        
      } catch (error) {
        errors.push({
          username: channel.username,
          error: error.message
        });
      }
    }
    
    console.log(`\n✅ 恢复完成！`);
    console.log(`   成功: ${restoredCount} 个`);
    console.log(`   失败: ${errors.length} 个\n`);
    
    if (errors.length > 0) {
      console.log('❌ 失败列表：');
      errors.forEach(err => {
        console.log(`   - @${err.username}: ${err.error}`);
      });
      console.log('');
    }
    
    // ==================== 第3步：验证结果 ====================
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ 第3步：验证结果');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    // 检查是否还有加成标记
    const remainingBoosted = await db6.channels.countDocuments({
      'weight.officialBoosted': true
    });
    
    if (remainingBoosted === 0) {
      console.log('✅ 所有官方加成标记已清除');
    } else {
      console.log(`⚠️  仍有 ${remainingBoosted} 个频道保留官方加成标记`);
    }
    
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('🎉 恢复完成！');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    console.log('✅ 官方频道权重已恢复到原始状态');
    console.log('   如需重新加成，运行: node scripts/boost_telegram_official.js\n');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ 执行失败:', error);
    process.exit(1);
  }
}

// 执行
main();

