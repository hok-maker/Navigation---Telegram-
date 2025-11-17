# Telegram 频道导航网站

一个用于展示和浏览 Telegram 频道的导航网站。

## 项目简介

本项目是一个基于 Next.js 的 Telegram 频道导航网站，展示从爬虫系统收集的频道数据。用户可以浏览、搜索和筛选各种 Telegram 频道。

## 技术栈

- **框架**: Next.js 14 (App Router)
- **数据库**: MongoDB
- **UI**: React + CSS Modules
- **部署**: 可部署到 Vercel 或其他支持 Node.js 的平台

## 项目结构

```
02Next_开局模版/
├── app/                    # Next.js App Router 页面
│   ├── layout.jsx          # 根布局
│   ├── page.jsx            # 首页（频道列表）
│   ├── page.module.css     # 首页样式
│   └── globals.css         # 全局样式
├── components/             # React 组件
│   ├── ChannelCard/        # 频道卡片组件
│   └── BackToTop/          # 返回顶部组件
├── utils/                  # 工具函数
│   └── mongodb.js          # MongoDB 连接
├── service/                # 服务层
│   └── middlewares/        # 中间件
├── .env.local              # 环境变量（需要手动创建）
├── package.json            # 依赖管理
└── README.md               # 项目说明
```

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

创建 `.env.local` 文件（已包含）：

```env
# MongoDB 配置
MONGODB_URI=mongodb://127.0.0.1:27017,127.0.0.1:27018/?replicaSet=LocalRS_01
DB_NAME=telegram_crawler
```

### 3. 确保数据库有数据

先运行爬虫程序收集数据：

```bash
cd ../Telegram爬虫
npm run mass-collect
```

### 4. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3428

## 功能特性

### 已实现

- ✅ 频道列表展示
- ✅ 频道卡片组件（显示名称、描述、统计数据）
- ✅ MongoDB 数据库连接
- ✅ 响应式设计
- ✅ 统计信息展示（总频道数、总订阅数）

### 待实现

- ⏳ 搜索功能
- ⏳ 分类筛选
- ⏳ 排序功能（按订阅数、按更新时间）
- ⏳ 分页功能
- ⏳ 频道详情页
- ⏳ 收藏功能
- ⏳ 标签系统

## 数据来源

数据来自独立的爬虫项目 `Telegram爬虫`，该项目位于同一工作区中。爬虫项目负责：

1. 从公开的 Telegram 频道页面抓取数据
2. 使用 Telegram Client API 搜索和获取详细信息
3. 将数据存储到 MongoDB

## 部署

### 本地部署

```bash
npm run build
npm start
```

### Vercel 部署

1. 在 Vercel 中导入项目
2. 配置环境变量（MongoDB URI）
3. 部署

注意：如果使用本地 MongoDB，需要配置网络访问权限或使用云数据库（如 MongoDB Atlas）。

## 开发说明

### 数据结构

频道数据结构（MongoDB）：

```javascript
{
  _id: ObjectId,
  username: String,       // 频道用户名
  name: String,           // 频道名称
  description: String,    // 频道描述
  avatar: String,         // 头像 URL
  url: String,            // 频道链接
  platform: String,       // 平台（telegram）
  isVerified: Boolean,    // 是否认证
  isActive: Boolean,      // 是否活跃
  stats: {
    members: Number,      // 订阅者数
    posts: Number,        // 消息数
    photos: Number,       // 图片数
    videos: Number,       // 视频数
    files: Number,        // 文件数
    links: Number         // 链接数
  },
  createdAt: Date,        // 创建时间
  updatedAt: Date         // 更新时间
}
```

### 添加新功能

1. 组件放在 `components/` 目录
2. 页面放在 `app/` 目录
3. 工具函数放在 `utils/` 目录
4. API 路由放在 `app/api/` 目录

## 相关项目

- **Telegram爬虫**: 位于 `../Telegram爬虫/`，负责数据收集

## 许可证

MIT
