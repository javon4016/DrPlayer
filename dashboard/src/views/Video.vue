<template>
  <Breadcrumb
    @handleOpenForm="handleOpenForm"
    @refreshPage="refreshPage"
    @minimize="minimize"
    @maximize="maximize"
    @closeWindow="closeWindow"
    @onSearch="onSearch"
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
        @load-more="onSearchLoadMore"
        @exit-search="exitSearch"
        @video-click="handleVideoClick"
      />
      
      <!-- 默认视频列表 -->
      <VideoList 
        v-else
        :classList="form.classList" 
        :recommendVideos="form.recommendVideos"
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
import { ref, reactive, onMounted, onBeforeUnmount } from "vue";
import SourceDialog from "../components/SourceDialog.vue";
import Breadcrumb from "../components/Breadcrumb.vue";
import VideoList from "../components/VideoList.vue";
import SearchResults from "../components/SearchResults.vue";
import { videoService, siteService } from "@/api/services";
import { useSiteStore } from "@/stores/siteStore";
import { usePaginationStore } from "@/stores/paginationStore";

const { nowSite, setCurrentSite } = useSiteStore();
const paginationStore = usePaginationStore();

const currentDateTime = ref("");
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
  hasMore: false
});

const timer = ref(null);
const getData = async () => {
  try {
    // 首先尝试从配置服务获取站点数据
    const configStatus = siteService.getConfigStatus();
    
    if (configStatus.hasConfigUrl) {
      try {
        // 如果有配置地址，从配置地址加载站点数据
        await siteService.loadSitesFromConfig();
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
  } else if (nowSite && nowSite.name) {
    form.now_site = nowSite;
    form.now_site_title = nowSite.name;
    // 同步到siteService
    siteService.setCurrentSite(nowSite.key);
  }
};

const checkNowSite = () => {
  form.new_site = form.now_site;
  if (!form.new_site.key && form.sites.length > 0) {
    form.new_site = form.sites[0];
  } else if (
    form.new_site.key &&
    !form.sites.map((i) => i.key).includes(form.new_site.key)
  ) {
    form.new_site = form.sites[0];
  }
};

const formatDate = (date) => {
  const options = {
    weekday: "long", // 星期几
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true, // 12小时制
  };
  return date.toLocaleString("zh-CN", options);
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
  getData();
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

// 处理视频点击事件
const handleVideoClick = (video) => {
  if (video && video.vod_id) {
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
           director: video.vod_director
         }
       });
  }
};



const handleOpenForm = () => {
  form.visible = true;
  form.form_title = `请选择数据源(${form.sites.length})`;
  checkNowSite();
};

// 页面加载时获取数据
onMounted(() => {
  getData(); // 页面加载时获取数据
  getNowSite(); // 获取储存的当前源
  getClassList(form.now_site);
  startClock(); // 启动时钟
});

// 清理定时器
onBeforeUnmount(() => {
  if (timer.value) {
    clearInterval(timer.value); // 销毁时清除定时器
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
