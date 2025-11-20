'use client'

import { useState } from 'react'
import { batchPromoteChannels } from '../Actions'
import styles from './EditDialog.module.css'

/**
 * 批量增加权重对话框组件
 * 
 * @param {Object} props
 * @param {Array<Object>} props.selectedChannels - 选中的频道列表
 * @param {Function} props.onClose - 关闭回调
 * @param {Function} props.onSuccess - 成功回调
 */
export default function BatchPromoteDialog({ selectedChannels, onClose, onSuccess }) {
  const [mode, setMode] = useState('percentage') // 'percentage' or 'fixed'
  const [amount, setAmount] = useState(50) // 默认增加 50%
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  
  // 格式化权重
  const formatWeight = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(2) + 'K'
    return num.toFixed(0)
  }
  
  // 计算预计增加后的权重
  const getEstimatedWeight = (channel) => {
    const originalWeight = channel.weight?.value || 0
    
    if (mode === 'percentage') {
      return Math.floor(originalWeight * (100 + amount) / 100)
    } else {
      return originalWeight + amount
    }
  }
  
  // 处理增加权重
  const handlePromote = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      const usernames = selectedChannels.map(ch => ch.username)
      const response = await batchPromoteChannels({ usernames, amount, mode })
      
      if (response.success) {
        setResult(response.data)
        
        // 如果全部成功，2秒后自动关闭
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
  
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>⬆️ 批量增加权重</h2>
          <button className={styles.closeButton} onClick={onClose}>✕</button>
        </div>
        
        <div className={styles.body}>
          {/* 模式选择 */}
          <div className={styles.formGroup}>
            <label className={styles.label}>增加模式:</label>
            <div className={styles.modeSelector}>
              <button 
                className={`${styles.modeButton} ${mode === 'percentage' ? styles.modeButtonActive : ''}`}
                onClick={() => setMode('percentage')}
              >
                📊 百分比模式
              </button>
              <button 
                className={`${styles.modeButton} ${mode === 'fixed' ? styles.modeButtonActive : ''}`}
                onClick={() => setMode('fixed')}
              >
                🔢 固定值模式
              </button>
            </div>
          </div>
          
          {/* 数值设置 */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              {mode === 'percentage' ? (
                <>
                  增加百分比: <strong>{amount}%</strong>
                  <span className={styles.hint}>（权重将变为原来的 {100 + amount}%）</span>
                </>
              ) : (
                <>
                  增加固定值: <strong>+{amount}</strong>
                  <span className={styles.hint}>（所有频道权重都增加 {amount}）</span>
                </>
              )}
            </label>
            <div className={styles.sliderContainer}>
              <input
                type="range"
                min={mode === 'percentage' ? 10 : 1000}
                max={mode === 'percentage' ? 500 : 100000}
                step={mode === 'percentage' ? 10 : 1000}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className={styles.slider}
              />
              <div className={styles.sliderLabels}>
                {mode === 'percentage' ? (
                  <>
                    <span>轻度 (+10%)</span>
                    <span>中度 (+100%)</span>
                    <span>重度 (+500%)</span>
                  </>
                ) : (
                  <>
                    <span>+1K</span>
                    <span>+50K</span>
                    <span>+100K</span>
                  </>
                )}
              </div>
            </div>
            
            {/* 手动输入 */}
            <div className={styles.manualInput}>
              <input 
                type="number" 
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                min={mode === 'percentage' ? 1 : 1}
                max={mode === 'percentage' ? 1000 : 10000000}
                className={styles.numberInput}
              />
              <span className={styles.unit}>{mode === 'percentage' ? '%' : ''}</span>
            </div>
          </div>
          
          {/* 预览列表 */}
          <div className={styles.previewSection}>
            <h3>预览效果（共 {selectedChannels.length} 个）</h3>
            <div className={styles.previewList}>
              {selectedChannels.slice(0, 10).map(channel => {
                const oldWeight = channel.weight?.value || 0
                const newWeight = getEstimatedWeight(channel)
                const increased = newWeight - oldWeight
                
                return (
                  <div key={channel.username} className={styles.previewItem}>
                    <div className={styles.channelInfo}>
                      <strong>{channel.name || channel.username}</strong>
                      <span className={styles.username}>@{channel.username}</span>
                    </div>
                    <div className={styles.weightChange}>
                      <span className={styles.oldWeight}>{formatWeight(oldWeight)}</span>
                      <span className={styles.arrow}>→</span>
                      <span className={styles.newWeightPromote}>{formatWeight(newWeight)}</span>
                      <span className={styles.diffPromote}>
                        (+{mode === 'percentage' ? `${amount}%` : formatWeight(increased)})
                      </span>
                    </div>
                  </div>
                )
              })}
              {selectedChannels.length > 10 && (
                <div className={styles.moreHint}>
                  ... 还有 {selectedChannels.length - 10} 个频道
                </div>
              )}
            </div>
          </div>
          
          {/* 结果显示 */}
          {result && (
            <div className={styles.resultBox}>
              <div className={styles.resultSummary}>
                {result.success.length > 0 && (
                  <div className={styles.successSummary}>
                    ✅ 成功: {result.success.length} 个
                  </div>
                )}
                {result.failed.length > 0 && (
                  <div className={styles.errorSummary}>
                    ❌ 失败: {result.failed.length} 个
                  </div>
                )}
              </div>
              
              {/* 成功详情 */}
              {result.success.length > 0 && (
                <div className={styles.resultDetail}>
                  <div className={styles.resultTitle}>✅ 成功:</div>
                  <ul className={styles.resultList}>
                    {result.success.slice(0, 5).map((item, idx) => (
                      <li key={idx}>
                        @{item.username} {item.name && `(${item.name})`}
                        <span className={styles.weightInfo}>
                          {' '}{formatWeight(item.oldWeight)} → {formatWeight(item.newWeight)}
                          {' '}(+{formatWeight(item.increased)})
                        </span>
                      </li>
                    ))}
                    {result.success.length > 5 && (
                      <li>... 还有 {result.success.length - 5} 个</li>
                    )}
                  </ul>
                </div>
              )}
              
              {/* 失败详情 */}
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
          <button 
            className={styles.saveButton} 
            onClick={handlePromote}
            disabled={loading || selectedChannels.length === 0}
          >
            {loading ? '处理中...' : `确认增加 ${selectedChannels.length} 个频道权重`}
          </button>
        </div>
      </div>
    </div>
  )
}

