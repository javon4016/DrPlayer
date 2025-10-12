<template>
  <div class="search-aggregation">
    <!-- 顶部Header已移至全局Header组件 -->

    <!-- 主要内容区域 -->
    <div class="search-content">
      <!-- 最近搜索记录（仅在搜索前显示，有记录时） -->
      <div v-if="!hasSearched && recentSearches.length > 0" class="recent-search-floating">
        <div class="recent-search-section">
          <div class="section-header">
            <h3 class="section-title">
              <icon-history class="title-icon"/>
              最近搜索记录
            </h3>
            <a-button type="text" size="small" class="refresh-btn" @click="clearRecentSearches">
              <template #icon>
                <icon-delete/>
              </template>
              清空
            </a-button>
          </div>
          <div class="recent-search-tags">
            <a-tag 
                v-for="tag in recentSearches" 
                :key="tag"
                class="recent-tag"
                @click="searchRecentTag(tag)"
            >
              {{ tag }}
            </a-tag>
          </div>
        </div>
      </div>

      <!-- 搜索前的状态：建议+热门 -->
      <div v-if="!hasSearched" class="search-home">
        <!-- 猜你想搜（有输入草稿时显示） -->
        <div v-if="suggestions.length > 0" class="search-suggestions">
          <div class="section-header">
            <h3 class="section-title">
              <icon-bulb class="title-icon"/>
              猜你想搜
            </h3>
          </div>
          <div class="suggestions-tags">
              <a-tag 
                  v-for="suggestion in suggestions" 
                  :key="suggestion"
                  class="suggestion-tag"
                  @click="searchSuggestion(suggestion)"
              >
                {{ suggestion }}
              </a-tag>
          </div>
        </div>



        <!-- 热门搜索 -->
        <div class="hot-search-section">
          <div class="section-header">
            <h3 class="section-title">
              <icon-fire class="title-icon"/>
              热门搜索
            </h3>
            <a-button 
                type="text" 
                size="small" 
                @click="randomizeHotSearchTags"
                class="refresh-btn"
            >
              <template #icon>
                <icon-refresh/>
              </template>
              换一批
            </a-button>
          </div>
          <div class="hot-search-tags">
            <a-tag 
                v-for="tag in hotSearchTags" 
                :key="tag"
                class="hot-tag"
                @click="searchHotTag(tag)"
            >
              {{ tag }}
            </a-tag>
          </div>
        </div>
      </div>

      <!-- 搜索结果页面 -->
      <div v-if="hasSearched" class="search-results">
        <div class="results-layout">
          <!-- 左侧源分组 -->
          <div class="sources-sidebar">
            <div class="sources-header">
              <h4>搜索源</h4>
              <span class="sources-count">({{ searchStats.completed }}/{{ searchStats.total }})</span>
              <span class="sources-result-tag" v-if="searchStats.withData > 0">{{ searchStats.withData }}</span>
              <span class="sources-time-tag" v-if="searchTotalTime > 0">{{ searchTotalTime.toFixed(2) }}s</span>
            </div>
            <div class="sources-list">
              <div 
                  v-for="source in sourcesWithResults" 
                  :key="source.key"
                  class="source-item"
                  :class="{ active: activeSource === source.key }"
                  @click="selectSource(source.key)"
              >
                <div class="source-info">
                  <span class="source-name">{{ source.name }}</span>
                  <span class="source-count" v-if="searchResults[source.key]">
                    ({{ searchResults[source.key].length }})
                  </span>
                </div>
                <div class="source-status">
                  <a-spin v-if="loadingStates[source.key]" :size="14"/>
                  <icon-check-circle 
                      v-else-if="searchResults[source.key]" 
                      class="status-success"
                  />
                  <icon-close-circle 
                      v-else-if="errorStates[source.key]" 
                      class="status-error"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- 右侧搜索结果 -->
          <div class="results-content">
            <div v-if="activeSource && searchResults[activeSource]" class="results-list">
              <div class="results-header">
                <h4>{{ getSourceName(activeSource) }} 搜索结果</h4>
                <span class="results-count">
                  共 {{ searchResults[activeSource].length }} 条结果
                </span>
              </div>
              <SearchVideoGrid
                ref="scrollbarRef"
                :videos="processedDisplayedResults"
                :loading="loadingMore"
                :error="activeSource && errorStates[activeSource] ? `${getSourceName(activeSource)} 搜索失败` : ''"
                :has-more="hasMoreData"
                :scroll-height="`${scrollAreaHeight}px`"
                variant="aggregation"
                default-poster="/default-poster.svg"
                @video-click="handleVideoClick"
                @load-more="handleLoadMore"
                @retry="() => retrySearch(activeSource)"
                @scroll="handleScroll"
              />
            </div>

            
            <!-- 加载状态 -->
            <div v-else-if="activeSource && loadingStates[activeSource]" class="loading-state">
              <a-spin :size="32"/>
              <p>正在搜索 {{ getSourceName(activeSource) }}...</p>
            </div>
            
            <!-- 错误状态 -->
            <div v-else-if="activeSource && errorStates[activeSource]" class="error-state">
              <icon-exclamation-circle class="error-icon"/>
              <p>{{ getSourceName(activeSource) }} 搜索失败</p>
              <a-button @click="retrySearch(activeSource)">重试</a-button>
            </div>
            
            <!-- 空状态 -->
            <div v-else-if="activeSource" class="empty-state">
              <icon-empty class="empty-icon"/>
              <p>{{ getSourceName(activeSource) }} 暂无搜索结果</p>
            </div>
          </div>
          
          <!-- ActionRenderer组件 -->
          <ActionRenderer
            v-if="showActionRenderer"
            :action-data="currentActionData"
            @close="handleActionClose"
          />
        </div>
      </div>
    </div>

    <!-- 搜索设置弹窗 -->
    <SearchSettingsModal 
        v-model:visible="showSearchSettings"
        @confirm="onSearchSettingsConfirm"
    />
  </div>
</template>

