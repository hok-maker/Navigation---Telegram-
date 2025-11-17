/**
 * Telegram 官方频道权重加成脚本
 * 策略：固定权重提升
 * 
 * 目标：让 Telegram 官方频道排在顶部
 */

import { db6, connectDB6 } from '../utils/db/index.js';

// Telegram 官方频道列表
const OFFICIAL_CHANNELS = [
  'telegram',        // Telegram News
  'telegramtips',    // Telegram Tips
  'durov',          // Pavel Durov
  'premium',        // Telegram Premium
  'telegra_ph',     // Telegraph
  'isiswatch',      // ISIS Watch
  'previews',       // Telegram Previews
  'contest',        // Telegram Contest
  'TelegramBlog',   // Telegram Blog (如果有)
];

// 加成配置
const BOOST_CONFIG = {
  targetWeight: 35000000,  // 目标权重：35M（高于所有中文频道）
  description: 'Telegram 官方频道加成'
};

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
    
    // ==================== 第1步：查找官方频道 ====================
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📊 第1步：查找 Telegram 官方频道');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    const officialChannels = await db6.channels.find({
      username: { $in: OFFICIAL_CHANNELS }
    }).toArray();
    
    console.log(`找到 ${officialChannels.length} 个官方频道：\n`);
    
    officialChannels.forEach((ch, idx) => {
      const currentWeight = ch.weight?.value || 0;
      const isActive = ch.meta?.isActive;
      const adminHidden = ch.meta?.adminHidden;
      console.log(`${idx + 1}. ${ch.name || ch.username}`);
      console.log(`   @${ch.username}`);
      console.log(`   当前权重: ${formatNumber(currentWeight)}`);
      console.log(`   状态: ${isActive ? '✅ 活跃' : '❌ 不活跃'} | 管理员隐藏: ${adminHidden ? '是' : '否'}\n`);
    });
    
    if (officialChannels.length === 0) {
      console.log('⚠️  没有找到官方频道');
      process.exit(0);
    }
    
    // ==================== 第2步：显示加成策略 ====================
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🎯 第2步：加成策略');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    console.log(`策略：${BOOST_CONFIG.description}`);
    console.log(`目标权重：${formatNumber(BOOST_CONFIG.targetWeight)}\n`);
    
    console.log('📈 预览权重变化：\n');
    officialChannels.forEach((ch, idx) => {
      const oldWeight = ch.weight?.value || 0;
      const newWeight = BOOST_CONFIG.targetWeight;
      console.log(`${idx + 1}. ${ch.name || ch.username}`);
      console.log(`   ${formatNumber(oldWeight)} → ${formatNumber(newWeight)} (+${formatNumber(newWeight - oldWeight)})\n`);
    });
    
    // ==================== 第3步：执行更新 ====================
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🚀 第3步：执行更新');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    console.log('正在更新官方频道权重...\n');
    
    let updatedCount = 0;
    let skippedCount = 0;
    const errors = [];
    
    for (const channel of officialChannels) {
      try {
        const originalWeight = channel.weight?.value || 0;
        
        // 如果已经加成过，跳过
        if (channel.weight?.officialBoosted === true) {
          skippedCount++;
          console.log(`   跳过: @${channel.username}（已加成）`);
          continue;
        }
        
        await db6.channels.updateOne(
          { _id: channel._id },
          {
            $set: {
              'weight.originalValue': originalWeight,           // 保存原始权重
              'weight.value': BOOST_CONFIG.targetWeight,        // 新权重
              'weight.officialBoosted': true,                   // 官方加成标记
              'weight.officialBoostConfig': {
                targetWeight: BOOST_CONFIG.targetWeight,
                description: BOOST_CONFIG.description,
                appliedAt: new Date()
              }
            }
          }
        );
        
        updatedCount++;
        console.log(`   ✅ 更新: @${channel.username} → ${formatNumber(BOOST_CONFIG.targetWeight)}`);
        
      } catch (error) {
        errors.push({
          username: channel.username,
          error: error.message
        });
      }
    }
    
    console.log(`\n✅ 更新完成！`);
    console.log(`   成功: ${updatedCount} 个`);
    console.log(`   跳过: ${skippedCount} 个（已加成过）`);
    console.log(`   失败: ${errors.length} 个\n`);
    
    if (errors.length > 0) {
      console.log('❌ 失败列表：');
      errors.forEach(err => {
        console.log(`   - @${err.username}: ${err.error}`);
      });
      console.log('');
    }
    
    // ==================== 第4步：验证结果 ====================
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ 第4步：验证结果');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    // 查询新的Top 10
    const newTop10 = await db6.channels.find({
      'meta.isActive': true,
      $or: [
        { 'meta.adminHidden': { $exists: false } },
        { 'meta.adminHidden': false }
      ]
    }).sort({ 'weight.value': -1 }).limit(10).toArray();
    
    console.log('🏆 新的排名前10：\n');
    
    newTop10.forEach((ch, idx) => {
      const weight = ch.weight?.value || 0;
      const officialBoosted = ch.weight?.officialBoosted ? ' 🔥' : '';
      const chineseBoosted = ch.weight?.boosted ? ' ⚡' : '';
      
      console.log(`${idx + 1}. ${ch.name || ch.username}${officialBoosted}${chineseBoosted}`);
      console.log(`   @${ch.username}`);
      console.log(`   权重: ${formatNumber(weight)}\n`);
    });
    
    // 统计官方频道的排名
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📊 官方频道排名统计：\n');
    
    for (const channel of officialChannels) {
      // 查询该频道的排名
      const higherCount = await db6.channels.countDocuments({
        'meta.isActive': true,
        $or: [
          { 'meta.adminHidden': { $exists: false } },
          { 'meta.adminHidden': false }
        ],
        'weight.value': { $gt: channel.weight?.value || 0 }
      });
      
      const rank = higherCount + 1;
      console.log(`   @${channel.username}: 第 ${rank} 名`);
    }
    
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('🎉 全部完成！');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    console.log('✅ 下一步：');
    console.log('   1. 刷新首页查看新的排序结果');
    console.log('   2. 官方频道现在应该排在最前面');
    console.log('   3. 如需回滚，运行: node scripts/restore_telegram_official.js\n');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ 执行失败:', error);
    process.exit(1);
  }
}

// 执行
main();

