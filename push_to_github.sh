#!/bin/bash

# Navigation 代码推送到 GitHub 脚本
# 使用方法：chmod +x push_to_github.sh && ./push_to_github.sh

echo "=== Navigation 推送到 GitHub ==="
echo ""

# 进入 Navigation 目录
cd "$(dirname "$0")"

# 检查是否是 Git 仓库
if [ ! -d ".git" ]; then
    echo "初始化 Git 仓库..."
    git init
    git remote add origin https://github.com/hok-maker/Navigation---Telegram-.git
fi

# 检查远程仓库
echo "检查远程仓库..."
git remote -v

# 拉取远程代码（避免冲突）
echo ""
echo "拉取远程代码..."
git pull origin main --allow-unrelated-histories || echo "首次推送无需拉取"

# 添加所有更改
echo ""
echo "添加更改..."
git add .

# 显示待提交的文件
echo ""
echo "待提交的文件："
git status --short

# 提交更改
echo ""
read -p "输入提交信息（直接回车使用默认）: " commit_msg

if [ -z "$commit_msg" ]; then
    commit_msg="合并: GitHub优化 + Coinzilla广告配置

- Avatar互斥渲染优化（头像加载失败处理）
- CSS简化（移除不必要的absolute定位）
- Emoji Favicon（避免404错误）
- 添加Coinzilla验证标签
- 创建广告接入相关文档和组件"
fi

git commit -m "$commit_msg"

# 推送到 GitHub
echo ""
echo "推送到 GitHub..."
git branch -M main

# ⭐ 从环境变量读取 Token（避免在代码中暴露）
if [ -z "$GITHUB_TOKEN" ]; then
    echo "❌ 未设置 GITHUB_TOKEN 环境变量"
    echo "请执行: export GITHUB_TOKEN=your_token"
    exit 1
fi

git push https://${GITHUB_TOKEN}@github.com/hok-maker/Navigation---Telegram-.git main

echo ""
echo "✅ 推送完成！"
echo ""
echo "下一步：在正式服务器执行 'git pull origin main' 来合并新代码"

