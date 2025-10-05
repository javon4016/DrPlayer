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

// 配置选项
const config = {
  // pkg优化选项
  pkg: {
    compress: 'Brotli', // 使用Brotli压缩 (GZip也可选)
    publicPackages: '*', // 将所有包标记为public以减少体积
    noBytecode: false, // 保持字节码生成以避免兼容性问题
    public: true, // 使用public选项加速打包
    options: 'max-old-space-size=512' // 限制内存使用
  },
  // UPX压缩选项
  upx: {
    enabled: true, // 是否启用UPX压缩
    level: 6, // 压缩级别 (1-9, 降低到6以提高兼容性)
    keepBackup: true, // 保留备份文件以便回滚
    ultraBrute: false, // 是否使用ultra-brute模式
    testAfterCompress: true, // 压缩后测试二进制文件
    fallbackOnError: true // 如果压缩后无法运行，则回滚到原文件
  }
};

console.log('🚀 开始优化打包流程...\n');

// 检查UPX是否可用
function checkUpxAvailable() {
  try {
    execSync('upx --version', { stdio: 'pipe' });
    return true;
  } catch (error) {
    console.log('⚠️  UPX未安装或不可用，将跳过UPX压缩步骤');
    console.log('   可以从 https://upx.github.io/ 下载UPX');
    return false;
  }
}

// 格式化文件大小
function formatFileSize(bytes) {
  return (bytes / 1024 / 1024).toFixed(2) + ' MB';
}

