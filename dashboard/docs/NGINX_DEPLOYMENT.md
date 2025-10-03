# Vue SPA Nginx部署指南

本文档说明如何解决Vue单页应用(SPA)在静态部署时的404问题，并提供完整的Nginx配置方案。

## 问题原因

Vue Router使用`createWebHistory`模式时，路由是通过浏览器的History API实现的。当用户直接访问或刷新非根路径页面时（如`/settings`），服务器会尝试查找对应的物理文件，但这些文件并不存在，因此返回404错误。

## 解决方案

通过Nginx配置`try_files`指令，将所有不匹配静态文件的请求重定向到`index.html`，让Vue Router接管路由处理。

## 部署方式

### 方式一：根目录部署

适用于将DrPlayer部署在域名根目录的情况，如：`https://example.com/`

#### 1. 构建应用
```bash
# 使用根目录打包脚本
pnpm build:root
```

#### 2. 部署文件
将`dist`目录中的所有文件复制到服务器的网站根目录：
```bash
# 示例路径
/var/www/html/drplayer/
```

#### 3. Nginx配置
使用提供的`nginx-root.conf`配置文件：
```bash
# 复制配置文件
sudo cp nginx-root.conf /etc/nginx/sites-available/drplayer
sudo ln -s /etc/nginx/sites-available/drplayer /etc/nginx/sites-enabled/

# 或者直接编辑默认配置
sudo nano /etc/nginx/sites-available/default
```

### 方式二：子目录部署

适用于将DrPlayer部署在域名子目录的情况，如：`https://example.com/apps/drplayer/`

#### 1. 构建应用
```bash
# 使用子目录打包脚本
pnpm build:apps
```

#### 2. 部署文件
将`dist`目录中的所有文件复制到服务器的指定子目录：
```bash
# 示例路径
/var/www/html/drplayer/
```

#### 3. Nginx配置
使用提供的`nginx-subdir.conf`配置文件：
```bash
# 复制配置文件
sudo cp nginx-subdir.conf /etc/nginx/sites-available/drplayer-subdir
sudo ln -s /etc/nginx/sites-available/drplayer-subdir /etc/nginx/sites-enabled/
```

## 配置文件说明

### 核心配置项

1. **try_files指令**
   ```nginx
   try_files $uri $uri/ /index.html;
   ```
   这是解决SPA路由404问题的关键配置。

2. **静态资源缓存**
   ```nginx
   location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
       expires 1y;
       add_header Cache-Control "public, immutable";
   }
   ```

3. **Gzip压缩**
   ```nginx
   gzip on;
   gzip_types text/plain text/css application/json application/javascript;
   ```

4. **安全头设置**
   ```nginx
   add_header X-Frame-Options "SAMEORIGIN" always;
   add_header X-Content-Type-Options "nosniff" always;
   ```

### 路径配置

- **根目录部署**：修改`root`指令指向您的实际部署路径
- **子目录部署**：修改`alias`指令指向您的实际部署路径

## 部署步骤

### 1. 准备服务器环境
```bash
# 安装Nginx（Ubuntu/Debian）
sudo apt update
sudo apt install nginx

# 安装Nginx（CentOS/RHEL）
sudo yum install nginx
# 或者
sudo dnf install nginx
```

### 2. 配置Nginx
```bash
# 备份原配置
sudo cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup

# 应用新配置
sudo cp nginx-root.conf /etc/nginx/sites-available/drplayer
sudo ln -s /etc/nginx/sites-available/drplayer /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启Nginx
sudo systemctl restart nginx
```

### 3. 部署应用文件
```bash
# 创建部署目录
sudo mkdir -p /var/www/html/drplayer

# 复制构建文件
sudo cp -r dist/* /var/www/html/drplayer/

# 设置权限
sudo chown -R www-data:www-data /var/www/html/drplayer
sudo chmod -R 755 /var/www/html/drplayer
```

### 4. 验证部署
1. 访问首页：`http://your-domain/`
2. 直接访问子页面：`http://your-domain/settings`
3. 刷新页面确认不会出现404错误

## 常见问题

### 1. 刷新页面仍然404
- 检查Nginx配置中的`try_files`指令是否正确
- 确认`root`或`alias`路径是否正确
- 检查文件权限是否正确

### 2. 静态资源加载失败
- 检查`base`路径配置是否与部署路径匹配
- 确认静态资源文件是否存在
- 检查Nginx静态文件配置

### 3. API请求失败
- 配置API代理（如果后端API在不同端口）
- 检查CORS设置
- 确认API路径配置

## 性能优化建议

1. **启用Gzip压缩**：减少传输文件大小
2. **设置静态资源缓存**：提高加载速度
3. **使用CDN**：加速静态资源访问
4. **启用HTTP/2**：提高传输效率
5. **配置SSL证书**：启用HTTPS

## 安全建议

1. **隐藏Nginx版本信息**
2. **设置安全响应头**
3. **禁止访问敏感文件**
4. **配置防火墙规则**
5. **定期更新系统和软件**

## 监控和日志

```nginx
# 访问日志
access_log /var/log/nginx/drplayer_access.log;

# 错误日志
error_log /var/log/nginx/drplayer_error.log;
```

通过以上配置，您的Vue SPA应用将能够正确处理所有路由，解决刷新页面404的问题。