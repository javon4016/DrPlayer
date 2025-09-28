import { defineStore } from 'pinia';

export const useVisitedStore = defineStore('visited', {
  state: () => ({
    lastClickedVideoId: null, // 最后点击的视频ID
    lastClickedVideoName: null // 最后点击的视频名称
  }),

  getters: {
    // 检查是否是最后点击的视频
    isLastClicked: (state) => (videoId) => {
      return state.lastClickedVideoId === videoId;
    }
  },

  actions: {
    // 记录最后点击的视频
    setLastClicked(videoId, videoName) {
      if (!videoId) return;
      
      this.lastClickedVideoId = videoId;
      this.lastClickedVideoName = videoName;
      
      // 保存到localStorage
      this.saveToStorage();
    },

    // 清除记录
    clear() {
      this.lastClickedVideoId = null;
      this.lastClickedVideoName = null;
      localStorage.removeItem('last-clicked-video');
    },

    // 保存到localStorage
    saveToStorage() {
      try {
        const data = {
          videoId: this.lastClickedVideoId,
          videoName: this.lastClickedVideoName
        };
        localStorage.setItem('last-clicked-video', JSON.stringify(data));
      } catch (error) {
        console.warn('保存最后点击视频失败:', error);
      }
    },

    // 从localStorage加载
    loadFromStorage() {
      try {
        const stored = localStorage.getItem('last-clicked-video');
        if (stored) {
          const data = JSON.parse(stored);
          this.lastClickedVideoId = data.videoId;
          this.lastClickedVideoName = data.videoName;
        }
      } catch (error) {
        console.warn('加载最后点击视频失败:', error);
        this.clear();
      }
    }
  }
});