<template>
  <div class="footer-content">
    <!-- 翻页统计信息 -->
    <div v-if="paginationStore.shouldShow" class="pagination-stats">
      <span class="stats-text">{{ paginationStore.statsText }}</span>
    </div>
    <!-- 默认底部工具条内容 -->
    <div v-else class="default-footer">
      <div class="footer-info">
        <!-- 版权信息 -->
        <div class="copyright-section">
          <icon-copyright class="footer-icon" />
          <span class="copyright-text">{{ currentYear }} DrPlayer</span>
        </div>
        
        <!-- 分隔符 -->
        <div class="separator">|</div>
        
        <!-- 项目地址 -->
        <div class="project-section">
          <icon-github class="footer-icon" />
          <a 
            href="https://github.com/hjdhnx/DrPlayer" 
            target="_blank" 
            class="project-link"
            @click="handleProjectClick"
          >
            GitHub
          </a>
        </div>
        
        <!-- 分隔符 -->
        <div class="separator">|</div>
        
        <!-- 备案号 -->
        <div class="license-section">
          <icon-safe class="footer-icon" />
          <span class="license-text">hjdhnx</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { Message } from '@arco-design/web-vue';
import { 
  IconCopyright, 
  IconGithub, 
  IconSafe 
} from '@arco-design/web-vue/es/icon';
import { usePaginationStore } from '@/stores/paginationStore';

// 使用翻页统计store
const paginationStore = usePaginationStore();

// 获取当前年份
const currentYear = computed(() => new Date().getFullYear());

// 处理项目链接点击
const handleProjectClick = () => {
  Message.success('正在跳转到项目主页...');
};
</script>

<style scoped>
.footer-content {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pagination-stats {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.stats-text {
  font-size: 13px;
  color: var(--color-text-2);
  font-weight: 500;
}

.default-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  color: var(--color-text-2);
  font-size: 13px;
}

.footer-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 16px;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%);
  border-radius: 20px;
  border: 1px solid rgba(99, 102, 241, 0.1);
  transition: all 0.3s ease;
}

.footer-info:hover {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%);
  border-color: rgba(99, 102, 241, 0.2);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.1);
}

.copyright-section,
.project-section,
.license-section {
  display: flex;
  align-items: center;
  gap: 4px;
}

.footer-icon {
  font-size: 14px;
  color: var(--color-primary-6);
  transition: all 0.3s ease;
}

.copyright-text,
.license-text {
  font-size: 13px;
  color: var(--color-text-2);
  font-weight: 500;
  transition: color 0.3s ease;
}

.project-link {
  font-size: 13px;
  color: var(--color-primary-6);
  text-decoration: none;
  font-weight: 500;
  transition: all 0.3s ease;
  position: relative;
}

.project-link:hover {
  color: var(--color-primary-7);
  transform: translateY(-1px);
}

.project-link::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 1px;
  background: var(--color-primary-6);
  transition: width 0.3s ease;
}

.project-link:hover::after {
  width: 100%;
}

.separator {
  color: var(--color-border-3);
  font-size: 12px;
  opacity: 0.6;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .footer-info {
    gap: 8px;
    padding: 0 12px;
    font-size: 12px;
  }
  
  .footer-icon {
    font-size: 12px;
  }
  
  .copyright-text,
  .license-text,
  .project-link {
    font-size: 12px;
  }
}

@media (max-width: 480px) {
  .footer-info {
    flex-direction: column;
    gap: 4px;
    padding: 8px 12px;
  }
  
  .separator {
    display: none;
  }
  
  .copyright-section,
  .project-section,
  .license-section {
    gap: 3px;
  }
}
</style>
