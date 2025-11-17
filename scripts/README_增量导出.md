# 频道增量导出/导入指南

**版本:** V2.0  
**更新日期:** 2025-11-11

---

## 📋 功能概述

增强版导出/导入脚本，支持**增量导出**，解决手动爬取频道后的数据同步问题。

### 核心特性

- ✅ **增量导出** - 只导出新增的频道（默认模式）
- ✅ **全量导出** - 导出所有频道（首次使用或完整备份）
- ✅ **按时间导出** - 导出最近 N 天创建的频道
- ✅ **自动标记** - 导出后自动标记，避免重复
- ✅ **智能识别** - 使用 `meta.lastExported` 字段标记已导出频道

---

## 🚀 快速开始

### 场景 1: 首次使用（全量导出）

```bash
cd NetworkCrawler

# 全量导出所有频道
node scripts/export_channel_usernames.js all

# 输出文件：
# - channel_usernames_all_2025-11-11.json
# - channel_usernames_all_2025-11-11.txt
```

### 场景 2: 日常使用（增量导出）

```bash
# 默认模式：只导出新增频道
node scripts/export_channel_usernames.js

# 或显式指定增量模式
node scripts/export_channel_usernames.js new

# 输出文件：
# - channel_usernames_new_2025-11-11.json
# - channel_usernames_new_2025-11-11.txt
```

### 场景 3: 导出最近创建的频道

```bash
# 导出最近 7 天创建的频道
node scripts/export_channel_usernames.js recent 7

# 导出最近 30 天创建的频道
node scripts/export_channel_usernames.js recent 30

# 输出文件：
# - channel_usernames_recent7d_2025-11-11.json
# - channel_usernames_recent30d_2025-11-11.json
```

---

## 📊 工作流程

### 典型工作流

```
1. 本地/测试环境
   ├─ 手动添加新频道到数据库（或通过爬虫自动发现）
   ├─ 运行 PreviewCrawler_New 补全数据
   └─ 导出新频道
       └─ node scripts/export_channel_usernames.js   # 增量导出

2. 传输文件
   ├─ 将 JSON 文件传输到正式服务器
   └─ scp channel_usernames_new_2025-11-11.json user@server:/path/

3. 正式服务器
   ├─ 导入新频道
   │   └─ node scripts/import_channel_usernames.js channel_usernames_new_2025-11-11.json
   ├─ 启动 PreviewCrawler_New 补全数据
   └─ 启动 NetworkCrawler 爬取消息
```

---

## 📝 详细说明

### 导出模式对比

| 模式 | 命令 | 查询条件 | 适用场景 |
|------|------|---------|----------|
| **增量** | `node scripts/export_channel_usernames.js` | `meta.lastExported` 不存在 | 日常同步新增频道 ⭐ 推荐 |
| **全量** | `node scripts/export_channel_usernames.js all` | 所有频道 | 首次使用、完整备份 |
| **按时间** | `node scripts/export_channel_usernames.js recent 7` | `createdAt` 最近 7 天 | 指定时间范围导出 |

### 标记机制

导出成功后，脚本会自动在数据库中标记已导出频道：

```javascript
// 在 channels 集合中添加
{
    meta: {
        lastExported: ISODate('2025-11-11T10:30:00.000Z')
    },
    updatedAt: ISODate('2025-11-11T10:30:00.000Z')
}
```

**优点：**
- ✅ 下次运行增量导出时，已导出的频道会被自动跳过
- ✅ 可以查询 `meta.lastExported` 字段确认哪些频道已同步
- ✅ 支持多次增量导出，不会重复

---

## 🎯 实际使用案例

### 案例 1: 手动添加新频道

