import { defineStore } from 'pinia';

// SessionStorage键名常量
const STORAGE_KEY = 'drplayer_page_states';

// 从SessionStorage加载状态
const loadFromStorage = () => {
    try {
        const stored = sessionStorage.getItem(STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            console.log('🔄 [存储] 从SessionStorage加载页面状态:', parsed);
            return parsed;
        }
    } catch (error) {
        console.error('从SessionStorage加载页面状态失败:', error);
    }
    
    // 返回默认状态
    return {
        // Video页面状态
        video: {
            activeKey: '',
            currentPage: 1,
            videos: [],
            hasMore: true,
            loading: false,
            scrollPosition: 0,
            lastUpdateTime: null
        },
        // Home页面状态
        home: {
            scrollPosition: 0,
            lastUpdateTime: null
        },
        // 搜索结果状态
        search: {
            keyword: '',
            currentPage: 1,
            videos: [],
            hasMore: true,
            loading: false,
            scrollPosition: 0,
            lastUpdateTime: null
        }
    };
};

// 保存到SessionStorage
const saveToStorage = (pageStates) => {
    try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(pageStates));
        console.log('🔄 [存储] 保存页面状态到SessionStorage:', pageStates);
    } catch (error) {
        console.error('保存页面状态到SessionStorage失败:', error);
    }
};

export const usePageStateStore = defineStore('pageState', {
    state: () => ({
        // 保存各个页面的状态，从SessionStorage初始化
        pageStates: loadFromStorage()
    }),
    
    actions: {
        // 保存页面状态
        savePageState(pageName, state) {
            if (!this.pageStates[pageName]) {
                this.pageStates[pageName] = {};
            }
            
            // 合并状态，保留时间戳
            this.pageStates[pageName] = {
                ...this.pageStates[pageName],
                ...state,
                lastUpdateTime: Date.now()
            };
            
            // 立即保存到SessionStorage
            saveToStorage(this.pageStates);
            
            console.log(`🔄 [状态保存] 页面状态 [${pageName}]:`, this.pageStates[pageName]);
        },
        
        // 获取页面状态
        getPageState(pageName) {
            const state = this.pageStates[pageName];
            console.log(`获取页面状态 [${pageName}]:`, state);
            return state || {};
        },
        
        // 清除页面状态
        clearPageState(pageName) {
            if (this.pageStates[pageName]) {
                this.pageStates[pageName] = {};
                
                // 同步到SessionStorage
                saveToStorage(this.pageStates);
                
                console.log(`🔄 [状态清除] 页面状态 [${pageName}]`);
            }
        },
        
        // 检查状态是否过期（超过30分钟）
        isStateExpired(pageName, maxAge = 30 * 60 * 1000) {
            const state = this.pageStates[pageName];
            if (!state || !state.lastUpdateTime) {
                return true;
            }
            return Date.now() - state.lastUpdateTime > maxAge;
        },
        
        // 保存Video页面特定状态
        saveVideoState(activeKey, currentPage, videos, hasMore, loading, scrollPosition = 0) {
            this.savePageState('video', {
                activeKey,
                currentPage,
                videos: [...videos], // 深拷贝数组
                hasMore,
                loading,
                scrollPosition
            });
        },
        
        // 保存搜索状态
        saveSearchState(keyword, currentPage, videos, hasMore, loading, scrollPosition = 0) {
            this.savePageState('search', {
                keyword,
                currentPage,
                videos: [...videos], // 深拷贝数组
                hasMore,
                loading,
                scrollPosition
            });
        },
        
        // 保存滚动位置
        saveScrollPosition(pageName, position) {
            if (this.pageStates[pageName]) {
                this.pageStates[pageName].scrollPosition = position;
                this.pageStates[pageName].lastUpdateTime = Date.now();
                
                // 同步到SessionStorage
                saveToStorage(this.pageStates);
            }
        },
        
        // 获取滚动位置
        getScrollPosition(pageName) {
            const state = this.pageStates[pageName];
            return state ? state.scrollPosition || 0 : 0;
        },
        
        // 重新从SessionStorage加载状态
        reloadFromStorage() {
            this.pageStates = loadFromStorage();
            console.log('🔄 [存储] 重新加载页面状态:', this.pageStates);
        },
        
        // 清除所有SessionStorage数据
        clearAllStorage() {
            try {
                sessionStorage.removeItem(STORAGE_KEY);
                this.pageStates = loadFromStorage(); // 重置为默认状态
                console.log('🔄 [存储] 清除所有页面状态');
            } catch (error) {
                console.error('清除SessionStorage失败:', error);
            }
        }
    },
    
    getters: {
        // 获取Video页面状态
        videoState: (state) => state.pageStates.video || {},
        
        // 获取搜索状态
        searchState: (state) => state.pageStates.search || {},
        
        // 获取Home页面状态
        homeState: (state) => state.pageStates.home || {}
    }
});