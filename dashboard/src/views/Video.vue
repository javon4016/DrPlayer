<template>
  <Breadcrumb
    @handleOpenForm="handleOpenForm"
    @refreshPage="refreshPage"
    @minimize="minimize"
    @maximize="maximize"
    @closeWindow="closeWindow"
    @onSearch="onSearch"
    @handlePush="handlePush"
    :now_site_title="form.now_site_title"
  >
    <!-- 默认插槽的内容放这里 -->
    <div class="current-time">
      <span>{{ currentDateTime }}</span>
    </div>
  </Breadcrumb>

  <!-- 内容区域 -->
  <div class="main-container">
    <a-layout-content class="content">
      <!-- 搜索结果展示 -->
      <SearchResults 
        v-if="searchState.isSearching"
        :keyword="searchState.searchKeyword"
        :videos="searchState.searchResults"
        :loading="searchState.searchLoading"
        :error="searchState.searchError"
        :currentPage="searchState.currentPage"
        :totalPages="searchState.totalPages"
        :hasMore="searchState.hasMore"
        :scrollPosition="searchState.scrollPosition"
        :sourceRoute="{ name: route.name, params: route.params, query: route.query }"
        :module="form.now_site?.key || nowSite?.key"
        :extend="form.now_site"
        :api-url="form.now_site?.api"
        @load-more="onSearchLoadMore"
        @exit-search="exitSearch"
        @video-click="handleVideoClick"
        @refresh-list="handleRefreshList"
      />
      
      <!-- 默认视频列表 -->
      <VideoList 
        v-else
        ref="videoListRef"
        :classList="form.classList" 
        :recommendVideos="form.recommendVideos"
        :sourceRoute="{ name: route.name, params: route.params, query: { ...route.query, activeKey: currentActiveKey } }"
        :returnToActiveKey="route.query._returnToActiveKey"
        :module="form.now_site?.key || nowSite?.key"
        :extend="form.now_site"
        :api-url="form.now_site?.api"
        :specialCategoryState="specialCategoryState"
        @activeKeyChange="handleActiveKeyChange"
        @special-action="handleSpecialAction"
        @close-special-category="closeSpecialCategory"
      />
    </a-layout-content>
  </div>

  <SourceDialog
    :visible="form.visible"
    :title="form.form_title"
    :sites="form.sites"
    :currentSiteKey="form.now_site.key"
    @update:visible="(val) => (form.visible = val)"
    @confirm-clear="handleConfirmClear"
    @confirm-change="handleConfirmChange"
    @change-rule="handleChangeRule"
  />
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount, nextTick } from "vue";
import SourceDialog from "../components/SourceDialog.vue";
import Breadcrumb from "../components/Breadcrumb.vue";
import VideoList from "../components/VideoList.vue";
import SearchResults from "../components/SearchResults.vue";
import { videoService, siteService } from "@/api/services";
import { useSiteStore } from "@/stores/siteStore";
import { usePaginationStore } from "@/stores/paginationStore";
import { usePageStateStore } from "@/stores/pageStateStore";
import { useRoute, useRouter } from "vue-router";
import { Message } from "@arco-design/web-vue";

const { nowSite, setCurrentSite } = useSiteStore();
const paginationStore = usePaginationStore();
const pageStateStore = usePageStateStore();
const route = useRoute();
const router = useRouter();

// 时间格式化函数
const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

const currentDateTime = ref(formatDate(new Date())); // 初始化时就设置当前时间
const currentActiveKey = ref(""); // 当前选中的分类key
const videoListRef = ref(null); // VideoList组件引用
const form = reactive({
  sites: [],
  now_site_title: "hipy影视",
  now_site: {},
  visible: false,
  form_title: "",
  recommendVideos: [],
  classList: {},
  videoList: {},
});

// 搜索相关状态
const searchState = reactive({
  isSearching: false,
  searchKeyword: "",
  searchResults: [],
  searchLoading: false,
  searchError: null,
  currentPage: 1,
  totalPages: 1,
  hasMore: false,
  scrollPosition: 0
});

// 特殊分类状态
const specialCategoryState = reactive({
  isActive: false,
  categoryData: null,
  originalClassList: null,
  originalRecommendVideos: null
});

