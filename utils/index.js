// 数据库工具 - 仅用于页面和服务器操作
export {
  db,                      // 课表数据库的集合引用
  db2,                     // 积分数据库的集合引用
  db3,                     // 联盟设置数据库的集合引用
  db4,                     // 用户活跃度统计数据库的集合引用
  db6,                     // 爬虫数据库的集合引用（频道导航网站使用）
  dbEchoBot,               // 回声机器人数据库的集合引用
  connectDB,               // 课表数据库的连接函数
  connectDB2,              // 积分数据库的连接函数
  connectDB3,              // 联盟设置数据库的连接函数
  connectDB4,              // 用户活跃度统计数据库的连接函数
  connectDB6,              // 爬虫数据库的连接函数（频道导航网站使用）
  connectEchoBotDB,        // 回声机器人数据库的连接函数
  initRedis,               // ⭐ Redis连接初始化函数（Navigation 缓存系统）
  getRedis,                // 获取Redis实例
  isRedisAvailable,        // 检查Redis连接状态
  getScheduleChangeStream, // 课表数据库的Change Stream 监听器
  getAllianceChangeStream, // 联盟设置数据库的Change Stream 监听器
  getPointsChangeStream,   // 积分数据库的Change Stream 监听器
  getUserActivityStatsChangeStream, // 用户活跃度统计数据库的Change Stream 监听器
  getEchoBotChangeStream,  // 回声机器人数据库的Change Stream 监听器
  client,                  // 课表数据库的客户端
  client3,                 // 联盟设置数据库的客户端
  client6,                 // 爬虫数据库的客户端
} from './db/index.js'

// Server Action 工具 - 统一错误处理和响应格式
export {
  success,                 // 成功响应格式
  error,                   // 错误响应格式
  permissionDenied,        // 权限不足响应
  notFound,                // 数据未找到响应
  withServerAction,        // Server Action 错误处理包装器
  withPermissionCheck,     // 带权限检查的包装器
  withValidation,          // 带参数验证的包装器
  BUSINESS_STATUS_CODE,    // 业务状态码常量
  RESPONSE_MESSAGES,       // 响应消息常量
} from './serverAction/index.js'

// 安全工具 - 限流和输入验证
export {
  checkRateLimit,          // 通用限流检查
  checkLikeRateLimit,      // 点赞限流
  checkSearchRateLimit,    // 搜索限流
  checkAdminRateLimit,     // 管理员限流
  getRemainingQuota,       // 获取剩余配额
  // ⭐ IP限流（只防攻击，不防爬虫）
  checkGlobalIPRateLimit,  // 全局IP限流
  checkPageAccessRateLimit, // 页面访问限流
  checkAPIRateLimit,       // API限流（长期：10000次/小时）- 宽松策略
  checkAvatarBurstLimit,   // 头像短期限流（1000次/分钟）- 可选
  getClientIP,             // 获取客户端IP
} from './security/rateLimiter.js'

export {
  sanitizeSearchKeyword,   // 清洗搜索关键词
  validateUsername,        // 验证频道用户名
  validateFingerprint,     // 验证设备指纹
  validatePage,            // 验证页码
  validatePageSize,        // 验证页面大小
  validateSortBy,          // 验证排序字段
  sanitizeChannelName,     // 清洗频道名称
  sanitizeChannelDescription, // 清洗频道描述
} from './security/validator.js'
