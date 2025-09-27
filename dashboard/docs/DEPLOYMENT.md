# DrPlayer Dashboard 部署指南

本文档提供了 DrPlayer Dashboard 的完整部署指南，解决了子目录部署和SPA路由刷新的问题。

## 构建配置

### 1. 环境变量配置

在项目根目录创建 `.env.production` 文件：

```bash
# 生产环境配置
NODE_ENV=production

# 如果部署到子目录，设置基础路径
# 例如：部署到 /apps/ 目录下
VITE_BASE_PATH=/apps/

# 如果部署到根目录，使用相对路径
# VITE_BASE_PATH=./
```

### 2. 构建命令

```bash
# 安装依赖
npm install

# 构建生产版本
npm run build

# 构建后的文件在 dist 目录中
```

## 部署配置

### Nginx 配置

#### 1. 根目录部署

如果部署到网站根目录（如 `https://example.com/`）：

```nginx
server {
    listen 80;
    server_name example.com;
    root /var/www/drplayer/dist;
    index index.html;

    # 处理静态资源
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    # 处理 SPA 路由
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 安全配置
    location ~ /\. {
        deny all;
    }
}
```

#### 2. 子目录部署

如果部署到子目录（如 `https://example.com/apps/`）：

```nginx
server {
    listen 80;
    server_name example.com;
    
    # 子目录配置
    location /apps/ {
        alias /var/www/drplayer/dist/;
        index index.html;
        
        # 处理静态资源
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
            try_files $uri =404;
        }
        
        # 处理 SPA 路由 - 关键配置
        try_files $uri $uri/ /apps/index.html;
    }

    # 安全配置
    location ~ /\. {
        deny all;
    }
}
```

#### 3. 使用 location 块的高级配置

```nginx
server {
    listen 80;
    server_name example.com;
    
    location /apps {
        alias /var/www/drplayer/dist;
        
        # 重写规则处理子目录
        location ~ ^/apps/(.*)$ {
            try_files /$1 /$1/ /index.html;
        }
        
        # 静态资源缓存
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
```

### Apache 配置

如果使用 Apache 服务器，在 `dist` 目录创建 `.htaccess` 文件：

```apache
# 根目录部署
RewriteEngine On
RewriteBase /

# 处理静态资源
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]

# 子目录部署（例如 /apps/）
# RewriteEngine On
# RewriteBase /apps/
# RewriteCond %{REQUEST_FILENAME} !-f
# RewriteCond %{REQUEST_FILENAME} !-d
# RewriteRule . /apps/index.html [L]
```

## 部署步骤

### 1. 准备构建

```bash
# 1. 设置环境变量（根据部署目录）
echo "VITE_BASE_PATH=/apps/" > .env.production

# 2. 构建项目
npm run build
```

### 2. 上传文件

```bash
# 将 dist 目录内容上传到服务器
scp -r dist/* user@server:/var/www/drplayer/dist/
```

### 3. 配置服务器

```bash
# 1. 配置 nginx
sudo nano /etc/nginx/sites-available/drplayer
sudo ln -s /etc/nginx/sites-available/drplayer /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# 2. 设置文件权限
sudo chown -R www-data:www-data /var/www/drplayer/
sudo chmod -R 755 /var/www/drplayer/
```

## 常见问题解决

### 1. 资源加载 404

**问题**：部署到子目录后，CSS/JS 文件加载失败

**解决**：
- 确保 `.env.production` 中设置了正确的 `VITE_BASE_PATH`
- 检查 nginx 配置中的 `alias` 路径是否正确

### 2. 路由刷新 404

**问题**：直接访问路由地址或刷新页面时出现 404

**解决**：
- 确保 nginx 配置了正确的 `try_files` 规则
- 检查 `try_files` 中的 fallback 路径是否正确

### 3. 子目录路由问题

**问题**：子目录部署时路由跳转不正确

**解决**：
- 确保 Vue Router 的 base 路径配置正确
- 检查环境变量 `VITE_BASE_PATH` 是否正确设置

## 验证部署

部署完成后，验证以下功能：

1. **静态资源加载**：检查浏览器开发者工具，确保所有 CSS/JS 文件正常加载
2. **路由导航**：点击菜单项，确保路由跳转正常
3. **页面刷新**：在任意页面刷新，确保不出现 404 错误
4. **直接访问**：直接在地址栏输入路由地址，确保能正常访问

## 性能优化建议

1. **启用 Gzip 压缩**
2. **设置静态资源缓存**
3. **使用 CDN 加速**
4. **启用 HTTP/2**

```nginx
# Gzip 压缩
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

# HTTP/2
listen 443 ssl http2;
```