#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync, rmSync, cpSync, mkdirSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 定义路径
const rootDir = __dirname;
const tempServerDir = join(rootDir, 'temp-server');
const distBinaryDir = join(rootDir, 'dist-binary');
const distDir = join(rootDir, 'dist');
const tempServerDistDir = join(tempServerDir, 'dist');

console.log('🚀 开始自动化打包流程...\n');

try {
  // 步骤 1: 前端构建
  console.log('📦 步骤 1: 构建前端项目...');
  execSync('pnpm build:apps', { 
    stdio: 'inherit', 
    cwd: rootDir 
  });
  console.log('✅ 前端构建完成\n');

  // 步骤 2: 清理 temp-server 中的旧文件
  console.log('🧹 步骤 2: 清理 temp-server 中的旧文件...');
  
  // 清理 temp-server 中的旧 apps 目录
  const tempServerAppsDir = join(tempServerDir, 'apps');
  if (existsSync(tempServerAppsDir)) {
    rmSync(tempServerAppsDir, { recursive: true, force: true });
    console.log('✅ 已删除旧的 apps 目录');
  }
  console.log('');

  // 步骤 3: 复制构建文件到 temp-server/apps/drplayer
  console.log('📁 步骤 3: 复制构建文件到 temp-server...');
  if (!existsSync(distDir)) {
    throw new Error('dist 目录不存在，请确保前端构建成功');
  }
  
  // 确保 temp-server 目录存在
  if (!existsSync(tempServerDir)) {
    mkdirSync(tempServerDir, { recursive: true });
  }
  
  // 创建 apps/drplayer 目录并复制 dist 内容
  const tempServerDrplayerDir = join(tempServerAppsDir, 'drplayer');
  if (!existsSync(tempServerAppsDir)) {
    mkdirSync(tempServerAppsDir, { recursive: true });
  }
  
  // 将 dist 目录的内容复制到 apps/drplayer
  cpSync(distDir, tempServerDrplayerDir, { recursive: true });
  console.log('✅ 已将 dist 内容复制到 apps/drplayer');
  console.log('');

  // 步骤 4: 在 temp-server 目录中打包二进制文件
  console.log('⚙️  步骤 4: 打包二进制文件...');
  
  // 确保 temp-server 有 node_modules
  const tempServerNodeModules = join(tempServerDir, 'node_modules');
  if (!existsSync(tempServerNodeModules)) {
    console.log('📦 安装 temp-server 依赖...');
    execSync('pnpm install', { 
      stdio: 'inherit', 
      cwd: tempServerDir 
    });
  }
  
  // 执行 pkg 打包
  execSync('pnpm pkg:win', { 
    stdio: 'inherit', 
    cwd: tempServerDir 
  });
  console.log('✅ 二进制文件打包完成\n');

  // 步骤 5: 移动二进制文件到 dist-binary 目录
  console.log('📦 步骤 5: 移动二进制文件到 dist-binary...');
  
  // 确保 dist-binary 目录存在
  if (!existsSync(distBinaryDir)) {
    mkdirSync(distBinaryDir, { recursive: true });
  }
  
  // 查找并移动二进制文件
  const tempDistBinaryDir = join(tempServerDir, 'dist-binary');
  if (existsSync(tempDistBinaryDir)) {
    const files = readdirSync(tempDistBinaryDir);
    for (const file of files) {
      const srcPath = join(tempDistBinaryDir, file);
      const destPath = join(distBinaryDir, file);
      
      // 如果目标文件已存在，先删除
      if (existsSync(destPath)) {
        rmSync(destPath, { force: true });
      }
      
      // 移动文件
      cpSync(srcPath, destPath, { recursive: true });
      console.log(`✅ 已移动: ${file}`);
    }
    
    // 清理 temp-server 中的 dist-binary 目录
    try {
      rmSync(tempDistBinaryDir, { recursive: true, force: true });
    } catch (error) {
      console.log(`⚠️  无法删除临时目录 (可能有进程正在使用): ${error.message}`);
    }
  }
  
  // 步骤 6: 清理 temp-server 目录
  console.log('\n🧹 步骤 6: 清理 temp-server 临时文件...');
  
  // 需要清理的目录列表
  const dirsToClean = [
    join(tempServerDir, 'apps'),
    join(tempServerDir, 'dist-binary')
  ];
  
  for (const dirPath of dirsToClean) {
    if (existsSync(dirPath)) {
      try {
        rmSync(dirPath, { recursive: true, force: true });
        console.log(`✅ 已清理: ${dirPath.replace(tempServerDir, 'temp-server')}`);
      } catch (error) {
        console.log(`⚠️  无法清理目录 ${dirPath.replace(tempServerDir, 'temp-server')}: ${error.message}`);
      }
    }
  }
  
  console.log('\n🎉 自动化打包流程完成！');
  console.log(`📁 二进制文件位置: ${distBinaryDir}`);
  
  // 显示生成的文件
  if (existsSync(distBinaryDir)) {
    const files = readdirSync(distBinaryDir);
    if (files.length > 0) {
      console.log('\n📋 生成的文件:');
      files.forEach(file => {
        const filePath = join(distBinaryDir, file);
        const stats = statSync(filePath);
        const size = (stats.size / 1024 / 1024).toFixed(2);
        console.log(`  - ${file} (${size} MB)`);
      });
    }
  }

} catch (error) {
  console.error('\n❌ 打包过程中出现错误:');
  console.error(error.message);
  process.exit(1);
}