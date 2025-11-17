'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import FingerprintJS from '@fingerprintjs/fingerprintjs';

/**
 * 设备指纹 Context
 * 全局只获取一次指纹，避免创建过多 WebGL contexts
 */
const FingerprintContext = createContext(null);

export function FingerprintProvider({ children }) {
  const [fingerprint, setFingerprint] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getFingerprint = async () => {
      try {
        // ⭐ 全局只调用一次
        const fp = await FingerprintJS.load();
        const result = await fp.get();
        setFingerprint(result.visitorId);
      } catch (error) {
        console.error('获取设备指纹失败:', error);
      } finally {
        setLoading(false);
      }
    };

    getFingerprint();
  }, []);

  return (
    <FingerprintContext.Provider value={{ fingerprint, loading }}>
      {children}
    </FingerprintContext.Provider>
  );
}

/**
 * 使用设备指纹的 Hook
 */
export function useFingerprint() {
  const context = useContext(FingerprintContext);
  if (context === null) {
    throw new Error('useFingerprint must be used within FingerprintProvider');
  }
  return context;
}

