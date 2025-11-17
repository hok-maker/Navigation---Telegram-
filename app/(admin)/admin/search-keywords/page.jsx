'use client'

import { useState, useEffect } from 'react'
import {
  getSearchKeywords,
  addSearchKeyword,
  addSearchKeywordsBatch,
  updateSearchKeyword,
  deleteSearchKeyword,
  toggleSearchKeywordStatus,
  triggerImmediateSearch
} from './Actions'
import styles from './search-keywords.module.css'

export default function SearchKeywordsPage() {
  const [keywords, setKeywords] = useState([])
  const [loading, setLoading] = useState(true)
  const [keyword, setKeyword] = useState('')
  const [priority, setPriority] = useState(5)
  const [editingKeyword, setEditingKeyword] = useState(null)
  const [stats, setStats] = useState({ total: 0, active: 0, pending: 0, completed: 0 })
  const [batchText, setBatchText] = useState('')
  const [showBatchImport, setShowBatchImport] = useState(false)
  const [sortField, setSortField] = useState('priority') // 默认按优先级排序
  const [sortOrder, setSortOrder] = useState('asc') // asc 或 desc

  // 加载关键词列表
  const loadKeywords = async () => {
    setLoading(true)
    const result = await getSearchKeywords()
    if (result.success) {
      setKeywords(result.data.keywords)
      setStats(result.data.stats)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadKeywords()
  }, [])

  // 单个添加
  const handleAdd = async (e) => {
    e.preventDefault()

    if (!keyword.trim()) {
      alert('请输入关键词')
      return
    }

    const result = await addSearchKeyword(keyword.trim(), priority)

    if (result.success) {
      alert('添加成功')
      setKeyword('')
      setPriority(5)
      loadKeywords()
    } else {
      alert(result.message)
    }
  }

  // 批量导入
  const handleBatchImport = async () => {
    if (!batchText.trim()) {
      alert('请输入关键词')
      return
    }

    // 解析关键词（按行分割，过滤空行）
    const keywords = batchText
      .split('\n')
      .map(k => k.trim())
      .filter(k => k)

    if (keywords.length === 0) {
      alert('没有有效的关键词')
      return
    }

    if (!confirm(`确定要导入 ${keywords.length} 个关键词吗？`)) {
      return
    }

    const result = await addSearchKeywordsBatch(keywords, priority)

    if (result.success) {
      alert(result.message)
      setBatchText('')
      setShowBatchImport(false)
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

    const result = await updateSearchKeyword(
      editingKeyword._id,
      editingKeyword.keyword,
      editingKeyword.priority
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
    const newStatus = currentStatus === 'active' ? 'pending' : 'active'
    if (!confirm(`确定要${newStatus === 'active' ? '启用' : '暂停'}该关键词吗？`)) {
      return
    }

    const result = await toggleSearchKeywordStatus(id)
    if (result.success) {
      loadKeywords()
    } else {
      alert(result.message)
    }
  }

  // 删除关键词
  const handleDelete = async (id, keyword) => {
    if (!confirm(`确定要删除关键词"${keyword}"吗？\n\n注意：这将删除该关键词的所有搜索历史！`)) {
      return
    }

    const result = await deleteSearchKeyword(id)
    if (result.success) {
      loadKeywords()
    } else {
      alert(result.message)
    }
  }

  // 立即搜索（触发BotSearchCrawler立即搜索该关键词）
  const handleImmediateSearch = async (id, keyword) => {
    if (!confirm(`确定要立即搜索"${keyword}"吗？\n\nBotSearchCrawler 将在下一轮检查时（约60秒内）开始搜索。`)) {
      return
    }

    const result = await triggerImmediateSearch(id)
    if (result.success) {
      alert(result.message)
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
      // 如果是新字段，默认升序
      setSortField(field)
      setSortOrder('asc')
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
        case 'priority':
          aValue = a.priority || 5
          bValue = b.priority || 5
          break
        case 'status':
          aValue = a.status
          bValue = b.status
          break
        case 'searchCount':
          aValue = a.stats?.totalSearches || 0
          bValue = b.stats?.totalSearches || 0
          break
        case 'channelCount':
          aValue = a.stats?.totalChannelsFound || 0
          bValue = b.stats?.totalChannelsFound || 0
          break
        case 'lastSearch':
          aValue = a.schedule?.lastSearchAt ? new Date(a.schedule.lastSearchAt).getTime() : 0
          bValue = b.schedule?.lastSearchAt ? new Date(b.schedule.lastSearchAt).getTime() : 0
          break
        case 'nextSearch':
          aValue = a.schedule?.nextSearchAt ? new Date(a.schedule.nextSearchAt).getTime() : 0
          bValue = b.schedule?.nextSearchAt ? new Date(b.schedule.nextSearchAt).getTime() : 0
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
        <h1>🔍 搜索关键词管理</h1>
        <p>管理 BotSearchCrawler 的搜索关键词列表</p>
      </div>

      {/* 统计信息 */}
      <div className={styles.statsBar}>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>总关键词</span>
          <span className={styles.statValue}>{stats.total || 0}</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>启用中</span>
          <span className={styles.statValue}>{stats.active || 0}</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>待搜索</span>
          <span className={styles.statValue}>{stats.pending || 0}</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>已完成</span>
          <span className={styles.statValue}>{stats.completed || 0}</span>
        </div>
      </div>

      {/* 添加/导入切换 */}
      <div className={styles.toggleButtons}>
        <button
          className={`${styles.toggleButton} ${!showBatchImport ? styles.active : ''}`}
          onClick={() => setShowBatchImport(false)}
        >
          单个添加
        </button>
        <button
          className={`${styles.toggleButton} ${showBatchImport ? styles.active : ''}`}
          onClick={() => setShowBatchImport(true)}
        >
          批量导入
        </button>
      </div>

      {/* 单个添加表单 */}
      {!showBatchImport && (
        <div className={styles.addSection}>
          <h2>添加关键词</h2>
          <form onSubmit={handleAdd} className={styles.form}>
            <div className={styles.formRow}>
              <div className={styles.inputGroup}>
                <label>关键词</label>
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="例如：北京、上海、科技..."
                  className={styles.input}
                />
              </div>

              <div className={styles.inputGroup}>
                <label>优先级（1-10）</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={priority}
                  onChange={(e) => setPriority(parseInt(e.target.value))}
                  className={styles.numberInput}
                />
                <span className={styles.hint}>1=最高优先级，10=最低优先级</span>
              </div>
            </div>

            <button type="submit" className={styles.submitButton}>
              ➕ 添加关键词
            </button>
          </form>
        </div>
      )}

      {/* 批量导入表单 */}
      {showBatchImport && (
        <div className={styles.addSection}>
          <h2>批量导入关键词</h2>
          <div className={styles.batchForm}>
            <div className={styles.inputGroup}>
              <label>关键词列表（每行一个）</label>
              <textarea
                value={batchText}
                onChange={(e) => setBatchText(e.target.value)}
                placeholder="北京&#10;上海&#10;深圳&#10;广州&#10;...&#10;&#10;支持直接粘贴 keyword.txt 内容"
                className={styles.batchTextarea}
                rows={15}
              />
              <span className={styles.hint}>
                {batchText.split('\n').filter(k => k.trim()).length} 个关键词
              </span>
            </div>

            <div className={styles.inputGroup}>
              <label>优先级（1-10）</label>
              <input
                type="number"
                min="1"
                max="10"
                value={priority}
                onChange={(e) => setPriority(parseInt(e.target.value))}
                className={styles.numberInput}
              />
              <span className={styles.hint}>所有导入的关键词使用相同优先级</span>
            </div>

            <button onClick={handleBatchImport} className={styles.submitButton}>
              📥 批量导入
            </button>
          </div>
        </div>
      )}

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
                  <th onClick={() => handleSort('priority')} className={styles.sortable}>
                    优先级{getSortIndicator('priority')}
                  </th>
                  <th onClick={() => handleSort('status')} className={styles.sortable}>
                    状态{getSortIndicator('status')}
                  </th>
                  <th onClick={() => handleSort('searchCount')} className={styles.sortable}>
                    搜索次数{getSortIndicator('searchCount')}
                  </th>
                  <th onClick={() => handleSort('channelCount')} className={styles.sortable}>
                    发现频道{getSortIndicator('channelCount')}
                  </th>
                  <th onClick={() => handleSort('lastSearch')} className={styles.sortable}>
                    上次搜索{getSortIndicator('lastSearch')}
                  </th>
                  <th onClick={() => handleSort('nextSearch')} className={styles.sortable}>
                    下次搜索{getSortIndicator('nextSearch')}
                  </th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {getSortedKeywords().map((kw) => (
                  <tr
                    key={kw._id}
                    className={kw.status !== 'active' ? styles.inactive : ''}
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
                          max="10"
                          value={editingKeyword.priority}
                          onChange={(e) =>
                            setEditingKeyword({
                              ...editingKeyword,
                              priority: parseInt(e.target.value)
                            })
                          }
                          className={styles.editInput}
                        />
                      ) : (
                        kw.priority || 5
                      )}
                    </td>
                    <td>
                      <span
                        className={`${styles.status} ${
                          kw.status === 'active'
                            ? styles.active
                            : kw.status === 'completed'
                            ? styles.completed
                            : styles.pending
                        }`}
                      >
                        {kw.status === 'active' && '✅ 启用'}
                        {kw.status === 'pending' && '⏸️ 暂停'}
                        {kw.status === 'completed' && '✔️ 完成'}
                      </span>
                    </td>
                    <td>{kw.stats?.totalSearches || 0}</td>
                    <td>{kw.stats?.totalChannelsFound || 0}</td>
                    <td>
                      {kw.schedule?.lastSearchAt
                        ? new Date(kw.schedule.lastSearchAt).toLocaleString('zh-CN')
                        : '-'}
                    </td>
                    <td>
                      {kw.schedule?.nextSearchAt
                        ? new Date(kw.schedule.nextSearchAt).toLocaleString('zh-CN')
                        : '-'}
                    </td>
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
                            onClick={() => handleImmediateSearch(kw._id, kw.keyword)}
                            className={styles.searchButton}
                            title="触发BotSearchCrawler立即搜索此关键词"
                          >
                            立即搜索
                          </button>
                          <button
                            onClick={() => handleToggleStatus(kw._id, kw.status)}
                            className={styles.toggleButton}
                          >
                            {kw.status === 'active' ? '暂停' : '启用'}
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

