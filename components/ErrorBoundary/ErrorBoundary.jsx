'use client'

import { Component } from 'react'
import styles from './ErrorBoundary.module.css'

/**
 * React错误边界组件
 * 捕获子组件的错误，防止整个页面崩溃
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error) {
    // 更新state，下次渲染时显示错误UI
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    // 记录错误到控制台
    console.error('❌ React Error Boundary 捕获错误:', {
      error: error.toString(),
      componentStack: errorInfo.componentStack
    })
    
    // 如果集成了Sentry等错误监控服务，可以在这里上报
    // if (typeof window !== 'undefined' && window.Sentry) {
    //   window.Sentry.captureException(error, { contexts: { react: errorInfo } })
    // }
    
    this.setState({ errorInfo })
  }

  handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null 
    })
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className={styles.errorContainer}>
          <div className={styles.errorCard}>
            <div className={styles.errorIcon}>😵</div>
            <h2 className={styles.errorTitle}>出错了</h2>
            <p className={styles.errorMessage}>
              页面遇到了一些问题，但不用担心
            </p>
            
            {/* 开发环境显示错误详情 */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className={styles.errorDetails}>
                <summary>错误详情（开发环境）</summary>
                <pre className={styles.errorStack}>
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
            
            <div className={styles.errorActions}>
              <button 
                className={styles.primaryButton}
                onClick={this.handleReload}
              >
                刷新页面
              </button>
              <button 
                className={styles.secondaryButton}
                onClick={this.handleReset}
              >
                重试
              </button>
            </div>
            
            <p className={styles.errorHint}>
              如果问题持续存在，请联系管理员
            </p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