const timer = ref(null);
const getData = async (forceRefresh = false) => {
  try {
    // 首先尝试从配置服务获取站点数据
    const configStatus = siteService.getConfigStatus();
    
    if (configStatus.hasConfigUrl) {
      try {
        // 如果有配置地址，从配置地址加载站点数据
        await siteService.loadSitesFromConfig(forceRefresh);
        console.log("从配置地址加载站点数据成功");
      } catch (configError) {
        console.error("从配置地址加载站点数据失败:", configError);
        // 配置加载失败时，使用本地存储的站点数据
      }
    }
    
    // 获取所有站点配置
    form.sites = siteService.getAllSites();
    
    // 如果仍然没有站点配置，提示用户设置配置地址
    if (form.sites.length === 0) {
      console.log("暂无站点配置，请在设置中配置数据源地址");
    }
  } catch (error) {
    console.error("获取站点配置失败:", error);
  }
};

const getNowSite = () => {
  // 优先使用siteService中的当前站点
  const currentSite = siteService.getCurrentSite();
  if (currentSite) {
    form.now_site = currentSite;
    form.now_site_title = currentSite.name;
    // 同步到 siteStore
    setCurrentSite(currentSite);
  } else if (nowSite && nowSite.name) {
    form.now_site = nowSite;
    form.now_site_title = nowSite.name;
    // 同步到siteService
    siteService.setCurrentSite(nowSite.key);
  } else {
    // 如果都没有，清空当前源
    form.now_site = {};
    form.now_site_title = "hipy影视";
  }
};

const checkNowSite = () => {
  // 确保 form.now_site 有值，如果没有则从 siteService 获取
  if (!form.now_site || !form.now_site.key) {
    const currentSite = siteService.getCurrentSite();
    if (currentSite) {
      form.now_site = currentSite;
      form.now_site_title = currentSite.name;
    } else if (form.sites.length > 0) {
      // 如果没有当前源，设置第一个可用源
      const firstSite = form.sites.find(site => site.type === 4) || form.sites[0];
      form.now_site = firstSite;
      form.now_site_title = firstSite.name;
      siteService.setCurrentSite(firstSite.key);
    }
  } else {
    // 检查当前源是否在站点列表中
    const siteExists = form.sites.some(site => site.key === form.now_site.key);
    if (!siteExists && form.sites.length > 0) {
      // 如果当前源不在列表中，设置第一个可用源
      const firstSite = form.sites.find(site => site.type === 4) || form.sites[0];
      form.now_site = firstSite;
      form.now_site_title = firstSite.name;
      siteService.setCurrentSite(firstSite.key);
    }
  }
  
  // 设置 new_site 用于换源对话框
  form.new_site = form.now_site;
};

// 启动定时器
const startClock = () => {
  timer.value = setInterval(() => {
    currentDateTime.value = formatDate(new Date());
  }, 1000); // 每秒更新时间
};

const refreshPage = () => {
  window.location.reload();
};

const minimize = () => {};
const maximize = () => {};
const closeWindow = () => {};

const handleChangeRule = (site) => (form.new_site = site);

const handleConfirmClear = () => {
  form.now_site = form.new_site;
  setCurrentSite(form.now_site);
  form.visible = false;
  getData(true); // 传递 forceRefresh=true 强制刷新配置数据
  checkNowSite();
};

