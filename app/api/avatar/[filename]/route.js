/**
 * 头像API路由
 * 提供本地存储的频道头像访问
 * 
 * 路径：/api/avatar/[filename]
 * 示例：/api/avatar/durov_abc123.jpg
 * 
 * ⭐ 防爬虫：每IP每小时最多100次请求
 */

import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { checkAPIRateLimit, getClientIP } from '@/utils';

// 导入配置文件（相对路径，适配任意磁盘）
const diskConfig = require('../../../../../../../.路径配置/disk_config.js');

/**
 * GET /api/avatar/[filename]
 * 返回指定的头像文件
 */
export async function GET(request, { params }) {
    try {
        // ⭐ API限流检查（防止批量下载头像）
        if (process.env.NODE_ENV === 'production') {
            const clientIP = getClientIP(request);
            const allowed = await checkAPIRateLimit(clientIP, 'avatar');
            
            if (!allowed) {
                console.log(`⛔ API限流: ${clientIP} (头像下载 10000次/小时)`);
                return new NextResponse(
                    JSON.stringify({
                        success: false,
                        message: '请求过于频繁，请稍后再试',
                        code: 'RATE_LIMIT_API'
                    }),
                    { 
                        status: 429,
                        headers: {
                            'Content-Type': 'application/json',
                            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',  // ⭐ 禁止缓存429响应
                            'Retry-After': '3600'
                        }
                    }
                );
            }
        }
        
        const { filename } = params;
        
        // 验证文件名（防止路径遍历攻击）
        if (!filename || filename.includes('..') || filename.includes('/')) {
            return new NextResponse('Invalid filename', { status: 400 });
        }
        
        // 构建完整路径
        const avatarPath = path.join(diskConfig.TG_CHANNEL_AVATARS, filename);
        
        // 读取文件
        const fileBuffer = await fs.readFile(avatarPath);
        
        // 根据文件扩展名确定Content-Type
        const ext = path.extname(filename).toLowerCase();
        let contentType = 'image/jpeg';
        if (ext === '.png') contentType = 'image/png';
        else if (ext === '.webp') contentType = 'image/webp';
        else if (ext === '.gif') contentType = 'image/gif';
        
        // 返回图片
        return new NextResponse(fileBuffer, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=31536000, immutable',  // 缓存1年
            },
        });
        
    } catch (error) {
        // 文件不存在或其他错误
        if (error.code === 'ENOENT') {
            return new NextResponse('Avatar not found', { status: 404 });
        }
        
        console.error('头像读取错误:', error);
        return new NextResponse('Internal server error', { status: 500 });
    }
}

