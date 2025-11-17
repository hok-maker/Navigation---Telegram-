import { BUSINESS_STATUS_CODE, RESPONSE_MESSAGES } from './constants.js'

/**
 * 成功响应格式 - 统一所有成功返回的格式
 * @param {any} data - 返回的数据
 * @param {string} message - 成功消息
 * @param {number} status - 状态码
 * @returns {object} 统一格式的成功响应
 */
export function success(data = null, message = RESPONSE_MESSAGES.SUCCESS, status = BUSINESS_STATUS_CODE.SUCCESS) {
  return { 
    success: true,
    status, 
    message, 
    data 
  }
}

/**
 * 错误响应格式 - 统一所有错误返回的格式
 * @param {string} message - 错误消息
 * @param {number} status - 状态码
 * @param {any} data - 错误相关数据
 * @returns {object} 统一格式的错误响应
 */
export function error(message = RESPONSE_MESSAGES.ERROR, status = BUSINESS_STATUS_CODE.ERROR, data = null) {
  return { 
    success: false,
    status, 
    message, 
    data 
  }
}

/**
 * 权限不足响应
 * @param {string} customMessage - 自定义错误消息
 * @returns {object} 权限错误响应
 */
export function permissionDenied(customMessage = RESPONSE_MESSAGES.PERMISSION_DENIED) {
  return error(customMessage, BUSINESS_STATUS_CODE.ERROR, { type: 'PERMISSION_ERROR' })
}

/**
 * 数据未找到响应
 * @param {string} customMessage - 自定义错误消息
 * @returns {object} 未找到错误响应
 */
export function notFound(customMessage = RESPONSE_MESSAGES.NOT_FOUND) {
  return error(customMessage, BUSINESS_STATUS_CODE.ERROR, { type: 'NOT_FOUND_ERROR' })
}
