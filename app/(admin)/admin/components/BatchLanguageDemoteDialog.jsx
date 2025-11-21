'use client'

import { useState, useEffect } from 'react'
import { getLanguageStatistics, batchLanguageDemote } from '../Actions'
import styles from './EditDialog.module.css'

/**
 * 批量语言降权对话框组件
 * 根据频道名称的语言类型，批量降低该语言所有频道的权重
 */
export default function BatchLanguageDemoteDialog({ onClose, onSuccess }) {
  const [languages, setLanguages] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedLanguage, setSelectedLanguage] = useState(null)
  const [demotePercent, setDemotePercent] = useState(90) // 默认降权90%
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState(null)
  
  // 加载语言统计
  useEffect(() => {
    loadLanguageStatistics()
  }, [])
  
  const loadLanguageStatistics = async () => {
    setLoading(true)
    try {
      const response = await getLanguageStatistics()
      if (response.success) {
        setLanguages(response.data.languages)
      } else {
        alert('加载失败: ' + response.error)
      }
    } catch (error) {
      alert('加载失败: ' + error.message)
    } finally {
      setLoading(false)
    }
  }
  
  // 格式化数字
  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(2) + 'K'
    return num
  }
  
  // 获取语言图标
  const getLanguageIcon = (lang) => {
    const icons = {
      'zh': '🇨🇳',  // 中文
      'en': '🇺🇸',  // 英文
      'ru': '🇷🇺',  // 俄文
      'ja': '🇯🇵',  // 日文
      'ko': '🇰🇷',  // 韩文
      'ar': '🇸🇦',  // 阿拉伯文
      'es': '🇪🇸',  // 西班牙文
      'fr': '🇫🇷',  // 法文
      'de': '🇩🇪',  // 德文
      'pt': '🇵🇹',  // 葡萄牙文
      'it': '🇮🇹',  // 意大利文
      'tr': '🇹🇷',  // 土耳其文
      'hi': '🇮🇳',  // 印地文
      'th': '🇹🇭',  // 泰文
      'vi': '🇻🇳',  // 越南文
      'id': '🇮🇩',  // 印尼文
      'other': '🌐' // 其他
    }
    return icons[lang] || '🌐'
  }
  
  // 获取语言名称
  const getLanguageName = (lang) => {
    const names = {
      'zh': '中文',
      'en': '英文',
      'ru': '俄文',
      'ja': '日文',
      'ko': '韩文',
      'ar': '阿拉伯文',
      'es': '西班牙文',
      'fr': '法文',
      'de': '德文',
      'pt': '葡萄牙文',
      'it': '意大利文',
      'tr': '土耳其文',
      'hi': '印地文',
      'th': '泰文',
      'vi': '越南文',
      'id': '印尼文',
      'other': '其他语言'
    }
    return names[lang] || lang
  }
  
  // 执行批量降权
  const handleDemote = async () => {
    if (!selectedLanguage) {
      alert('请先选择一个语言')
      return
    }
    
    if (!window.confirm(
      `确定要对所有「${getLanguageName(selectedLanguage.code)}」频道降权 ${demotePercent}% 吗？\n\n` +
      `影响范围：${selectedLanguage.count} 个频道\n` +
      `总权重：${formatNumber(selectedLanguage.totalWeight)}\n\n` +
      `降权后权重将变为原来的 ${100 - demotePercent}%`
    )) {
      return
    }
    
    setProcessing(true)
    setResult(null)
    
    try {
      const response = await batchLanguageDemote({
        languageCode: selectedLanguage.code,
        demotePercent
      })
      
      if (response.success) {
        setResult(response.data)
        
        // 2秒后自动关闭并刷新
        setTimeout(() => {
          onSuccess()
        }, 2000)
      } else {
        alert('操作失败: ' + response.error)
      }
    } catch (error) {
      alert('操作失败: ' + error.message)
    } finally {
      setProcessing(false)
    }
  }
  
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
        <div className={styles.header}>
          <h2>🌍 批量语言降权</h2>
          <button className={styles.closeButton} onClick={onClose}>✕</button>
        </div>
        
        <div className={styles.body}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div>⏳ 正在分析频道语言...</div>
            </div>
          ) : (
            <>
              {/* 语言列表 */}
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  选择要降权的语言类型：
                </label>
                <div style={{ 
                  maxHeight: '300px', 
                  overflowY: 'auto', 
                  border: '1px solid #e1e4e8',
                  borderRadius: '6px',
                  padding: '8px'
                }}>
                  {languages.map(lang => (
                    <div 
                      key={lang.code}
                      onClick={() => setSelectedLanguage(lang)}
                      style={{
                        padding: '12px',
                        margin: '4px 0',
                        border: selectedLanguage?.code === lang.code 
                          ? '2px solid #667eea' 
                          : '1px solid #e1e4e8',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        background: selectedLanguage?.code === lang.code 
                          ? 'rgba(102, 126, 234, 0.1)' 
                          : 'white',
                        transition: 'all 0.2s',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '24px' }}>{getLanguageIcon(lang.code)}</span>
                        <div>
                          <div style={{ fontWeight: '600', fontSize: '15px' }}>
                            {getLanguageName(lang.code)}
                          </div>
                          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                            {lang.count} 个频道 · 总权重 {formatNumber(lang.totalWeight)}
                          </div>
                        </div>
                      </div>
                      {selectedLanguage?.code === lang.code && (
                        <span style={{ color: '#667eea', fontWeight: 'bold' }}>✓</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* 降权百分比 */}
              {selectedLanguage && (
                <>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      降权百分比: {demotePercent}%
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="99"
                      value={demotePercent}
                      onChange={(e) => setDemotePercent(Number(e.target.value))}
                      style={{ width: '100%' }}
                    />
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      fontSize: '12px', 
                      color: '#666',
                      marginTop: '4px'
                    }}>
                      <span>10% (温和)</span>
                      <span>50% (中等)</span>
                      <span>90% (激进)</span>
                      <span>99% (极致)</span>
                    </div>
                  </div>
                  
                  {/* 预览效果 */}
                  <div style={{
                    background: '#f6f8fa',
                    border: '1px solid #e1e4e8',
                    borderRadius: '6px',
                    padding: '16px',
                    marginTop: '16px'
                  }}>
                    <div style={{ fontWeight: '600', marginBottom: '12px', color: '#24292f' }}>
                      📊 预计效果：
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px' }}>
                      <div>
                        <div style={{ color: '#666' }}>影响频道数：</div>
                        <div style={{ fontWeight: '600', fontSize: '16px', color: '#667eea' }}>
                          {selectedLanguage.count} 个
                        </div>
                      </div>
                      <div>
                        <div style={{ color: '#666' }}>当前总权重：</div>
                        <div style={{ fontWeight: '600', fontSize: '16px' }}>
                          {formatNumber(selectedLanguage.totalWeight)}
                        </div>
                      </div>
                      <div>
                        <div style={{ color: '#666' }}>降权后保留：</div>
                        <div style={{ fontWeight: '600', fontSize: '16px', color: '#22863a' }}>
                          {100 - demotePercent}%
                        </div>
                      </div>
                      <div>
                        <div style={{ color: '#666' }}>新总权重：</div>
                        <div style={{ fontWeight: '600', fontSize: '16px', color: '#d73a49' }}>
                          {formatNumber(selectedLanguage.totalWeight * (100 - demotePercent) / 100)}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
              
              {/* 操作结果 */}
              {result && (
                <div style={{
                  background: '#d4edda',
                  border: '1px solid #c3e6cb',
                  borderRadius: '6px',
                  padding: '16px',
                  marginTop: '16px',
                  color: '#155724'
                }}>
                  <div style={{ fontWeight: '600', marginBottom: '8px' }}>
                    ✅ 批量降权完成！
                  </div>
                  <div style={{ fontSize: '14px' }}>
                    成功处理：{result.updated} 个频道
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        
        <div className={styles.footer}>
          <button 
            className={styles.cancelButton}
            onClick={onClose}
            disabled={processing}
          >
            取消
          </button>
          <button 
            className={styles.submitButton}
            onClick={handleDemote}
            disabled={!selectedLanguage || processing || loading}
          >
            {processing ? '⏳ 处理中...' : '🌍 批量降权'}
          </button>
        </div>
      </div>
    </div>
  )
}

