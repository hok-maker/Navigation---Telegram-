'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { searchChannels, saveSearchKeyword } from '../../Actions';
import styles from './SearchBar.module.css';

/**
 * 搜索栏组件（⭐ 服务端搜索 + URL 状态恢复）
 * 优化：调用服务端搜索 API，支持刷新时恢复搜索关键词
 */
export default function SearchBar({ onSearchResults }) {
  const searchParams = useSearchParams();
  const [keyword, setKeyword] = useState('');
  const [searching, setSearching] = useState(false);
  
  // ⭐ 初始化时从 URL 恢复搜索关键词
  useEffect(() => {
    const urlKeyword = searchParams.get('search');
    if (urlKeyword) {
      setKeyword(urlKeyword);
    }
  }, [searchParams]);

  // 搜索处理
  const handleSearch = async (e) => {
    e.preventDefault();
    
    // 如果关键词为空，清空搜索结果
    if (!keyword.trim()) {
      onSearchResults(null);
      return;
    }
    
    setSearching(true);
    
    try {
      // 并行执行：服务端搜索 + 记录关键词
      const [searchResult] = await Promise.all([
        searchChannels({ keyword: keyword.trim(), page: 1, pageSize: 20 }),
        saveSearchKeyword(keyword.trim())
      ]);
      
      if (searchResult.success) {
        // 将搜索结果传递给父组件
        onSearchResults({
          channels: searchResult.data.channels,
          pagination: searchResult.data.pagination,
          keyword: searchResult.data.keyword
        });
        
        console.log(`🔍 搜索 "${searchResult.data.keyword}" 找到 ${searchResult.data.pagination.total} 个频道`);
      }
    } catch (error) {
      console.error('搜索失败:', error);
      onSearchResults(null);
    } finally {
      setSearching(false);
    }
  };
  
  // 清空搜索
  const handleClear = () => {
    setKeyword('');
    onSearchResults(null);
  };

  return (
    <div className={styles.searchBar}>
      {/* 搜索框 */}
      <form className={styles.searchForm} onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="搜索频道名称或描述..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className={styles.searchInput}
          disabled={searching}
        />
        
        {keyword && (
          <button 
            type="button" 
            onClick={handleClear}
            className={styles.clearButton}
            disabled={searching}
          >
            ✕
          </button>
        )}
        
        <button 
          type="submit" 
          className={styles.searchButton}
          disabled={searching}
        >
          {searching ? '搜索中...' : '🔍 搜索'}
        </button>
      </form>
    </div>
  );
}

