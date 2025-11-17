/**
 * 查看账号限流历史
 * 
 * 命令:
 * node scripts/view_floodwait_history.js view
 * node scripts/view_floodwait_history.js export
 * node scripts/view_floodwait_history.js clear
 * 用于分析账号的 API 使用限额和限流规律
 * 
 * 使用方法:
 * node scripts/view_floodwait_history.js <命令>
 * 
 * 命令:
 * view      查看所有账号的限流历史
 * export    导出限流数据为 CSV 文件
 * clear     清除所有限流历史（危险！）
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = '06_DB_crawler';

/**
 * 查看所有账号的限流历史
 */
async function viewFloodWaitHistory() {
    const client = new MongoClient(MONGODB_URI);
    
    try {
        await client.connect();
        const db = client.db(DB_NAME);
        const accounts = await db.collection('accounts').find().toArray();

        if (accounts.length === 0) {
            console.log('📭 数据库中没有账号');
            return;
        }

        console.log('\n' + '='.repeat(80));
        console.log('📊 账号限流历史分析');
        console.log('='.repeat(80) + '\n');

        for (const account of accounts) {
            console.log(`\n🔷 ${account.name} (${account.credentials.phone})`);
            console.log('─'.repeat(80));
            
            // 统计信息
            console.log('\n📈 总体统计:');
            console.log(`   总请求数: ${account.stats.totalRequests || 0}`);
            console.log(`   成功请求: ${account.stats.successfulRequests || 0}`);
            console.log(`   失败请求: ${account.stats.failedRequests || 0}`);
            console.log(`   限流次数: ${account.stats.floodWaitCount || 0}`);
            console.log(`   总冷却时间: ${Math.ceil((account.stats.totalFloodWaitSeconds || 0) / 60)} 分钟`);
            
            // 当前状态
            if (account.status.isCoolingDown && account.status.cooldownUntil) {
                const remaining = Math.max(0, Math.ceil((new Date(account.status.cooldownUntil) - Date.now()) / 1000 / 60));
                if (remaining > 0) {
                    console.log(`\n⚠️  当前状态: 冷却中（剩余 ${remaining} 分钟）`);
                }
            }
            
            // 限流历史
            if (account.floodWaitHistory && account.floodWaitHistory.length > 0) {
                console.log(`\n📋 限流历史记录 (最近 ${account.floodWaitHistory.length} 次):\n`);
                
                console.log('时间                    | 冷却时长      | 总请求数 | 距上次限流 | 平均请求/次');
                console.log('─'.repeat(80));
                
                account.floodWaitHistory.forEach((record, index) => {
                    const time = new Date(record.timestamp).toLocaleString('zh-CN');
                    const waitMin = Math.ceil(record.waitSeconds / 60);
                    const totalReq = record.totalRequestsAtTime || 0;
                    const sinceLastFloodWait = record.requestsSinceLastFloodWait || 0;
                    const avgPerFlood = sinceLastFloodWait > 0 ? sinceLastFloodWait : (index === 0 ? totalReq : '-');
                    
                    console.log(
                        `${time.padEnd(23)} | ${waitMin.toString().padEnd(8)} 分钟 | ${totalReq.toString().padEnd(8)} | ${sinceLastFloodWait.toString().padEnd(10)} | ${avgPerFlood}`
                    );
                });
                
                // 分析
                if (account.floodWaitHistory.length >= 2) {
                    const validRecords = account.floodWaitHistory.filter(r => r.requestsSinceLastFloodWait > 0);
                    if (validRecords.length > 0) {
                        const avgRequests = Math.floor(
                            validRecords.reduce((sum, r) => sum + r.requestsSinceLastFloodWait, 0) / validRecords.length
                        );
                        const maxRequests = Math.max(...validRecords.map(r => r.requestsSinceLastFloodWait));
                        const minRequests = Math.min(...validRecords.map(r => r.requestsSinceLastFloodWait));
                        
                        console.log('\n💡 限流规律分析:');
                        console.log(`   平均限流间隔: ${avgRequests} 次请求`);
                        console.log(`   最大限流间隔: ${maxRequests} 次请求`);
                        console.log(`   最小限流间隔: ${minRequests} 次请求`);
                        console.log(`   建议: 每 ${Math.floor(avgRequests * 0.8)} 次请求后休息一段时间`);
                    }
                }
            } else {
                console.log('\n📋 限流历史: 暂无记录');
            }
            
            console.log('');
        }
        
        console.log('='.repeat(80));
        console.log('✅ 分析完成\n');
        
    } catch (error) {
        console.error('❌ 查看限流历史失败:', error);
    } finally {
        await client.close();
    }
}

