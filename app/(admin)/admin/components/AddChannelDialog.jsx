'use client'

import { useState } from 'react'
import { addChannels } from '../Actions'
import styles from './EditDialog.module.css'

export default function AddChannelDialog({ onClose, onSuccess }) {
  const [usernames, setUsernames] = useState('')
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setResult(null)
    setSaving(true)

    try {
      const response = await addChannels({ usernames })

      if (response.success) {
        setResult(response.data)
        // 如果有成功添加的频道，2秒后关闭对话框并刷新
        if (response.data.summary.success > 0) {
          setTimeout(() => {
            onSuccess()
          }, 2000)
        }
      } else {
        setResult({
          summary: { success: 0, skipped: 0, failed: 1 },
          results: { success: [], skipped: [], failed: [{ input: '', reason: response.error }] }
        })
      }
    } catch (err) {
      setResult({
        summary: { success: 0, skipped: 0, failed: 1 },
        results: { success: [], skipped: [], failed: [{ input: '', reason: err.message }] }
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>➕ 手动添加频道</h2>
          <button onClick={onClose} className={styles.closeButton}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label>
              频道用户名 <span className={styles.required}>*</span>
            </label>
            <textarea
              value={usernames}
              onChange={(e) => setUsernames(e.target.value)}
              placeholder="例如：&#10;bbcchinese&#10;@durov&#10;https://t.me/TelegramTips&#10;&#10;每行一个频道，或用逗号/空格分隔"
              required
              disabled={saving}
              className={styles.textarea}
              rows={8}
            />
            <div className={styles.hint}>
              支持格式：username、@username、https://t.me/username
            </div>
          </div>

          {result && (
            <div className={styles.resultBox}>
              <div className={styles.resultSummary}>
                {result.summary.success > 0 && (
                  <div className={styles.successSummary}>
                    ✅ 成功添加 {result.summary.success} 个频道
                  </div>
                )}
                {result.summary.skipped > 0 && (
                  <div className={styles.warningSummary}>
                    ⏭️ 跳过 {result.summary.skipped} 个已存在
                  </div>
                )}
                {result.summary.failed > 0 && (
                  <div className={styles.errorSummary}>
                    ❌ {result.summary.failed} 个添加失败
                  </div>
                )}
              </div>

              {/* 显示成功的频道 */}
              {result.results.success.length > 0 && (
                <div className={styles.resultDetail}>
                  <div className={styles.resultTitle}>✅ 成功添加：</div>
                  <div className={styles.resultList}>
                    {result.results.success.map((username, idx) => (
                      <div key={idx} className={styles.resultItem}>@{username}</div>
                    ))}
                  </div>
                </div>
              )}

              {/* 显示跳过的频道 */}
              {result.results.skipped.length > 0 && (
                <div className={styles.resultDetail}>
                  <div className={styles.resultTitle}>⏭️ 已存在：</div>
                  <div className={styles.resultList}>
                    {result.results.skipped.map((item, idx) => (
                      <div key={idx} className={styles.resultItem}>@{item.username}</div>
                    ))}
                  </div>
                </div>
              )}

              {/* 显示失败的频道 */}
              {result.results.failed.length > 0 && (
                <div className={styles.resultDetail}>
                  <div className={styles.resultTitle}>❌ 失败：</div>
                  <div className={styles.resultList}>
                    {result.results.failed.map((item, idx) => (
                      <div key={idx} className={styles.resultItemError}>
                        {item.input} - {item.reason}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className={styles.infoBox}>
            <div className={styles.infoTitle}>📝 说明</div>
            <ul className={styles.infoList}>
              <li>支持批量添加，每行一个频道，或用逗号/空格分隔</li>
              <li>添加后，PreviewCrawler_New 会自动爬取频道详细信息</li>
              <li>频道用户名会自动转换为小写，去除特殊字符</li>
            </ul>
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className={styles.cancelButton}
            >
              {result?.summary.success > 0 ? '关闭' : '取消'}
            </button>
            <button
              type="submit"
              disabled={saving || !usernames.trim()}
              className={styles.saveButton}
            >
              {saving ? '添加中...' : '✓ 添加频道'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