const handleConfirmChange = (site) => {
  form.now_site = site;
  // 使用 siteStore 统一管理站点切换
  setCurrentSite(site);
  form.now_site_title = site.name;
  form.visible = false;
  getClassList(site); //获取分类列表
};
//获取分类列表
const getClassList = async (site) => {
  if (!site || !site.key) {
    console.log("站点信息无效");
    return;
  }

  console.log(site, "确认换源");

  // 先清除之前的数据，防止数据残留
  form.classList = {
    class: [],
    filters: {}
  };
  form.recommendVideos = [];

  try {
    // 使用videoService获取首页数据，包含分类信息
    const homeData = await videoService.getRecommendVideos(site.key, {
      extend: site.ext,
      apiUrl: site.api
    });
    
    form.classList = {
      class: homeData.categories,
      filters: homeData.filters
    };
    
    // 保存推荐视频数据，如果没有推荐数据则保持为空数组
    form.recommendVideos = homeData.videos || [];
    
    console.log("分类列表:", form.classList);
    console.log("推荐视频:", form.recommendVideos);
  } catch (error) {
    console.error("获取分类列表失败:", error);
    // 降级处理：使用空的分类列表
    form.classList = {
      class: [],
      filters: {}
    };
    form.recommendVideos = [];
  }
};
const onSearch = async (value) => {
  if (!value || !value.trim()) {
    // 如果搜索内容为空，退出搜索模式
    searchState.isSearching = false;
    searchState.searchKeyword = "";
    searchState.searchResults = [];
    return;
  }

  const keyword = value.trim();
  searchState.searchKeyword = keyword;
  searchState.isSearching = true;
  searchState.searchLoading = true;
  searchState.searchError = null;
  searchState.currentPage = 1;

  try {
    if (!form.now_site || !form.now_site.key) {
      throw new Error("请先选择数据源");
    }

    // 调用搜索API
    const searchData = await videoService.searchVideo(form.now_site.key, {
      keyword: keyword,
      page: 1,
      extend: form.now_site.ext,
      apiUrl: form.now_site.api
    });

    searchState.searchResults = searchData.videos || [];
    searchState.totalPages = searchData.pagination?.totalPages || 1;
    searchState.hasMore = searchData.pagination?.hasNext || false;
  } catch (error) {
    console.error("搜索失败:", error);
    searchState.searchError = error.message || "搜索失败，请重试";
    searchState.searchResults = [];
  } finally {
    searchState.searchLoading = false;
  }
};

// 搜索加载更多
const onSearchLoadMore = async () => {
  if (searchState.searchLoading || !searchState.searchKeyword || !searchState.hasMore) return;

  searchState.searchLoading = true;
  const nextPage = searchState.currentPage + 1;

  try {
    const searchData = await videoService.searchVideo(form.now_site.key, {
      keyword: searchState.searchKeyword,
      page: nextPage,
      extend: form.now_site.ext,
      apiUrl: form.now_site.api
    });



    // 追加新的搜索结果到现有结果中
    const newVideos = searchData.videos || [];
    
    // 检查是否有重复数据或no_data标识
    const existingIds = new Set(searchState.searchResults.map(v => v.vod_id));
    const uniqueNewVideos = newVideos.filter(video => {
      // 过滤掉重复的视频和no_data标识
      return !existingIds.has(video.vod_id) && 
             video.vod_id !== 'no_data' && 
             video.vod_name !== 'no_data';
    });
    
    // 如果新数据为空或全部重复，表示没有更多数据
     if (uniqueNewVideos.length === 0) {
       searchState.hasMore = false;
     } else {
      searchState.searchResults = [...searchState.searchResults, ...uniqueNewVideos];
      searchState.hasMore = searchData.pagination?.hasNext !== false; // 只有明确返回false才停止
    }
    
    searchState.currentPage = nextPage;
    searchState.totalPages = searchData.pagination?.totalPages || searchState.totalPages;
  } catch (error) {
    console.error("搜索加载更多失败:", error);
    searchState.searchError = error.message || "加载失败，请重试";
  } finally {
    searchState.searchLoading = false;
  }
};

// 退出搜索模式
const exitSearch = () => {
  searchState.isSearching = false;
  searchState.searchKeyword = "";
  searchState.searchResults = [];
  searchState.searchError = null;
  searchState.currentPage = 1;
};

// 处理分类变化事件
const handleActiveKeyChange = (activeKey) => {
  currentActiveKey.value = activeKey;
};

// 处理视频点击事件
const handleVideoClick = (video) => {
  if (video && video.vod_id) {
    let fromSearch = 'false';
    
    // 判断当前是否在搜索状态
    if (searchState.isSearching) {
      // 搜索状态的保存由SearchResults组件处理
      console.log('从搜索结果点击视频，状态保存由SearchResults组件处理');
      fromSearch = 'true';
    } else {
      // 保存分类状态
      if (currentActiveKey.value) {
        pageStateStore.saveVideoState(
          currentActiveKey.value,
          1, // 当前页码
          [], // 视频列表
          true, // hasMore状态
          false, // loading状态
          window.scrollY // 当前滚动位置
        );
        console.log('从分类列表点击视频，保存分类状态');
      }
    }
    
    router.push({
      name: 'VideoDetail',
      params: { id: video.vod_id },
      query: {
        name: video.vod_name,
        pic: video.vod_pic,
        year: video.vod_year,
        area: video.vod_area,
        type: video.vod_type,
        remarks: video.vod_remarks,
        content: video.vod_content,
        actor: video.vod_actor,
        director: video.vod_director,
        // 传递来源页面信息
        sourceRouteName: route.name,
        sourceRouteParams: JSON.stringify(route.params),
        sourceRouteQuery: JSON.stringify({ ...route.query, activeKey: currentActiveKey.value }),
        fromSearch: fromSearch, // 标识是否来自搜索
        // 添加来源图片信息，用于详情页图片备用
        sourcePic: video.vod_pic
      }
    });
  }
};

