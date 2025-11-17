'use client';

import { useState, useEffect } from 'react';
import { useFingerprint } from '@/contexts/FingerprintContext';
import { likeChannel, checkIfLiked } from '../../Actions';
import styles from './LikeButton.module.css';

/**
 * 点赞按钮组件
 * 使用设备指纹识别，无需登录
 * ⭐ 优化：使用全局 FingerprintContext，避免重复初始化
 */
export default function LikeButton({ channel }) {
  const { fingerprint, loading: fpLoading } = useFingerprint();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(null);
  const [loading, setLoading] = useState(true);

  // 检查点赞状态
  useEffect(() => {
    async function checkLikeStatus() {
      // 等待 fingerprint 加载完成
      if (fpLoading || !fingerprint) {
        return;
      }

      try {
        // 检查是否已点赞
        const checkResult = await checkIfLiked(channel.username, fingerprint);
        if (checkResult.success) {
          setLiked(checkResult.data.liked);
          setLikeCount(checkResult.data.count);
        }
      } catch (error) {
        console.error('检查点赞状态失败:', error);
        // 失败时使用 SSR 数据作为降级
        setLikeCount(channel?.stats?.likes || 0);
      } finally {
        setLoading(false);
      }
    }

    checkLikeStatus();
  }, [fingerprint, fpLoading, channel.username, channel?.stats?.likes]);

  // 处理点赞
  const handleLike = async (e) => {
    e.stopPropagation();
    e.preventDefault();

    if (loading || !fingerprint) return;

    setLoading(true);

    try {
      const result = await likeChannel(channel.username, fingerprint);
      
      if (result.success) {
        setLiked(result.data.liked);
        setLikeCount(result.data.count);
      }
    } catch (error) {
      console.error('点赞失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.buttonWrapper}>
    <button
      className={`${styles.likeButton} ${liked ? styles.liked : ''}`}
      onClick={handleLike}
      disabled={loading || !fingerprint}
    >
      <span className={styles.icon}>
        {liked ? '❤️' : '🤍'}
      </span>
      {/* ⭐ 只在数据加载完成且有点赞时显示数字 */}
      {likeCount !== null && likeCount > 0 && (
        <span className={styles.count}>{likeCount}</span>
      )}
    </button>
      <span className={styles.tooltip}>
        {liked ? '取消点赞' : '点赞'}
      </span>
    </div>
  );
}

