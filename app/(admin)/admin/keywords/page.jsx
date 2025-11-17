'use client'

import { useState, useEffect } from 'react'
import {
  getKeywords,
  addKeyword,
  addKeywordsBatch,
  updateKeyword,
  deleteKeyword,
  toggleKeywordStatus
} from './Actions'
import styles from './keywords.module.css'

export default function KeywordsPage() {
  const [keywords, setKeywords] = useState([])
  const [loading, setLoading] = useState(true)
  const [keyword, setKeyword] = useState('')
  const [demotePercent, setDemotePercent] = useState(65)
  const [editingKeyword, setEditingKeyword] = useState(null)
  const [stats, setStats] = useState({ total: 0, active: 0, disabled: 0 })
  const [sortField, setSortField] = useState('createdAt') // 默认按创建时间排序
  const [sortOrder, setSortOrder] = useState('desc') // asc 或 desc

  // 加载关键词列表
  const loadKeywords = async () => {
    setLoading(true)
    const result = await getKeywords()
    if (result.success) {
      setKeywords(result.data.keywords)
      setStats(result.data.stats)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadKeywords()
  }, [])

  // 添加关键词
  const handleAdd = async (e) => {
    e.preventDefault()

    if (!keyword.trim()) {
      alert('请输入关键词')
      return
    }

    // 检查是否为批量输入（逗号或换行符分隔）
    const keywords = keyword
      .split(/[,，\n]/)
      .map(k => k.trim())
      .filter(k => k)

    let result
    if (keywords.length === 1) {
      // 单个添加
      result = await addKeyword(keywords[0], demotePercent)
    } else {
      // 批量添加
      result = await addKeywordsBatch(keywords, demotePercent)
    }

    if (result.success) {
      alert(result.message)
      setKeyword('')
      setDemotePercent(65)
      loadKeywords()
    } else {
      alert(result.message)
    }
  }

  // 编辑关键词
  const handleEdit = (kw) => {
    setEditingKeyword(kw)
  }

  // 保存编辑
  const handleSaveEdit = async () => {
    if (!editingKeyword) return

    const result = await updateKeyword(
      editingKeyword._id,
      editingKeyword.keyword,
      editingKeyword.demotePercent
    )

    if (result.success) {
      alert('修改成功')
      setEditingKeyword(null)
      loadKeywords()
    } else {
      alert(result.message)
    }
  }

  // 切换状态
  const handleToggleStatus = async (id, currentStatus) => {
    if (!confirm(`确定要${currentStatus === 'active' ? '禁用' : '启用'}该关键词吗？`)) {
      return
    }

    const result = await toggleKeywordStatus(id)
    if (result.success) {
      loadKeywords()
    } else {
      alert(result.message)
    }
  }

  // 删除关键词
  const handleDelete = async (id, keyword) => {
    if (!confirm(`确定要删除关键词"${keyword}"吗？`)) {
      return
    }

    const result = await deleteKeyword(id)
    if (result.success) {
      loadKeywords()
    } else {
      alert(result.message)
    }
  }

  // 排序处理
  const handleSort = (field) => {
    if (sortField === field) {
      // 如果点击的是当前排序字段，切换排序顺序
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      // 如果是新字段，默认降序（对于数值和时间）或升序（对于文本）
      setSortField(field)
      setSortOrder(field === 'keyword' || field === 'status' ? 'asc' : 'desc')
    }
  }

  // 获取排序后的关键词列表
  const getSortedKeywords = () => {
    return [...keywords].sort((a, b) => {
      let aValue, bValue

      switch (sortField) {
        case 'keyword':
          aValue = a.keyword
          bValue = b.keyword
          break
        case 'demotePercent':
          aValue = a.demotePercent
          bValue = b.demotePercent
          break
        case 'status':
          aValue = a.status
          bValue = b.status
          break
        case 'matchCount':
          aValue = a.matchCount || 0
          bValue = b.matchCount || 0
          break
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime()
          bValue = new Date(b.createdAt).getTime()
          break
        default:
          return 0
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
      return 0
    })
  }

  // 获取排序指示器
  const getSortIndicator = (field) => {
    if (sortField !== field) return ' ↕️'
    return sortOrder === 'asc' ? ' ↑' : ' ↓'
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>🔻 降权关键词管理</h1>
        <p>管理自动降权的关键词列表</p>
      </div>

      {/* 统计信息 */}
      <div className={styles.statsBar}>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>总关键词</span>
          <span className={styles.statValue}>{stats.total || 0}</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>已启用</span>
          <span className={styles.statValue}>{stats.active || 0}</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>已禁用</span>
          <span className={styles.statValue}>{stats.disabled || 0}</span>
        </div>
      </div>

      {/* 添加表单 */}
      <div className={styles.addSection}>
        <h2>添加关键词</h2>
        <form onSubmit={handleAdd} className={styles.form}>
          <div className={styles.formRow}>
            <div className={styles.inputGroup}>
              <label>关键词（支持批量，用逗号或换行分隔）</label>
              <textarea
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="博彩&#10;赌博&#10;诈骗"
                className={styles.textarea}
                rows={3}
              />
            </div>

            <div className={styles.inputGroup}>
              <label>降权比例（%）</label>
              <input
                type="number"
                min="1"
                max="99"
                value={demotePercent}
                onChange={(e) => setDemotePercent(parseInt(e.target.value))}
                className={styles.numberInput}
              />
              <span className={styles.hint}>
                {demotePercent}% = 权重×{(1 - demotePercent / 100).toFixed(2)}
              </span>
            </div>
          </div>

          <button type="submit" className={styles.submitButton}>
            ➕ 添加关键词
          </button>
        </form>
      </div>

      {/* 关键词列表 */}
      <div className={styles.listSection}>
        <h2>关键词列表</h2>

        {loading ? (
          <div className={styles.loading}>加载中...</div>
        ) : keywords.length === 0 ? (
          <div className={styles.empty}>暂无关键词</div>
        ) : (
          <div className={styles.table}>
            <table>
              <thead>
                <tr>
                  <th onClick={() => handleSort('keyword')} className={styles.sortable}>
                    关键词{getSortIndicator('keyword')}
                  </th>
                  <th onClick={() => handleSort('demotePercent')} className={styles.sortable}>
                    降权比例{getSortIndicator('demotePercent')}
                  </th>
                  <th>实际系数</th>
                  <th onClick={() => handleSort('status')} className={styles.sortable}>
                    状态{getSortIndicator('status')}
                  </th>
                  <th onClick={() => handleSort('matchCount')} className={styles.sortable}>
                    匹配数{getSortIndicator('matchCount')}
                  </th>
                  <th onClick={() => handleSort('createdAt')} className={styles.sortable}>
                    创建时间{getSortIndicator('createdAt')}
                  </th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {getSortedKeywords().map((kw) => (
                  <tr
                    key={kw._id}
                    className={kw.status === 'disabled' ? styles.disabled : ''}
                  >
                    <td>
                      {editingKeyword?._id === kw._id ? (
                        <input
                          type="text"
                          value={editingKeyword.keyword}
                          onChange={(e) =>
                            setEditingKeyword({
                              ...editingKeyword,
                              keyword: e.target.value
                            })
                          }
                          className={styles.editInput}
                        />
                      ) : (
                        <strong>{kw.keyword}</strong>
                      )}
                    </td>
                    <td>
                      {editingKeyword?._id === kw._id ? (
                        <input
                          type="number"
                          min="1"
                          max="99"
                          value={editingKeyword.demotePercent}
                          onChange={(e) =>
                            setEditingKeyword({
                              ...editingKeyword,
                              demotePercent: parseInt(e.target.value)
                            })
                          }
                          className={styles.editInput}
                        />
                      ) : (
                        `${kw.demotePercent}%`
                      )}
                    </td>
                    <td>
                      ×
                      {(1 - (editingKeyword?._id === kw._id
                        ? editingKeyword.demotePercent
                        : kw.demotePercent) / 100).toFixed(2)}
                    </td>
                    <td>
                      <span
                        className={`${styles.status} ${
                          kw.status === 'active' ? styles.active : styles.inactive
                        }`}
                      >
                        {kw.status === 'active' ? '✅ 启用' : '❌ 禁用'}
                      </span>
                    </td>
                    <td>{kw.matchCount || 0}</td>
                    <td>{new Date(kw.createdAt).toLocaleDateString()}</td>
                    <td>
                      {editingKeyword?._id === kw._id ? (
                        <div className={styles.actions}>
                          <button
                            onClick={handleSaveEdit}
                            className={styles.saveButton}
                          >
                            保存
                          </button>
                          <button
                            onClick={() => setEditingKeyword(null)}
                            className={styles.cancelButton}
                          >
                            取消
                          </button>
                        </div>
                      ) : (
                        <div className={styles.actions}>
                          <button
                            onClick={() => handleEdit(kw)}
                            className={styles.editButton}
                          >
                            编辑
                          </button>
                          <button
                            onClick={() => handleToggleStatus(kw._id, kw.status)}
                            className={styles.toggleButton}
                          >
                            {kw.status === 'active' ? '禁用' : '启用'}
                          </button>
                          <button
                            onClick={() => handleDelete(kw._id, kw.keyword)}
                            className={styles.deleteButton}
                          >
                            删除
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

