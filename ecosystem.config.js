/**
 * Navigation - PM2 配置文件
 * 导航网站：Next.js前端应用，展示和管理频道数据
 * 
 * ⚠️ 重要：首次启动前需要构建
 *    cd Navigation && npm run build
 */

module.exports = {
  apps: [
    {
      name: 'Navigation',
      script: 'npm',
      args: 'run start',
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3528,  // 必须与 package.json 中的端口一致
      },
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
      
      // Next.js 启动设置
      wait_ready: false,
      listen_timeout: 30000,        // 30秒超时（Next.js 启动需要时间）
      kill_timeout: 5000,           // 停止超时
      restart_delay: 4000,          // 重启延迟（避免频繁重启）
      
      // 错误重启限制
      max_restarts: 5,              // 最多重启5次
      min_uptime: '10s',            // 运行至少10秒才算成功启动
      
      // 注意：启动前必须先构建
      // 手动运行: cd Navigation && npm run build
    }
  ]
};

