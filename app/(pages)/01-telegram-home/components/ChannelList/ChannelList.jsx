'use client';

import { useState, useCallback, useEffect, Suspense } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useInView } from 'react-intersection-observer';
import ChannelCard from '../ChannelCard';
import SearchBar from '../SearchBar';
import { getChannelsData, searchChannels } from '../../Actions';
import styles from './ChannelList.module.css';

/**
 * 频道列表组件（⭐ 无限滚动 + URL 状态保持）
 * 优化：服务端分页 + 无限滚动 + 刷新保持搜索状态
 */
export default function ChannelList({ 
  initialChannels, 
  initialPagination,
  searchKeyword: initialSearchKeyword = ''  // ⭐ 从 URL 获取的搜索关键词
}) {
  const router = useRouter();
  const pathname = usePathname();
  
  // 状态管理
  const [channels, setChannels] = useState(initialChannels);
  const [pagination, setPagination] = useState(initialPagination);
  const [loading, setLoading] = useState(false);
  const [searchMode, setSearchMode] = useState(!!initialSearchKeyword); // ⭐ 根据 URL 初始化
  const [searchKeyword, setSearchKeyword] = useState(initialSearchKeyword); // ⭐ 从 URL 初始化
  
  // 无限滚动触发器
  const { ref, inView } = useInView({
    threshold: 0,
    triggerOnce: false
  });
  
  // 加载更多频道
  const loadMore = useCallback(async () => {
    if (loading || !pagination.hasMore) return;
    
    setLoading(true);
    
    try {
      const result = await getChannelsData({ 
        page: pagination.page + 1, 
        pageSize: pagination.pageSize 
      });
      
      if (result.success) {
        setChannels(prev => [...prev, ...result.data.channels]);
        setPagination(result.data.pagination);
      }
    } catch (error) {
      console.error('加载更多失败:', error);
    } finally {
      setLoading(false);
    }
  }, [pagination, loading]);
  
  // 加载更多搜索结果
  const loadMoreSearch = useCallback(async () => {
    if (loading || !pagination.hasMore || !searchKeyword) return;
    
    setLoading(true);
    
    try {
      const result = await searchChannels({ 
        keyword: searchKeyword,
        page: pagination.page + 1, 
        pageSize: pagination.pageSize 
      });
      
      if (result.success) {
        setChannels(prev => [...prev, ...result.data.channels]);
        setPagination(result.data.pagination);
      }
    } catch (error) {
      console.error('加载更多搜索结果失败:', error);
    } finally {
      setLoading(false);
    }
  }, [pagination, loading, searchKeyword]);
  
  // 监听滚动触发
  useEffect(() => {
    if (inView) {
      if (searchMode) {
        loadMoreSearch(); // 搜索模式：加载更多搜索结果
      } else {
        loadMore(); // 浏览模式：加载更多频道
      }
    }
  }, [inView, loadMore, loadMoreSearch, searchMode]);
  
  // ⭐ 处理搜索结果（由 SearchBar 传入）
  const handleSearchResults = useCallback(async (searchResult) => {
    if (searchResult === null) {
      // ⭐ 清空搜索，重新加载全局数据（不使用 initialChannels，因为可能是搜索结果）
      setSearchMode(false);
      setSearchKeyword('');
      setLoading(true);
      
      try {
        // 重新获取首页数据
        const result = await getChannelsData({ page: 1, pageSize: 20 });
        if (result.success) {
          setChannels(result.data.channels);
          setPagination(result.data.pagination);
        }
      } catch (error) {
        console.error('加载数据失败:', error);
        // 失败时使用 initialChannels 作为备份
        setChannels(initialChannels);
        setPagination(initialPagination);
      } finally {
        setLoading(false);
      }
      
      // ⭐ 使用浅层路由清除 URL 参数（不触发 Server Component 重新渲染）
      window.history.replaceState(null, '', pathname);
    } else {
      // 进入搜索模式
      setSearchMode(true);
      setSearchKeyword(searchResult.keyword);
      setChannels(searchResult.channels);
      setPagination(searchResult.pagination);
      
      // ⭐ 使用浅层路由更新 URL（不触发 Server Component 重新渲染）
      const url = `${pathname}?search=${encodeURIComponent(searchResult.keyword)}`;
      window.history.replaceState(null, '', url);
    }
  }, [initialChannels, initialPagination, pathname]);

  return (
    <div className={styles.container}>
      {/* ⭐ 搜索栏（使用 Suspense 包装，因为 SearchBar 使用了 useSearchParams） */}
      <Suspense fallback={<div className={styles.searchBarLoading}>加载中...</div>}>
        <SearchBar onSearchResults={handleSearchResults} />
      </Suspense>

      {/* 搜索模式提示 */}
      {searchMode && (
        <div className={styles.resultInfo}>
          找到 <strong>{pagination.total}</strong> 个频道
          {pagination.total === 0 && (
            <span className={styles.noResult}>，请尝试其他关键词</span>
          )}
        </div>
      )}

      {/* 频道列表 */}
      {channels.length === 0 && !searchMode ? (
        <div className={styles.empty}>
          <p>暂无频道数据</p>
          <p className={styles.hint}>
            请先运行爬虫程序收集数据
          </p>
        </div>
      ) : (
        <>
          <div className={styles.grid}>
            {channels.map((channel) => (
              <ChannelCard key={channel._id} channel={channel} />
            ))}
          </div>
          
          {/* 无限滚动触发器（浏览模式 + 搜索模式都支持） */}
          {pagination.hasMore && (
            <div ref={ref} className={styles.loadingTrigger}>
              {loading ? (
                <div className={styles.loading}>
                  <div className={styles.spinner}></div>
                  <span>加载中...</span>
                </div>
              ) : (
                <div className={styles.loadMore}>向下滚动加载更多</div>
              )}
            </div>
          )}
          
          {/* 已到底部 */}
          {!pagination.hasMore && channels.length > 0 && (
            <div className={styles.end}>
              <span>🎉</span> 已经到底了 ~
            </div>
          )}
        </>
      )}
    </div>
  );
}