/**
 * 清除所有限流历史（危险操作）
 */
async function clearFloodWaitHistory() {
    const client = new MongoClient(MONGODB_URI);
    
    try {
        await client.connect();
        const db = client.db(DB_NAME);
        
        console.log('⚠️  这将清除所有账号的限流历史记录！');
        console.log('⚠️  请在5秒内按 Ctrl+C 取消...\n');
        
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        const result = await db.collection('accounts').updateMany(
            {},
            { 
                $set: {
                    floodWaitHistory: [],
                    'stats.floodWaitCount': 0,
                    'stats.totalFloodWaitSeconds': 0
                }
            }
        );
        
        console.log(`✅ 已清除 ${result.modifiedCount} 个账号的限流历史\n`);
        
    } catch (error) {
        console.error('❌ 清除失败:', error);
    } finally {
        await client.close();
    }
}

/**
 * 导出限流数据为 CSV
 */
async function exportToCSV() {
    const client = new MongoClient(MONGODB_URI);
    const fs = require('fs');
    
    try {
        await client.connect();
        const db = client.db(DB_NAME);
        const accounts = await db.collection('accounts').find().toArray();

        let csv = '账号,时间,冷却时长(分钟),总请求数,距上次限流请求数\n';
        
        for (const account of accounts) {
            if (account.floodWaitHistory && account.floodWaitHistory.length > 0) {
                for (const record of account.floodWaitHistory) {
                    const time = new Date(record.timestamp).toISOString();
                    const waitMin = Math.ceil(record.waitSeconds / 60);
                    const totalReq = record.totalRequestsAtTime || 0;
                    const sinceLastFloodWait = record.requestsSinceLastFloodWait || 0;
                    
                    csv += `${account.credentials.phone},${time},${waitMin},${totalReq},${sinceLastFloodWait}\n`;
                }
            }
        }
        
        const filename = `floodwait_history_${Date.now()}.csv`;
        fs.writeFileSync(filename, csv);
        console.log(`✅ 数据已导出到: ${filename}\n`);
        
    } catch (error) {
        console.error('❌ 导出失败:', error);
    } finally {
        await client.close();
    }
}

/**
 * 主函数
 */
async function main() {
    const args = process.argv.slice(2);
    const command = args[0];

    if (!command) {
        console.log(`
📊 账号限流历史查看工具

使用方法:
  node scripts/view_floodwait_history.js <命令>

命令:
  view      查看所有账号的限流历史
  export    导出限流数据为 CSV 文件
  clear     清除所有限流历史（危险！）

示例:
  node scripts/view_floodwait_history.js view
  node scripts/view_floodwait_history.js export
        `);
        process.exit(0);
    }

    try {
        switch (command) {
            case 'view':
                await viewFloodWaitHistory();
                break;
            
            case 'export':
                await exportToCSV();
                break;
            
            case 'clear':
                await clearFloodWaitHistory();
                break;
            
            default:
                console.log(`❌ 未知命令: ${command}`);
                console.log('运行 node scripts/view_floodwait_history.js 查看帮助');
        }
    } catch (error) {
        console.error('❌ 执行失败:', error);
        process.exit(1);
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    main();
}

module.exports = {
    viewFloodWaitHistory,
    clearFloodWaitHistory,
    exportToCSV
};

