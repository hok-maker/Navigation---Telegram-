'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import { likeChannelAction, checkIfLikedAction } from './Actions';
import styles from './ChannelDisplay.module.css';

/**
 * 频道展示组件
 * - 显示频道基本信息
 * - 点赞支持按钮（⭐ 与 01 模块逻辑完全一致）
 * - 打开 Telegram 频道按钮
 */
export default function ChannelDisplay({ channel }) {
  const [liked, setLiked] = useState(false);
  // ⭐ 初始值为 null，避免显示过时数据
  const [likeCount, setLikeCount] = useState(null);
  const [loading, setLoading] = useState(true); // ⭐ 初始为 true
  const [fingerprint, setFingerprint] = useState(null);

  const {
    username = '',
    name = '未知频道',
    description = '',
    avatar,
    stats = {},
    isVerified = false,
  } = channel || {};

  // ⭐ 初始化指纹和检查点赞状态（与 01 模块完全一致）
  useEffect(() => {
    async function init() {
      try {
        // 获取设备指纹
        const fp = await FingerprintJS.load();
        const result = await fp.get();
        const visitorId = result.visitorId;
        setFingerprint(visitorId);

        // 检查是否已点赞（⭐ 获取真实的最新数据）
        const checkResult = await checkIfLikedAction(username, visitorId);
        if (checkResult.success) {
          setLiked(checkResult.data.liked);
          setLikeCount(checkResult.data.count);
        }
      } catch (error) {
        console.error('初始化失败:', error);
        // ⭐ 失败时使用 SSR 数据作为降级
        setLikeCount(channel?.stats?.likes || 0);
      } finally {
        setLoading(false); // ⭐ 加载完成
      }
    }

    init();
  }, [username, channel?.stats?.likes]);

  // ⭐ 处理点赞（与 01 模块完全一致）
  const handleLike = async () => {
    if (loading || !fingerprint) return;
    
    setLoading(true);
    
    try {
      const result = await likeChannelAction(username, fingerprint);
      
      if (result.success) {
        setLiked(result.data.liked);
        setLikeCount(result.data.count);
        
        // 添加动画效果
        const button = document.getElementById('like-button');
        if (button) {
          button.classList.add(styles.likeAnimation);
          setTimeout(() => button.classList.remove(styles.likeAnimation), 600);
        }
      }
    } catch (error) {
      console.error('点赞失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 格式化数字
  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  // 获取首字母（用于默认头像）
  const getInitial = () => {
    if (!name) return '?';
    return name.trim()[0].toUpperCase();
  };

  // Telegram 链接
  const telegramUrl = `https://t.me/${username}`;

  return (
    <div className={styles.channelCard}>
        {/* 头像 */}
      <div className={styles.avatarWrapper}>
          {avatar ? (
            <Image 
              src={avatar} 
              alt={name} 
              width={100}
              height={100}
            className={styles.avatar}
              unoptimized={avatar.startsWith('/api/')}
            />
          ) : (
          <div className={styles.avatarPlaceholder}>
              {getInitial()}
            </div>
          )}
          {isVerified && (
          <div className={styles.verifiedBadge}>✓</div>
          )}
        </div>

        {/* 频道信息 */}
      <div className={styles.channelInfo}>
        <h2 className={styles.channelName}>{name}</h2>
        <p className={styles.channelUsername}>@{username}</p>
          
          {/* 订阅数 */}
        <div className={styles.subscribers}>
          <span className={styles.subscribersIcon}>👥</span>
          <span className={styles.subscribersCount}>{formatNumber(stats.members || 0)}</span>
          <span className={styles.subscribersLabel}>订阅者</span>
          </div>

          {/* 简介 */}
          {description && (
          <p className={styles.description}>
              {description.length > 120 
                ? description.substring(0, 120) + '...' 
                : description}
            </p>
          )}
        </div>

      {/* ⭐ 点赞按钮（与 01 模块逻辑完全一致） */}
        <button 
          id="like-button"
        className={`${styles.likeButton} ${liked ? styles.liked : ''} ${loading ? styles.liking : ''}`}
          onClick={handleLike}
        disabled={loading || !fingerprint}
        title={liked ? '取消点赞' : '点赞支持'}
        >
        <span className={styles.likeIcon}>{liked ? '❤️' : '🤍'}</span>
        <span className={styles.likeText}>
          {liked ? '已点赞' : '点赞支持'}
          </span>
        {/* ⭐ 只在数据加载完成且有点赞时显示数字 */}
        {likeCount !== null && likeCount > 0 && (
          <span className={styles.likeCount}>{likeCount} 个赞</span>
        )}
        </button>

        {/* 打开频道按钮 */}
        <a 
          href={telegramUrl}
          target="_blank"
          rel="noopener noreferrer"
        className={styles.openButton}
      >
        <span className={styles.openIcon}>📱</span>
        <span className={styles.openText}>打开 Telegram 频道</span>
      </a>
    </div>
  );
}
