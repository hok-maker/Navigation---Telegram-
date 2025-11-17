import { error } from './responseFormat.js'

/**
 * Server Action 错误处理高阶函数
 * 类似 Telegram 机器人中的统一错误处理机制
 * 
 * @param {Function} handler - 实际的 Server Action 处理函数
 * @returns {Function} 包装后的函数，自动处理错误
 */
export function withServerAction(handler) {
  return async (...args) => {
    try {
      // 执行实际的业务逻辑
      return await handler(...args)
    } catch (err) {
      // 统一错误处理和日志记录
      console.error("🚨 Server Action Error:", {
        error: err.message,
        stack: err.stack,
        args: args,
        timestamp: new Date().toISOString()
      })
      
      // 返回统一的错误格式
      return error(err.message || "服务器内部错误")
    }
  }
}

/**
 * 带权限检查的 Server Action 包装器
 * @param {Function} handler - 实际的处理函数
 * @param {Function} permissionCheck - 权限检查函数
 * @returns {Function} 包装后的函数
 */
export function withPermissionCheck(handler, permissionCheck) {
  return withServerAction(async (...args) => {
    // 执行权限检查
    const hasPermission = await permissionCheck(...args)
    if (!hasPermission) {
      throw new Error("权限不足，无法执行此操作")
    }
    
    // 权限检查通过，执行实际处理函数
    return await handler(...args)
  })
}

/**
 * 带参数验证的 Server Action 包装器
 * @param {Function} handler - 实际的处理函数
 * @param {Function} validator - 参数验证函数
 * @returns {Function} 包装后的函数
 */
export function withValidation(handler, validator) {
  return withServerAction(async (...args) => {
    // 执行参数验证
    const validationResult = await validator(...args)
    if (!validationResult.isValid) {
      throw new Error(validationResult.message || "参数验证失败")
    }
    
    // 验证通过，执行实际处理函数
    return await handler(...args)
  })
}
