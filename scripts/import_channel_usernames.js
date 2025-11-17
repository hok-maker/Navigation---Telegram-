/**
 * 导入频道用户名列表（新服务器使用）
 * 
 * 功能：
 * - 从导出的 JSON 文件导入频道用户名
 * - 创建初始的频道记录（模仿 NetworkCrawler 的数据结构）
 * - 标记为等待 PreviewCrawler_New 处理
 * - 避免重复导入
 * 
 * 使用方法:
 *   node scripts/import_channel_usernames.js <filename>
 * 
 * 示例:
 *   node scripts/import_channel_usernames.js channel_usernames_2025-11-16.json
 *   node scripts/import_channel_usernames.js ../exports/channel_usernames_2025-11-16.json
 * 
 * 或从 TXT 文件导入:
 *   node scripts/import_channel_usernames.js channel_usernames_2025-11-16.txt
 */

const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

// 数据库配置
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017,127.0.0.1:27018/?replicaSet=LocalRS_01';
const DB_NAME = '06_DB_crawler';

/**
 * 从 JSON 文件读取频道列表
 */
function readFromJSON(filepath) {
    const content = fs.readFileSync(filepath, 'utf8');
    const data = JSON.parse(content);
    
    // 如果是导出的格式
    if (data.channels && Array.isArray(data.channels)) {
        return data.channels.map(ch => ({
            username: ch.username,
            name: ch.name,
            members: ch.members || 0
        }));
    }
    
    // 如果是纯数组
    if (Array.isArray(data)) {
        return data.map(item => {
            if (typeof item === 'string') {
                return { username: item, name: null, members: 0 };
            }
            return item;
        });
    }
    
    throw new Error('无法识别的 JSON 格式');
}

/**
 * 从 TXT 文件读取频道列表
 */
function readFromTXT(filepath) {
    const content = fs.readFileSync(filepath, 'utf8');
    const usernames = content
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#'));  // 过滤空行和注释
    
    return usernames.map(username => ({
        username: username.replace('@', ''),  // 移除可能的 @ 符号
        name: null,
        members: 0
    }));
}

/**
 * 创建频道初始记录（模仿 NetworkCrawler 的结构）
 */
function createChannelDocument(channelData) {
    return {
        username: channelData.username,
        entityType: 'channel',
        name: channelData.name || null,
        description: null,
        avatar: null,
        
        // 统计信息（PreviewCrawler 负责）
        stats: {
            members: channelData.members || null,
            memberHistory: [],
            // ⭐ 增长趋势（嵌套在 stats 下）
            growth: {
                last7Days: 0,
                last30Days: 0,
                avgDailyGrowth: 0,
                growthRate: 0,
                isGrowing: false,
                lastCalculated: null
            }
        },
        
        // 权重（初始化，等待 PreviewCrawler 计算完整值）
        weight: {
            value: 0,
            baseWeight: 0,
            growthBonus: 0,
            abnormalPenalty: 0,
            lastCalculated: null,
            calculationReason: null
        },
        
        // 发现的链接（NetworkCrawler 填充）
        discoveredLinks: [],
        
        // 爬取状态（NetworkCrawler 用）
        crawlState: {
            lastMessageId: null,
            lastCrawlTime: null,
            isIndexChannel: false,
            totalMessagesRead: 0
        },
        
        // 质量评分（NetworkCrawler 用）
        quality: {
            discoveredChannels: 0,
            qualityScore: 0,
            lastCalculated: null
        },
        
        // 元数据
        meta: {
            firstDiscoveredAt: new Date(),
            firstDiscoveredFrom: 'imported_seed_data',
            isActive: true,
            lastNetworkCrawl: null,
            // ⭐ PreviewCrawler 状态跟踪
            previewCrawl: {
                lastChecked: null,
                lastSuccess: null,
                consecutiveFailures: 0
            }
        },
        
        // ⭐ 数据源标记（关键！）
        dataSources: {
            networkCrawler: {
                hasData: false,  // 未被 NetworkCrawler 处理过
                lastCrawl: null
            },
            previewPage: {
                hasData: false,  // ⭐ 未被 PreviewCrawler 处理过 - 等待 PreviewCrawler_New 处理
                lastCrawl: null,
                firstUpdate: null,
                hasAvatar: false  // ⭐ 是否有头像
            }
        },
        
        lastChecked: null,
        createdAt: new Date(),
        updatedAt: new Date()
    };
}

/**
 * 导入频道列表
 */
