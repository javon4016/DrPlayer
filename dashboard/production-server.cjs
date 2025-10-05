#!/usr/bin/env node
/**
 * 生产服务器 - DrPlayer Dashboard (CommonJS版本，用于PKG打包)
 */

const Fastify = require('fastify');
const fastifyStatic = require('@fastify/static');
const path = require('path');
const fs = require('fs/promises');
const { execSync } = require('child_process');
const net = require('net');

// 内联 SPA 路由功能 (避免ES6模块依赖)
async function addSPARoutes(fastify, options) {
    const spaApps = options.spaApps || ['drplayer'];
    
    for (const appName of spaApps) {
        fastify.get(`/apps/${appName}`, async (request, reply) => {
            return reply.redirect(301, `/apps/${appName}/`);
        });

        fastify.get(`/apps/${appName}/`, async (request, reply) => {
            const indexPath = path.join(options.appsDir, appName, 'index.html');
            
            try {
                const indexContent = await fs.readFile(indexPath, 'utf8');
                return reply
                    .type('text/html')
                    .header('Cache-Control', 'no-cache, no-store, must-revalidate')
                    .send(indexContent);
            } catch (error) {
                return reply.code(404).send({ error: `${appName} application not found` });
            }
        });
    }

    fastify.setNotFoundHandler(async (request, reply) => {
        const url = request.url;
        
        for (const appName of spaApps) {
            const appPrefix = `/apps/${appName}/`;
            
            if (url.startsWith(appPrefix)) {
                const urlPath = url.replace(appPrefix, '');
                const hasExtension = /\.[a-zA-Z0-9]+(\?.*)?$/.test(urlPath);
                
                if (!hasExtension) {
                    const indexPath = path.join(options.appsDir, appName, 'index.html');
                    
                    try {
                        const indexContent = await fs.readFile(indexPath, 'utf8');
                        return reply
                            .type('text/html')
                            .header('Cache-Control', 'no-cache, no-store, must-revalidate')
                            .send(indexContent);
                    } catch (error) {
                        return reply.code(404).send({ error: `${appName} application not found` });
                    }
                }
            }
        }
        
        return reply.code(404).send({ error: 'Not Found' });
    });
}

// PKG 环境下的路径处理
const isPkg = typeof process.pkg !== 'undefined';

// 在CommonJS中，__filename和__dirname是全局可用的
// 在PKG环境中需要重新定义
let currentFilename, currentDirname;

if (isPkg) {
    currentFilename = process.execPath;
    currentDirname = path.dirname(process.execPath);
} else {
    currentFilename = __filename;
    currentDirname = __dirname;
}

// 检查端口是否可用
function checkPortAvailable(port) {
    return new Promise((resolve) => {
        const server = net.createServer();
        let resolved = false;
        
        // 设置超时机制
        const timeout = setTimeout(() => {
            if (!resolved) {
                resolved = true;
                server.close();
                resolve(false);
            }
        }, 1000);
        
        server.listen(port, '0.0.0.0', () => {
            if (!resolved) {
                resolved = true;
                clearTimeout(timeout);
                server.close(() => {
                    resolve(true);
                });
            }
        });
        
        server.on('error', (err) => {
            if (!resolved) {
                resolved = true;
                clearTimeout(timeout);
                resolve(false);
            }
        });
    });
}

// 查找可用端口
async function findAvailablePort(startPort = 9978, maxAttempts = 100) {
    for (let i = 0; i < maxAttempts; i++) {
        const port = startPort + i;
        const isAvailable = await checkPortAvailable(port);
        if (isAvailable) {
            return port;
        }
        console.log(`端口 ${port} 已被占用，尝试下一个端口...`);
    }
    throw new Error(`无法找到可用端口，已尝试 ${startPort} 到 ${startPort + maxAttempts - 1}`);
}

// PKG 环境下的工作目录处理
let workDir;
if (isPkg) {
    workDir = process.cwd();
    console.log('PKG 环境检测到，工作目录:', workDir);
    console.log('可执行文件路径:', process.execPath);
} else {
    workDir = currentDirname;
}

// 构建和部署函数
async function buildAndDeploy() {
    console.log('🔨 开始构建应用...');
    
    try {
        if (!isPkg) {
            try {
                execSync('pnpm build:apps', { stdio: 'inherit', cwd: currentDirname });
                console.log('✅ 构建完成');
            } catch (buildError) {
                console.warn('⚠️ 构建命令执行失败，可能是在打包环境中运行:', buildError.message);
                console.log('📦 跳过构建步骤，使用预构建的文件');
            }
        } else {
            console.log('📦 检测到pkg环境，跳过构建步骤');
        }
        
        const appsDir = path.join(workDir, 'apps');
        const drplayerDir = path.join(appsDir, 'drplayer');
        
        await fs.mkdir(drplayerDir, { recursive: true });
        console.log('📁 创建apps目录');
        
        const distDir = path.join(workDir, 'dist');
        try {
            await fs.access(distDir);
            await copyDirectory(distDir, drplayerDir);
            console.log('📋 复制文件到apps/drplayer');
        } catch (error) {
            console.warn('⚠️ dist目录不存在，跳过文件复制');
            if (isPkg) {
                console.log('📦 pkg环境中，请确保静态文件已正确打包');
            }
        }
        
    } catch (error) {
        console.error('❌ 构建失败:', error.message);
        if (typeof process.pkg === 'undefined') {
            process.exit(1);
        } else {
            console.log('📦 pkg环境中继续运行...');
        }
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

// 主函数
async function main() {
    const fastify = Fastify({
        logger: false
    });

    let PORT = 9978;

    // PKG环境中的静态文件路径处理
    let appsDir;
    if (isPkg) {
        // PKG环境中，静态文件在工作目录下的apps目录
        appsDir = path.join(workDir, 'apps');
        console.log('📦 PKG环境中使用工作目录的静态文件路径:', appsDir);
    } else {
        // 开发环境中使用工作目录
        appsDir = path.join(workDir, 'apps');
        console.log('🔧 开发环境中使用工作目录:', appsDir);
    }

    const options = {
        appsDir: appsDir,
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
        let version = '1.0.0';
        try {
            const packageJsonPath = path.join(currentDirname, 'package.json');
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
            await buildAndDeploy();
            
            console.log(`🔍 正在查找可用端口，起始端口: ${PORT}`);
            const availablePort = await findAvailablePort(PORT);
            PORT = availablePort;
            options.port = PORT;
            
            console.log(`✅ 找到可用端口: ${PORT}`);
            
            await fastify.listen({ port: PORT, host: '0.0.0.0' });
            console.log(`🚀 生产服务器启动成功！`);
            console.log(`📱 访问地址: http://localhost:${PORT}/apps/drplayer/`);
            console.log(`🔍 健康检查: http://localhost:${PORT}/health`);
            console.log(`📦 运行环境: ${isPkg ? 'PKG二进制' : '开发环境'}`);
            
            if (isPkg) {
                console.log(`📁 工作目录: ${workDir}`);
                console.log(`📂 应用目录: ${options.appsDir}`);
            }
            
        } catch (err) {
            console.error('❌ 服务器启动失败:', err.message);
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

    await start();
}

// 启动应用
main().catch(console.error);