import { defineStore } from 'pinia';

export const usePaginationStore = defineStore('pagination', {
    state: () => ({
        statsText: '', // 翻页统计文本
        isVisible: false, // 是否显示统计信息
        currentRoute: '', // 当前路由，用于判断是否显示
    }),
    actions: {
        // 更新翻页统计信息
        updateStats(text) {
            this.statsText = text;
            this.isVisible = !!text; // 有文本时显示，无文本时隐藏
        },
        // 清除翻页统计信息
        clearStats() {
            this.statsText = '';
            this.isVisible = false;
        },
        // 设置当前路由
        setCurrentRoute(route) {
            this.currentRoute = route;
            // 如果不是点播页面，清除统计信息
            if (route !== '/video') {
                this.clearStats();
            }
        }
    },
    getters: {
        // 是否应该显示统计信息（在点播页面且有统计文本）
        shouldShow: (state) => state.isVisible && state.currentRoute === '/video'
    }
});