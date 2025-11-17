'use client'

import { useState } from 'react'
import { updateChannelWeight, updateChannelLikes, toggleChannelStatus } from '../Actions'
import styles from './EditDialog.module.css'

export default function EditDialog({ channel, onClose, onSuccess }) {
  const [weight, setWeight] = useState(channel.weight?.value || 0)
  const [likes, setLikes] = useState(channel.stats?.likes || 0)
  // ⭐ 使用 adminHidden 字段（默认 false = 启用）
  const [isActive, setIsActive] = useState(!(channel.meta?.adminHidden === true))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // 保存权重
  const handleSaveWeight = async () => {
    setLoading(true)
    setError('')
    setSuccessMessage('')

    try {
      const result = await updateChannelWeight(channel.username, Number(weight))
      if (result.success) {
        setSuccessMessage('权重更新成功！')
      } else {
        setError(result.message || '更新失败')
      }
    } catch (err) {
      setError('操作失败：' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // 保存点赞数
  const handleSaveLikes = async () => {
    setLoading(true)
    setError('')
    setSuccessMessage('')

    try {
      const result = await updateChannelLikes(channel.username, Number(likes))
      if (result.success) {
        setSuccessMessage('点赞数更新成功！')
      } else {
        setError(result.message || '更新失败')
      }
    } catch (err) {
      setError('操作失败：' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // 切换状态
  const handleToggleStatus = async () => {
    setLoading(true)
    setError('')
    setSuccessMessage('')

    try {
      const result = await toggleChannelStatus(channel.username)
      if (result.success) {
        setIsActive(result.data.isActive)
        setSuccessMessage(`频道已${result.data.isActive ? '启用' : '禁用'}！`)
      } else {
        setError(result.message || '操作失败')
      }
    } catch (err) {
      setError('操作失败：' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // 保存所有更改
  const handleSaveAll = async () => {
    setLoading(true)
    setError('')
    setSuccessMessage('')

    try {
      // 并行执行所有更新
      const results = await Promise.all([
        updateChannelWeight(channel.username, Number(weight)),
        updateChannelLikes(channel.username, Number(likes)),
        // ⭐ 比较 adminHidden 字段（isActive 是反义）
        isActive !== !(channel.meta?.adminHidden === true)
          ? toggleChannelStatus(channel.username)
          : Promise.resolve({ success: true })
      ])

      const allSuccess = results.every(r => r.success)
      
      if (allSuccess) {
        setSuccessMessage('所有更改保存成功！')
        setTimeout(() => {
          onSuccess()
        }, 1000)
      } else {
        setError('部分更新失败，请检查后重试')
      }
    } catch (err) {
      setError('操作失败：' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        {/* 头部 */}
        <div className={styles.header}>
          <h2 className={styles.title}>
            编辑频道 - @{channel.username}
          </h2>
          <button onClick={onClose} className={styles.closeButton}>
            ✕
          </button>
        </div>

        {/* 内容 */}
        <div className={styles.content}>
          {/* 频道信息 */}
          <div className={styles.infoSection}>
            <div className={styles.channelInfo}>
              {channel.avatar && (
                <img
                  src={channel.avatar}
                  alt={channel.name}
                  className={styles.avatar}
                />
              )}
              <div>
                <h3 className={styles.channelName}>{channel.name}</h3>
                <p className={styles.channelUsername}>@{channel.username}</p>
              </div>
            </div>
          </div>

          {/* 编辑表单 */}
          <div className={styles.form}>
            {/* 权重 */}
            <div className={styles.formGroup}>
              <label className={styles.label}>
                <span className={styles.labelText}>权重</span>
                <span className={styles.labelHint}>
                  当前: {channel.weight?.value?.toLocaleString() || 0}
                </span>
              </label>
              <div className={styles.inputGroup}>
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className={styles.input}
                  placeholder="输入新权重"
                />
                <button
                  onClick={handleSaveWeight}
                  disabled={loading}
                  className={styles.quickSaveButton}
                >
                  保存
                </button>
              </div>
            </div>

            {/* 点赞数 */}
            <div className={styles.formGroup}>
              <label className={styles.label}>
                <span className={styles.labelText}>点赞数</span>
                <span className={styles.labelHint}>
                  当前: {channel.stats?.likes || 0}
                </span>
              </label>
              <div className={styles.inputGroup}>
                <input
                  type="number"
                  value={likes}
                  onChange={(e) => setLikes(e.target.value)}
                  className={styles.input}
                  placeholder="输入新点赞数"
                  min="0"
                />
                <button
                  onClick={handleSaveLikes}
                  disabled={loading}
                  className={styles.quickSaveButton}
                >
                  保存
                </button>
              </div>
            </div>

            {/* 状态 */}
            <div className={styles.formGroup}>
              <label className={styles.label}>
                <span className={styles.labelText}>频道状态</span>
                <span className={styles.labelHint}>
                  {isActive ? '✅ 已启用' : '❌ 已禁用'}
                </span>
              </label>
              <div className={styles.statusToggle}>
                <button
                  onClick={handleToggleStatus}
                  disabled={loading}
                  className={`${styles.toggleButton} ${isActive ? styles.active : ''}`}
                >
                  {isActive ? '点击禁用' : '点击启用'}
                </button>
              </div>
            </div>
          </div>

          {/* 消息提示 */}
          {error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}
          {successMessage && (
            <div className={styles.successMessage}>
              {successMessage}
            </div>
          )}
        </div>

        {/* 底部操作 */}
        <div className={styles.footer}>
          <button
            onClick={onClose}
            className={styles.cancelButton}
            disabled={loading}
          >
            取消
          </button>
          <button
            onClick={handleSaveAll}
            disabled={loading}
            className={styles.saveAllButton}
          >
            {loading ? '保存中...' : '保存所有更改'}
          </button>
        </div>
      </div>
    </div>
  )
}

