import styles from './AdminChannelCard.module.css'

export default function AdminChannelCard({ channel, onEdit }) {
  const {
    username,
    name,
    description,
    avatar,
    stats = {},
    weight = {},
    meta = {}
  } = channel

  // ⭐ 使用 adminHidden 字段判断是否被管理员禁用
  const isActive = !(meta.adminHidden === true)

  return (
    <div className={`${styles.card} ${!isActive ? styles.disabled : ''}`}>
      {/* 禁用标志 */}
      {!isActive && (
        <div className={styles.disabledBadge}>
          已禁用
        </div>
      )}

      {/* 频道头部 */}
      <div className={styles.header}>
        {avatar && (
          <img
            src={avatar}
            alt={name}
            className={styles.avatar}
            onError={(e) => {
              e.target.style.display = 'none'
            }}
          />
        )}
        <div className={styles.headerInfo}>
          <h3 className={styles.channelName}>{name || '未命名'}</h3>
          <a
            href={`https://t.me/${username}`}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.username}
          >
            @{username}
          </a>
        </div>
      </div>

      {/* 描述 */}
      {description && (
        <p className={styles.description}>
          {description.length > 100
            ? description.substring(0, 100) + '...'
            : description}
        </p>
      )}

      {/* 统计信息 */}
      <div className={styles.stats}>
        <div className={styles.statItem}>
          <span className={styles.statIcon}>👥</span>
          <span className={styles.statValue}>
            {stats.members?.toLocaleString() || '0'}
          </span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statIcon}>❤️</span>
          <span className={styles.statValue}>
            {stats.likes || 0}
          </span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statIcon}>⭐</span>
          <span className={styles.statValue}>
            {weight.value?.toLocaleString() || '0'}
          </span>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className={styles.actions}>
        <button
          onClick={() => onEdit(channel)}
          className={styles.editButton}
        >
          ✏️ 编辑
        </button>
        <a
          href={`/${username}`}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.viewButton}
        >
          👁️ 查看
        </a>
      </div>
    </div>
  )
}