<script>
import { defineComponent, ref, computed, onMounted, onUnmounted, onBeforeUnmount, watch, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Message } from '@arco-design/web-vue';
import { 
  IconHistory, 
  IconBulb, 
  IconFire, 
  IconRefresh, 
  IconCheckCircle, 
  IconCloseCircle, 
  IconExclamationCircle, 
  IconEmpty,
  IconDelete 
} from '@arco-design/web-vue/es/icon';
import SearchSettingsModal from '@/components/SearchSettingsModal.vue';
import ActionRenderer from '@/components/actions/ActionRenderer.vue';
import SearchVideoGrid from '@/components/SearchVideoGrid.vue';
import { getFileTypeIcon, isFolder, isDirectoryFile } from '@/utils/fileTypeUtils';
import { usePaginationStore } from '@/stores/paginationStore';
import { usePageStateStore } from '@/stores/pageStateStore';
import { useVisitedStore } from '@/stores/visitedStore';
import siteService from '@/api/services/site';
import videoService from '@/api/services/video';

export default defineComponent({
  name: 'SearchAggregation',
  components: {
    SearchSettingsModal,
    ActionRenderer,
    SearchVideoGrid,
    IconHistory,
    IconBulb,
    IconFire,
    IconRefresh,
    IconCheckCircle,
    IconCloseCircle,
    IconExclamationCircle,
    IconEmpty,
    IconDelete
  },
  setup() {
    const route = useRoute();
    const router = useRouter();
    
    // Stores
    const paginationStore = usePaginationStore();
    const pageStateStore = usePageStateStore();
    const visitedStore = useVisitedStore();
    
    // 搜索相关状态
    const searchKeyword = ref('');
    const hasSearched = ref(false);
    const showSearchSettings = ref(false);
    const recentSearches = ref([]);
    
    // 搜索源和结果
    const searchSources = ref([]);
    const searchResults = ref({});
    const loadingStates = ref({});
    const errorStates = ref({});
    const activeSource = ref('');
    
    // 滚动翻页相关
    const scrollbarRef = ref(null);
    const scrollAreaHeight = ref(600);
    const displayedCount = ref(20); // 当前显示的结果数量
    const pageSize = ref(20); // 每次加载的数量
    const loadingMore = ref(false);
    
    // 分页状态管理
    const currentPages = ref({}); // 每个源的当前页码
    const hasMorePages = ref({}); // 每个源是否还有更多页面
    
    // 搜索完成时间戳记录
    const searchCompletedTimes = ref({}); // 记录每个源完成搜索的时间戳
    
    // 搜索耗时记录
    const searchStartTime = ref(0); // 搜索开始时间戳
    const searchTotalTime = ref(0); // 搜索总耗时（秒）
    
    // ActionRenderer相关
    const showActionRenderer = ref(false);
    const currentActionData = ref(null);
    
    // 所有热门搜索标签
    const allHotSearchTags = [
      '最新电影', '热门电视剧', '经典动漫', '综艺节目', '纪录片',
      '科幻大片', '动作电影', '喜剧片', '爱情剧', '悬疑剧',
      '国产剧', '韩剧', '日剧', '美剧', '港剧',
      '2024新片', '高分电影', '经典老片', '院线大片', '网络电影',
      '武侠片', '古装剧', '现代剧', '都市剧', '农村剧',
      '青春剧', '校园剧', '职场剧', '医疗剧', '律政剧'
    ];
    
    // 当前显示的热门搜索标签
    const hotSearchTags = ref([]);
    
    // 搜索建议
    const suggestions = ref([]);
    
    // 计算属性
    const displayedResults = computed(() => {
      if (!activeSource.value || !searchResults.value[activeSource.value]) {
        return [];
      }
      return searchResults.value[activeSource.value].slice(0, displayedCount.value);
    });

    // 处理后的显示结果，为SearchVideoGrid组件准备数据
    const processedDisplayedResults = computed(() => {
      return displayedResults.value.map(video => ({
        ...video,
        fileType: isFolder(video) ? 'folder' : (isDirectoryFile(video) ? getFileTypeIcon(video.vod_name) : null)
      }));
    });
    
    const hasMoreData = computed(() => {
      if (!activeSource.value) {
        return false;
      }
      // 检查是否还有更多页面可以加载，或者当前显示的数量少于已加载的数据
      const hasMoreFromServer = hasMorePages.value[activeSource.value] || false;
      const hasMoreFromLocal = searchResults.value[activeSource.value] && 
        displayedCount.value < searchResults.value[activeSource.value].length;
      return hasMoreFromServer || hasMoreFromLocal;
    });
    
    // 过滤有结果的搜索源，并按搜索完成时间排序
    const sourcesWithResults = computed(() => {
      const sourcesWithData = searchSources.value.filter(source => {
        const results = searchResults.value[source.key];
        // 严格只显示有结果的源
        return results && results.length > 0;
      });
      
      // 按搜索完成时间排序，先完成的排在前面
      const sortedSources = sourcesWithData.sort((a, b) => {
        const timeA = searchCompletedTimes.value[a.key] || 0;
        const timeB = searchCompletedTimes.value[b.key] || 0;
        return timeA - timeB; // 升序排列，时间戳小的（先完成的）排在前面
      });
      
      console.log('搜索源排序结果:', sortedSources.map(s => ({
        name: s.name,
        key: s.key,
        completedTime: searchCompletedTimes.value[s.key]
      })));
      
      return sortedSources;
    });
    
    // 搜索统计计算属性
    const searchStats = computed(() => {
      const totalSources = searchSources.value.length;
      let completedSources = 0;
      let sourcesWithData = 0;
      let sourcesWithoutData = 0;
      
      // 计算已完成搜索的源数量（包括成功和失败的）
      searchSources.value.forEach(source => {
        const isLoading = loadingStates.value[source.key];
        const hasResults = searchResults.value[source.key] !== undefined;
        const hasError = errorStates.value[source.key] !== undefined;
        const resultCount = searchResults.value[source.key]?.length || 0;
        
        // 如果不在加载中，且有结果或有错误，则认为已完成
        if (!isLoading && (hasResults || hasError)) {
          completedSources++;
          
          // 区分有数据和无数据的源
          if (resultCount > 0) {
            sourcesWithData++;
          } else {
            sourcesWithoutData++;
          }
        }
      });
      
      return {
        completed: completedSources,
        total: totalSources,
        withData: sourcesWithData,
        withoutData: sourcesWithoutData
      };
    });
    
    // 方法
    const loadSearchSources = () => {
      try {
        const allSites = siteService.getAllSites();
        
        // 获取用户配置的搜索源
        const searchSettings = getSearchSettings();
        
        // 过滤出可搜索的源
        const availableSources = allSites.filter(site => 
          site.searchable && site.searchable !== 0
        );
        
        // 根据用户设置过滤
        searchSources.value = availableSources.filter(site => 
          searchSettings.selectedSources.includes(site.key)
        );
        
        // 如果没有配置，默认选择所有可搜索的源
        if (searchSources.value.length === 0) {
          searchSources.value = availableSources;
        }
        
      } catch (error) {
        console.error('加载搜索源失败:', error);
        Message.error('加载搜索源失败');
      }
    };
    
    const getSearchSettings = () => {
      try {
        const settings = localStorage.getItem('searchAggregationSettings');
        if (settings) {
          const parsed = JSON.parse(settings);
          // 验证设置格式
          if (parsed && Array.isArray(parsed.selectedSources)) {
            console.log('已加载搜索设置:', parsed);
            return parsed;
          } else {
            console.warn('搜索设置格式无效，使用默认配置');
          }
        } else {
          console.log('未找到搜索设置，使用默认配置');
        }
      } catch (error) {
        console.error('获取搜索设置失败:', error);
      }
      return { selectedSources: [] };
    };
    
    const performSearch = async (keyword) => {
      console.log('🔍 [performSearch] 方法被调用:', { 
        keyword, 
        currentKeyword: searchKeyword.value,
        hasSearched: hasSearched.value,
        currentResults: Object.keys(searchResults.value).length
      });
      
      if (!keyword || !keyword.trim()) {
        Message.warning('请输入搜索关键词');
        return;
      }
      
      const trimmedKeyword = keyword.trim();
      console.log('🔍 [performSearch] 开始执行搜索:', { trimmedKeyword });
      
      // 记录搜索开始时间
      searchStartTime.value = Date.now();
      
      searchKeyword.value = trimmedKeyword;
      hasSearched.value = true;
      
      // 重置状态
      console.log('🔍 [performSearch] 重置搜索状态...');
      searchResults.value = {};
      loadingStates.value = {};
      errorStates.value = {};
      currentPages.value = {};
      hasMorePages.value = {};
      searchCompletedTimes.value = {}; // 清空搜索完成时间戳
      searchTotalTime.value = 0; // 重置搜索总耗时
      displayedCount.value = pageSize.value;
      
      console.log('🔍 [performSearch] 状态重置完成:', {
        searchResults: Object.keys(searchResults.value).length,
        loadingStates: Object.keys(loadingStates.value).length,
        hasSearched: hasSearched.value
      });
      
      // 重置活跃源，让自动激活逻辑来处理
      activeSource.value = '';
      
      // 并行搜索所有源
      const searchPromises = searchSources.value.map(source => 
        searchSource(source, keyword.trim())
      );
      
      await Promise.allSettled(searchPromises);
      
      // 计算搜索总耗时
      const searchEndTime = Date.now();
      searchTotalTime.value = (searchEndTime - searchStartTime.value) / 1000; // 转换为秒
      console.log('🔍 [performSearch] 搜索完成，总耗时:', searchTotalTime.value.toFixed(2) + 's');
      
      // 记录最近搜索
      try {
        const HISTORY_KEY = 'drplayer_search_history';
        const stored = localStorage.getItem(HISTORY_KEY);
        let history = [];
        try { history = stored ? JSON.parse(stored) : []; } catch { history = []; }
        const k = searchKeyword.value;
        // 过滤空字符串和无效值
        if (k && k.trim()) {
          const idx = history.findIndex(item => item === k);
          if (idx !== -1) history.splice(idx, 1);
          history.unshift(k);
          // 过滤历史记录中的空字符串
          history = history.filter(item => item && item.trim());
          if (history.length > 10) history = history.slice(0, 10);
          localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
          // console.log('保存搜索历史记录:',history);
          // 直接更新最近搜索记录
          recentSearches.value = [...history];
        }
      } catch (e) {
        console.error('保存搜索历史失败:', e);
      }
    };
    
    const searchSource = async (source, keyword, page = 1) => {
      loadingStates.value[source.key] = true;
      
      try {
        const searchData = await videoService.searchVideo(source.key, {
          keyword: keyword,
          page: page,
          extend: source.ext,
          apiUrl: source.api
        });
        
        const newVideos = searchData.videos || [];
        
        if (page === 1) {
          // 第一页，直接设置结果
          searchResults.value[source.key] = newVideos;
          currentPages.value[source.key] = 1;
        } else {
          // 后续页面，追加到现有结果
          if (!searchResults.value[source.key]) {
            searchResults.value[source.key] = [];
          }
          
          // 过滤重复数据
          const existingIds = new Set(searchResults.value[source.key].map(v => v.vod_id));
          const uniqueNewVideos = newVideos.filter(video => 
            !existingIds.has(video.vod_id) && 
            video.vod_id !== 'no_data' && 
            video.vod_name !== 'no_data'
          );
          
          searchResults.value[source.key] = [...searchResults.value[source.key], ...uniqueNewVideos];
          currentPages.value[source.key] = page;
        }
        
        // 更新分页状态
        hasMorePages.value[source.key] = searchData.pagination?.hasNext !== false;
        
        // 记录搜索完成时间戳（仅在第一页时记录）
        if (page === 1) {
          searchCompletedTimes.value[source.key] = Date.now();
          console.log(`搜索源 ${source.name} 完成搜索，时间戳: ${searchCompletedTimes.value[source.key]}`);
          
          // 搜索完成后实时保存状态
          debouncedSavePageState();
          console.log('🔄 [状态保存] 搜索完成，触发状态保存:', source.name);
        }
        
        delete errorStates.value[source.key];
      } catch (error) {
        console.error(`搜索源 ${source.name} 失败:`, error);
        errorStates.value[source.key] = error.message || '搜索失败';
        if (page === 1) {
          searchResults.value[source.key] = [];
          currentPages.value[source.key] = 1;
          hasMorePages.value[source.key] = false;
        }
      } finally {
        loadingStates.value[source.key] = false;
      }
    };
    
    const selectSource = (sourceKey) => {
      activeSource.value = sourceKey;
      displayedCount.value = pageSize.value; // 重置显示数量
      updateScrollAreaHeight();
      updateGlobalStats();
      
      // 切换搜索源后实时保存状态
      debouncedSavePageState();
      console.log('🔄 [状态保存] 切换搜索源，触发状态保存:', sourceKey);
    };
    
    // 滚动位置保存的防抖定时器
    let scrollSaveTimer = null;
    
    // 滚动事件处理
    const handleScroll = (e) => {
      // 使用SearchVideoGrid组件的方法获取滚动位置
      if (scrollbarRef.value?.getScrollTop && scrollbarRef.value?.getScrollContainer) {
        const scrollTop = scrollbarRef.value.getScrollTop();
        const container = scrollbarRef.value.getScrollContainer();
        
        if (!container) return;
        
        const scrollHeight = container.scrollHeight - container.clientHeight;
        
        // 实时更新滚动位置
        scrollPosition.value = scrollTop;
        
        // 防抖保存滚动位置（使用更长的延迟避免过于频繁）
        if (scrollSaveTimer) {
          clearTimeout(scrollSaveTimer);
        }
        scrollSaveTimer = setTimeout(() => {
          if (hasSearched.value && searchKeyword.value) {
            debouncedSavePageState();
            console.log('🔄 [状态保存] 滚动位置变化，触发状态保存:', scrollTop);
          }
        }, 1000); // 1秒防抖延迟，避免滚动时过于频繁保存
        
        // 当滚动到距离底部50px以内时触发加载
        if (scrollHeight - scrollTop < 50 && hasMoreData.value && !loadingMore.value) {
          loadMore();
        }
      }
    };
    
    // 加载更多数据
    const loadMore = async () => {
      if (!hasMoreData.value || loadingMore.value || !activeSource.value) return;
      
      loadingMore.value = true;
      
      try {
        // 检查是否需要从服务器加载更多数据
        const currentResults = searchResults.value[activeSource.value] || [];
        const needMoreFromServer = hasMorePages.value[activeSource.value] && 
          displayedCount.value >= currentResults.length;
        
        if (needMoreFromServer) {
          // 从服务器加载下一页
          const currentPage = currentPages.value[activeSource.value] || 1;
          const nextPage = currentPage + 1;
          
          const activeSourceObj = searchSources.value.find(s => s.key === activeSource.value);
          if (activeSourceObj && searchKeyword.value) {
            await searchSource(activeSourceObj, searchKeyword.value, nextPage);
          }
        }
        
        // 增加显示数量
        displayedCount.value += pageSize.value;
        updateGlobalStats();
        
        // 加载更多后实时保存状态
        debouncedSavePageState();
        console.log('🔄 [状态保存] 加载更多数据，触发状态保存');
      } catch (error) {
        console.error('加载更多数据失败:', error);
        Message.error('加载更多数据失败');
      } finally {
        loadingMore.value = false;
      }
    };

    // 处理SearchVideoGrid组件的load-more事件
    const handleLoadMore = () => {
      loadMore();
    };
    
    // 动态计算滚动区域高度
    const updateScrollAreaHeight = () => {
      // 计算可用高度：总高度减去头部和其他固定元素
      const availableHeight = window.innerHeight - 112; // 减去导航栏等固定高度
      scrollAreaHeight.value = Math.max(availableHeight - 120, 400); // 减去results-header等，最小400px
    };
    
    // 新的视频点击处理方法，支持action类型
    const handleVideoClick = (video) => {
      if (video && video.vod_id) {
        // 检查是否为action类型
        if (video.vod_tag === 'action') {
          try {
            // 尝试解析vod_id中的JSON字符串获取action配置
            const actionConfig = JSON.parse(video.vod_id);
            console.log('SearchAggregation解析action配置:', actionConfig);
            
            // 传递解析后的action配置给ActionRenderer
            currentActionData.value = actionConfig;
            showActionRenderer.value = true;
            return;
          } catch (error) {
            console.log('SearchAggregation vod_id不是JSON格式，作为普通文本处理:', video.vod_id);
            
            // 如果解析失败，说明vod_id是普通文本，显示Toast提示
            Message.info({
              content: video.vod_id,
              duration: 3000,
              closable: true
            });
            return;
          }
        }
        
        // 记录最后点击的视频
        visitedStore.setLastClicked(video.vod_id, video.name);
        
        // 获取当前源信息
        const currentSource = searchSources.value.find(s => s.key === activeSource.value);
        
        console.log('🎬 [搜索聚合] 点击视频跳转详情页:', {
          videoName: video.name,
          videoId: video.vod_id,
          activeSource: activeSource.value,
          currentSource: currentSource,
          sourceInfo: {
            key: currentSource?.key,
            name: currentSource?.name,
            api: currentSource?.api,
            ext: currentSource?.ext
          }
        });
        
        // 跳转到视频详情页面
        if (currentSource) {
          router.push({
            name: 'VideoDetail',
            params: { id: video.vod_id },
            query: {
              name: video.name,
              pic: video.pic,
              year: video.year,
              area: video.area,
              type: video.type,
              remarks: video.note,
              content: video.content,
              actor: video.actor,
              director: video.director,
              tempSiteKey: currentSource.key,
              tempSiteApi: currentSource.api,
              tempSiteName: currentSource.name,
              tempSiteExt: currentSource.ext,
              fromSpecialAction: 'true',
              from: 'search-aggregation',
              // 添加来源页面信息，用于返回时恢复状态
              sourceRouteName: 'SearchAggregation',
              sourceRouteParams: JSON.stringify({}),
              sourceRouteQuery: JSON.stringify({
                keyword: searchKeyword.value
              }),
              // 添加来源图片信息，用于详情页图片备用
              sourcePic: video.pic
            }
          });
        }
       }
     };
     
     // 更新全局统计信息
     const updateGlobalStats = () => {
       console.log('[updateGlobalStats] 更新全局统计信息');
       if (!activeSource.value || !searchResults.value[activeSource.value]) {
         paginationStore.updateStats('');
         return;
       }
       
       const totalResults = searchResults.value[activeSource.value].length;
       const displayedResults = Math.min(displayedCount.value, totalResults);
       const sourceName = getSourceName(activeSource.value);
       
       // 计算当前页数和总页数
       const currentPage = Math.ceil(displayedResults / pageSize.value) || 1;
       const totalPages = Math.ceil(totalResults / pageSize.value) || 1;
       
       let statsText = `搜索"${searchKeyword.value}"：${sourceName} - 已显示${displayedResults}条，共${totalResults}条`;
       
       // 添加页数信息
       if (totalResults > 0) {
         statsText += ` (第${currentPage}页/共${totalPages}页)`;
       }
       
       // 检查是否还有更多数据可以加载
       const hasMore = hasMoreData.value;
       if (hasMore) {
         statsText += '，可继续加载';
       } else if (totalResults > 0) {
         statsText += '，已全部加载';
       }
       console.log('[updateGlobalStats] <statsText>:', statsText);
       paginationStore.updateStats(statsText);
     };
     
     // ActionRenderer相关方法
     const handleActionClose = () => {
       showActionRenderer.value = false;
       currentActionData.value = null;
     };
    
    const getSourceName = (sourceKey) => {
      const source = searchSources.value.find(s => s.key === sourceKey);
      return source ? source.name : sourceKey;
    };
    
    const retrySearch = (sourceKey) => {
      const source = searchSources.value.find(s => s.key === sourceKey);
      if (source && searchKeyword.value) {
        searchSource(source, searchKeyword.value);
      }
    };
    
    const onSearchInput = (value) => {
      if (value && value.trim()) {
        // 生成搜索建议
        generateSuggestions(value.trim());
      } else {
        suggestions.value = [];
      }
    };
    
    const generateSuggestions = (keyword) => {
      if (!keyword || keyword.length < 1) {
        suggestions.value = [];
        return;
      }
      
      // 基础建议模板
      const suggestionTemplates = [
        `${keyword} 电影`,
        `${keyword} 电视剧`,
        `${keyword} 动漫`,
        `${keyword} 纪录片`,
        `${keyword} 综艺`,
        `最新 ${keyword}`,
        `${keyword} 高清`,
        `${keyword} 完整版`,
        `${keyword} 免费观看`,
        `${keyword} 在线播放`
      ];
      
      // 热门关键词联想
      const popularKeywords = [
        '2024', '最新', '高清', '免费', '完整版', '在线',
        '国产', '日本', '韩国', '美国', '欧美', '港台',
        '爱情', '动作', '喜剧', '科幻', '悬疑', '恐怖', '战争', '历史'
      ];
      
      // 根据关键词长度和内容生成不同的建议
      let suggestions_list = [];
      
      if (keyword.length === 1) {
        // 单字符时提供更多类型建议
        suggestions_list = [
          `${keyword}开头的电影`,
          `${keyword}字电视剧`,
          `${keyword}相关动漫`,
          `${keyword}类纪录片`
        ];
      } else if (keyword.length <= 3) {
        // 短关键词时提供基础建议
        suggestions_list = suggestionTemplates.slice(0, 6);
      } else {
        // 长关键词时提供更精确的建议
        suggestions_list = suggestionTemplates.slice(0, 4);
        
        // 添加一些智能联想
        popularKeywords.forEach(popular => {
          if (keyword.toLowerCase().includes(popular.toLowerCase()) === false) {
            suggestions_list.push(`${keyword} ${popular}`);
          }
        });
      }
      
      // 去重并限制数量
      suggestions.value = [...new Set(suggestions_list)].slice(0, 8);
    };
    
    const searchHotTag = (tag) => {
      router.push({
        name: 'SearchAggregation',
        query: { keyword: tag }
      });
    };
    
    const searchSuggestion = (suggestion) => {
      router.push({
        name: 'SearchAggregation',
        query: { keyword: suggestion }
      });
    };
    
    const searchRecentTag = (tag) => {
      router.push({
        name: 'SearchAggregation',
        query: { keyword: tag }
      });
    };
    
    const onSearchSettingsConfirm = (settings) => {
      // 保存搜索设置
      localStorage.setItem('searchAggregationSettings', JSON.stringify(settings));
      // 重新加载搜索源
      loadSearchSources();
      Message.success('搜索设置已保存');
    };
    
    const playVideo = (video) => {
      // 跳转到视频详情页面
      const currentSource = searchSources.value.find(s => s.key === activeSource.value);
      if (currentSource && video.vod_id) {
        router.push({
          name: 'VideoDetail',
          params: { id: video.vod_id },
          query: {
            site: currentSource.key,
            api: currentSource.api,
            ext: currentSource.ext,
            from: 'search'
          }
        });
      } else {
        Message.warning('无法播放该视频');
      }
    };
    
    const handleImageError = (event) => {
      event.target.style.display = 'none';
    };
    

    
    // 随机化热门搜索标签
    const randomizeHotSearchTags = () => {
      const shuffled = [...allHotSearchTags].sort(() => 0.5 - Math.random());
      hotSearchTags.value = shuffled.slice(0, 12); // 显示12个标签
    };
    
    // 最近搜索读取与清空
    const loadRecentSearches = () => {
      try {
        const HISTORY_KEY = 'drplayer_search_history';
        const stored = localStorage.getItem(HISTORY_KEY);
        let history = stored ? JSON.parse(stored) : [];
        if (!Array.isArray(history)) history = [];
        // 过滤空字符串和无效值
        recentSearches.value = history.filter(item => item && item.trim());
        // 如果过滤后的数据与原数据不同，更新localStorage
        if (recentSearches.value.length !== history.length) {
          localStorage.setItem(HISTORY_KEY, JSON.stringify(recentSearches.value));
        }
      } catch {
        recentSearches.value = [];
      }
    };
    const clearRecentSearches = () => {
      localStorage.removeItem('drplayer_search_history');
      recentSearches.value = [];
      Message.success('已清空最近搜索记录');
    };
    
    // 监听路由参数 - 监听整个query对象以确保时间戳参数变化时也能触发
    watch(() => route.query, (newQuery, oldQuery) => {
      const keyword = newQuery.keyword;
      const oldKeyword = oldQuery?.keyword;
      const isReturnFromDetail = newQuery._returnFromDetail === 'true';
      const newTimestamp = newQuery._t;
      const oldTimestamp = oldQuery?._t;
      
      // 检查是否只是时间戳参数变化（用于强制重新搜索）
      const isTimestampOnlyChange = keyword === oldKeyword && newTimestamp !== oldTimestamp;
      
      console.log('🔄 [路由监听] query变化:', { 
        newQuery, 
        oldQuery, 
        keyword, 
        oldKeyword, 
        currentKeyword: searchKeyword.value,
        isReturnFromDetail,
        isTimestampOnlyChange,
        newTimestamp,
        oldTimestamp
      });
      console.log('🔄 [路由监听] keyword类型:', typeof keyword, '值:', keyword);
      console.log('🔄 [路由监听] 条件判断 keyword存在:', !!keyword);
      
      if (keyword) {
        if (isReturnFromDetail) {
          // 从详情页返回时，不立即执行搜索，让状态恢复逻辑处理
          console.log('🔄 [路由监听] 从详情页返回，跳过路由监听器的搜索，等待状态恢复逻辑处理');
          searchKeyword.value = keyword; // 只更新关键词，不执行搜索
        } else if (isTimestampOnlyChange || keyword !== searchKeyword.value) {
          // 时间戳变化（强制重新搜索）或关键词变化时才执行搜索
          console.log('🔄 [路由监听] 准备执行搜索:', keyword, isTimestampOnlyChange ? '(时间戳强制)' : '(关键词变化)');
          searchKeyword.value = keyword;
          console.log('🔄 [路由监听] 即将调用performSearch');
          performSearch(keyword);
          console.log('🔄 [路由监听] performSearch调用完成');
        } else {
          // 关键词相同且不是时间戳强制更新，跳过搜索
          console.log('🔄 [路由监听] 关键词相同且无时间戳强制更新，跳过搜索');
        }
      } else {
        // 当没有keyword参数时，重置搜索状态
        console.log('🔄 [路由监听] 清空搜索状态');
        hasSearched.value = false;
        searchKeyword.value = '';
        searchResults.value = {};
        activeSource.value = '';
        displayedCount.value = pageSize.value;
      }
    }, { immediate: true, deep: true });
    // 监听输入草稿用于生成建议
    watch(() => route.query.keywordDraft, (draft) => {
      const val = typeof draft === 'string' ? draft : '';
      // 只有在没有进行搜索时才更新searchKeyword.value，避免在搜索过程中被重置
      if (!hasSearched.value) {
        searchKeyword.value = val;
      }
      onSearchInput(val);
    });
    
    // 监听activeSource变化，更新统计
    watch(activeSource, () => {
      updateGlobalStats();
    });

    // 监听有结果的源列表变化，自动激活第一个有结果的源
    watch(sourcesWithResults, (newSourcesWithResults) => {
      console.log('sourcesWithResults 变化:', newSourcesWithResults.map(s => s.name));
      console.log('当前 activeSource:', activeSource.value);
      
      // 如果有结果的源列表不为空，且当前没有活跃源或当前活跃源没有结果
      if (newSourcesWithResults.length > 0) {
        const currentActiveHasResults = activeSource.value && 
          searchResults.value[activeSource.value] && 
          searchResults.value[activeSource.value].length > 0;
        
        console.log('当前活跃源是否有结果:', currentActiveHasResults);
        
        // 如果当前没有活跃源，或当前活跃源没有结果，则激活第一个有结果的源
        if (!activeSource.value || activeSource.value === '' || !currentActiveHasResults) {
          const firstSourceWithResults = newSourcesWithResults[0];
          activeSource.value = firstSourceWithResults.key;
          console.log(`自动激活第一个有结果的搜索源: ${firstSourceWithResults.name} (${firstSourceWithResults.key})`);
          console.log('激活后的 activeSource:', activeSource.value);
        }
      }
    });
    
    // 滚动位置状态
    const scrollPosition = ref(0);
    
    // 保存滚动位置
    const saveScrollPosition = () => {
      if (scrollbarRef.value?.getScrollTop) {
        scrollPosition.value = scrollbarRef.value.getScrollTop();
        console.log('🔄 [滚动位置] 保存滚动位置:', scrollPosition.value);
      }
    };
    
    // 恢复滚动位置
    const restoreScrollPosition = (retryCount = 0) => {
      if (scrollPosition.value > 0) {
        const maxRetries = 5;
        const delay = Math.min(100 * Math.pow(2, retryCount), 1000); // 指数退避，最大1秒
        
        const attemptRestore = () => {
          if (scrollbarRef.value?.scrollTo && scrollbarRef.value?.getScrollContainer) {
            const scrollContainer = scrollbarRef.value.getScrollContainer();
            if (scrollContainer) {
              // 检查容器是否有内容
              const hasContent = scrollContainer.scrollHeight > scrollContainer.clientHeight;
              if (hasContent) {
                scrollbarRef.value.scrollTo({ top: scrollPosition.value });
                console.log('🔄 [滚动位置] 恢复滚动位置:', scrollPosition.value);
                return true;
              } else if (retryCount < maxRetries) {
                console.log(`🔄 [滚动位置] 容器内容未完全加载，${delay}ms后重试 (${retryCount + 1}/${maxRetries})`);
                setTimeout(() => restoreScrollPosition(retryCount + 1), delay);
                return false;
              }
            } else if (retryCount < maxRetries) {
              console.log(`🔄 [滚动位置] 滚动容器未找到，${delay}ms后重试 (${retryCount + 1}/${maxRetries})`);
              setTimeout(() => restoreScrollPosition(retryCount + 1), delay);
              return false;
            }
          } else if (retryCount < maxRetries) {
            console.log(`🔄 [滚动位置] SearchVideoGrid组件方法未就绪，${delay}ms后重试 (${retryCount + 1}/${maxRetries})`);
            setTimeout(() => restoreScrollPosition(retryCount + 1), delay);
            return false;
          }
          
          if (retryCount >= maxRetries) {
            console.warn('🔄 [滚动位置] 达到最大重试次数，滚动位置恢复失败');
          }
          return false;
        };
        
        if (retryCount === 0) {
          // 首次尝试使用nextTick
          nextTick(() => {
            if (!attemptRestore()) {
              // 如果首次失败，开始重试机制
              setTimeout(() => restoreScrollPosition(1), 100);
            }
          });
        } else {
          attemptRestore();
        }
      }
    };

    // 防抖保存状态的定时器
    let saveStateTimer = null;
    
    // 状态保存和恢复
    const savePageState = () => {
      if (hasSearched.value && searchKeyword.value) {
        // 保存当前滚动位置
        saveScrollPosition();
        
        const state = {
          searchKeyword: searchKeyword.value,
          hasSearched: hasSearched.value,
          searchResults: searchResults.value,
          loadingStates: loadingStates.value,
          errorStates: errorStates.value,
          activeSource: activeSource.value,
          currentPages: currentPages.value,
          hasMorePages: hasMorePages.value,
          searchCompletedTimes: searchCompletedTimes.value,
          displayedCount: displayedCount.value,
          scrollPosition: scrollPosition.value,
          scrollAreaHeight: scrollAreaHeight.value,
          loadingMore: loadingMore.value,
          timestamp: Date.now() // 添加时间戳用于判断状态新鲜度
        };
        pageStateStore.savePageState('searchAggregation', state);
        console.log('🔄 [状态保存] 保存聚合搜索页面状态:', state);
      }
    };
    
    // 防抖保存状态，避免过于频繁的保存操作
    const debouncedSavePageState = () => {
      if (saveStateTimer) {
        clearTimeout(saveStateTimer);
      }
      saveStateTimer = setTimeout(() => {
        savePageState();
      }, 500); // 500ms防抖延迟
    };

    // 清除页面状态
    const clearPageState = () => {
      pageStateStore.clearPageState('searchAggregation');
      console.log('🔄 [状态清理] 已清除聚合搜索页面状态');
      
      // 重置所有状态到初始值
      searchKeyword.value = '';
      hasSearched.value = false;
      searchResults.value = {};
      loadingStates.value = {};
      errorStates.value = {};
      activeSource.value = '';
      currentPages.value = {};
      hasMorePages.value = {};
      searchCompletedTimes.value = {};
      displayedCount.value = pageSize.value;
      scrollPosition.value = 0;
      loadingMore.value = false;
    };

    const restorePageState = () => {
      const savedState = pageStateStore.getPageState('searchAggregation');
      if (savedState && !pageStateStore.isStateExpired('searchAggregation')) {
        console.log('🔄 [状态恢复] 恢复聚合搜索页面状态:', savedState);
        
        searchKeyword.value = savedState.searchKeyword || '';
        hasSearched.value = savedState.hasSearched || false;
        searchResults.value = savedState.searchResults || {};
        loadingStates.value = savedState.loadingStates || {};
        errorStates.value = savedState.errorStates || {};
        activeSource.value = savedState.activeSource || '';
        currentPages.value = savedState.currentPages || {};
        hasMorePages.value = savedState.hasMorePages || {};
        searchCompletedTimes.value = savedState.searchCompletedTimes || {};
        displayedCount.value = savedState.displayedCount || 20;
        loadingMore.value = savedState.loadingMore || false;
        
        // 恢复滚动位置和区域高度
        scrollPosition.value = savedState.scrollPosition || 0;
        if (savedState.scrollAreaHeight) {
          scrollAreaHeight.value = savedState.scrollAreaHeight;
        }
        
        // 更新全局统计信息
        updateGlobalStats();
        
        // 延迟恢复滚动位置，确保DOM已渲染
        if (scrollPosition.value > 0) {
          console.log('🔄 [滚动位置] 准备恢复滚动位置:', scrollPosition.value);
          // 使用更长的延迟确保搜索结果完全渲染，特别是从详情页返回时
          nextTick(() => {
            setTimeout(() => {
              restoreScrollPosition();
            }, 300); // 增加延迟时间
          });
        }
        
        return true;
      }
      return false;
    };

    // 监听搜索设置变更事件，当搜索设置改变时重新加载搜索源
    const handleSearchSettingsChange = (event) => {
      console.log('检测到搜索设置变更，重新加载搜索源...', event.detail);
      loadSearchSources();
    };

    // 组件挂载时初始化
    onMounted(() => {
      loadSearchSources();
      randomizeHotSearchTags();
      loadRecentSearches();
      updateScrollAreaHeight();
      
      // 监听窗口大小变化
      window.addEventListener('resize', updateScrollAreaHeight);
      
      // 监听搜索设置变更事件
      window.addEventListener('searchSettingsChanged', handleSearchSettingsChange);
      
      // 显示当前配置状态
      const settings = getSearchSettings();
      if (settings.selectedSources.length > 0) {
        console.log(`已恢复搜索源配置，共 ${settings.selectedSources.length} 个源`);
      }
      
      // 检查是否从详情页返回
      const isReturnFromDetail = route.query._returnFromDetail === 'true';
      console.log('🔄 [状态恢复] 是否从详情页返回:', isReturnFromDetail);
      
      // 检查URL中是否有关键词参数
      const urlKeyword = route.query.keyword;
      console.log('🔄 [状态恢复] URL关键词参数:', urlKeyword);
      console.log('🔄 [状态恢复] 当前搜索关键词:', searchKeyword.value);
      console.log('🔄 [状态恢复] 当前搜索结果:', Object.keys(searchResults.value).length > 0 ? '有结果' : '无结果');
      
      // 尝试恢复页面状态
      const restored = restorePageState();
      if (restored) {
        console.log('🔄 [状态恢复] 成功恢复聚合搜索页面状态');
        
        // 检查恢复的状态是否与URL参数匹配
        const stateKeyword = searchKeyword.value;
        
        if (isReturnFromDetail) {
          // 如果是从详情页返回，优先使用恢复的状态，不执行新搜索
          console.log('🔄 [状态恢复] 从详情页返回，使用恢复的状态，不执行新搜索');
          
          // 从详情页返回时，需要额外确保滚动位置恢复
          if (scrollPosition.value > 0) {
            console.log('🔄 [滚动位置] 从详情页返回，额外确保滚动位置恢复:', scrollPosition.value);
            // 使用更长的延迟，确保页面完全渲染
            setTimeout(() => {
              restoreScrollPosition();
            }, 500);
          }
        } else if (urlKeyword && urlKeyword === stateKeyword) {
          // URL关键词与恢复状态匹配，使用恢复的状态
          console.log('🔄 [状态恢复] URL关键词与恢复状态匹配，使用恢复的状态');
          console.log('🔄 [状态恢复] 恢复的搜索结果数量:', Object.keys(searchResults.value).length);
        } else if (urlKeyword && urlKeyword !== stateKeyword) {
          // URL关键词与恢复状态不匹配，执行新搜索
          console.log('🔄 [状态恢复] URL关键词与恢复状态不匹配，执行新搜索:', urlKeyword);
          performSearch(urlKeyword);
        } else if (!urlKeyword && stateKeyword) {
          // URL中没有关键词但有恢复状态，说明用户可能点击了关闭按钮，清除状态
          console.log('🔄 [状态恢复] URL中没有关键词但有恢复状态，清除状态回到初始页面');
          clearPageState();
        }
      } else if (urlKeyword) {
        // 如果没有恢复状态但URL中有关键词，则执行搜索
        console.log('🔄 [状态恢复] 没有保存状态，根据URL关键词执行搜索:', urlKeyword);
        performSearch(urlKeyword);
      }
      
      // 清理URL中的返回标识
      if (isReturnFromDetail) {
        const newQuery = { ...route.query };
        delete newQuery._returnFromDetail;
        router.replace({ query: newQuery });
      }
    });
    
    onBeforeUnmount(() => {
      // 页面离开前保存状态
      savePageState();
      
      // 清理事件监听器
      window.removeEventListener('resize', updateScrollAreaHeight);
      window.removeEventListener('searchSettingsChanged', handleSearchSettingsChange);
      
      // 清理定时器
      if (saveStateTimer) {
        clearTimeout(saveStateTimer);
        saveStateTimer = null;
      }
      if (scrollSaveTimer) {
        clearTimeout(scrollSaveTimer);
        scrollSaveTimer = null;
      }
    });

    onUnmounted(() => {
      window.removeEventListener('resize', updateScrollAreaHeight);
    });
    
    return {
      searchKeyword,
      hasSearched,
      showSearchSettings,
      searchSources,
      sourcesWithResults,
      searchResults,
      loadingStates,
      errorStates,
      activeSource,
      displayedResults,
      processedDisplayedResults,
      hasMoreData,
      loadingMore,
      scrollbarRef,
      scrollAreaHeight,
      hotSearchTags,
      suggestions,
      showActionRenderer,
      currentActionData,
      searchStats,
      searchTotalTime,
      performSearch,
      selectSource,
      getSourceName,
      retrySearch,
      onSearchInput,
      searchHotTag,
      searchSuggestion,
      searchRecentTag,
      onSearchSettingsConfirm,
      handleVideoClick,
      handleImageError,
      handleScroll,
      handleLoadMore,
      handleActionClose,
      randomizeHotSearchTags,
      clearPageState,
      // 最近搜索
      recentSearches,
      clearRecentSearches,
      // 工具函数
      getFileTypeIcon,
      isFolder,
      isDirectoryFile
    };
  }
});
</script>

