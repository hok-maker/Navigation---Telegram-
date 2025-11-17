'use client'

import { useState, useEffect } from 'react'
import { 
  HiOutlineArrowUp, 
  HiOutlineMoon, 
  HiOutlineSun,
  HiOutlineInformationCircle,
  HiOutlineMenu,
  HiOutlineX
} from 'react-icons/hi'
import { useDarkMode } from '@/contexts/DarkModeContext'
import styles from './FloatingButtons.module.css'

export default function FloatingButtons() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const { isDarkMode, toggleDarkMode } = useDarkMode()

  // 监听滚动，决定是否显示"回到顶部"按钮
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // 回到顶部
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  // 前往网站说明页（新标签页打开）
  const goToAbout = () => {
    window.open('/about', '_blank', 'noopener,noreferrer')
  }

  return (
    <div className={styles.container}>
      {/* 展开后的按钮列表 */}
      {isExpanded && (
        <div className={styles.buttonList}>
          {/* 回到顶部 */}
          {showScrollTop && (
            <div className={styles.buttonWrapper}>
              <button
                className={`${styles.button} ${styles.scrollTop}`}
                onClick={scrollToTop}
              >
                <HiOutlineArrowUp className={styles.icon} />
              </button>
              <span className={styles.tooltip}>回到顶部</span>
            </div>
          )}

          {/* 暗黑模式切换 */}
          <div className={styles.buttonWrapper}>
            <button
              className={`${styles.button} ${styles.darkMode}`}
              onClick={toggleDarkMode}
            >
              {isDarkMode ? (
                <HiOutlineSun className={styles.icon} />
              ) : (
                <HiOutlineMoon className={styles.icon} />
              )}
            </button>
            <span className={styles.tooltip}>
              {isDarkMode ? '浅色模式' : '夜间模式'}
            </span>
          </div>

          {/* 网站说明 */}
          <div className={styles.buttonWrapper}>
            <button
              className={`${styles.button} ${styles.about}`}
              onClick={goToAbout}
            >
              <HiOutlineInformationCircle className={styles.icon} />
            </button>
            <span className={styles.tooltip}>网站说明</span>
          </div>
        </div>
      )}

      {/* 主按钮（展开/收起） */}
      <div className={styles.buttonWrapper}>
        <button
          className={`${styles.button} ${styles.mainButton} ${isExpanded ? styles.active : ''}`}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (
            <HiOutlineX className={styles.icon} />
          ) : (
            <HiOutlineMenu className={styles.icon} />
          )}
        </button>
        <span className={styles.tooltip}>
          {isExpanded ? '收起菜单' : '展开菜单'}
        </span>
      </div>
    </div>
  )
}