```bash
# 1. 你手动收集了 100 个新频道用户名，保存到 new_channels.txt

# 2. 导入到本地数据库
node scripts/import_channel_usernames.js new_channels.txt

# 3. 启动 PreviewCrawler_New 补全数据
cd ../PreviewCrawler_New_1
pm2 start ecosystem.config.js

# 4. 等待补全完成后，增量导出
cd ../NetworkCrawler
node scripts/export_channel_usernames.js   # 只导出这 100 个新频道

# 5. 传输到正式服务器
scp exports/channel_usernames_new_2025-11-11.json user@server:/path/

# 6. 在正式服务器导入
ssh user@server
cd /path/to/NetworkCrawler
node scripts/import_channel_usernames.js channel_usernames_new_2025-11-11.json
```

### 案例 2: 定期同步

```bash
# 每周一次，同步最近 7 天新增的频道

# 本地环境
node scripts/export_channel_usernames.js recent 7

# 传输到正式服务器
scp exports/channel_usernames_recent7d_2025-11-11.json user@server:/path/

# 正式服务器导入
ssh user@server
cd /path/to/NetworkCrawler
node scripts/import_channel_usernames.js channel_usernames_recent7d_2025-11-11.json
```

### 案例 3: 首次部署正式服务器

```bash
# 1. 在本地导出所有频道（全量）
node scripts/export_channel_usernames.js all

# 2. 传输到正式服务器
scp exports/channel_usernames_all_2025-11-11.json user@server:/path/

# 3. 在正式服务器导入
ssh user@server
cd /path/to/NetworkCrawler
node scripts/import_channel_usernames.js channel_usernames_all_2025-11-11.json

# 4. 启动所有爬虫
pm2 start ecosystem.config.js
cd ../PreviewCrawler_New_1 && pm2 start ecosystem.config.js
cd ../PreviewCrawler_New_2 && pm2 start ecosystem.config.js
```

---

## 🔍 查询已导出频道

### MongoDB 查询示例

```javascript
// 1. 查询已导出的频道
db.channels.find({
    'meta.lastExported': { $exists: true }
}).count();

// 2. 查询未导出的频道（待同步）
db.channels.find({
    'meta.lastExported': { $exists: false }
}).count();

// 3. 查询最近 7 天导出的频道
db.channels.find({
    'meta.lastExported': {
        $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    }
}).count();

// 4. 查询上次导出时间最早的 10 个频道
db.channels.find({
    'meta.lastExported': { $exists: true }
})
.sort({ 'meta.lastExported': 1 })
.limit(10)
.toArray();
```

---

## 📂 输出文件格式

### JSON 格式（完整信息）

```json
{
    "exportMode": "new",
    "exportTime": "2025-11-11T10:30:00.000Z",
    "totalChannels": 150,
    "channels": [
        {
            "username": "example_channel",
            "name": "示例频道",
            "members": 5000,
            "createdAt": "2025-11-10T08:00:00.000Z",
            "lastExported": null
        }
    ]
}
```

### TXT 格式（纯用户名）

```
example_channel
another_channel
test_channel
...
```

---

## ⚠️ 注意事项

### 1. 导出前的准备

- ✅ 确保 PreviewCrawler_New 已经处理完新频道
- ✅ 检查数据库中频道的 `stats.members` 是否已填充
- ✅ 确认网络连接正常（传输文件时）

### 2. 导入时的注意事项

- ⚠️ 导入脚本会自动跳过已存在的频道
- ⚠️ 导入后需要手动启动 PreviewCrawler_New 补全数据
- ⚠️ 大批量导入时，建议分批执行（脚本已自动分批，每批 1000 个）

### 3. 标记字段的管理

**不要手动删除 `meta.lastExported` 字段！** 这会导致频道被重复导出。

如果需要重新导出某些频道：
- 方式 1：使用 `all` 模式导出（不检查标记）
- 方式 2：手动删除特定频道的标记（不推荐）

```javascript
// 删除特定频道的导出标记（谨慎使用）
db.channels.updateMany(
    { username: { $in: ['channel1', 'channel2'] } },
    { $unset: { 'meta.lastExported': '' } }
);
```

---

## 🛠️ 故障排查

### 问题 1: 增量导出显示 0 个频道