<style scoped>
.search-aggregation {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--color-bg-1);
}

/* 头部样式已移至全局Header组件 */

/* 主要内容区域 */
.search-content {
  flex: 1;
  overflow: hidden;
}

/* 搜索首页样式 */
.search-home {
  padding: 40px 20px;
  max-width: 800px;
  margin: 0 auto;
}

.hot-search-section {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
  margin-bottom: 40px;
  margin-top: 0;
}

.recent-search-section {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto 20px auto;
}
.recent-search-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
.recent-tag {
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 16px;
  padding: 6px 16px;
}
.recent-tag:hover {
  background: var(--color-fill-2);
  transform: translateY(-1px);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-1);
  margin: 0;
}

.refresh-btn {
  color: var(--color-text-3);
  transition: all 0.2s ease;
}

.refresh-btn:hover {
  color: var(--color-primary-6);
}

.title-icon {
  font-size: 20px;
  color: var(--color-primary-6);
}

.hot-search-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.hot-tag {
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 16px;
  padding: 6px 16px;
}

.hot-tag:hover {
  background: var(--color-primary-1);
  border-color: var(--color-primary-6);
  color: var(--color-primary-6);
  transform: translateY(-1px);
}

/* 最近搜索记录浮动区域 */
.recent-search-floating {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
  margin-bottom: 8px;
}

