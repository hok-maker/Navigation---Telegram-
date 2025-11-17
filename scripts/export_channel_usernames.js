/**
 * 导出频道用户名列表（增强版 - 支持增量导出）
 * 
 * 功能：
 * - 从当前数据库导出频道的 username
 * - 支持全量导出和增量导出
 * - 保存为 JSON 和 TXT 两种格式
 * - 自动标记已导出频道，避免重复
 * 
 * 使用方法:
 *   node scripts/export_channel_usernames.js [mode]
 * 
 * 导出模式:
 *   all             - 全量导出（所有频道）
 *   new             - 增量导出（只导出未导出过的）【默认】
 *   recent [days]   - 导出最近 N 天创建的频道
 * 
 * 示例:
 *   node scripts/export_channel_usernames.js              # 增量导出（只导出新频道）
 *   node scripts/export_channel_usernames.js all          # 全量导出（所有频道）
 *   node scripts/export_channel_usernames.js recent 7     # 导出最近7天的频道
 * 
 * 输出文件：
 *   - channel_usernames_[mode]_YYYY-MM-DD.json  （JSON格式，含完整信息）
 *   - channel_usernames_[mode]_YYYY-MM-DD.txt   （纯文本，每行一个用户名）
 */

const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

// 数据库配置
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017,127.0.0.1:27018/?replicaSet=LocalRS_01';
const DB_NAME = '06_DB_crawler';

