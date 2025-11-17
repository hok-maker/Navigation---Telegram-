# 频道数据导出/导入指南

## 📋 概述

这套脚本用于在开发环境和生产环境之间迁移频道数据。

**使用场景：**
- ✅ 开发/测试阶段已爬取大量频道数据
- ✅ 需要将这些频道用户名迁移到生产服务器
- ✅ 在生产服务器快速启动，无需从零开始爬取

**工作流程：**
```
开发服务器                 生产服务器
    ↓                         ↓
导出用户名                 导入用户名
    ↓                         ↓
JSON/TXT 文件   →  传输  →  数据库
    ↓                         ↓
统计报告                   自动补全数据
                              ↓
                     PreviewCrawler_New
```

---

## 📤 导出频道列表（开发服务器）

### 脚本文件

```bash
Navigation/scripts/export_channel_usernames.js
```

### 使用方法

```bash
# 进入 Navigation 目录
cd Navigation

# 运行导出脚本（增量导出 - 默认）
node scripts/export_channel_usernames.js

# 全量导出
node scripts/export_channel_usernames.js all

# 导出最近7天创建的频道
node scripts/export_channel_usernames.js recent 7
```

### 输出文件

脚本会在 `Navigation/exports/` 目录生成3个文件：

| 文件 | 格式 | 用途 | 示例 |
|------|------|------|------|
| `channel_usernames_YYYY-MM-DD.json` | JSON | 完整信息（含名称、订阅数） | 推荐导入用 |
| `channel_usernames_YYYY-MM-DD.txt` | TXT | 纯用户名列表（每行一个） | 简单快速 |
| `export_stats_YYYY-MM-DD.json` | JSON | 统计信息（Top 10等） | 查看报告 |

### 输出示例

```bash
================================================================================
✅ 导出成功！
================================================================================

📁 导出目录: /path/to/Navigation/exports/

📄 导出文件:
   • channel_usernames_new_2025-11-16.json (2.5 MB) - 完整信息
   • channel_usernames_new_2025-11-16.txt (156 KB) - 纯用户名列表
   • export_stats_new_2025-11-16.json - 统计信息

📊 数据统计:
   • 频道总数: 10,234
   • 订阅总数: 45,678,900
   • 平均订阅: 4,462
   • 最大订阅: 1,234,567
   • 最小订阅: 50

🏆 Top 10 频道:
   1. @telegram - Telegram Tips (1,234,567 订阅)
   2. @durov - Pavel Durov (987,654 订阅)
   ...
```

---

## 📥 导入频道列表（生产服务器）

### 脚本文件

```bash
Navigation/scripts/import_channel_usernames.js
```

### 使用方法

#### 步骤1：传输文件到生产服务器

```bash
# 方式1：使用 scp
scp exports/channel_usernames_new_2025-11-16.json user@server:/path/to/Navigation/exports/

# 方式2：使用 rsync
rsync -avz exports/ user@server:/path/to/Navigation/exports/

# 方式3：使用云存储（如果可用）
# 上传到 Google Drive / Dropbox / 阿里云OSS，然后在生产服务器下载
```

#### 步骤2：在生产服务器运行导入

```bash
# 进入 Navigation 目录
cd Navigation

# 导入 JSON 文件（推荐）
node scripts/import_channel_usernames.js channel_usernames_new_2025-11-16.json

# 或导入 TXT 文件
node scripts/import_channel_usernames.js channel_usernames_new_2025-11-16.txt

# 或使用完整路径
node scripts/import_channel_usernames.js ../exports/channel_usernames_new_2025-11-16.json
```

### 导入过程

```bash
================================================================================
📥 导入频道用户名列表
================================================================================

📁 文件路径: exports/channel_usernames_new_2025-11-16.json

📖 读取文件...
✅ 读取到 10,234 个频道

🔧 连接数据库...
✅ 数据库连接成功

🔍 检查数据库现有数据...
   数据库中已有 50 个频道

📊 导入统计:
   • 待导入: 10,234 个
   • 已存在: 50 个（跳过）
   • 需导入: 10,184 个

💾 开始导入...
   进度: 1000/10184
   进度: 2000/10184
   ...
   进度: 10184/10184

================================================================================
✅ 导入成功！
================================================================================

📊 最终统计:
   • 成功导入: 10,184 个频道
   • 已跳过: 50 个（数据库中已存在）
   • 总计: 10,234 个
```