/* 搜索建议样式 */
.search-suggestions {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
  margin-bottom: 8px;
}

.suggestions-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.suggestion-tag {
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 16px;
  padding: 6px 16px;
}

.suggestion-tag:hover {
  background: var(--color-primary-1);
  border-color: var(--color-primary-6);
  color: var(--color-primary-6);
  transform: translateY(-1px);
}

/* 搜索结果样式 */
.search-results {
  height: calc(100vh - 112px); /* 减去顶部导航(64px)和底部(48px)的高度 */
  overflow: hidden;
}

.results-layout {
  display: flex;
  height: 100%;
}

/* 左侧源分组 */
.sources-sidebar {
  width: 280px;
  background: var(--color-bg-2);
  border-right: 1px solid var(--color-border-2);
  display: flex;
  flex-direction: column;
  height: 100%;
}

.sources-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--color-border-2);
  background: var(--color-bg-2);
  position: sticky;
  top: 0;
  z-index: 10;
  flex-shrink: 0;
}

.sources-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-1);
}

.sources-count {
  color: var(--color-text-3);
  font-size: 14px;
}

.sources-result-tag {
  background: #52c41a;
  color: white;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 12px;
  font-weight: 500;
  margin-left: 8px;
}

.sources-time-tag {
  background: #1890ff;
  color: white;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 12px;
  font-weight: 500;
  margin-left: 8px;
}