async function importChannelUsernames() {
    let client;
    
    try {
        console.log('\n' + '='.repeat(70));
        console.log('📥 导入频道用户名列表');
        console.log('='.repeat(70) + '\n');

        // 1. 检查命令行参数
        const filename = process.argv[2];
        if (!filename) {
            console.error('❌ 错误：请提供文件名\n');
            console.log('使用方法:');
            console.log('  node scripts/import_channel_usernames.js <filename>\n');
            console.log('示例:');
            console.log('  node scripts/import_channel_usernames.js channel_usernames_2025-11-16.json');
            console.log('  node scripts/import_channel_usernames.js channel_usernames_2025-11-16.txt\n');
            process.exit(1);
        }

        // 2. 查找文件
        let filepath;
        if (fs.existsSync(filename)) {
            filepath = filename;  // 绝对路径或相对路径
        } else if (fs.existsSync(path.join(__dirname, '../exports', filename))) {
            filepath = path.join(__dirname, '../exports', filename);  // 在 exports 目录
        } else {
            console.error(`❌ 错误：找不到文件 "${filename}"\n`);
            console.log('请检查文件路径是否正确\n');
            process.exit(1);
        }

        console.log(`📁 文件路径: ${filepath}\n`);

        // 3. 读取文件
        console.log('📖 读取文件...');
        const ext = path.extname(filepath).toLowerCase();
        let channels;

        if (ext === '.json') {
            channels = readFromJSON(filepath);
        } else if (ext === '.txt') {
            channels = readFromTXT(filepath);
        } else {
            throw new Error(`不支持的文件格式: ${ext}（仅支持 .json 和 .txt）`);
        }

        console.log(`✅ 读取到 ${channels.length} 个频道\n`);

        if (channels.length === 0) {
            console.log('⚠️  文件中没有频道数据');
            process.exit(0);
        }

        // 4. 连接数据库
        console.log('🔧 连接数据库...');
        client = new MongoClient(MONGODB_URI);
        await client.connect();
        console.log('✅ 数据库连接成功\n');
        
        const db = client.db(DB_NAME);
        const channelsCollection = db.collection('channels');

        // 5. 检查数据库中已有的频道
        console.log('🔍 检查数据库现有数据...');
        const existingUsernames = await channelsCollection
            .find({ username: { $exists: true } }, { projection: { username: 1 } })
            .toArray();
        
        const existingSet = new Set(existingUsernames.map(ch => ch.username.toLowerCase()));
        console.log(`   数据库中已有 ${existingSet.size} 个频道\n`);

        // 6. 过滤出需要导入的频道
        const newChannels = channels.filter(ch => !existingSet.has(ch.username.toLowerCase()));
        const skippedCount = channels.length - newChannels.length;

        console.log('📊 导入统计:');
        console.log(`   • 待导入: ${channels.length} 个`);
        console.log(`   • 已存在: ${skippedCount} 个（跳过）`);
        console.log(`   • 需导入: ${newChannels.length} 个\n`);

        if (newChannels.length === 0) {
            console.log('✅ 所有频道都已存在，无需导入');
            await client.close();
            process.exit(0);
        }

        // 7. 批量插入
        console.log('💾 开始导入...');
        const documents = newChannels.map(ch => createChannelDocument(ch));
        
        // 分批插入（每批1000个，避免单次操作过大）
        const batchSize = 1000;
        let insertedCount = 0;
        
        for (let i = 0; i < documents.length; i += batchSize) {
            const batch = documents.slice(i, i + batchSize);
            try {
                const result = await channelsCollection.insertMany(batch, { ordered: false });
                insertedCount += result.insertedCount;
                console.log(`   进度: ${Math.min(i + batchSize, documents.length)}/${documents.length}`);
            } catch (error) {
                // 可能有部分重复，忽略重复错误
                if (error.code === 11000) {
                    console.log(`   ⚠️  批次 ${i}-${i + batchSize} 有部分重复，已跳过`);
                } else {
                    throw error;
                }
            }
        }

        console.log('');

        // 8. 显示结果
        console.log('='.repeat(70));
        console.log('✅ 导入成功！');
        console.log('='.repeat(70));
        console.log(`\n📊 最终统计:`);
        console.log(`   • 成功导入: ${insertedCount} 个频道`);
        console.log(`   • 已跳过: ${skippedCount} 个（数据库中已存在）`);
        console.log(`   • 总计: ${channels.length} 个\n`);

        console.log('💡 下一步：');
        console.log('   1. 启动 PreviewCrawler_New 处理这些新频道');
        console.log('      → 会补全名称、描述、头像、订阅数');
        console.log('      → 会计算权重');
        console.log('   2. 启动 NetworkCrawler 爬取这些频道的消息');
        console.log('      → 会发现更多新频道\n');

        console.log('🚀 启动命令：');
        console.log('   cd PreviewCrawler_New && pm2 start ecosystem.config.js');
        console.log('   cd NetworkCrawler && pm2 start ecosystem.config.js\n');

        await client.close();
        process.exit(0);
    } catch (error) {
        console.error('\n❌ 导入失败:', error.message);
        console.error(error.stack);
        if (client) {
            await client.close();
        }
        process.exit(1);
    }
}

// 执行导入
importChannelUsernames();

