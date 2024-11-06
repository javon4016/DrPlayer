import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        vue(),
    ],
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
})