// 获取文件大小
function getFileSize(filePath) {
  if (!existsSync(filePath)) return 0;
  return statSync(filePath).size;
}

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
  
  if (!existsSync(tempServerDir)) {
    mkdirSync(tempServerDir, { recursive: true });
  }
  
  const tempServerDrplayerDir = join(tempServerAppsDir, 'drplayer');
  if (!existsSync(tempServerAppsDir)) {
    mkdirSync(tempServerAppsDir, { recursive: true });
  }
  
  cpSync(distDir, tempServerDrplayerDir, { recursive: true });
  console.log('✅ 已将 dist 内容复制到 apps/drplayer');
  console.log('');

  // 步骤 4: 在 temp-server 目录中打包二进制文件（使用优化选项）
  console.log('⚙️  步骤 4: 使用优化选项打包二进制文件...');
  
  const tempServerNodeModules = join(tempServerDir, 'node_modules');
  if (!existsSync(tempServerNodeModules)) {
    console.log('📦 安装 temp-server 依赖...');
    execSync('pnpm install', { 
      stdio: 'inherit', 
      cwd: tempServerDir 
    });
  }
  
  // 构建优化的pkg命令
  let pkgCommand = 'pkg . --target node18-win-x64 --output dist-binary/drplayer-server-win.exe';
  
  // 添加压缩选项
  if (config.pkg.compress) {
    pkgCommand += ` --compress ${config.pkg.compress}`;
  }
  
  // 添加public packages选项
  if (config.pkg.publicPackages) {
    pkgCommand += ` --public-packages "${config.pkg.publicPackages}"`;
  }
  
  // 添加public选项
  if (config.pkg.public) {
    pkgCommand += ' --public';
  }
  
  // 添加no-bytecode选项（仅在明确启用时）
  if (config.pkg.noBytecode) {
    pkgCommand += ' --no-bytecode';
  }
  
  // 添加Node.js选项
  if (config.pkg.options) {
    pkgCommand += ` --options "${config.pkg.options}"`;
  }
  
  console.log(`🔧 执行命令: ${pkgCommand}`);
  execSync(pkgCommand, { 
    stdio: 'inherit', 
    cwd: tempServerDir 
  });
  console.log('✅ 优化二进制文件打包完成\n');

  // 步骤 5: 移动二进制文件到 dist-binary 目录
  console.log('📦 步骤 5: 移动二进制文件到 dist-binary...');
  
  if (!existsSync(distBinaryDir)) {
    mkdirSync(distBinaryDir, { recursive: true });
  }
  
  const tempDistBinaryDir = join(tempServerDir, 'dist-binary');
  if (existsSync(tempDistBinaryDir)) {
    const files = readdirSync(tempDistBinaryDir);
    for (const file of files) {
      const srcPath = join(tempDistBinaryDir, file);
      const destPath = join(distBinaryDir, file);
      
      if (existsSync(destPath)) {
        rmSync(destPath, { force: true });
      }
      
      cpSync(srcPath, destPath, { recursive: true });
      console.log(`✅ 已移动: ${file}`);
    }
    
    try {
      rmSync(tempDistBinaryDir, { recursive: true, force: true });
    } catch (error) {
      console.log(`⚠️  无法删除临时目录: ${error.message}`);
    }
  }

  // 步骤 6: UPX压缩（如果启用且可用）
  if (config.upx.enabled && checkUpxAvailable()) {
    console.log('\n🗜️  步骤 6: 使用UPX进行额外压缩...');
    
    const files = readdirSync(distBinaryDir).filter(file => file.endsWith('.exe'));
    
    for (const file of files) {
      const filePath = join(distBinaryDir, file);
      const originalSize = getFileSize(filePath);
      
      // 创建备份（如果启用）
      if (config.upx.keepBackup) {
        const backupPath = join(distBinaryDir, file + '.backup');
        cpSync(filePath, backupPath);
        console.log(`📋 已创建备份: ${file}.backup`);
      }
      
      try {
        let upxCommand = `upx -${config.upx.level}`;
        
        // 添加额外的UPX选项以获得更好的压缩率
        if (config.upx.ultraBrute) {
          upxCommand += ' --ultra-brute'; // 尝试所有压缩方法（很慢但压缩率最高）
        }
        
        // 添加兼容性选项
        upxCommand += ' --force'; // 强制压缩
        upxCommand += ` "${filePath}"`;
        
        console.log(`🔧 压缩 ${file}...`);
        execSync(upxCommand, { stdio: 'pipe' });
        
        const compressedSize = getFileSize(filePath);
        const compressionRatio = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);
        
        console.log(`✅ ${file} 压缩完成:`);
        console.log(`   原始大小: ${formatFileSize(originalSize)}`);
        console.log(`   压缩后: ${formatFileSize(compressedSize)}`);
        console.log(`   压缩率: ${compressionRatio}%`);
        
        // 测试压缩后的二进制文件
        if (config.upx.testAfterCompress) {
          console.log(`🧪 测试压缩后的二进制文件...`);
          try {
            // 简单的启动测试 - 运行 --help 命令
            execSync(`"${filePath}" --help`, { timeout: 10000, stdio: 'pipe' });
            console.log(`✅ 压缩后的二进制文件测试通过`);
          } catch (testError) {
            console.log(`⚠️  压缩后的二进制文件测试失败: ${testError.message}`);
            
            if (config.upx.fallbackOnError) {
              console.log(`🔄 回滚到原始文件...`);
              const backupPath = join(distBinaryDir, file + '.backup');
              if (existsSync(backupPath)) {
                cpSync(backupPath, filePath);
                console.log(`✅ 已回滚到原始未压缩文件`);
                console.log(`📝 建议: pkg生成的二进制文件可能与UPX不兼容，使用原始文件`);
              }
            } else {
              throw testError;
            }
          }
        }
        
      } catch (error) {
        console.log(`❌ UPX压缩 ${file} 失败: ${error.message}`);
        
        // 如果压缩失败且有备份，恢复原文件
        if (config.upx.keepBackup) {
          const backupPath = join(distBinaryDir, file + '.backup');
          if (existsSync(backupPath)) {
            cpSync(backupPath, filePath);
            console.log(`🔄 已从备份恢复 ${file}`);
          }
        }
      }
    }
  } else if (config.upx.enabled) {
    console.log('\n⚠️  跳过UPX压缩步骤（UPX不可用）');
  }

  // 步骤 7: 清理临时文件
  console.log('\n🧹 步骤 7: 清理临时文件...');
  
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
        console.log(`⚠️  无法清理目录: ${error.message}`);
      }
    }
  }
  
  // 清理UPX备份文件（可选）
  if (!config.upx.keepBackup) {
    const backupFiles = readdirSync(distBinaryDir).filter(file => file.endsWith('.backup'));
    if (backupFiles.length > 0) {
      console.log('\n🗑️  清理备份文件...');
      for (const backupFile of backupFiles) {
        const backupPath = join(distBinaryDir, backupFile);
        rmSync(backupPath, { force: true });
        console.log(`✅ 已删除备份: ${backupFile}`);
      }
    }
  }
  
  console.log('\n🎉 优化打包流程完成！');
  console.log(`📁 二进制文件位置: ${distBinaryDir}`);
  
  // 显示最终结果
  if (existsSync(distBinaryDir)) {
    const files = readdirSync(distBinaryDir);
    if (files.length > 0) {
      console.log('\n📋 最终生成的文件:');
      let totalSize = 0;
      files.forEach(file => {
        const filePath = join(distBinaryDir, file);
        const stats = statSync(filePath);
        const size = stats.size;
        totalSize += size;
        console.log(`  - ${file} (${formatFileSize(size)})`);
      });
      console.log(`\n📊 总大小: ${formatFileSize(totalSize)}`);
    }
  }

} catch (error) {
  console.error('\n❌ 优化打包过程中出现错误:');
  console.error(error.message);
  process.exit(1);
}