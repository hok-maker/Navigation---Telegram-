# 📚 数据库模块使用说明

## 🎯 设计理念

采用**模块化设计**，每个数据库独立为一个模块文件，便于管理和维护。

## 📦 模块结构

```
utils/db/
├── index.js              # 统一导出入口
├── db_schedule.js        # 课表数据库
├── db2_points.js         # 积分数据库
├── db3_federation.js     # 联盟设置数据库
├── db4_userActivityStats.js  # 用户活跃度统计数据库
├── db5_echoBot.js        # 回声机器人数据库
├── db6_crawler.js        # 爬虫数据库 ⭐
└── redis.js              # Redis 缓存
```

---

## 🚀 使用方法

### 方式 1：统一导入（推荐）

```javascript
import { db6, connectDB6 } from '@/utils/db';

async function getData() {
  // 确保数据库已连接
  await connectDB6();
  
  // 使用集合
  const channels = await db6.channels.find({}).toArray();
  return channels;
}
```

### 方式 2：直接导入模块

```javascript
import { db6, connectDB6 } from '@/utils/db/db6_crawler';

async function getData() {
  await connectDB6();
  const channels = await db6.channels.find({}).toArray();
  return channels;
}
```

---

## 📊 爬虫数据库 (db6_crawler.js)

### 数据库信息

- **数据库名称**: `06_DB_crawler`
- **连接函数**: `connectDB6()`
- **集合对象**: `db6`

### 集合列表

| 集合 | 说明 | 用途 |
|------|------|------|
| `db6.channels` | 频道数据 | 存储所有爬取的 Telegram 频道信息 |
| `db6.entities` | 实体缓存 | 缓存非频道用户名（避免重复 API 调用）|
| `db6.accounts` | Telegram 账号 | 管理爬虫使用的 Telegram 账号 |
| `db6.crawlLogs` | 爬取日志 | 记录爬虫运行日志 |

---

## 💡 实际示例

### 示例 1：获取频道列表（首页）

```javascript
// app/page.jsx
import { db6, connectDB6 } from '@/utils/db';

async function getChannels() {
  await connectDB6();
  
  const channels = await db6.channels
    .find({ 'meta.isActive': true })
    .sort({ 'stats.members': -1 })
    .limit(500)
    .toArray();
  
  return channels;
}
```

### 示例 2：获取频道详情

```javascript
// app/channel/[username]/page.jsx
import { db6, connectDB6 } from '@/utils/db';

async function getChannelDetails(username) {
  await connectDB6();
  
  const channel = await db6.channels.findOne({ username });
  return channel;
}
```

### 示例 3：Server Action 中使用

```javascript
// app/Actions.js
'use server';

import { db6, connectDB6 } from '@/utils/db';
import { withServerAction } from '@/utils/serverAction';

export const searchChannels = withServerAction(async (searchTerm) => {
  await connectDB6();
  
  const channels = await db6.channels
    .find({
      $or: [
        { username: { $regex: searchTerm, $options: 'i' } },
        { title: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } }
      ]
    })
    .limit(50)
    .toArray();
  
  return channels;
});
```

---

## 🔄 数据结构

### channels 集合

