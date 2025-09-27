import {defineConfig, loadEnv} from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path';

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
    // 加载环境变量
    const env = loadEnv(mode, process.cwd(), '')
    
    return {
        // 基础路径配置，支持子目录部署
        // 开发环境使用 '/'，生产环境可以通过环境变量设置
        base: mode.startsWith('production') ? (env.VITE_BASE_PATH || './') : '/',
    
    plugins: [
        vue(),
    ],
    
    // 构建配置
    build: {
        // 输出目录
        outDir: 'dist',
        // 静态资源目录
        assetsDir: 'assets',
        // 生成相对路径的资源引用
        rollupOptions: {
            output: {
                // 静态资源文件名格式
                assetFileNames: 'assets/[name]-[hash][extname]',
                chunkFileNames: 'assets/[name]-[hash].js',
                entryFileNames: 'assets/[name]-[hash].js'
            }
        }
    },
    
    optimizeDeps: {
        include: [
            '@arco-design/web-vue/es/icon'
        ]
    },
    
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src'), // 配置别名
        },
    },
    }
})