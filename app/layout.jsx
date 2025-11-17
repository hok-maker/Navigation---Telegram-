import './globals.css';
import ClientProviders from './ClientProviders';
import FloatingButtons from '@/components/FloatingButtons/FloatingButtons';
import { siteConfig } from '@/utils/seo';

export const metadata = {
  metadataBase: new URL(siteConfig.url),
  
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`,
  },
  
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  
  authors: [{ name: siteConfig.author }],
  creator: siteConfig.author,
  publisher: siteConfig.author,
  
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  
  // ⭐ 使用 emoji 作为 favicon，避免 404 错误
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">📱</text></svg>',
  },
  
  manifest: '/site.webmanifest',
  
  openGraph: {
    type: 'website',
    locale: siteConfig.locale,
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: siteConfig.name,
    description: siteConfig.description,
  },
  
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.name,
    description: siteConfig.description,
    creator: '@996007net',
  },
  
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION,
    yahoo: process.env.NEXT_PUBLIC_YAHOO_VERIFICATION,
  },
  
  category: 'technology',
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta name="theme-color" content="#667eea" />
        <link rel="canonical" href={siteConfig.url} />
        {/* Coinzilla 所有者验证 如果需要更换域名请修改中间内容 */}
        <meta name="coinzilla" content="16ca70e1364cb462df3c6ded1f12225c" />
        {/* Coinzilla 所有者验证 如果需要更换域名请修改中间内容 */}
      </head>
      <body>
        <ClientProviders>
          {children}
          <FloatingButtons />
        </ClientProviders>
      </body>
    </html>
  );
}
