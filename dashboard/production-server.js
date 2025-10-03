/**
 * 生产服务器 - DrPlayer Dashboard
 */

import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import {addSPARoutes} from './fastify-spa-routes.js';
import path from 'path';
import {fileURLToPath} from 'url';
import fs from 'fs/promises';
import {execSync} from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 构建和部署函数
async function buildAndDeploy() {
    console.log('🔨 开始构建应用...');
    
    try {
        // 执行构建命令
        execSync('pnpm build:fastify', { stdio: 'inherit', cwd: __dirname });
        console.log('✅ 构建完成');
        
        // 确保apps目录存在
        const appsDir = path.join(__dirname, 'apps');
        const drplayerDir = path.join(appsDir, 'drplayer');
        
        await fs.mkdir(drplayerDir, { recursive: true });
        console.log('📁 创建apps目录');
        
        // 复制dist内容到apps/drplayer
        const distDir = path.join(__dirname, 'dist');
        await copyDirectory(distDir, drplayerDir);
        console.log('📋 复制文件到apps/drplayer');
        
    } catch (error) {
        console.error('❌ 构建失败:', error.message);
        process.exit(1);
    }
}

// 递归复制目录
async function copyDirectory(src, dest) {
    await fs.mkdir(dest, { recursive: true });
    const entries = await fs.readdir(src, { withFileTypes: true });
    
    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        
        if (entry.isDirectory()) {
            await copyDirectory(srcPath, destPath);
        } else {
            await fs.copyFile(srcPath, destPath);
        }
    }
}

const fastify = Fastify({
    logger: true
});

// 配置选项
const PORT = 8008;
const options = {
    appsDir: path.join(__dirname, 'apps'),
    port: PORT
};

// 注册静态文件服务
await fastify.register(fastifyStatic, {
    root: options.appsDir,
    prefix: '/apps/',
    decorateReply: false,
});

// 注册SPA路由支持
await fastify.register(addSPARoutes, {
    appsDir: options.appsDir,
    spaApps: ['drplayer']
});

// 根路径 - 显示应用列表
fastify.get('/', async (request, reply) => {
    // 读取package.json获取版本信息
    let version = '1.0.0';
    try {
        const packageJsonPath = path.join(__dirname, 'package.json');
        const packageJsonContent = await fs.readFile(packageJsonPath, 'utf8');
        const packageJson = JSON.parse(packageJsonContent);
        version = packageJson.version || '1.0.0';
    } catch (error) {
        console.warn('无法读取package.json版本信息:', error.message);
    }
    
    const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DrPlayer Dashboard</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 40px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: #333;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        h1 {
            text-align: center;
            color: #2c3e50;
            margin-bottom: 30px;
            font-size: 2.5em;
        }
        .apps-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-top: 30px;
        }
        .app-card {
            background: #f8f9fa;
            border: 2px solid #e9ecef;
            border-radius: 8px;
            padding: 20px;
            text-decoration: none;
            color: #495057;
            transition: all 0.3s ease;
        }
        .app-card:hover {
            border-color: #667eea;
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(102, 126, 234, 0.2);
        }
        .app-name {
            font-size: 1.2em;
            font-weight: bold;
            margin-bottom: 8px;
            color: #2c3e50;
        }
        .app-description {
            font-size: 0.9em;
            color: #6c757d;
        }
        .status {
            margin-top: 30px;
            padding: 15px;
            background: #d4edda;
            border: 1px solid #c3e6cb;
            border-radius: 6px;
            color: #155724;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            color: #6c757d;
            font-size: 0.9em;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎬 DrPlayer Dashboard</h1>
        
        <div class="status">
            <strong>✅ 服务器运行正常</strong> - 端口: ${PORT}
        </div>
        
        <div class="apps-grid">
            <a href="/apps/drplayer/" class="app-card">
                <div class="app-name">DrPlayer</div>
                <div class="app-description">视频播放器管理界面</div>
            </a>
        </div>
        
        <div class="footer">
            <p>健康检查: <a href="/health">/health</a></p>
            <p>DrPlayer Dashboard v${version}</p>
        </div>
    </div>
</body>
</html>`;
    
    return reply.type('text/html').send(html);
});

// 健康检查
fastify.get('/health', async (request, reply) => {
    return {status: 'ok', timestamp: new Date().toISOString()};
});

// 启动服务器
const start = async () => {
    try {
        // 先构建和部署
        await buildAndDeploy();
        
        // 启动服务器
        await fastify.listen({port: PORT, host: '0.0.0.0'});
        console.log(`🚀 生产服务器启动成功！`);
        console.log(`📱 访问地址: http://localhost:${PORT}/apps/drplayer/`);
        console.log(`🔍 健康检查: http://localhost:${PORT}/health`);
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

// 优雅关闭
process.on('SIGINT', async () => {
    console.log('\n🛑 正在关闭服务器...');
    await fastify.close();
    process.exit(0);
});

start();