// Fastify SPA配置示例 - 解决Vue Router刷新404问题
// 适用于将Vue应用作为Fastify静态文件服务的子目录部署

import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fastify = Fastify({ logger: true });

// 注册静态文件插件
async function setupSPA(fastify, options) {
    // 1. 注册静态文件服务
    await fastify.register(fastifyStatic, {
        root: options.appsDir,            // 应用程序文件根目录
        prefix: '/apps/',                 // URL访问前缀
        decorateReply: false,             // 禁用 sendFile 装饰器，避免冲突
        // 设置静态文件缓存
        setHeaders: (res, path) => {
            if (path.endsWith('.html')) {
                // HTML文件不缓存，确保路由更新
                res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            } else if (path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
                // 静态资源长期缓存
                res.setHeader('Cache-Control', 'public, max-age=31536000');
            }
        }
    });

    // 2. SPA路由回退处理 - 关键配置
    // 处理DrPlayer应用的所有路由，回退到index.html
    fastify.get('/apps/drplayer/*', async (request, reply) => {
        const requestedPath = request.params['*'];
        const fullPath = path.join(options.appsDir, 'drplayer', requestedPath);
        
        try {
            // 检查请求的文件是否存在
            await fs.promises.access(fullPath);
            // 如果文件存在，让静态文件服务处理
            return reply.callNotFound();
        } catch (error) {
            // 文件不存在，返回index.html让Vue Router处理
            const indexPath = path.join(options.appsDir, 'drplayer', 'index.html');
            
            try {
                const indexContent = await fs.promises.readFile(indexPath, 'utf8');
                reply
                    .type('text/html')
                    .header('Cache-Control', 'no-cache, no-store, must-revalidate')
                    .send(indexContent);
            } catch (indexError) {
                reply.code(404).send({ error: 'Application not found' });
            }
        }
    });

    // 3. 处理根路径访问，重定向到带斜杠的路径
    fastify.get('/apps/drplayer', async (request, reply) => {
        reply.redirect(301, '/apps/drplayer/');
    });

    // 4. 处理DrPlayer应用根路径
    fastify.get('/apps/drplayer/', async (request, reply) => {
        const indexPath = path.join(options.appsDir, 'drplayer', 'index.html');
        
        try {
            const indexContent = await fs.promises.readFile(indexPath, 'utf8');
            reply
                .type('text/html')
                .header('Cache-Control', 'no-cache, no-store, must-revalidate')
                .send(indexContent);
        } catch (error) {
            reply.code(404).send({ error: 'Application not found' });
        }
    });

    // 5. API路由（如果需要）
    fastify.register(async function (fastify) {
        // 您的API路由
        fastify.get('/api/health', async (request, reply) => {
            return { status: 'ok' };
        });
    });
}

// 使用示例
async function start() {
    try {
        // 配置选项
        const options = {
            appsDir: path.join(__dirname, 'apps'), // 您的apps目录路径
        };

        // 注册SPA配置
        await fastify.register(setupSPA, options);

        // 启动服务器
        await fastify.listen({ port: 3000, host: '0.0.0.0' });
        console.log('Server is running on http://localhost:3000');
        console.log('DrPlayer app available at: http://localhost:3000/apps/drplayer/');
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
}

// 如果直接运行此文件
if (import.meta.url === `file://${process.argv[1]}`) {
    start();
}

export { setupSPA };