---

## 🔄 完整迁移流程

### 在开发服务器

```bash
# 1. 导出频道列表
cd /path/to/Navigation
node scripts/export_channel_usernames.js

# 2. 检查导出文件
ls -lh exports/
# channel_usernames_new_2025-11-16.json
# channel_usernames_new_2025-11-16.txt
# export_stats_new_2025-11-16.json

# 3. 传输到生产服务器（示例）
scp exports/channel_usernames_new_2025-11-16.json user@server:/path/to/Navigation/exports/
```

### 在生产服务器

```bash
# 1. 确保数据库已启动
mongosh --host 127.0.0.1:27017 --eval "db.runCommand('ping')"

# 2. 确保 Navigation 代码已部署
cd /path/to/Navigation
npm install

# 3. 配置环境变量
cp env.template .env
vim .env  # 配置数据库连接等

# 4. 导入频道列表
node scripts/import_channel_usernames.js channel_usernames_new_2025-11-16.json

# 5. 启动 PreviewCrawler_New 补全数据
cd ../PreviewCrawler_New
pm2 start ecosystem.config.js

# 6. （可选）启动 NetworkCrawler 爬取消息
cd ../NetworkCrawler
pm2 start ecosystem.config.js
```

---

## 📊 数据结构说明

### 导出的数据（JSON 格式）

```json
{
  "exportMode": "new",
  "exportTime": "2025-11-16T10:30:00.000Z",
  "totalChannels": 10234,
  "channels": [
    {
      "username": "telegram",
      "name": "Telegram Tips",
      "members": 1234567,
      "createdAt": "2025-10-01T00:00:00.000Z",
      "lastExported": null
    },
    {
      "username": "durov",
      "name": "Pavel Durov",
      "members": 987654,
      "createdAt": "2025-10-02T00:00:00.000Z",
      "lastExported": null
    }
    // ... more channels
  ]
}
```

### 导入后的数据库记录

```javascript
{
  username: "telegram",
  entityType: "channel",
  name: "Telegram Tips",        // ⭐ 从导出文件获取
  description: null,              // 等待 PreviewCrawler 补全
  avatar: null,                   // 等待 PreviewCrawler 补全
  
  stats: {
    members: 1234567,            // ⭐ 从导出文件获取
    memberHistory: []             // 等待 PreviewCrawler 填充
  },
  
  weight: {
    value: 0,                     // 等待 PreviewCrawler 计算
    baseWeight: 0,
    growthBonus: 0
  },
  
  dataSources: {
    networkCrawler: {
      hasData: false,             // 未被 NetworkCrawler 处理
      lastCrawl: null
    },
    previewPage: {
      hasData: false,             // ⭐ 未被 PreviewCrawler 处理（会被 PreviewCrawler_New 识别）
      lastCrawl: null
    }
  },
  
  meta: {
    firstDiscoveredFrom: "imported_seed_data",
    firstDiscoveredAt: ISODate()
  },
  
  createdAt: ISODate(),
  updatedAt: ISODate()
}
```

---

## 🎯 PreviewCrawler_New 的作用

导入后，`PreviewCrawler_New` 会自动处理这些频道：

### 查询条件

```javascript
{
  'dataSources.previewPage.hasData': { $ne: true }  // ⭐ 未被处理的频道
}
```

### 补全内容

1. ✅ **基础信息** - 名称、描述、头像
2. ✅ **订阅数据** - 最新订阅人数、历史记录
3. ✅ **权重计算** - 基于订阅数计算初始权重
4. ✅ **标记完成** - 设置 `dataSources.previewPage.hasData = true`

### 处理时间

