'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import styles from './admin.module.css'

/**
 * 管理后台布局 - 验证密码
 */
export default function AdminLayout({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isChecking, setIsChecking] = useState(true)
  const router = useRouter()

  // 检查是否已登录
  useEffect(() => {
    const token = sessionStorage.getItem('admin_token')
    if (token === 'admin_authenticated') {
      setIsAuthenticated(true)
    }
    setIsChecking(false)
  }, [])

  // 处理登录
  const handleLogin = (e) => {
    e.preventDefault()
    
    // 简单的密码验证（实际部署时从环境变量获取）
    const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123'
    
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem('admin_token', 'admin_authenticated')
      setIsAuthenticated(true)
      setError('')
    } else {
      setError('密码错误')
    }
  }

  // 处理登出
  const handleLogout = () => {
    sessionStorage.removeItem('admin_token')
    setIsAuthenticated(false)
    setPassword('')
  }

  if (isChecking) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>加载中...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className={styles.loginContainer}>
        <div className={styles.loginBox}>
          <h1 className={styles.loginTitle}>🔐 管理后台登录</h1>
          <p className={styles.loginSubtitle}>Telegram 频道导航 - 管理系统</p>
          
          <form onSubmit={handleLogin} className={styles.loginForm}>
            <div className={styles.inputGroup}>
              <label htmlFor="password">管理员密码</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                className={styles.input}
                autoFocus
              />
            </div>
            
            {error && <div className={styles.error}>{error}</div>}
            
            <button type="submit" className={styles.loginButton}>
              登录
            </button>
          </form>
          
          <div className={styles.loginFooter}>
            <a href="/" className={styles.backLink}>← 返回首页</a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.adminLayout}>
      {/* 顶部导航栏 */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.headerTitle}>
            <span className={styles.emoji}>⚙️</span>
            管理后台
          </h1>
          
          {/* 导航菜单 */}
          <nav className={styles.nav}>
            <a href="/admin" className={styles.navLink}>
              📊 频道管理
            </a>
            <a href="/admin/keywords" className={styles.navLink}>
              🔻 降权关键词
            </a>
            <a href="/admin/search-keywords" className={styles.navLink}>
              🔍 搜索关键词
            </a>
          </nav>
          
          <div className={styles.headerActions}>
            <a href="/" className={styles.homeLink} target="_blank">
              查看首页
            </a>
            <button onClick={handleLogout} className={styles.logoutButton}>
              退出登录
            </button>
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className={styles.mainContent}>
        {children}
      </main>
    </div>
  )
}

