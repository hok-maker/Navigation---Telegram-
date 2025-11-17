'use server';

import { getChannelByUsername, likeChannel, checkIfLiked } from '@/app/(pages)/01-telegram-home/Actions';

/**
 * 02-channel-share 模块的 Server Actions
 * 
 * 设计说明：
 * - 本模块复用 01 模块的 Actions，保持一致性
 * - 如果未来需要独立逻辑，在这里扩展即可
 */

/**
 * 获取频道信息
 * @param {string} username - 频道用户名
 * @returns {Promise<Object>} 频道数据
 */
export async function getChannel(username) {
  return await getChannelByUsername(username);
}

/**
 * 点赞频道
 * @param {string} username - 频道用户名
 * @param {string} fingerprint - 设备指纹
 * @returns {Promise<Object>} 点赞结果
 */
export async function likeChannelAction(username, fingerprint) {
  return await likeChannel(username, fingerprint);
}

/**
 * 检查是否已点赞
 * @param {string} username - 频道用户名
 * @param {string} fingerprint - 设备指纹
 * @returns {Promise<Object>} 点赞状态
 */
export async function checkIfLikedAction(username, fingerprint) {
  return await checkIfLiked(username, fingerprint);
}

