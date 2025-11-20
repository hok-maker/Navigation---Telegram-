'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'  // ⭐ 添加：URL 参数支持
import { getAdminChannelsData, searchAdminChannels } from './Actions'
import AdminChannelCard from './components/AdminChannelCard'
import EditDialog from './components/EditDialog'
import AddChannelDialog from './components/AddChannelDialog'  // ⭐ 添加频道对话框
import BatchDemoteDialog from './components/BatchDemoteDialog'  // ⭐ 批量降权对话框
import BatchPromoteDialog from './components/BatchPromoteDialog'  // ⭐ 批量增加权重对话框
import BatchLanguageDemoteDialog from './components/BatchLanguageDemoteDialog'  // ⭐ 批量语言降权对话框
import styles from './page.module.css'

export default function AdminPage() {
  const router = useRouter()  // ⭐ 路由控制
  const searchParams = useSearchParams()  // ⭐ 读取 URL 参数
  
  // ⭐ 从 URL 参数初始化状态（刷新页面时保持搜索状态）
  const [channels, setChannels] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [searchKeyword, setSearchKeyword] = useState(searchParams.get('keyword') || '')
  const [showDisabled, setShowDisabled] = useState(searchParams.get('showDisabled') === 'true')
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'weight.value')
  const [editingChannel, setEditingChannel] = useState(null)
  const [showAddDialog, setShowAddDialog] = useState(false)  // ⭐ 添加频道对话框状态
  const [showBatchDemoteDialog, setShowBatchDemoteDialog] = useState(false)  // ⭐ 批量降权对话框状态
  const [showBatchPromoteDialog, setShowBatchPromoteDialog] = useState(false)  // ⭐ 批量增加权重对话框状态
  const [showLanguageDemoteDialog, setShowLanguageDemoteDialog] = useState(false)  // ⭐ 批量语言降权对话框状态
  const [selectionMode, setSelectionMode] = useState(false)  // ⭐ 多选模式
  const [selectedChannels, setSelectedChannels] = useState([])  // ⭐ 选中的频道
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)

  // ⭐ 更新 URL 参数（保存搜索状态）
  const updateURL = (keyword, currentSortBy, currentShowDisabled) => {
    const params = new URLSearchParams()
    
    // 只添加非默认值的参数，保持 URL 简洁
    if (keyword && keyword.trim()) {
      params.set('keyword', keyword.trim())
    }
    if (currentSortBy && currentSortBy !== 'weight.value') {
      params.set('sortBy', currentSortBy)
    }
    if (currentShowDisabled) {
      params.set('showDisabled', 'true')
    }
    
    // 更新 URL（不刷新页面）
    const newURL = params.toString() ? `/neoneo?${params.toString()}` : '/neoneo'
    router.push(newURL, { scroll: false })  // scroll: false 保持滚动位置
  }

  // 加载频道数据
  const loadChannels = async (pageNum = 1, keyword = '', currentSortBy = sortBy) => {
    setLoading(true)
    
    try {
      let result
      if (keyword.trim()) {
        result = await searchAdminChannels({
          keyword,
          page: pageNum,
          pageSize: 20,
          sortBy: currentSortBy,
          showDisabled
        })
      } else {
        result = await getAdminChannelsData({
          page: pageNum,
          pageSize: 20,
          sortBy: currentSortBy,
          showDisabled
        })
      }

      if (result.success) {
        if (pageNum === 1) {
          setChannels(result.data.channels)
        } else {
          setChannels(prev => [...prev, ...result.data.channels])
        }
        setStats(result.data.stats)
        setHasMore(result.data.pagination.hasMore)
        setPage(pageNum)
      }
    } catch (err) {
      console.error('加载失败:', err)
    } finally {
      setLoading(false)
    }
  }

  // ⭐ 初始加载（使用 URL 参数）
  useEffect(() => {
    const keyword = searchParams.get('keyword') || ''
    const sort = searchParams.get('sortBy') || 'weight.value'
    loadChannels(1, keyword, sort)
  }, [])

  // 筛选变化时重新加载
  useEffect(() => {
    loadChannels(1, searchKeyword, sortBy)
    updateURL(searchKeyword, sortBy, showDisabled)  // ⭐ 更新 URL
  }, [showDisabled])

  // 搜索处理
  const handleSearch = (e) => {
    e.preventDefault()
    updateURL(searchKeyword, sortBy, showDisabled)  // ⭐ 更新 URL
    loadChannels(1, searchKeyword, sortBy)
  }

  // 加载更多
  const handleLoadMore = () => {
    loadChannels(page + 1, searchKeyword, sortBy)
  }
  
  // 排序变化处理
  const handleSortChange = (newSortBy) => {
    setSortBy(newSortBy)
    updateURL(searchKeyword, newSortBy, showDisabled)  // ⭐ 更新 URL
    loadChannels(1, searchKeyword, newSortBy)
  }
  
  // ⭐ 清除搜索处理
  const handleClearSearch = () => {
    setSearchKeyword('')
    updateURL('', sortBy, showDisabled)  // ⭐ 更新 URL（清除关键词）
    loadChannels(1, '', sortBy)
  }

  // 打开编辑对话框
  const handleEdit = (channel) => {
    setEditingChannel(channel)
  }

  // 关闭编辑对话框
  const handleCloseEdit = () => {
    setEditingChannel(null)
  }

  // 保存成功后刷新
  const handleSaveSuccess = () => {
    setEditingChannel(null)
    loadChannels(1, searchKeyword, sortBy)
  }
  
  // ⭐ 添加频道成功后刷新
  const handleAddSuccess = () => {
    setShowAddDialog(false)
    loadChannels(1, searchKeyword, sortBy)
  }
  
  // ⭐ 切换多选模式
  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode)
    setSelectedChannels([])  // 清空选中列表
  }
  
  // ⭐ 切换单个频道选中状态
  const toggleChannelSelection = (channel) => {
    setSelectedChannels(prev => {
      const exists = prev.find(ch => ch.username === channel.username)
      if (exists) {
        return prev.filter(ch => ch.username !== channel.username)
      } else {
        return [...prev, channel]
      }
    })
  }
  
  // ⭐ 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedChannels.length === channels.length) {
      setSelectedChannels([])
    } else {
      setSelectedChannels([...channels])
    }
  }
  
  // ⭐ 批量降权成功后刷新
  const handleBatchDemoteSuccess = () => {
    setShowBatchDemoteDialog(false)
    setSelectedChannels([])
    setSelectionMode(false)
    loadChannels(1, searchKeyword, sortBy)
  }
  
  // ⭐ 批量增加权重成功后刷新
  const handleBatchPromoteSuccess = () => {
    setShowBatchPromoteDialog(false)
    setSelectedChannels([])
    setSelectionMode(false)
    loadChannels(1, searchKeyword, sortBy)
  }

  return (
    <div className={styles.container}>
      {/* 统计信息 */}
      <div className={styles.statsBar}>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>总频道数</span>
          <span className={styles.statValue}>{stats.total || 0}</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>已启用</span>
          <span className={styles.statValue}>{stats.activeCount || 0}</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>已禁用</span>
          <span className={styles.statValue}>{stats.disabledCount || 0}</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>总订阅数</span>
          <span className={styles.statValue}>
            {stats.totalMembers > 0 
              ? (stats.totalMembers / 1000000).toFixed(1) + 'M'
              : '0'}
          </span>
        </div>
      </div>

      {/* 搜索和筛选 */}
      <div className={styles.toolbar}>
        <form onSubmit={handleSearch} className={styles.searchForm}>
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="搜索频道名称或用户名..."
            className={styles.searchInput}
          />
          <button type="submit" className={styles.searchButton}>
            🔍 搜索
          </button>
          {searchKeyword && (
            <button
              type="button"
              onClick={handleClearSearch}
              className={styles.clearButton}
            >
              ✕ 清除
            </button>
          )}
        </form>
        
        {/* ⭐ 添加频道按钮 */}
        <button 
          onClick={() => setShowAddDialog(true)}
          className={styles.addButton}
        >
          ➕ 添加频道
        </button>
        
        {/* ⭐ 批量语言降权按钮 */}
        <button 
          onClick={() => setShowLanguageDemoteDialog(true)}
          className={styles.languageDemoteButton}
          title="根据语言类型批量降权"
        >
          🌍 语言降权
        </button>

        {/* ⭐ 排序选择器 */}
        <div className={styles.sortSelector}>
          <label>排序：</label>
          <select 
            value={sortBy} 
            onChange={(e) => handleSortChange(e.target.value)}
            className={styles.sortSelect}
          >
            <option value="weight.value">⭐ 按权重</option>
            <option value="stats.members">👥 按订阅数</option>
            <option value="stats.likes">❤️ 按点赞数</option>
            <option value="updatedAt">🕐 按更新时间</option>
            <option value="meta.firstDiscoveredAt">📅 按发现时间</option>
          </select>
        </div>

        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={showDisabled}
            onChange={(e) => setShowDisabled(e.target.checked)}
          />
          <span>显示已禁用频道</span>
        </label>
        
        {/* ⭐ 批量操作按钮 */}
        <button 
          onClick={toggleSelectionMode}
          className={`${styles.batchButton} ${selectionMode ? styles.batchButtonActive : ''}`}
        >
          {selectionMode ? '✓ 退出多选' : '☑️ 批量操作'}
        </button>
      </div>
      
      {/* ⭐ 批量操作工具栏 */}
      {selectionMode && (
        <div className={styles.batchToolbar}>
          <div className={styles.batchInfo}>
            <button 
              onClick={toggleSelectAll}
              className={styles.selectAllButton}
            >
              {selectedChannels.length === channels.length ? '✓ 取消全选' : '☐ 全选'}
            </button>
            <span className={styles.selectionCount}>
              已选择 <strong>{selectedChannels.length}</strong> 个频道
            </span>
          </div>
          
          <div className={styles.batchActions}>
            <button 
              onClick={() => setShowBatchPromoteDialog(true)}
              disabled={selectedChannels.length === 0}
              className={styles.promoteButton}
            >
              ⬆️ 批量增加权重
            </button>
            <button 
              onClick={() => setShowBatchDemoteDialog(true)}
              disabled={selectedChannels.length === 0}
              className={styles.demoteButton}
            >
              ⬇️ 批量降权
            </button>
          </div>
        </div>
      )}
      
      {/* ⭐ 当前状态提示 */}
      {(searchKeyword || sortBy !== 'weight.value') && (
        <div className={styles.statusBar}>
          {searchKeyword && (
            <span className={styles.statusItem}>
              🔍 搜索: <strong>{searchKeyword}</strong>
            </span>
          )}
          {sortBy !== 'weight.value' && (
            <span className={styles.statusItem}>
              排序: <strong>
                {sortBy === 'stats.members' && '👥 订阅数'}
                {sortBy === 'stats.likes' && '❤️ 点赞数'}
                {sortBy === 'updatedAt' && '🕐 更新时间'}
                {sortBy === 'meta.firstDiscoveredAt' && '📅 发现时间'}
              </strong>
            </span>
          )}
        </div>
      )}

      {/* 频道列表 */}
      {loading && channels.length === 0 ? (
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>加载中...</p>
        </div>
      ) : channels.length === 0 ? (
        <div className={styles.empty}>
          <p>😕 没有找到频道</p>
        </div>
      ) : (
        <>
          <div className={styles.channelGrid}>
            {channels.map((channel) => {
              const isSelected = selectedChannels.some(ch => ch.username === channel.username)
              
              return (
                <div 
                  key={channel._id}
                  className={`${styles.channelCardWrapper} ${selectionMode ? styles.selectionMode : ''} ${isSelected ? styles.selected : ''}`}
                  onClick={() => selectionMode && toggleChannelSelection(channel)}
                >
                  {selectionMode && (
                    <div className={styles.checkboxOverlay}>
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={() => {}}
                        className={styles.selectionCheckbox}
                      />
                    </div>
                  )}
                  <AdminChannelCard
                    channel={channel}
                    onEdit={selectionMode ? null : handleEdit}
                  />
                </div>
              )
            })}
          </div>

          {/* 加载更多按钮 */}
          {hasMore && (
            <div className={styles.loadMoreContainer}>
              <button
                onClick={handleLoadMore}
                disabled={loading}
                className={styles.loadMoreButton}
              >
                {loading ? '加载中...' : '加载更多'}
              </button>
            </div>
          )}
        </>
      )}

      {/* 编辑对话框 */}
      {editingChannel && (
        <EditDialog
          channel={editingChannel}
          onClose={handleCloseEdit}
          onSuccess={handleSaveSuccess}
        />
      )}
      
      {/* ⭐ 添加频道对话框 */}
      {showAddDialog && (
        <AddChannelDialog
          onClose={() => setShowAddDialog(false)}
          onSuccess={handleAddSuccess}
        />
      )}
      
      {/* ⭐ 批量降权对话框 */}
      {showBatchDemoteDialog && (
        <BatchDemoteDialog
          selectedChannels={selectedChannels}
          onClose={() => setShowBatchDemoteDialog(false)}
          onSuccess={handleBatchDemoteSuccess}
        />
      )}
      
      {/* ⭐ 批量增加权重对话框 */}
      {showBatchPromoteDialog && (
        <BatchPromoteDialog
          selectedChannels={selectedChannels}
          onClose={() => setShowBatchPromoteDialog(false)}
          onSuccess={handleBatchPromoteSuccess}
        />
      )}
      
      {/* ⭐ 批量语言降权对话框 */}
      {showLanguageDemoteDialog && (
        <BatchLanguageDemoteDialog
          onClose={() => setShowLanguageDemoteDialog(false)}
          onSuccess={() => {
            setShowLanguageDemoteDialog(false)
            loadChannels(1, searchKeyword, sortBy)
          }}
        />
      )}
    </div>
  )
}

