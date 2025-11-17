'use client';

import { useEffect, useRef } from 'react';
import styles from './NativeAdCard.module.css';

/**
 * 原生广告卡片（模仿频道卡片样式）
 * 让广告自然融入频道列表，提升用户体验和点击率
 */
export default function NativeAdCard({ zoneId, position = 'in-feed' }) {
  const adContainerRef = useRef(null);
  const adLoadedRef = useRef(false);

  useEffect(() => {
    if (adLoadedRef.current) return;
    
    const loadCoinzillaAd = () => {
      if (window.coinzilla_display) {
        displayAd();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://coinzillatag.com/lib/display.js';
      script.async = true;
      script.onload = () => displayAd();
      document.body.appendChild(script);
    };

    const displayAd = () => {
      if (!window.coinzilla_display || !zoneId) return;

      const preferences = {
        zone: zoneId,
        width: '320',
        height: '250'
      };

      window.coinzilla_display.push(preferences);
      adLoadedRef.current = true;
    };

    loadCoinzillaAd();
  }, [zoneId]);

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
        {/* Coinzilla 广告会自动注入到这里 */}
        <div className={styles.placeholder}>
          <div className={styles.placeholderIcon}>📢</div>
          <div className={styles.placeholderText}>广告加载中...</div>
        </div>
      </div>
    </div>
  );
}