```javascript
{
  _id: ObjectId("..."),
  username: "channelname",          // 频道用户名
  title: "频道标题",
  description: "频道描述",
  
  stats: {
    members: 100000,                // 成员数
    lastMessageId: 12345,           // 最后一条消息 ID
    estimatedActivity: 50           // 估计活跃度
  },
  
  links: [                          // 从频道中提取的链接
    { username: "link1", source: "description" },
    { username: "link2", source: "message" }
  ],
  
  crawlState: {
    lastMessageId: 12345,           // 上次读取到的消息 ID
    lastCrawlTime: ISODate("..."),  // 上次爬取时间
    isIndexChannel: true,           // 是否为索引类频道
    crawlCount: 5,                  // 爬取次数
    consecutiveFailures: 0          // 连续失败次数
  },
  
  quality: {
    discoveredChannels: 25,         // 发现的频道数量
    qualityScore: 65,               // 质量分（0-100）
    lastCalculated: ISODate("...")  // 上次计算时间
  },
  
  meta: {
    isActive: true,                 // 是否活跃
    isQualitySource: false,         // 是否为优质源
    qualitySourceNote: "",          // 优质源备注
    lastError: null,                // 最后错误
    consecutiveErrors: 0            // 连续错误次数
  },
  
  firstDiscoveredAt: ISODate("..."), // 首次发现时间
  discoveredFrom: "source_channel",  // 来源频道
  lastChecked: ISODate("..."),       // 最后检查时间
  createdAt: ISODate("..."),         // 创建时间
  updatedAt: ISODate("...")          // 更新时间
}
```

---

## ⚠️ 注意事项

### 1. 连接管理

```javascript
// ❌ 错误：每次都创建新连接
async function getData() {
  const client = new MongoClient(uri);
  await client.connect();
  // ...
}

// ✅ 正确：使用模块提供的连接函数
async function getData() {
  await connectDB6();  // 自动复用连接
  const data = await db6.channels.find({}).toArray();
  return data;
}
```

### 2. 字段名称变化

从旧版 `mongodb.js` 迁移时注意字段名称变化：

| 旧字段 | 新字段 | 说明 |
|--------|--------|------|
| `isActive` | `meta.isActive` | 活跃状态 |
| `isVerified` | `meta.isVerified` | 认证状态 |
| - | `quality.*` | 新增质量评分系统 |
| - | `crawlState.*` | 新增爬取状态 |

### 3. JSON 序列化

Server Component 返回的数据需要 JSON 序列化：

```javascript
// ✅ 正确
async function getChannels() {
  await connectDB6();
  const channels = await db6.channels.find({}).toArray();
  return JSON.parse(JSON.stringify(channels));  // 序列化
}

// ❌ 错误：直接返回 MongoDB 对象
async function getChannels() {
  await connectDB6();
  return await db6.channels.find({}).toArray();  // 包含 _id 等非 JSON 类型
}
```

---

## 🔧 环境变量

在 `.env` 文件中配置：

```bash
# MongoDB 连接 URI
MONGODB_URI=mongodb://localhost:27017

# 如果使用副本集
MONGODB_URI=mongodb://127.0.0.1:27017,127.0.0.1:27018/?replicaSet=LocalRS_01
```

---

## 📖 更多信息

- **爬虫数据库设计**: 查看 `/MTProto_Bot(爬虫)/数据库结构设计.md`
- **索引优化**: 运行 `/MTProto_Bot(爬虫)/scripts/create_indexes.js`
- **质量评分**: 查看 `/MTProto_Bot(爬虫)/scripts/recalculate_quality_scores.js`

---

## ✅ 优势对比

### 旧方案 (`mongodb.js`)

```javascript
// ❌ 单一文件，难以扩展
import { getChannelsCollection } from '@/utils/mongodb';

const collection = await getChannelsCollection();
const channels = await collection.find({}).toArray();
```

### 新方案 (`db6_crawler.js`)

```javascript
// ✅ 模块化设计，易于维护
import { db6, connectDB6 } from '@/utils/db';

await connectDB6();
const channels = await db6.channels.find({}).toArray();
const entities = await db6.entities.find({}).toArray();  // 多集合支持
const accounts = await db6.accounts.find({}).toArray();
```

**优势：**
- ✅ 模块化设计，清晰的职责分离
- ✅ 多集合支持，不需要为每个集合写函数
- ✅ 连接复用，性能更好
- ✅ 统一的命名规范（db6、connectDB6）
- ✅ 与爬虫项目保持一致

---

**🎉 重构完成！现在 Next.js 项目使用与爬虫项目相同的模块化数据库设计！**