// 处理刷新列表事件
const handleRefreshList = () => {
  console.log('收到刷新列表请求');
  
  if (searchState.isSearching) {
    // 如果在搜索状态，重新执行搜索
    console.log('刷新搜索结果');
    // 可以重新调用搜索方法
    // searchVideos(searchState.searchKeyword);
  } else {
    // 如果在分类列表状态，刷新当前分类
    console.log('刷新分类列表');
    if (videoListRef.value) {
      videoListRef.value.refreshCurrentCategory();
    }
  }
};

// 处理特殊动作事件
const handleSpecialAction = async (actionType, actionData) => {
  console.log('🎯 [DEBUG] handleSpecialAction 被调用');
  console.log('🎯 [DEBUG] actionType:', actionType);
  console.log('🎯 [DEBUG] actionData:', JSON.stringify(actionData, null, 2));
  
  switch (actionType) {
    case '__self_search__':
      console.log('🎯 [DEBUG] 匹配到 __self_search__ 动作，调用 handleSelfSearchAction');
      await handleSelfSearchAction(actionData);
      break;
    default:
      console.warn('🎯 [WARN] 未知的特殊动作类型:', actionType);
      break;
  }
};

// 处理源内搜索动作
const handleSelfSearchAction = async (categoryData) => {
  try {
    console.log('🔍 [DEBUG] handleSelfSearchAction 被调用');
    console.log('🔍 [DEBUG] 接收到的 categoryData:', JSON.stringify(categoryData, null, 2));
    
    // 保存当前状态
    if (!specialCategoryState.isActive) {
      console.log('🔍 [DEBUG] 保存当前状态');
      specialCategoryState.originalClassList = form.classList;
      specialCategoryState.originalRecommendVideos = form.recommendVideos;
    }
    
    // 解析T4返回的参数
    const tid = categoryData.tid || categoryData.type_id || categoryData.actionData?.tid;
    const typeName = categoryData.name || categoryData.type_name || `搜索: ${tid}`;
    
    console.log('🔍 [DEBUG] 解析的参数:', { 
      tid, 
      typeName,
      'categoryData.tid': categoryData.tid,
      'categoryData.type_id': categoryData.type_id,
      'categoryData.actionData?.tid': categoryData.actionData?.tid,
      'categoryData.name': categoryData.name,
      'categoryData.type_name': categoryData.type_name
    });
    
    if (!tid) {
      console.error('🔍 [ERROR] 源内搜索参数不完整：缺少tid');
      Message.error('源内搜索参数不完整：缺少tid');
      return;
    }
    
    // 使用tid调用T4分类接口获取视频数据
    const categoryResult = await videoService.getCategoryVideos(
      form.now_site?.key || nowSite?.key,
      {
        typeId: tid,
        page: 1,
        filters: {},
        apiUrl: form.now_site?.api,
        extend: form.now_site?.ext
      }
    );
    
    console.log('T4分类接口返回数据:', categoryResult);
    
    // 构造特殊分类数据结构
    const specialClassList = {
      class: [{
        type_id: tid,
        type_name: typeName
      }],
      filters: {}
    };
    
    // 设置特殊分类状态
    specialCategoryState.isActive = true;
    specialCategoryState.categoryData = {
      type_id: tid,
      type_name: typeName,
      originalData: categoryData,
      videos: categoryResult.videos || [],
      pagination: categoryResult.pagination || {}
    };
    
    // 更新分类列表和推荐视频
    form.classList = specialClassList;
    form.recommendVideos = []; // 隐藏推荐视频
    
    // 切换到特殊分类
    currentActiveKey.value = tid;
    
    console.log('特殊分类设置完成:', {
      tid,
      categoryName: typeName,
      isActive: specialCategoryState.isActive,
      videosCount: categoryResult.videos?.length || 0,
      classList: form.classList
    });
    
    // 等待下一个tick，确保VideoList组件已经接收到新的props
    await nextTick();
    
    // 直接设置VideoList组件的数据，而不是触发刷新
    if (videoListRef.value && categoryResult.videos) {
      console.log('直接设置VideoList组件的特殊分类数据');
      // 通过VideoList的暴露方法直接设置数据
      videoListRef.value.setSpecialCategoryData(tid, categoryResult.videos, categoryResult.pagination);
    }
    
  } catch (error) {
    console.error('处理源内搜索失败:', error);
    Message.error(`源内搜索失败: ${error.message}`);
  }
};

