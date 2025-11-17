'use client'

import { createContext, useContext, useState, useEffect } from 'react'

const DarkModeContext = createContext()

export function DarkModeProvider({ children }) {
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [mounted, setMounted] = useState(false)

  // 初始化：从 localStorage 读取用户偏好
  useEffect(() => {
    setMounted(true)
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('darkMode')
      if (saved !== null) {
        setIsDarkMode(saved === 'true')
      }
    }
  }, [])

  // 切换暗黑模式
  const toggleDarkMode = () => {
    if (typeof window === 'undefined') return
    
    setIsDarkMode(prev => {
      const newValue = !prev
      localStorage.setItem('darkMode', String(newValue))
      return newValue
    })
  }

  // 应用暗黑模式到 document
  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return
    
    if (isDarkMode) {
      document.documentElement.classList.add('dark-mode')
    } else {
      document.documentElement.classList.remove('dark-mode')
    }
  }, [isDarkMode, mounted])

  // SSR 和 CSR 都返回 Provider，避免水合不匹配
  return (
    <DarkModeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
      {children}
    </DarkModeContext.Provider>
  )
}

export function useDarkMode() {
  const context = useContext(DarkModeContext)
  
  // 如果在服务端或没有 Provider，返回默认值
  if (!context) {
    if (typeof window === 'undefined') {
      // 服务端：返回默认值
      return { isDarkMode: false, toggleDarkMode: () => {} }
    }
    throw new Error('useDarkMode must be used within DarkModeProvider')
  }
  
  return context
}

