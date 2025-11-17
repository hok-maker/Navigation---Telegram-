'use client';

import { FingerprintProvider } from '@/contexts/FingerprintContext';
import { DarkModeProvider } from '@/contexts/DarkModeContext';
import ErrorBoundary from '@/components/ErrorBoundary';

/**
 * 客户端 Providers
 * 包装所有需要在客户端运行的 Context Providers
 * ⭐ 添加错误边界，防止页面崩溃
 */
export default function ClientProviders({ children }) {
  return (
    <ErrorBoundary>
    <DarkModeProvider>
    <FingerprintProvider>
      {children}
    </FingerprintProvider>
    </DarkModeProvider>
    </ErrorBoundary>
  );
}

