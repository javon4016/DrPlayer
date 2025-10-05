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
                console.log(`🔍 [SPA] 尝试读取index.html: ${indexPath}`);
                const indexContent = await fs.readFile(indexPath, 'utf8');
                console.log(`✅ [SPA] 成功读取index.html，长度: ${indexContent.length}`);
                return reply
                    .type('text/html')
                    .header('Cache-Control', 'no-cache, no-store, must-revalidate')
                    .send(indexContent);
            } catch (error) {
                console.error(`❌ [SPA] 读取index.html失败: ${error.message}`);
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
        
        // 设置超时
        const timeout = setTimeout(() => {
            server.close();
            resolve(false);
        }, 1000);
        
        server.listen(port, '0.0.0.0', () => {
            clearTimeout(timeout);
            server.close(() => {
                resolve(true);
            });
        });
        
        server.on('error', (err) => {
            clearTimeout(timeout);
            resolve(false);
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
    // 在PKG环境中，静态文件被打包在二进制文件内部，使用__dirname访问
    workDir = __dirname;
    console.log('PKG 环境检测到，工作目录:', process.cwd());
    console.log('可执行文件路径:', process.execPath);
    console.log('📦 PKG环境中使用内部资源路径:', workDir);
} else {
    workDir = currentDirname;
}

// 验证静态文件是否存在
async function validateStaticFiles() {
    if (isPkg) {
        // PKG环境中，静态文件被打包在二进制文件内部，直接使用__dirname
        const appsDir = path.join(__dirname, 'apps');
        const drplayerDir = path.join(appsDir, 'drplayer');
        
        try {
            // 在PKG环境中，使用readdir来验证目录存在性而不是access
            const appsContents = await fs.readdir(appsDir);
            
            if (appsContents.includes('drplayer')) {
                // 进一步验证drplayer目录内容
                const drplayerContents = await fs.readdir(drplayerDir);
                
                // 检查是否包含必要的文件（如index.html）
                if (drplayerContents.includes('index.html')) {
                    console.log('✅ 静态文件目录验证成功:', drplayerDir);
                    return true;
                } else {
                    console.error('❌ drplayer目录中缺少index.html文件');
                    return false;
                }
            } else {
                console.error('❌ apps目录中不包含drplayer子目录');
                return false;
            }
        } catch (error) {
            console.error('❌ 无法读取PKG中的静态文件目录:', error.message);
            return false;
        }
    } else {
        // 非PKG环境
        const appsDir = path.join(workDir, 'apps');
        const drplayerDir = path.join(appsDir, 'drplayer');
        
        try {
            await fs.access(drplayerDir);
            console.log('✅ 静态文件目录验证成功:', drplayerDir);
            return true;
        } catch (error) {
            console.error('❌ 静态文件目录不存在:', drplayerDir);
            console.error('请确保构建过程正确将静态文件复制到了正确位置');
            return false;
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
        // PKG环境中，静态文件被打包在二进制文件内部，使用__dirname
        appsDir = path.join(__dirname, 'apps');
        console.log('📦 PKG环境中使用内部资源路径:', appsDir);
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
            // 验证静态文件是否存在
            const staticFilesValid = await validateStaticFiles();
            if (!staticFilesValid && isPkg) {
                console.error('❌ PKG环境中静态文件验证失败，服务器无法正常运行');
                process.exit(1);
            }
            
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