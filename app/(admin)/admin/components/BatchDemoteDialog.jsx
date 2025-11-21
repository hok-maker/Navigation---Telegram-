'use client'

import { useState } from 'react'
import { batchDemoteChannels, batchRestoreChannels } from '../Actions'
import styles from './EditDialog.module.css'

/**
 * 批量降权对话框组件
 * 
 * @param {Object} props
 * @param {Array<Object>} props.selectedChannels - 选中的频道列表
 * @param {Function} props.onClose - 关闭回调
 * @param {Function} props.onSuccess - 成功回调
 */
export default function BatchDemoteDialog({ selectedChannels, onClose, onSuccess }) {
  const [percentage, setPercentage] = useState(50) // 默认降权 50%
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [activeTab, setActiveTab] = useState('demote') // 'demote' or 'restore'
  
  // 格式化权重
  const formatWeight = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(2) + 'K'
    return num.toFixed(0)
  }
  
  // 计算预计降权后的权重
  const getEstimatedWeight = (channel) => {
    const originalWeight = channel.weight?.value || 0
    return Math.floor(originalWeight * (100 - percentage) / 100)
  }
  
  // 处理降权 - ⭐ 支持多次降权
  const handleDemote = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      const usernames = selectedChannels.map(ch => ch.username)
      const response = await batchDemoteChannels({ usernames, percentage })
      
      if (response.success) {
        setResult(response.data)
        
        // ⭐ 如果全部成功，2秒后自动关闭（不再检查 skipped）
        if (response.data.failed.length === 0) {
          setTimeout(() => {
            onSuccess()
          }, 2000)
        }
      } else {
        alert(response.error || '操作失败')
      }
    } catch (error) {
      alert('操作失败: ' + error.message)
    } finally {
      setLoading(false)
    }
  }
  
  // 处理恢复
  const handleRestore = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      const usernames = selectedChannels.map(ch => ch.username)
      const response = await batchRestoreChannels({ usernames })
      
      if (response.success) {
        setResult(response.data)
        
        // 如果全部成功，2秒后自动关闭
        if (response.data.failed.length === 0 && response.data.skipped.length === 0) {
          setTimeout(() => {
            onSuccess()
          }, 2000)
        }
      } else {
        alert(response.error || '操作失败')
      }
    } catch (error) {
      alert('操作失败: ' + error.message)
    } finally {
      setLoading(false)
    }
  }
  
  // 筛选：哪些频道已降权（只用于恢复功能）
  const demotedChannels = selectedChannels.filter(ch => ch.weight?.demoted === true)
  // ⭐ 所有频道都可以降权（支持多次降权）
  const allChannels = selectedChannels
  
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>批量权重管理</h2>
          <button className={styles.closeButton} onClick={onClose}>✕</button>
        </div>
        
        {/* Tab 切换 */}
        <div className={styles.tabs}>
          <button 
            className={`${styles.tab} ${activeTab === 'demote' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('demote')}
          >
            ⬇️ 批量降权 ({allChannels.length}) {/* ⭐ 支持多次降权 */}
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'restore' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('restore')}
          >
            ⬆️ 批量恢复 ({demotedChannels.length})
          </button>
        </div>
        
        <div className={styles.body}>
          {activeTab === 'demote' && (
            <>
              {/* 降权设置 */}
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  降权百分比: <strong>{percentage}%</strong>
                  <span className={styles.hint}>（权重将变为原来的 {100 - percentage}%）</span>
                </label>
                <div className={styles.sliderContainer}>
                  <input
                    type="range"
                    min="10"
                    max="99"
                    step="5"
                    value={percentage}
                    onChange={(e) => setPercentage(Number(e.target.value))}
                    className={styles.slider}
                  />
                  <div className={styles.sliderLabels}>
                    <span>轻度 (10%)</span>
                    <span>中度 (50%)</span>
                    <span>重度 (99%)</span>
                  </div>
                </div>
              </div>
              
              {/* 预览列表 - ⭐ 支持多次降权 */}
              <div className={styles.previewSection}>
                <h3>预览效果（共 {allChannels.length} 个）</h3>
                  <div className={styles.previewList}>
                  {allChannels.slice(0, 10).map(channel => {
                      const oldWeight = channel.weight?.value || 0
                      const newWeight = getEstimatedWeight(channel)
                    const demoteCount = channel.weight?.demoteCount || 0
                    const isDemoted = channel.weight?.demoted === true
                      
                      return (
                        <div key={channel.username} className={styles.previewItem}>
                          <div className={styles.channelInfo}>
                            <strong>{channel.name || channel.username}</strong>
                            <span className={styles.username}>@{channel.username}</span>
                          {/* ⭐ 显示降权次数 */}
                          {isDemoted && (
                            <span className={styles.demoteCountBadge}>
                              已降权 {demoteCount} 次
                            </span>
                          )}
                          </div>
                          <div className={styles.weightChange}>
                            <span className={styles.oldWeight}>{formatWeight(oldWeight)}</span>
                            <span className={styles.arrow}>→</span>
                            <span className={styles.newWeight}>{formatWeight(newWeight)}</span>
                          <span className={styles.diff}>
                            (-{percentage}%) {isDemoted && `[第${demoteCount + 1}次]`}
                          </span>
                          </div>
                        </div>
                      )
                    })}
                  {allChannels.length > 10 && (
                      <div className={styles.moreHint}>
                      ... 还有 {allChannels.length - 10} 个频道
                      </div>
                    )}
                  </div>
              </div>
            </>
          )}
          
          {activeTab === 'restore' && (
            <>
              {/* 恢复列表 */}
              <div className={styles.previewSection}>
                <h3>待恢复频道（共 {demotedChannels.length} 个）</h3>
                {demotedChannels.length === 0 ? (
                  <div className={styles.emptyState}>
                    ⚠️ 选中的频道都未降权，无需恢复
                  </div>
                ) : (
                  <div className={styles.previewList}>
                    {demotedChannels.slice(0, 10).map(channel => {
                      const currentWeight = channel.weight?.value || 0
                      const originalWeight = channel.weight?.beforeDemote || currentWeight
                      const config = channel.weight?.demoteConfig
                      
                      return (
                        <div key={channel.username} className={styles.previewItem}>
                          <div className={styles.channelInfo}>
                            <strong>{channel.name || channel.username}</strong>
                            <span className={styles.username}>@{channel.username}</span>
                            {config && (
                              <span className={styles.demoteInfo}>
                                （已降权 {config.percentage}%）
                              </span>
                            )}
                          </div>
                          <div className={styles.weightChange}>
                            <span className={styles.oldWeight}>{formatWeight(currentWeight)}</span>
                            <span className={styles.arrow}>→</span>
                            <span className={styles.newWeight}>{formatWeight(originalWeight)}</span>
                            <span className={styles.restore}>恢复</span>
                          </div>
                        </div>
                      )
                    })}
                    {demotedChannels.length > 10 && (
                      <div className={styles.moreHint}>
                        ... 还有 {demotedChannels.length - 10} 个频道
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
          
          {/* 结果显示 */}
          {result && (
            <div className={styles.resultBox}>
              <div className={styles.resultSummary}>
                {result.success.length > 0 && (
                  <div className={styles.successSummary}>
                    ✅ 成功: {result.success.length} 个
                  </div>
                )}
                {result.skipped && result.skipped.length > 0 && (
                  <div className={styles.warningSummary}>
                    ⚠️ 跳过: {result.skipped.length} 个
                  </div>
                )}
                {result.failed.length > 0 && (
                  <div className={styles.errorSummary}>
                    ❌ 失败: {result.failed.length} 个
                  </div>
                )}
              </div>
              
              {/* 详细结果 */}
              {result.success.length > 0 && (
                <div className={styles.resultDetail}>
                  <div className={styles.resultTitle}>✅ 成功:</div>
                  <ul className={styles.resultList}>
                    {result.success.slice(0, 5).map((item, idx) => (
                      <li key={idx}>
                        @{item.username} {item.name && `(${item.name})`}
                        {/* ⭐ 显示降权次数（如果有） */}
                        {item.demoteCount && activeTab === 'demote' && (
                          <span className={styles.demoteCountInfo}>
                            {' '}[第{item.demoteCount}次降权]
                          </span>
                        )}
                      </li>
                    ))}
                    {result.success.length > 5 && (
                      <li>... 还有 {result.success.length - 5} 个</li>
                    )}
                  </ul>
                </div>
              )}
              
              {result.skipped && result.skipped.length > 0 && (
                <div className={styles.resultDetail}>
                  <div className={styles.resultTitle}>⚠️ 跳过:</div>
                  <ul className={styles.resultList}>
                    {result.skipped.slice(0, 5).map((item, idx) => (
                      <li key={idx} className={styles.resultItemWarning}>
                        @{item.username} - {item.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {result.failed.length > 0 && (
                <div className={styles.resultDetail}>
                  <div className={styles.resultTitle}>❌ 失败:</div>
                  <ul className={styles.resultList}>
                    {result.failed.map((item, idx) => (
                      <li key={idx} className={styles.resultItemError}>
                        @{item.username} - {item.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className={styles.footer}>
          <button className={styles.cancelButton} onClick={onClose} disabled={loading}>
            取消
          </button>
          {activeTab === 'demote' && (
            <button 
              className={styles.saveButton} 
              onClick={handleDemote}
              disabled={loading || allChannels.length === 0}
            >
              {loading ? '处理中...' : `确认降权 ${allChannels.length} 个频道`}
            </button>
          )}
          {activeTab === 'restore' && (
            <button 
              className={styles.saveButton} 
              onClick={handleRestore}
              disabled={loading || demotedChannels.length === 0}
            >
              {loading ? '处理中...' : `确认恢复 ${demotedChannels.length} 个频道`}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

