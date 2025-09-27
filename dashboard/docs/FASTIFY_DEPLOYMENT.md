# Vue SPA + Fastify 部署指南

## 问题说明

Vue单页应用使用`createWebHistory`路由模式时，刷新页面会出现404错误。这是因为：

1. 用户访问 `/apps/drplayer/settings`
2. 浏览器向服务器请求 `/apps/drplayer/settings` 文件
3. 服务器找不到该文件，返回404
4. 需要让服务器将所有SPA路由请求都返回到 `index.html`

## 解决方案

通过Fastify提供静态文件服务 + SPA路由回退机制，完全可以解决刷新404问题。

## 配置步骤

### 1. 构建Vue应用

```bash
# 方法1：使用构建脚本（推荐）
node build-for-fastify.js

# 方法2：手动设置环境变量
set VITE_BASE_PATH=/apps/drplayer/
yarn build
```

### 2. 复制构建文件

将 `dist/` 目录的所有内容复制到您的后端 `apps/drplayer/` 目录：

```
your-backend/
├── apps/
│   └── drplayer/
│       ├── index.html
│       ├── assets/
│       │   ├── index-xxx.js
│       │   └── index-xxx.css
│       └── ...
└── server.js
```

### 3. 配置Fastify服务器

#### 方法1：使用提供的路由模块（推荐）

```javascript
import { addSPARoutes } from './fastify-spa-routes.js';
import fastifyStatic from '@fastify/static';

// 您现有的静态文件配置
await fastify.register(fastifyStatic, {
    root: options.appsDir,
    prefix: '/apps/',
    decorateReply: false,
});

// 添加SPA路由支持
await fastify.register(addSPARoutes, { 
    appsDir: options.appsDir 
});
```

#### 方法2：直接在现有代码中添加

```javascript
import path from 'path';
import fs from 'fs';

// 在您现有的Fastify应用中添加这些路由
fastify.get('/apps/drplayer/*', async (request, reply) => {
    const requestedPath = request.params['*'];
    const fullPath = path.join(options.appsDir, 'drplayer', requestedPath);
    
    try {
        await fs.promises.access(fullPath);
        return reply.callNotFound(); // 让静态文件服务处理
    } catch (error) {
        // 返回index.html让Vue Router处理
        const indexPath = path.join(options.appsDir, 'drplayer', 'index.html');
        const indexContent = await fs.promises.readFile(indexPath, 'utf8');
        return reply
            .type('text/html')
            .header('Cache-Control', 'no-cache, no-store, must-revalidate')
            .send(indexContent);
    }
});

// 处理根路径
fastify.get('/apps/drplayer', async (request, reply) => {
    return reply.redirect(301, '/apps/drplayer/');
});

fastify.get('/apps/drplayer/', async (request, reply) => {
    const indexPath = path.join(options.appsDir, 'drplayer', 'index.html');
    const indexContent = await fs.promises.readFile(indexPath, 'utf8');
    return reply
        .type('text/html')
        .header('Cache-Control', 'no-cache, no-store, must-revalidate')
        .send(indexContent);
});
```

## 工作原理

1. **静态文件服务**：`@fastify/static` 处理所有存在的静态文件（JS、CSS、图片等）
2. **路由回退**：当请求的文件不存在时，返回 `index.html`
3. **Vue Router接管**：`index.html` 加载后，Vue Router根据URL显示对应组件

## 路由优先级

```
请求: /apps/drplayer/assets/index-xxx.js
↓
静态文件存在 → 直接返回文件

请求: /apps/drplayer/settings
↓
静态文件不存在 → 返回 index.html → Vue Router处理
```

## 缓存策略

- **HTML文件**：不缓存（`no-cache`），确保路由更新
- **静态资源**：长期缓存（1年），提高性能

## 测试验证

1. 启动Fastify服务器
2. 访问 `http://localhost:3000/apps/drplayer/`
3. 导航到不同页面（如设置页面）
4. 刷新页面，确认不出现404错误
5. 检查浏览器开发者工具，确认静态资源正常加载

## 常见问题

### Q: 刷新后页面空白？
A: 检查 `VITE_BASE_PATH` 是否正确设置为 `/apps/drplayer/`

### Q: 静态资源404？
A: 确认构建时的base路径与Fastify的prefix匹配

### Q: API请求失败？
A: 确保API路由在SPA路由之前注册，避免被SPA回退拦截

## 性能优化

1. **启用Gzip压缩**：
```javascript
import fastifyCompress from '@fastify/compress';
await fastify.register(fastifyCompress);
```

2. **设置静态资源缓存**：
```javascript
await fastify.register(fastifyStatic, {
    // ... 其他配置
    setHeaders: (res, path) => {
        if (path.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        } else if (path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg)$/)) {
            res.setHeader('Cache-Control', 'public, max-age=31536000');
        }
    }
});
```

## 总结

✅ **可以解决404问题**：通过Fastify的路由回退机制  
✅ **性能良好**：静态文件直接服务，只有路由请求才回退  
✅ **配置简单**：只需添加几个路由处理器  
✅ **开发友好**：支持热重载和开发服务器