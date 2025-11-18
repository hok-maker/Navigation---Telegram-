'use client';

import { useEffect, useRef } from 'react';
import styles from './NativeAdCard.module.css';

/**
 * Adsterra 原生广告卡片（模仿频道卡片样式）
 * 让广告自然融入频道列表，提升用户体验和点击率
 * 
 * @param {string} adId - 广告唯一标识（用于区分不同位置的广告）
 * @param {string} position - 广告位置标识
 */
export default function NativeAdCard({ adId = 'default', position = 'in-feed' }) {
  const adContainerRef = useRef(null);
  const adLoadedRef = useRef(false);

  useEffect(() => {
    if (adLoadedRef.current || !adContainerRef.current) return;
    
    try {
      // ⭐ 从环境变量读取 Adsterra 广告代码
      const adCode = process.env.NEXT_PUBLIC_ADSTERRA_NATIVE_CODE;
      
      if (!adCode) {
        console.warn('未配置 NEXT_PUBLIC_ADSTERRA_NATIVE_CODE 环境变量');
        return;
      }
      
      // ⭐ 使用 iframe 隔离每个广告，避免 ID 冲突
      const iframe = document.createElement('iframe');
      iframe.style.width = '100%';
      iframe.style.height = '160px'; // 缩小高度，更紧凑
      iframe.style.border = 'none';
      iframe.style.borderRadius = '8px';
      iframe.setAttribute('data-ad-id', adId);
      iframe.setAttribute('scrolling', 'no'); // 禁止滚动
      
      adContainerRef.current.appendChild(iframe);
      
      // 在 iframe 中注入广告代码
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
      iframeDoc.open();
      iframeDoc.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { margin: 0; padding: 0; overflow: hidden; }
          </style>
        </head>
        <body>
          ${adCode}
        </body>
        </html>
      `);
      iframeDoc.close();
      
      adLoadedRef.current = true;
    } catch (error) {
      console.error('加载 Adsterra 广告失败:', error);
    }
  }, [adId]);

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
      </div>
    </div>
  );
}