**原因:** 所有频道都已被标记为已导出

**解决:**
```bash
# 检查未导出的频道数量
mongo --eval "db.getSiblingDB('db6_crawler').channels.find({'meta.lastExported': {$exists: false}}).count()"

# 如果确实没有新频道，使用 recent 模式查看最近创建的
node scripts/export_channel_usernames.js recent 1
```

### 问题 2: 导入时显示"所有频道都已存在"

**原因:** 频道已经在目标数据库中

**解决:**
```bash
# 查看导入脚本的输出统计
# 如果确实需要重新导入，先删除目标数据库中的频道（谨慎！）
```

### 问题 3: 传输文件时断开连接

**解决:**
```bash
# 使用 rsync 代替 scp（支持断点续传）
rsync -avz --progress exports/channel_usernames_new_2025-11-11.json user@server:/path/
```

---

## 📈 最佳实践

### 1. 定期同步策略

**推荐频率：**
- 手动添加频道后：立即增量导出
- 定期同步：每周一次 `recent 7` 模式
- 完整备份：每月一次 `all` 模式

### 2. 文件命名建议

脚本已自动生成带模式和日期的文件名，建议保留：
- `channel_usernames_new_2025-11-11.json` - 清晰标注导出模式
- `channel_usernames_all_2025-11-11.json` - 便于区分全量备份

### 3. 数据验证

导入后验证数据完整性：
```bash
# 正式服务器
mongo --eval "db.getSiblingDB('db6_crawler').channels.count()"

# 对比导入前后的数量变化
```

---

## 🚀 自动化脚本示例

### 定期自动同步脚本

```bash
#!/bin/bash
# sync_channels.sh - 定期同步新频道到正式服务器

# 配置
LOCAL_DIR="/path/to/NetworkCrawler"
REMOTE_USER="user"
REMOTE_HOST="server.com"
REMOTE_PATH="/path/to/NetworkCrawler"
DATE=$(date +%Y-%m-%d)

# 1. 导出新频道
cd $LOCAL_DIR
node scripts/export_channel_usernames.js

# 2. 查找今天的导出文件
EXPORT_FILE=$(ls exports/channel_usernames_new_${DATE}.json 2>/dev/null)

if [ -z "$EXPORT_FILE" ]; then
    echo "❌ 没有找到今天的导出文件"
    exit 1
fi

# 3. 传输到正式服务器
echo "📤 传输文件: $EXPORT_FILE"
scp $EXPORT_FILE ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}/exports/

# 4. 在正式服务器导入
echo "📥 远程导入..."
ssh ${REMOTE_USER}@${REMOTE_HOST} "cd ${REMOTE_PATH} && node scripts/import_channel_usernames.js exports/$(basename $EXPORT_FILE)"

echo "✅ 同步完成！"
```

**使用方法：**
```bash
# 添加执行权限
chmod +x sync_channels.sh

# 手动执行
./sync_channels.sh

# 或添加到 crontab（每周日凌晨3点）
0 3 * * 0 /path/to/sync_channels.sh >> /path/to/sync.log 2>&1
```

---

## 📚 相关文档

- `README_导出导入频道.md` - 原版导出/导入文档
- `导航网站的docs/数据库结构设计.md` - 数据结构说明
- `00_开发日记/20-数据结构统一-修复.md` - 数据结构修复记录

---

## 🎉 总结

增强版导出/导入脚本完美解决了手动添加频道的同步问题：

1. ✅ **首次使用**: `node scripts/export_channel_usernames.js all`
2. ✅ **日常同步**: `node scripts/export_channel_usernames.js` (增量导出)
3. ✅ **按需导出**: `node scripts/export_channel_usernames.js recent 7`
4. ✅ **自动标记**: 导出后自动标记，避免重复
5. ✅ **智能识别**: 基于 `meta.lastExported` 字段

**核心优势：** 不需要每次全量导出，只同步新增的频道，大大提高效率！🚀

