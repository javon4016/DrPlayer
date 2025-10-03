// 为Fastify部署构建Vue应用的脚本
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function buildForFastify() {
    console.log('🚀 开始为Fastify部署构建Vue应用...');
    
    try {
        // 1. 设置环境变量
        process.env.NODE_ENV = 'production';
        process.env.VITE_BASE_PATH = '/apps/drplayer/';
        
        console.log('📦 正在构建应用...');
        
        // 2. 执行构建
        execSync('pnpm build', { 
            stdio: 'inherit',
            env: {
                ...process.env,
                VITE_BASE_PATH: '/apps/drplayer/'
            }
        });
        
        // 3. 检查构建结果
        const distPath = path.join(__dirname, 'dist');
        const indexPath = path.join(distPath, 'index.html');
        
        if (fs.existsSync(indexPath)) {
            console.log('✅ 构建成功！');
            console.log(`📁 构建文件位置: ${distPath}`);
            console.log('');
            console.log('📋 部署步骤：');
            console.log('1. 将 dist/ 目录的内容复制到您的后端 apps/drplayer/ 目录');
            console.log('2. 在Fastify应用中添加SPA路由支持（参考 fastify-spa-routes.js）');
            console.log('3. 重启Fastify服务器');
            console.log('4. 访问 http://your-server/apps/drplayer/');
            console.log('');
            console.log('🔧 Fastify配置示例：');
            console.log('```javascript');
            console.log('// 添加到您的Fastify应用中');
            console.log('import { addSPARoutes } from "./fastify-spa-routes.js";');
            console.log('await fastify.register(addSPARoutes, { appsDir: options.appsDir });');
            console.log('```');
        } else {
            throw new Error('构建失败：未找到index.html文件');
        }
        
    } catch (error) {
        console.error('❌ 构建失败:', error.message);
        process.exit(1);
    }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
    buildForFastify();
}

export { buildForFastify };