// 在 Pinia store 中，currentSite 作为状态存储
import {defineStore} from 'pinia'
import {ref, watch} from 'vue'
import siteService from '@/api/services/site'

export const useSiteStore = defineStore('site', () => {
    // 使用 ref 创建响应式状态，优先从 siteService 获取
    const nowSite = ref(siteService.getCurrentSite() || JSON.parse(localStorage.getItem('site-nowSite')) || null)

    // 设置当前源并同步到 siteService
    const setCurrentSite = (site) => {
        nowSite.value = site  // 更新响应式状态
        
        // 同步到两个存储系统
        localStorage.setItem('site-nowSite', JSON.stringify(site))  // 兼容旧系统
        
        // 同步到 siteService（如果传入的是完整站点对象）
        if (site && site.key) {
            siteService.setCurrentSite(site.key)
        }
        
        console.log('站点已切换:', site)
    }

    // 从 siteService 同步站点信息
    const syncFromSiteService = () => {
        const currentSite = siteService.getCurrentSite()
        if (currentSite && (!nowSite.value || currentSite.key !== nowSite.value.key)) {
            nowSite.value = currentSite
            localStorage.setItem('site-nowSite', JSON.stringify(currentSite))
            console.log('从 siteService 同步站点:', currentSite)
        }
    }

    // 监听 siteService 的站点变化事件
    if (typeof window !== 'undefined') {
        window.addEventListener('siteChange', (event) => {
            const { site } = event.detail
            if (site && (!nowSite.value || site.key !== nowSite.value.key)) {
                nowSite.value = site
                localStorage.setItem('site-nowSite', JSON.stringify(site))
                console.log('响应 siteService 站点变化:', site)
            }
        })
    }

    // 初始化时同步一次
    syncFromSiteService()

    return {
        nowSite,
        setCurrentSite,
        syncFromSiteService,
    }
})