.sources-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  height: 0; /* 强制flex子元素计算高度 */
}

.source-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 4px;
}

.source-item:hover {
  background: var(--color-fill-2);
}

.source-item.active {
  background: #1890ff !important;
  border: 1px solid #0050b3 !important;
  color: white !important;
}

.source-item.active .source-name {
  color: white !important;
}

.source-item.active .source-count {
  color: rgba(255, 255, 255, 0.8) !important;
}

.source-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.source-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-1);
}

.source-count {
  font-size: 12px;
  color: var(--color-text-3);
}

.source-status {
  display: flex;
  align-items: center;
}

.status-success {
  color: var(--color-success-6);
  font-size: 16px;
}

.status-error {
  color: var(--color-danger-6);
  font-size: 16px;
}

/* 右侧搜索结果 */
.results-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: 100%;
}

.results-list {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.results-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--color-border-2);
  background: var(--color-bg-1);
  position: sticky;
  top: 0;
  z-index: 10;
  flex-shrink: 0;
}

.results-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-1);
}

.results-count {
  color: var(--color-text-3);
  font-size: 14px;
}





/* 状态样式 */
.loading-state,
.error-state,
.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  color: var(--color-text-3);
}

.error-icon,
.empty-icon {
  font-size: 48px;
  color: var(--color-text-4);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .results-layout {
    flex-direction: column;
  }
  
  .sources-sidebar {
    width: 100%;
    height: 200px;
  }
  
  .sources-list {
    display: flex;
    flex-direction: row;
    overflow-x: auto;
    padding: 8px 12px;
  }
  
  .source-item {
    min-width: 120px;
    margin-right: 8px;
    margin-bottom: 0;
  }
  

  
  .search-header {
    padding: 0 16px;
  }
  
  .header-left,
  .header-right {
    min-width: 100px;
  }
}
</style>