async function exportChannelUsernames() {
    let client;
    
    try {
        console.log('\n' + '='.repeat(70));
        console.log('📤 导出频道用户名列表（增强版 - 支持增量导出）');
        console.log('='.repeat(70) + '\n');

        // 1. 解析命令行参数
        const mode = process.argv[2] || 'new';  // 默认增量导出
        const daysArg = parseInt(process.argv[3]) || 7;
        
        let modeDescription;
        let query = { username: { $exists: true, $ne: null } };
        
        if (mode === 'all') {
            modeDescription = '全量导出（所有频道）';
        } else if (mode === 'new') {
            modeDescription = '增量导出（只导出未导出过的）';
            query['meta.lastExported'] = { $exists: false };  // 未导出过的
        } else if (mode === 'recent') {
            modeDescription = `导出最近 ${daysArg} 天创建的频道`;
            const cutoffDate = new Date(Date.now() - daysArg * 24 * 60 * 60 * 1000);
            query.createdAt = { $gte: cutoffDate };
        } else {
            console.error(`❌ 错误：不支持的模式 "${mode}"\n`);
            console.log('支持的模式:');
            console.log('  all             - 全量导出');
            console.log('  new             - 增量导出（默认）');
            console.log('  recent [days]   - 导出最近N天的\n');
            process.exit(1);
        }

        console.log(`📋 导出模式: ${modeDescription}\n`);

        // 2. 连接数据库
        console.log('🔧 连接数据库...');
        client = new MongoClient(MONGODB_URI);
        await client.connect();
        console.log('✅ 数据库连接成功\n');
        
        const db = client.db(DB_NAME);
        const channelsCollection = db.collection('channels');

        // 3. 查询频道
        console.log('🔍 查询频道数据...');
        const channels = await channelsCollection
            .find(
                query,
                { projection: { username: 1, name: 1, 'stats.members': 1, createdAt: 1, 'meta.lastExported': 1 } }
            )
            .sort({ 'stats.members': -1 })  // 按订阅数降序
            .toArray();

        console.log(`✅ 找到 ${channels.length} 个频道\n`);

        if (channels.length === 0) {
            console.log('⚠️  数据库中没有频道数据');
            await client.close();
            process.exit(0);
        }

        // 4. 创建导出目录
        const exportDir = path.join(__dirname, '../exports');
        if (!fs.existsSync(exportDir)) {
            fs.mkdirSync(exportDir, { recursive: true });
            console.log(`📁 创建导出目录: ${exportDir}\n`);
        }

        // 5. 生成文件名（带模式和日期）
        const today = new Date().toISOString().split('T')[0];  // YYYY-MM-DD
        const modePrefix = mode === 'all' ? 'all' : (mode === 'recent' ? `recent${daysArg}d` : 'new');
        const jsonFilename = `channel_usernames_${modePrefix}_${today}.json`;
        const txtFilename = `channel_usernames_${modePrefix}_${today}.txt`;
        const statsFilename = `export_stats_${modePrefix}_${today}.json`;

        const jsonPath = path.join(exportDir, jsonFilename);
        const txtPath = path.join(exportDir, txtFilename);
        const statsPath = path.join(exportDir, statsFilename);

        // 6. 准备数据
        console.log('📊 准备导出数据...');

        // 提取用户名列表
        const usernames = channels.map(ch => ch.username);

        // 完整信息（JSON 格式）
        const exportData = {
            exportMode: mode,
            exportTime: new Date().toISOString(),
            totalChannels: channels.length,
            channels: channels.map(ch => ({
                username: ch.username,
                name: ch.name || null,
                members: ch.stats?.members || 0,
                createdAt: ch.createdAt || null,
                lastExported: ch.meta?.lastExported || null  // 记录上次导出时间
            }))
        };

        // 统计信息（使用循环避免栈溢出）
        let subscriberStats = { total: 0, max: 0, min: Infinity, avg: 0 };
        
        if (channels.length > 0) {
            let total = 0;
            let max = 0;
            let min = Infinity;
            
            for (const ch of channels) {
                const members = ch.stats?.members || 0;
                total += members;
                if (members > max) max = members;
                if (members < min) min = members;
            }
            
            subscriberStats = {
                total,
                max,
                min: min === Infinity ? 0 : min,
                avg: Math.round(total / channels.length)
            };
        }
        
        const stats = {
            exportMode: mode,
            exportTime: new Date().toISOString(),
            totalChannels: channels.length,
            files: {
                json: jsonFilename,
                txt: txtFilename
            },
            subscriberStats,
            topChannels: channels.slice(0, 10).map(ch => ({
                username: ch.username,
                name: ch.name,
                members: ch.stats?.members || 0
            }))
        };

        console.log('✅ 数据准备完成\n');

        // 7. 写入 JSON 文件（完整信息）
        console.log(`💾 写入 JSON 文件: ${jsonFilename}`);
        fs.writeFileSync(jsonPath, JSON.stringify(exportData, null, 2), 'utf8');
        const jsonSize = (fs.statSync(jsonPath).size / 1024).toFixed(2);
        console.log(`   文件大小: ${jsonSize} KB\n`);

        // 8. 写入 TXT 文件（纯用户名列表）
        console.log(`💾 写入 TXT 文件: ${txtFilename}`);
        fs.writeFileSync(txtPath, usernames.join('\n'), 'utf8');
        const txtSize = (fs.statSync(txtPath).size / 1024).toFixed(2);
        console.log(`   文件大小: ${txtSize} KB\n`);

        // 9. 写入统计文件
        console.log(`📊 写入统计文件: ${statsFilename}`);
        fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2), 'utf8');
        console.log('');

        // 10. 标记已导出频道（只在成功导出后标记）
        if (channels.length > 0) {
            console.log('🏷️  标记已导出频道...');
            const exportTime = new Date();
            const usernamesToMark = channels.map(ch => ch.username);
            
            const markResult = await channelsCollection.updateMany(
                { username: { $in: usernamesToMark } },
                { 
                    $set: { 
                        'meta.lastExported': exportTime,
                        updatedAt: exportTime
                    } 
                }
            );
            
            console.log(`✅ 已标记 ${markResult.modifiedCount} 个频道\n`);
        }

        // 11. 显示结果
        console.log('='.repeat(70));
        console.log('✅ 导出成功！');
        console.log('='.repeat(70));
        console.log(`\n📋 导出模式: ${modeDescription}`);
        console.log(`📁 导出目录: ${exportDir}\n`);
        console.log('📄 导出文件:');
        console.log(`   • ${jsonFilename} (${jsonSize} KB) - 完整信息`);
        console.log(`   • ${txtFilename} (${txtSize} KB) - 纯用户名列表`);
        console.log(`   • ${statsFilename} - 统计信息\n`);

        if (channels.length > 0) {
            console.log('📊 数据统计:');
            console.log(`   • 频道总数: ${stats.totalChannels.toLocaleString()}`);
            console.log(`   • 订阅总数: ${stats.subscriberStats.total.toLocaleString()}`);
            console.log(`   • 平均订阅: ${stats.subscriberStats.avg.toLocaleString()}`);
            console.log(`   • 最大订阅: ${stats.subscriberStats.max.toLocaleString()}`);
            console.log(`   • 最小订阅: ${stats.subscriberStats.min.toLocaleString()}\n`);

            console.log('🏆 Top 10 频道:');
            stats.topChannels.forEach((ch, idx) => {
                console.log(`   ${idx + 1}. @${ch.username} - ${ch.name || '(无名称)'} (${ch.members.toLocaleString()} 订阅)`);
            });
            console.log('');
        }

        console.log('💡 下一步：');
        console.log(`   1. 将文件传输到正式服务器`);
        console.log(`   2. 运行导入脚本: node scripts/import_channel_usernames.js ${jsonFilename}`);
        console.log('');
        
        console.log('📝 提示：');
        console.log(`   • 已导出的频道会被标记 meta.lastExported 字段`);
        console.log(`   • 下次运行 "node scripts/export_channel_usernames.js" 将只导出新增频道`);
        console.log(`   • 如需重新导出所有频道，运行 "node scripts/export_channel_usernames.js all"`);
        console.log('');

        await client.close();
        process.exit(0);
    } catch (error) {
        console.error('\n❌ 导出失败:', error.message);
        console.error(error.stack);
        if (client) {
            await client.close();
        }
        process.exit(1);
    }
}

// 执行导出
exportChannelUsernames();