// 关闭特殊分类，返回正常显示
const closeSpecialCategory = () => {
  if (!specialCategoryState.isActive) {
    return;
  }
  
  console.log('关闭特殊分类，恢复正常显示');
  
  // 恢复原始状态
  form.classList = specialCategoryState.originalClassList;
  form.recommendVideos = specialCategoryState.originalRecommendVideos;
  
  // 重置特殊分类状态
  specialCategoryState.isActive = false;
  specialCategoryState.categoryData = null;
  specialCategoryState.originalClassList = null;
  specialCategoryState.originalRecommendVideos = null;
  
  // 切换回推荐分类
  currentActiveKey.value = 'recommendTuijian404';
  
  console.log('特殊分类已关闭，恢复到推荐分类');
};



const handleOpenForm = () => {
  form.visible = true;
  // 过滤出 type 为 4 的数据源
  const type4Sites = form.sites.filter(site => site.type === 4);
  form.form_title = `请选择数据源(${type4Sites.length})`;
  checkNowSite();
};

// 处理推送功能
const handlePush = async (vodId) => {
  if (!vodId || !vodId.trim()) {
    Message.error("推送内容不能为空");
    return;
  }

  // 检查是否存在push_agent源
  const pushAgentSite = form.sites.find(site => site.key === 'push_agent');
  
  if (!pushAgentSite) {
    Message.error("没有找到push_agent服务，请检查源配置");
    return;
  }

  try {
    console.log('推送功能，使用临时站源:', {
      siteName: pushAgentSite.name,
      siteKey: pushAgentSite.key,
      siteApi: pushAgentSite.api
    });

    // 参考收藏和历史功能，使用临时源跳转到详情页
    router.push({
      name: 'VideoDetail',
      params: { id: vodId.trim() },
      query: {
        // 基本视频信息（推送时可能没有完整信息）
        name: `推送内容-${vodId.trim()}`,
        pic: '',
        year: '',
        area: '',
        type: '',
        type_name: '',
        remarks: '',
        content: '',
        actor: '',
        director: '',
        // 标识从推送进入，使用临时站源
        fromPush: 'true',
        // 传递push_agent站源信息，不影响全局状态
        tempSiteName: pushAgentSite.name,
        tempSiteApi: pushAgentSite.api,
        tempSiteKey: pushAgentSite.key,
        // 传递来源页面信息
        sourceRouteName: route.name,
        sourceRouteParams: JSON.stringify(route.params),
        sourceRouteQuery: JSON.stringify(route.query),
        // 添加来源图片信息，用于详情页图片备用（推送时通常没有图片）
        sourcePic: ''
      }
    });
    
    Message.success(`正在推送内容: ${vodId.trim()}`);
  } catch (error) {
    console.error("推送失败:", error);
    Message.error("推送失败，请重试");
  }
};

