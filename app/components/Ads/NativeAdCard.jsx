'use client';

import { useEffect, useRef } from 'react';
import styles from './NativeAdCard.module.css';

/**
 * Adsterra 原生广告卡片（模仿频道卡片样式）
 * 让广告自然融入频道列表，提升用户体验和点击率
 * 
 * @param {string} adCode - Adsterra 广告代码（从后台复制）
 * @param {string} position - 广告位置标识
 */
export default function NativeAdCard({ adCode, position = 'in-feed' }) {
  const adContainerRef = useRef(null);
  const adLoadedRef = useRef(false);

  useEffect(() => {
    if (adLoadedRef.current || !adCode || !adContainerRef.current) return;
    
    try {
      // ⭐ 从广告代码中提取 script src 和 container id
      const scriptMatch = adCode.match(/src="([^"]+)"/);
      const containerMatch = adCode.match(/id="([^"]+)"/);
      
      if (!scriptMatch || !containerMatch) {
        console.error('Adsterra 广告代码格式错误');
        return;
      }
      
      const scriptSrc = scriptMatch[1];
      const containerId = containerMatch[1];
      
      // 创建广告容器
      const adContainer = document.createElement('div');
      adContainer.id = containerId;
      adContainerRef.current.appendChild(adContainer);
      
      // 加载广告脚本
      const script = document.createElement('script');
      script.src = scriptSrc;
      script.async = true;
      script.setAttribute('data-cfasync', 'false');
      adContainerRef.current.appendChild(script);
      
      adLoadedRef.current = true;
    } catch (error) {
      console.error('加载 Adsterra 广告失败:', error);
    }
  }, [adCode]);

  return (
    <div className={styles.nativeAdCard} data-position={position}>
      {/* 赞助标签 */}
      <div className={styles.sponsorBadge}>
        <span className={styles.sponsorIcon}>💎</span>
        <span className={styles.sponsorText}>推广</span>
      </div>

      {/* 广告内容容器 */}
      <div 
        ref={adContainerRef}
        className={styles.adContent}
      >
        {/* Adsterra 广告会自动注入到这里 */}
        <div className={styles.placeholder}>
          <div className={styles.placeholderIcon}>📢</div>
          <div className={styles.placeholderText}>广告加载中...</div>
        </div>
      </div>
    </div>
  );
}
