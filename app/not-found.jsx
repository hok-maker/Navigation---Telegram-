import Link from 'next/link';
import { getNotFoundMetadata } from '@/utils/seo';
import styles from './not-found.module.css';

/**
 * ⭐ SEO Metadata for 404 page
 */
export const metadata = getNotFoundMetadata()

export default function NotFound() {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.title}>404</h1>
        <h2 className={styles.subtitle}>页面未找到</h2>
        <p className={styles.message}>
          抱歉，您访问的页面不存在或已被删除
        </p>
        <Link href="/" className={styles.homeButton}>
          返回首页
        </Link>
      </div>
    </div>
  );
}

