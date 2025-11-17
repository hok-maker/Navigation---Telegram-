/**
 * 输入验证和清洗模块
 * 防止注入攻击和异常输入
 */

/**
 * 清洗搜索关键词
 * @param {string} keyword - 原始关键词
 * @returns {string} 清洗后的关键词
 */
export function sanitizeSearchKeyword(keyword) {
  if (!keyword || typeof keyword !== 'string') {
    return ''
  }
  
  // 1. 去除首尾空格
  let clean = keyword.trim()
  
  // 2. 限制长度（防止超长查询，最多100字符）
  if (clean.length > 100) {
    clean = clean.substring(0, 100)
  }
  
  // 3. 移除特殊MongoDB操作符（防止NoSQL注入）
  // 移除 $、{、} 等特殊字符
  clean = clean.replace(/[\$\{\}]/g, '')
  
  // 4. 移除控制字符（0x00-0x1F, 0x7F）
  clean = clean.replace(/[\x00-\x1F\x7F]/g, '')
  
  // 5. 移除多余的空格（连续空格变单个）
  clean = clean.replace(/\s+/g, ' ')
  
  return clean
}

/**
 * 验证频道用户名格式
 * Telegram用户名规则：5-32字符，只能包含字母、数字、下划线
 * @param {string} username - 频道用户名
 * @returns {boolean} 是否有效
 */
export function validateUsername(username) {
  if (!username || typeof username !== 'string') {
    return false
  }
  
  // Telegram用户名规则
  const usernameRegex = /^[a-zA-Z0-9_]{5,32}$/
  return usernameRegex.test(username)
}

/**
 * 验证设备指纹格式
 * FingerprintJS生成的指纹通常是16-64字符的字母数字
 * @param {string} fingerprint - 设备指纹
 * @returns {boolean} 是否有效
 */
export function validateFingerprint(fingerprint) {
  if (!fingerprint || typeof fingerprint !== 'string') {
    return false
  }
  
  // 长度检查：16-64字符
  if (fingerprint.length < 16 || fingerprint.length > 64) {
    return false
  }
  
  // 格式检查：只允许字母数字
  const fingerprintRegex = /^[a-zA-Z0-9]+$/
  return fingerprintRegex.test(fingerprint)
}

/**
 * 验证页码参数
 * @param {any} page - 页码
 * @returns {number} 有效的页码（最小为1）
 */
export function validatePage(page) {
  const pageNum = parseInt(page)
  
  if (isNaN(pageNum) || pageNum < 1) {
    return 1
  }
  
  // 限制最大页码（防止恶意查询）
  if (pageNum > 10000) {
    return 10000
  }
  
  return pageNum
}

/**
 * 验证页面大小参数
 * @param {any} pageSize - 每页数量
 * @returns {number} 有效的页面大小（默认20，最小1，最大100）
 */
export function validatePageSize(pageSize) {
  const size = parseInt(pageSize)
  
  if (isNaN(size) || size < 1) {
    return 20 // 默认值
  }
  
  // 限制最大每页数量（防止一次性查询过多数据）
  if (size > 100) {
    return 100
  }
  
  return size
}

/**
 * 验证排序字段
 * @param {string} sortBy - 排序字段
 * @returns {string} 有效的排序字段
 */
export function validateSortBy(sortBy) {
  // 白名单：只允许这些排序方式
  const allowedSorts = [
    'weight.value',
    'stats.members',
    'createdAt',
    'updatedAt'
  ]
  
  if (!sortBy || !allowedSorts.includes(sortBy)) {
    return 'weight.value' // 默认按权重排序
  }
  
  return sortBy
}

/**
 * 清洗频道名称（用于管理员输入）
 * @param {string} name - 频道名称
 * @returns {string} 清洗后的名称
 */
export function sanitizeChannelName(name) {
  if (!name || typeof name !== 'string') {
    return ''
  }
  
  let clean = name.trim()
  
  // 限制长度
  if (clean.length > 200) {
    clean = clean.substring(0, 200)
  }
  
  // 移除控制字符
  clean = clean.replace(/[\x00-\x1F\x7F]/g, '')
  
  return clean
}

/**
 * 清洗频道描述（用于管理员输入）
 * @param {string} description - 频道描述
 * @returns {string} 清洗后的描述
 */
export function sanitizeChannelDescription(description) {
  if (!description || typeof description !== 'string') {
    return ''
  }
  
  let clean = description.trim()
  
  // 限制长度
  if (clean.length > 5000) {
    clean = clean.substring(0, 5000)
  }
  
  // 移除控制字符
  clean = clean.replace(/[\x00-\x1F\x7F]/g, '')
  
  return clean
}

