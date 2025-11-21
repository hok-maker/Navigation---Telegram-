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
    
    const channelCount = selectedLanguage.count.toLocaleString()
    
    if (!window.confirm(
      `⚠️ 确定要对所有「${getLanguageName(selectedLanguage.code)}」频道降权 ${demotePercent}% 吗？\n\n` +
      `📊 影响范围：${channelCount} 个频道\n` +
      `⭐ 总权重：${formatNumber(selectedLanguage.totalWeight)}\n` +
      `👥 总订阅：${formatNumber(selectedLanguage.totalMembers)}\n\n` +
      `📉 降权后权重将变为原来的 ${100 - demotePercent}%\n\n` +
      `⏱️ 批量处理中请耐心等待（约${Math.ceil(selectedLanguage.count / 1000)}秒）...`
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
        
        // 3秒后自动关闭并刷新
        setTimeout(() => {
          onSuccess()
        }, 3000)
      } else {
        alert('❌ 操作失败: ' + response.error)
        setProcessing(false)
      }
    } catch (error) {
      alert('❌ 操作失败: ' + error.message)
      setProcessing(false)
    }
  }
  
  return (
    <>
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      
      <div className={styles.overlay} onClick={processing ? null : onClose}>
        <div className={styles.dialog} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px', position: 'relative' }}>
          {/* 处理中遮罩 */}
          {processing && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(255, 255, 255, 0.95)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              borderRadius: '12px'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px', animation: 'spin 2s linear infinite' }}>
                ⚙️
              </div>
            <div style={{ fontSize: '18px', fontWeight: '600', color: '#667eea', marginBottom: '8px' }}>
              正在批量处理中...
            </div>
            <div style={{ fontSize: '14px', color: '#666' }}>
              {selectedLanguage && `正在更新 ${selectedLanguage.count.toLocaleString()} 个频道`}
            </div>
            <div style={{ fontSize: '13px', color: '#999', marginTop: '12px' }}>
              请勿关闭页面，预计需要 {selectedLanguage && Math.ceil(selectedLanguage.count / 1000)} 秒
            </div>
          </div>
        )}
        
        <div className={styles.header}>
          <h2>🌍 批量语言降权</h2>
          <button className={styles.closeButton} onClick={onClose} disabled={processing}>✕</button>
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
                            {lang.count.toLocaleString()} 个频道 · 总权重 {formatNumber(lang.totalWeight)} · {formatNumber(lang.totalMembers)} 订阅
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
                          {selectedLanguage.count.toLocaleString()} 个
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
                      <div>
                        <div style={{ color: '#666' }}>总订阅数：</div>
                        <div style={{ fontWeight: '600', fontSize: '16px' }}>
                          {formatNumber(selectedLanguage.totalMembers)}
                        </div>
                      </div>
                      <div>
                        <div style={{ color: '#666' }}>预计耗时：</div>
                        <div style={{ fontWeight: '600', fontSize: '16px', color: '#e36209' }}>
                          约 {Math.ceil(selectedLanguage.count / 1000)} 秒
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
                  <div style={{ fontWeight: '600', marginBottom: '12px', fontSize: '16px' }}>
                    ✅ 批量降权完成！
                  </div>
                  <div style={{ fontSize: '14px', lineHeight: '1.8' }}>
                    <div>🎯 语言类型：{getLanguageName(result.languageCode)}</div>
                    <div>📊 处理频道：{result.updated?.toLocaleString()} / {result.total?.toLocaleString()} 个</div>
                    <div>📉 降权比例：{result.demotePercent}%（保留 {100 - result.demotePercent}%）</div>
                    <div style={{ marginTop: '8px', color: '#0c5460', fontSize: '13px' }}>
                      💡 页面将在 3 秒后自动刷新...
                    </div>
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
            style={{
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {processing ? (
              <>
                ⏳ 批量处理中... 
                {selectedLanguage && ` (${selectedLanguage.count.toLocaleString()}个)`}
              </>
            ) : (
              '🌍 批量降权'
            )}
          </button>
        </div>
      </div>
    </div>
    </>
  )
}