```
假设：10,000 个频道，并发 5，每个 2.5 秒

处理时间 = 10,000 / 5 × 2.5 秒 ≈ 5,000 秒 ≈ 1.4 小时
```

**实际可能更快：**
- `PreviewCrawler_New` 持续运行，每 60 秒检查一次
- 处理完一批后，立即处理下一批
- 大约 **2-3 小时** 内完成所有频道的补全

---

## ⚠️ 注意事项

### 1. 数据库兼容性

✅ **脚本会自动处理重复**
- 导入前检查数据库中已有的频道
- 跳过已存在的频道
- 只插入新频道

### 2. 文件大小

| 频道数 | JSON 大小 | TXT 大小 |
|--------|-----------|----------|
| 1,000 | ~250 KB | ~15 KB |
| 10,000 | ~2.5 MB | ~150 KB |
| 100,000 | ~25 MB | ~1.5 MB |

### 3. 网络传输

**推荐方式（按优先级）：**
1. ⭐ **内网传输** - 使用 scp/rsync（最快）
2. 🌐 **云存储** - 阿里云 OSS / AWS S3（稳定）
3. 📧 **邮件附件** - 小文件可用（<10MB）

### 4. 权限要求

```bash
# 确保脚本有执行权限
chmod +x scripts/export_channel_usernames.js
chmod +x scripts/import_channel_usernames.js

# 确保 exports 目录可写
chmod 755 exports/
```

---

## 🐛 常见问题

### Q1: 导出时提示"数据库连接失败"

**解决：**
```bash
# 检查 MongoDB 是否运行
mongosh --host 127.0.0.1:27017 --eval "db.runCommand('ping')"

# 检查 .env 配置
cat .env | grep MONGODB_URI
```

### Q2: 导入时提示"文件找不到"

**解决：**
```bash
# 使用绝对路径
node scripts/import_channel_usernames.js /full/path/to/exports/channel_usernames_new_2025-11-16.json

# 或确保文件在 exports 目录
ls -la exports/
```

### Q3: 导入后 PreviewCrawler_New 没有处理

**检查：**
```bash
# 1. 确认导入成功
mongosh 06_DB_crawler --eval "db.channels.countDocuments({'dataSources.previewPage.hasData': false})"
# 应该显示导入的数量

# 2. 查看 PreviewCrawler_New 日志
pm2 logs preview-crawler-new

# 3. 手动触发（如果需要）
cd PreviewCrawler_New
node bot.js
```

### Q4: 部分频道已存在，会重复吗？

**不会！** 导入脚本会：
- ✅ 自动检测数据库中已有的频道
- ✅ 只导入新频道
- ✅ 显示跳过的数量

---

## 📈 性能优化

### 导出优化

```javascript
// 按订阅数降序（大频道优先）
.sort({ 'stats.members': -1 })

// 只查询必要字段
.project({ username: 1, name: 1, 'stats.members': 1 })
```

### 导入优化

```javascript
// 分批插入（每批 1000 个）
const batchSize = 1000;

// 忽略重复错误
insertMany(batch, { ordered: false })
```

---

## 🎯 总结

### 优点

- ✅ **快速启动** - 生产服务器 2-3 小时完成数据补全
- ✅ **避免重复** - 自动检测已有频道
- ✅ **格式灵活** - 支持 JSON 和 TXT 两种格式
- ✅ **详细统计** - 导出/导入都有完整报告

### 流程

```
开发服务器 → 导出(2分钟) → 传输(5分钟) → 导入(3分钟) → 补全(2小时) → 完成 ✅
```

### 注意事项

1. ⚠️ 导出前确认数据库连接正常
2. ⚠️ 传输文件时检查完整性（文件大小）
3. ⚠️ 导入后启动 `PreviewCrawler_New` 补全数据
4. ⚠️ 监控 PM2 日志，确保处理正常

---

**创建时间:** 2025-11-16  
**版本:** v1.0  
**位置:** Navigation/scripts/  
**维护者:** 爬虫团队

