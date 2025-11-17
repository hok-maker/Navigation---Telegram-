#!/bin/bash 
#命令 996007工作区/Navigation/deploy_from_github.sh

# Navigation 从 GitHub 拉取最新代码脚本
# 使用方法：在正式服务器的 Navigation 目录执行此脚本

echo "=== Navigation 从 GitHub 拉取最新代码 ==="
echo ""

# 显示当前目录
echo "当前目录: $(pwd)"
echo ""

# 检查是否在正确的目录
if [ ! -f "package.json" ]; then
    echo "❌ 错误：当前目录不是 Navigation 项目"
    echo "请先 cd 到 Navigation 目录"
    exit 1
fi

# 显示当前分支和状态
echo "📊 当前 Git 状态："
git status --short
echo ""

# 提示用户
read -p "⚠️  这将覆盖本地所有未提交的修改，是否继续? (y/n): " confirm
if [ "$confirm" != "y" ]; then
    echo "❌ 取消操作"
    exit 0
fi

echo ""
echo "🔄 开始拉取最新代码..."

# 拉取最新代码（因为Git历史被重建，使用reset）
git fetch origin main
if [ $? -ne 0 ]; then
    echo "❌ 拉取失败，请检查网络或仓库访问权限"
    exit 1
fi

git reset --hard origin/main
if [ $? -ne 0 ]; then
    echo "❌ 重置失败"
    exit 1
fi

echo "✅ 代码拉取成功"
echo ""

# 显示最新提交
echo "📝 最新提交："
git log -1 --oneline
echo ""

# 安装依赖
read -p "是否需要安装依赖? (y/n): " install_deps
if [ "$install_deps" = "y" ]; then
    echo ""
    echo "📦 安装依赖..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ 依赖安装失败"
        exit 1
    fi
    echo "✅ 依赖安装成功"
fi

echo ""

# 构建项目
read -p "是否需要重新构建? (y/n): " build_project
if [ "$build_project" = "y" ]; then
    echo ""
    echo "🔨 构建项目..."
    npm run build
    if [ $? -ne 0 ]; then
        echo "❌ 构建失败"
        exit 1
    fi
    echo "✅ 构建成功"
fi

echo ""

# 重启服务
read -p "是否需要重启 PM2 服务? (y/n): " restart_pm2
if [ "$restart_pm2" = "y" ]; then
    echo ""
    echo "🔄 重启 PM2 服务..."
    pm2 restart Navigation
    if [ $? -ne 0 ]; then
        echo "❌ 重启失败，请手动执行: pm2 restart Navigation"
        exit 1
    fi
    echo "✅ 服务重启成功"
    echo ""
    echo "📊 服务状态："
    pm2 status Navigation
fi

echo ""
echo "🎉 部署完成！"
echo ""
echo "📋 验证清单："
echo "- [ ] 访问网站确认正常"
echo "- [ ] 检查头像显示（特别是加载失败时的默认头像）"
echo "- [ ] 查看源代码确认 Coinzilla 标签存在"
echo "- [ ] 检查 PM2 日志: pm2 logs Navigation"