// 页面加载时获取数据
onMounted(async () => {
  getData(); // 页面加载时获取数据
  getNowSite(); // 获取储存的当前源
  
  // 检查是否需要恢复搜索状态
  const restoreSearch = route.query._restoreSearch;
  const returnToActiveKey = route.query._returnToActiveKey;
  
  if (restoreSearch === 'true') {
    // 恢复搜索状态
    const savedSearchState = pageStateStore.getPageState('search');
    if (savedSearchState && savedSearchState.keyword && !pageStateStore.isStateExpired('search')) {
      console.log('恢复搜索状态:', savedSearchState);
      
      // 恢复搜索相关状态
      searchState.isSearching = true;
      searchState.searchKeyword = savedSearchState.keyword;
      searchState.searchResults = savedSearchState.videos || [];
      searchState.currentPage = savedSearchState.currentPage || 1;
      searchState.hasMore = savedSearchState.hasMore || false;
      searchState.searchLoading = false;
      searchState.searchError = null;
      searchState.scrollPosition = savedSearchState.scrollPosition || 0;
      
      // 清除URL中的恢复参数
      const newQuery = { ...route.query };
      delete newQuery._restoreSearch;
      router.replace({ query: newQuery });
      
      await getClassList(form.now_site);
      startClock(); // 启动时钟
      
      // 注意：搜索结果的滚动位置恢复由SearchResults组件自动处理
      console.log('搜索状态恢复完成，滚动位置由SearchResults组件处理');
      
      return; // 搜索状态恢复完成，不再执行分类恢复逻辑
    }
  }
  
  // 尝试恢复页面状态
  const savedState = pageStateStore.getPageState('video');
  const isStateExpired = pageStateStore.isStateExpired('video');
  
  let shouldRestoreState = false;
  
  if (returnToActiveKey) {
    // 如果有返回参数，优先使用返回参数
    currentActiveKey.value = returnToActiveKey;
    shouldRestoreState = true;
    console.log('从详情页返回，恢复到分类:', returnToActiveKey);
    
    // 清除URL中的返回参数
    const newQuery = { ...route.query };
    delete newQuery._returnToActiveKey;
    router.replace({ query: newQuery });
  } else if (savedState && savedState.activeKey && !isStateExpired) {
    // 如果有保存的状态且未过期，恢复状态
    currentActiveKey.value = savedState.activeKey;
    shouldRestoreState = true;
    console.log('恢复保存的分类状态:', savedState.activeKey);
  }
  
  // 确保分类列表已加载
  await getClassList(form.now_site);
  startClock(); // 启动时钟
  
  // 如果需要恢复状态，等待VideoList组件挂载后再恢复
  if (shouldRestoreState) {
    setTimeout(() => {
      if (videoListRef.value) {
        videoListRef.value.restoreFullState({
          activeKey: currentActiveKey.value,
          currentPage: savedState?.currentPage || 1,
          videos: savedState?.videos || [],
          hasMore: savedState?.hasMore || true,
          scrollPosition: savedState?.scrollPosition || 0
        });
      }
    }, 100);
  }
});

// 清理定时器
onBeforeUnmount(() => {
  if (timer.value) {
    clearInterval(timer.value); // 销毁时清除定时器
  }
  
  // 保存当前页面状态
  if (currentActiveKey.value && videoListRef.value) {
    const currentState = videoListRef.value.getCurrentState();
    pageStateStore.saveVideoState(
      currentActiveKey.value,
      currentState.currentPage, // 从VideoList组件获取当前页码
      currentState.videos, // 从VideoList组件获取视频列表
      currentState.hasMore, // 从VideoList组件获取hasMore状态
      false, // loading状态
      currentState.scrollPosition // 从VideoList组件获取滚动位置
    );
    console.log('保存Video页面状态:', {
      activeKey: currentActiveKey.value,
      currentPage: currentState.currentPage,
      videosCount: currentState.videos.length,
      hasMore: currentState.hasMore,
      hasData: currentState.hasData,
      scrollPosition: currentState.scrollPosition
    });
  }
});
</script>

<style scoped>
/* 样式代码 */
.main-container {
  /* 减去Breadcrumb组件的总高度：
     - Breadcrumb基础高度：53px (padding: 16px*2 + content: 20px + border: 1px)
     - current-time元素额外高度：14px (padding + border)
     - 总计：67px */
  height: calc(100% - 67px);
  /* 使用100%最小高度，继承父容器 */
  /* min-height: 100%;  */
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.content {
  flex: 1;
  overflow: hidden;
  padding: 0;
}

/* 时间显示样式 */
.current-time {
  font-size: 14px;
  color: var(--color-text-2);
  white-space: nowrap;
  padding: 8px 12px;
  background: var(--color-bg-2);
  border-radius: 6px;
  border: 1px solid var(--color-border-2);
}

.current-time span {
  font-weight: 500;
}
</style>
