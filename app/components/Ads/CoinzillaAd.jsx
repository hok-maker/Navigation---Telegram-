'use client';

import { useEffect, useRef } from 'react';
import styles from './CoinzillaAd.module.css';

/**
 * Coinzilla 广告组件
 * 使用方式：<CoinzillaAd zoneId="YOUR_ZONE_ID" width={728} height={90} />
 */
export default function CoinzillaAd({ 
  zoneId, 
  width = 728, 
  height = 90,
  className = ''
}) {
  const adContainerRef = useRef(null);
  const adLoadedRef = useRef(false);

  useEffect(() => {
    // 避免重复加载
    if (adLoadedRef.current) return;
    
    // 检查是否已加载 Coinzilla 脚本
    const loadCoinzillaScript = () => {
      // 如果已经加载过脚本，直接显示广告
      if (window.coinzilla_display) {
        displayAd();
        return;
      }

      // 加载 Coinzilla 脚本
      const script = document.createElement('script');
      script.src = 'https://coinzillatag.com/lib/display.js';
      script.async = true;
      script.onload = () => {
        displayAd();
      };
      document.body.appendChild(script);
    };

    // 显示广告
    const displayAd = () => {
      if (!window.coinzilla_display || !zoneId) return;

      const preferences = {
        zone: zoneId,
        width: String(width),
        height: String(height)
      };

      window.coinzilla_display.push(preferences);
      adLoadedRef.current = true;
    };

    loadCoinzillaScript();

    // 清理函数（组件卸载时）
    return () => {
      // Coinzilla 脚本会自动清理
    };
  }, [zoneId, width, height]);

  return (
    <div 
      ref={adContainerRef}
      className={`${styles.adContainer} ${className}`}
      style={{ width: `${width}px`, height: `${height}px` }}
    >
      {/* 广告加载中提示 */}
      <div className={styles.placeholder}>
        <span className={styles.loadingText}>广告加载中...</span>
      </div>
    </div>
  );
}

