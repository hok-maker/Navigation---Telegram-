'use client';

import { useState } from 'react';
import styles from './ShareButtons.module.css';

/**
 * 分享页面操作按钮组
 * - 复制分享链接
 * - 返回主页浏览更多
 */
export default function ShareButtons({ username, channelName }) {
  const [copySuccess, setCopySuccess] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const handleCopy = () => {
    if (typeof window === 'undefined') return;
    
    const shareUrl = `${window.location.origin}/${username}`;
    
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopySuccess(true);
      setShowToast(true);
      
      // 按钮状态 2 秒后恢复
      setTimeout(() => setCopySuccess(false), 2000);
      
      // Toast 3 秒后消失
      setTimeout(() => setShowToast(false), 3000);
    }).catch(err => {
      console.error('复制失败:', err);
    });
  };

  return (
    <>
      {/* 复制成功提示弹窗 */}
      {showToast && (
        <div 
          className={styles.modal}
          onClick={() => setShowToast(false)}
        >
          <div 
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              className={styles.closeButton}
              onClick={() => setShowToast(false)}
            >
              ×
            </button>
            
            <div className={styles.header}>
              <div className={styles.icon}>🎉</div>
              <div className={styles.title}>邀请链接已生成！</div>
            </div>

            <div className={styles.channelInfo}>
              频道：{channelName || username}
            </div>

            <div className={styles.tips}>
              <div className={styles.tipItem}>
                <span className={styles.tipIcon}>💎</span>
                <span>邀请好友点赞 <strong>提升频道排名</strong></span>
              </div>
              <div className={styles.tipItem}>
                <span className={styles.tipIcon}>📈</span>
                <span>排名越高·曝光越多·粉丝越多</span>
              </div>
            </div>

            <div className={styles.share}>
              <div className={styles.shareTitle}>分享到社交平台</div>
              <div className={styles.sharePlatforms}>
                Telegram · X · Facebook · Reddit · Discord
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 操作按钮 */}
      <div className={styles.actions}>
        <button 
          onClick={handleCopy}
          className={`${styles.shareButton} ${copySuccess ? styles.copied : ''}`}
          disabled={copySuccess}
        >
          <span className={styles.icon}>{copySuccess ? '✅' : '🔗'}</span>
          <span className={styles.text}>{copySuccess ? '已复制链接' : '分享此频道'}</span>
        </button>
        
        <a 
          href="/" 
          className={styles.exploreButton}
        >
          <span className={styles.icon}>🌐</span>
          <span className={styles.text}>浏览更多频道</span>
        </a>
      </div>
    </>
  );
}

