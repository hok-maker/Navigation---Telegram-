'use client';

import { useState } from 'react';
import Image from 'next/image';
import styles from './ChannelCard.module.css';
import LikeButton from '../LikeButton';

/**
 * 格式化数字
 */
function formatNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

/**
 * 根据字符串生成颜色（确保同一频道颜色一致）
 */
function getColorFromString(str) {
  const colors = [
    ['#667eea', '#764ba2'], // 紫色
    ['#f093fb', '#f5576c'], // 粉色
    ['#4facfe', '#00f2fe'], // 蓝色
    ['#43e97b', '#38f9d7'], // 绿色
    ['#fa709a', '#fee140'], // 橙粉
    ['#30cfd0', '#330867'], // 青紫
    ['#a8edea', '#fed6e3'], // 淡彩
    ['#ff9a9e', '#fecfef'], // 柔粉
  ];
  
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

/**
 * 获取频道名称首字母（支持中文、英文、数字）
 */
function getInitial(name) {
  if (!name) return '?';
  const firstChar = name.trim()[0];
  // 如果是 emoji 或特殊字符，返回前2个字符
  if (firstChar && firstChar.match(/[\u{1F300}-\u{1F9FF}]/u)) {
    return name.trim().slice(0, 2);
  }
  return firstChar.toUpperCase();
}

/**
 * 频道卡片组件（⭐ 紧凑版 + 分享功能）
 * 优化思路：
 * 1. 整个卡片可点击（去掉底部按钮）
 * 2. 更小的头像和间距（提高信息密度）
 * 3. 只显示最重要的信息（订阅数）
 * 4. 点赞按钮移到右上角
 * 5. 分享按钮在点赞按钮旁边
 */
export default function ChannelCard({ channel }) {
  // 状态：复制成功提示
  const [copySuccess, setCopySuccess] = useState(false);
  const [showTip, setShowTip] = useState(false);
  // ⭐ 头像加载状态
  const [imageError, setImageError] = useState(false);

  // 使用默认值处理
  const {
    username = '',
    name = '未知频道',
    description,
    avatar,
    stats = {},
    isVerified = false,
    url
  } = channel || {}

  // 描述（2行，约80字符）
  const shortDesc = description 
    ? (description.length > 80 ? description.substring(0, 80) + '...' : description)
    : null

  // Telegram 频道链接
  const telegramUrl = url || `https://t.me/${username}`

  // ⭐ 默认头像：首字母 + 渐变色
  const initial = getInitial(name)
  const [color1, color2] = getColorFromString(username || name)
  const gradientStyle = {
    background: `linear-gradient(135deg, ${color1} 0%, ${color2} 100%)`
  }

  // ⭐ 复制分享链接（指向独立分享页面）
  const handleShare = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (typeof window === 'undefined') return;
    
    const shareUrl = `${window.location.origin}/${username}`;
    
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopySuccess(true);
      setShowTip(true);
      // 2秒后隐藏图标提示
      setTimeout(() => setCopySuccess(false), 2000);
      // 5秒后隐藏完整提示
      setTimeout(() => setShowTip(false), 5000);
    }).catch(err => {
      console.error('复制失败:', err);
    });
  };

  return (
    <>
      {/* ⭐ 复制成功提示框 */}
      {showTip && (
        <div 
          className={styles.shareToast}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowTip(false);
          }}
        >
          <div 
            className={styles.toastContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.toastIcon}>🎉</div>
            <div className={styles.toastText}>
              <div className={styles.toastTitle}>邀请链接已生成！</div>
              <div className={styles.toastChannel}>频道：{name}</div>
              <div className={styles.toastDesc}>
                <div className={styles.tipItem}>
                  <span className={styles.tipIcon}>💎</span>
                  <span>邀请好友点赞 <strong>提升频道排名</strong></span>
                </div>
                <div className={styles.tipItem}>
                  <span className={styles.tipIcon}>📈</span>
                  <span>排名越高 · 曝光越多 · 粉丝越多</span>
                </div>
                <div className={styles.sharePrompt}>
                  <div className={styles.shareTitle}>分享到社交平台</div>
                  <div className={styles.shareTags}>
                    Telegram · X · Facebook · Reddit · Discord
                  </div>
                </div>
              </div>
            </div>
            <button 
              className={styles.toastClose}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowTip(false);
              }}
            >
              ×
            </button>
          </div>
        </div>
      )}

      <a 
        href={telegramUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.card}
      >
        {/* 右上角按钮组 */}
        <div className={styles.topActions}>
          {/* 分享按钮 */}
          <div className={styles.buttonWrapper}>
          <button 
            className={styles.shareButton}
            onClick={handleShare}
          >
            {copySuccess ? '✓' : '🔗'}
          </button>
            <span className={styles.tooltip}>
              {copySuccess ? '已复制链接' : '复制分享链接'}
            </span>
          </div>
          
          {/* 点赞按钮 */}
          <div onClick={(e) => e.preventDefault()}>
            <LikeButton channel={channel} />
          </div>
        </div>

      {/* 头像和信息 */}
      <div className={styles.header}>
        <div className={styles.avatarWrapper}>
          {/* ⭐ 优化：只在有头像且未失败时显示真实头像 */}
          {avatar && !imageError ? (
            <Image 
              src={avatar} 
              alt={name} 
              width={48}
              height={48}
              className={styles.avatar}
              loading="lazy"
              unoptimized={avatar.startsWith('/api/')}
              onError={() => {
                // ⭐ 加载失败时，标记错误状态，显示默认头像
                setImageError(true);
              }}
            />
          ) : (
            /* ⭐ 默认头像：首字母 + 渐变色（无头像或加载失败时显示） */
            <div className={styles.avatarPlaceholder} style={gradientStyle}>
              {initial}
            </div>
          )}
        </div>
        <div className={styles.info}>
          {/* 频道名称 + 认证标志 */}
          <h3 className={styles.name}>
            {name}
            {isVerified && (
              <span className={styles.verified} title="已认证">✓</span>
            )}
          </h3>

          {/* 描述（紧贴名称下方） */}
      {shortDesc && (
        <p className={styles.description} suppressHydrationWarning>
          {shortDesc}
        </p>
      )}
        </div>
          </div>
        
      {/* 订阅数（底部独立显示） */}
      <div className={styles.footer}>
        <div className={styles.members}>
          <span className={styles.membersIcon}>👥</span>
          <span className={styles.membersCount}>{formatNumber(stats.members || 0)}</span>
        </div>
      </div>
      </a>
    </>
  );
}

