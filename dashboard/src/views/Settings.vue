<template>
  <div class="settings-container">
    <!-- 简化的标题显示 -->
    <div class="simple-header">
      <span class="navigation-title">Settings</span>
    </div>

    <!-- 设置内容 -->
    <div class="settings-content">
      <!-- 配置地址卡片 -->
      <a-card class="settings-card config-card" title="配置地址" :bordered="false">
        <template #extra>
          <icon-link class="card-icon" />
        </template>
        
        <div class="config-section">
          <div class="config-input-group">
            <a-input 
              v-model="configUrl" 
              placeholder="请输入配置地址URL (如: https://example.com/config.json)"
              size="large"
              class="config-input"
            >
              <template #prefix>
                <icon-globe />
              </template>
            </a-input>
            <div class="config-actions">
              <a-button 
                type="outline" 
                @click="testConfigUrl"
                :loading="testing"
                size="large"
              >
                <template #icon>
                  <icon-check-circle />
                </template>
                测试
              </a-button>
              <a-button 
                type="primary" 
                @click="saveConfigUrl"
                :loading="saving"
                size="large"
              >
                <template #icon>
                  <icon-save />
                </template>
                保存
              </a-button>
            </div>
          </div>
          
          <div v-if="configStatus" class="config-status">
            <a-alert 
              :type="configStatus.type === 'success' ? 'success' : configStatus.type === 'error' ? 'error' : 'warning'"
              :message="configStatus.message"
              show-icon
              :closable="false"
            />
          </div>
        </div>
      </a-card>

      <!-- 首页设置卡片 -->
      <a-card class="settings-card" title="首页设置" :bordered="false">
        <template #extra>
          <icon-home class="card-icon" />
        </template>
        
        <div class="settings-grid">
          <div class="setting-item" @click="handleSettingClick('datasource')">
            <div class="setting-info">
              <icon-database class="setting-icon" />
              <div class="setting-text">
                <div class="setting-title">数据源</div>
                <div class="setting-desc">管理视频数据来源</div>
              </div>
            </div>
            <div class="setting-value">
              <span class="value-text">配置中</span>
              <icon-right class="arrow-icon" />
            </div>
          </div>

          <div class="setting-item" @click="handleSettingClick('datasource-display')">
            <div class="setting-info">
              <icon-eye class="setting-icon" />
              <div class="setting-text">
                <div class="setting-title">数据源显示</div>
                <div class="setting-desc">控制数据源的显示状态</div>
              </div>
            </div>
            <div class="setting-value">
              <a-switch v-model="settings.datasourceDisplay" />
            </div>
          </div>

          <div class="setting-item" @click="handleSettingClick('recommendation')">
            <div class="setting-info">
              <icon-star class="setting-icon" />
              <div class="setting-text">
                <div class="setting-title">推荐</div>
                <div class="setting-desc">推荐内容设置</div>
              </div>
            </div>
            <div class="setting-value">
              <span class="value-text">站点推荐</span>
              <icon-right class="arrow-icon" />
            </div>
          </div>

          <div class="setting-item" @click="handleSettingClick('history-count')">
            <div class="setting-info">
              <icon-history class="setting-icon" />
              <div class="setting-text">
                <div class="setting-title">历史条数</div>
                <div class="setting-desc">设置历史记录保存数量</div>
              </div>
            </div>
            <div class="setting-value">
              <span class="value-text">100条</span>
              <icon-right class="arrow-icon" />
            </div>
          </div>
        </div>
      </a-card>

      <!-- 播放器设置卡片 -->
      <a-card class="settings-card" title="播放器设置" :bordered="false">
        <template #extra>
          <icon-play-circle class="card-icon" />
        </template>
        
        <div class="settings-grid">
          <div class="setting-item" @click="handleSettingClick('window-preview')">
            <div class="setting-info">
              <icon-computer class="setting-icon" />
              <div class="setting-text">
                <div class="setting-title">窗口预览</div>
                <div class="setting-desc">启用播放器窗口预览</div>
              </div>
            </div>
            <div class="setting-value">
              <a-switch v-model="settings.windowPreview" />
            </div>
          </div>

          <div class="setting-item" @click="handleSettingClick('player-type')">
            <div class="setting-info">
              <icon-play-arrow class="setting-icon" />
              <div class="setting-text">
                <div class="setting-title">播放器</div>
                <div class="setting-desc">选择播放器类型</div>
              </div>
            </div>
            <div class="setting-value">
              <span class="value-text">IJK</span>
              <icon-right class="arrow-icon" />
            </div>
          </div>

          <div class="setting-item" @click="handleSettingClick('ijk-decode')">
            <div class="setting-info">
              <icon-code class="setting-icon" />
              <div class="setting-text">
                <div class="setting-title">IJK解码</div>
                <div class="setting-desc">设置解码方式</div>
              </div>
            </div>
            <div class="setting-value">
              <span class="value-text">硬解码</span>
              <icon-right class="arrow-icon" />
            </div>
          </div>

          <div class="setting-item" @click="handleSettingClick('ad-filter')">
            <div class="setting-info">
              <icon-shield class="setting-icon" />
              <div class="setting-text">
                <div class="setting-title">广告过滤</div>
                <div class="setting-desc">自动过滤广告内容</div>
              </div>
            </div>
            <div class="setting-value">
              <a-switch v-model="settings.adFilter" />
            </div>
          </div>

          <div class="setting-item" @click="handleSettingClick('ijk-cache')">
            <div class="setting-info">
              <icon-storage class="setting-icon" />
              <div class="setting-text">
                <div class="setting-title">IJK缓存</div>
                <div class="setting-desc">启用播放器缓存</div>
              </div>
            </div>
            <div class="setting-value">
              <a-switch v-model="settings.ijkCache" />
            </div>
          </div>

          <div class="setting-item" @click="handleSettingClick('auto-live')">
            <div class="setting-info">
              <icon-live-broadcast class="setting-icon" />
              <div class="setting-text">
                <div class="setting-title">启动时进直播</div>
                <div class="setting-desc">应用启动时自动进入直播</div>
              </div>
            </div>
            <div class="setting-value">
              <a-switch v-model="settings.autoLive" />
            </div>
          </div>
        </div>
      </a-card>

      <!-- 系统设置卡片 -->
      <a-card class="settings-card" title="系统设置" :bordered="false">
        <template #extra>
          <icon-desktop class="card-icon" />
        </template>
        
        <div class="settings-grid">
          <div class="setting-item" @click="handleSettingClick('language')">
            <div class="setting-info">
              <icon-language class="setting-icon" />
              <div class="setting-text">
                <div class="setting-title">语言</div>
                <div class="setting-desc">选择界面语言</div>
              </div>
            </div>
            <div class="setting-value">
              <span class="value-text">中文</span>
              <icon-right class="arrow-icon" />
            </div>
          </div>

          <div class="setting-item" @click="handleSettingClick('theme')">
            <div class="setting-info">
              <icon-palette class="setting-icon" />
              <div class="setting-text">
                <div class="setting-title">主题</div>
                <div class="setting-desc">选择应用主题</div>
              </div>
            </div>
            <div class="setting-value">
              <span class="value-text">奈飞</span>
              <icon-right class="arrow-icon" />
            </div>
          </div>

          <div class="setting-item" @click="handleSettingClick('wallpaper')">
            <div class="setting-info">
              <icon-image class="setting-icon" />
              <div class="setting-text">
                <div class="setting-title">换张壁纸</div>
                <div class="setting-desc">更换应用背景壁纸</div>
              </div>
            </div>
            <div class="setting-value">
              <icon-right class="arrow-icon" />
            </div>
          </div>

          <div class="setting-item" @click="handleSettingClick('reset-wallpaper')">
            <div class="setting-info">
              <icon-refresh class="setting-icon" />
              <div class="setting-text">
                <div class="setting-title">重置壁纸</div>
                <div class="setting-desc">恢复默认背景壁纸</div>
              </div>
            </div>
            <div class="setting-value">
              <icon-right class="arrow-icon" />
            </div>
          </div>

          <div class="setting-item" @click="handleSettingClick('render-mode')">
            <div class="setting-info">
              <icon-desktop class="setting-icon" />
              <div class="setting-text">
                <div class="setting-title">渲染方式</div>
                <div class="setting-desc">选择渲染模式</div>
              </div>
            </div>
            <div class="setting-value">
              <span class="value-text">TextureView</span>
              <icon-right class="arrow-icon" />
            </div>
          </div>

          <div class="setting-item" @click="handleSettingClick('search-display')">
            <div class="setting-info">
              <icon-search class="setting-icon" />
              <div class="setting-text">
                <div class="setting-title">搜索展示</div>
                <div class="setting-desc">搜索结果展示方式</div>
              </div>
            </div>
            <div class="setting-value">
              <span class="value-text">缩略图</span>
              <icon-right class="arrow-icon" />
            </div>
          </div>

          <div class="setting-item" @click="handleSettingClick('webview')">
            <div class="setting-info">
              <icon-code class="setting-icon" />
              <div class="setting-text">
                <div class="setting-title">嗅探Webview</div>
                <div class="setting-desc">选择Webview类型</div>
              </div>
            </div>
            <div class="setting-value">
              <span class="value-text">系统自带</span>
              <icon-right class="arrow-icon" />
            </div>
          </div>

          <div class="setting-item" @click="handleSettingClick('secure-dns')">
            <div class="setting-info">
              <icon-safe class="setting-icon" />
              <div class="setting-text">
                <div class="setting-title">安全DNS</div>
                <div class="setting-desc">启用安全DNS解析</div>
              </div>
            </div>
            <div class="setting-value">
              <a-switch v-model="settings.secureDns" />
            </div>
          </div>
        </div>
      </a-card>

      <!-- 数据管理卡片 -->
      <a-card class="settings-card" title="数据管理" :bordered="false">
        <template #extra>
          <icon-folder class="card-icon" />
        </template>
        
        <div class="settings-grid">
          <div class="setting-item" @click="handleSettingClick('backup')">
            <div class="setting-info">
              <icon-download class="setting-icon" />
              <div class="setting-text">
                <div class="setting-title">数据备份还原</div>
                <div class="setting-desc">备份或还原应用数据</div>
              </div>
            </div>
            <div class="setting-value">
              <icon-right class="arrow-icon" />
            </div>
          </div>

          <div class="setting-item" @click="handleSettingClick('reset')">
            <div class="setting-info">
              <icon-delete class="setting-icon" />
              <div class="setting-text">
                <div class="setting-title">重置</div>
                <div class="setting-desc">重置所有设置到默认状态</div>
              </div>
            </div>
            <div class="setting-value">
              <icon-right class="arrow-icon" />
            </div>
          </div>

          <div class="setting-item" @click="handleSettingClick('search-aggregation')">
            <div class="setting-info">
              <icon-find-replace class="setting-icon" />
              <div class="setting-text">
                <div class="setting-title">聚搜</div>
                <div class="setting-desc">聚合搜索功能</div>
              </div>
            </div>
            <div class="setting-value">
              <span class="value-text">已关闭</span>
              <icon-right class="arrow-icon" />
            </div>
          </div>

          <div class="setting-item" @click="handleSettingClick('about')">
            <div class="setting-info">
              <icon-info-circle class="setting-icon" />
              <div class="setting-text">
                <div class="setting-title">关于</div>
                <div class="setting-desc">查看应用信息和版本</div>
              </div>
            </div>
            <div class="setting-value">
              <icon-right class="arrow-icon" />
            </div>
          </div>
        </div>
      </a-card>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { Message } from '@arco-design/web-vue'

// 配置地址相关
const configUrl = ref('')
const saving = ref(false)
const testing = ref(false)
const configStatus = ref(null)

// 设置项状态
const settings = reactive({
  datasourceDisplay: true,
  windowPreview: true,
  adFilter: true,
  ijkCache: false,
  autoLive: false,
  secureDns: false
})

// 保存配置地址
const saveConfigUrl = async () => {
  if (!configUrl.value.trim()) {
    Message.warning('请输入配置地址')
    return
  }
  
  saving.value = true
  try {
    // 这里应该调用实际的保存API
    await new Promise(resolve => setTimeout(resolve, 1000)) // 模拟API调用
    
    // 保存到localStorage
    localStorage.setItem('configUrl', configUrl.value)
    
    configStatus.value = {
      type: 'success',
      message: '配置地址保存成功'
    }
    Message.success('配置地址保存成功')
  } catch (error) {
    configStatus.value = {
      type: 'error',
      message: '保存失败：' + error.message
    }
    Message.error('保存失败')
  } finally {
    saving.value = false
    // 3秒后清除状态消息
    setTimeout(() => {
      configStatus.value = null
    }, 3000)
  }
}

// 测试配置地址
const testConfigUrl = async () => {
  if (!configUrl.value.trim()) {
    Message.warning('请输入配置地址')
    return
  }
  
  testing.value = true
  try {
    // 这里应该调用实际的测试API
    const response = await fetch(configUrl.value)
    
    if (response.ok) {
      configStatus.value = {
        type: 'success',
        message: '配置地址测试成功，连接正常'
      }
      Message.success('配置地址测试成功')
    } else {
      throw new Error(`HTTP ${response.status}`)
    }
  } catch (error) {
    configStatus.value = {
      type: 'error',
      message: '测试失败：无法连接到配置地址'
    }
    Message.error('测试失败：无法连接到配置地址')
  } finally {
    testing.value = false
    // 3秒后清除状态消息
    setTimeout(() => {
      configStatus.value = null
    }, 3000)
  }
}

// 处理设置项点击
const handleSettingClick = (settingKey) => {
  console.log('Setting clicked:', settingKey)
  Message.info(`点击了设置项：${settingKey}`)
  // 这里可以根据不同的设置项执行不同的操作
  // 比如打开对话框、跳转页面等
}

// 页面加载时从localStorage恢复配置
const loadConfig = () => {
  const savedUrl = localStorage.getItem('configUrl')
  if (savedUrl) {
    configUrl.value = savedUrl
  }
  
  // 加载其他设置项的状态
  const savedSettings = localStorage.getItem('appSettings')
  if (savedSettings) {
    try {
      const parsed = JSON.parse(savedSettings)
      Object.assign(settings, parsed)
    } catch (error) {
      console.error('Failed to load settings:', error)
    }
  }
}

// 保存设置项状态
const saveSettings = () => {
  localStorage.setItem('appSettings', JSON.stringify(settings))
}

// 监听设置项变化并自动保存
watch(settings, saveSettings, { deep: true })

// 初始化
loadConfig()
</script>

<style scoped>
.settings-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.simple-header {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 16px 20px;
  background: var(--color-bg-3);
  border-bottom: 1px solid var(--color-border-2);
  box-sizing: border-box;
  flex-shrink: 0;
}

.navigation-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-1);
  white-space: nowrap;
}

.settings-content {
  flex: 1;
  width: 100%;
  max-width: none;
  margin: 0;
  padding: 20px 24px 40px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  overflow-y: auto;
  box-sizing: border-box;
  max-height: calc(100vh - 120px);
}

.settings-card {
  width: 100%;
  height: auto;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  overflow: visible;
  box-sizing: border-box;
}

.settings-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

.settings-card :deep(.arco-card-header) {
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  padding: 20px 24px;
}

.settings-card :deep(.arco-card-header-title) {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 12px;
}

.card-icon {
  font-size: 20px;
  color: #6366f1;
}

.settings-card :deep(.arco-card) {
  height: auto;
}

.settings-card :deep(.arco-card-body) {
  padding: 24px;
  height: auto;
}

/* 配置地址卡片特殊样式 */
.config-card {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%);
}

.config-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: auto;
  min-height: auto;
}

.config-input-group {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  width: 100%;
  max-width: 100%;
  overflow: hidden;
  box-sizing: border-box;
}

.config-input {
  flex: 1;
  min-width: 0; /* 允许flex项目缩小到内容以下 */
  max-width: calc(100% - 180px); /* 为按钮组留出空间 */
  overflow: hidden;
}

.config-input :deep(.arco-input) {
  border-radius: 12px;
  border: 2px solid #e2e8f0;
  transition: all 0.3s ease;
  font-size: 14px;
}

.config-input :deep(.arco-input:focus) {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.config-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
  max-width: 170px;
  overflow: hidden;
}

.config-actions .arco-btn {
  border-radius: 12px;
  font-weight: 500;
  min-width: 80px;
  transition: all 0.3s ease;
}

.config-actions .arco-btn-primary {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  border: none;
}

.config-actions .arco-btn-primary:hover {
  background: linear-gradient(135deg, #5b5bd6 0%, #7c3aed 100%);
  transform: translateY(-1px);
}

.config-actions .arco-btn-outline {
  border: 2px solid #e2e8f0;
  color: #64748b;
}

.config-actions .arco-btn-outline:hover {
  border-color: #6366f1;
  color: #6366f1;
  background: rgba(99, 102, 241, 0.05);
}

.config-status {
  margin-top: 4px;
}

.config-status :deep(.arco-alert) {
  border-radius: 12px;
  border: none;
  font-weight: 500;
}

/* 设置项网格 */
.settings-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: auto;
  min-height: auto;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  width: 100%;
  max-width: 100%;
  min-width: 0; /* 允许flex项目缩小 */
  box-sizing: border-box;
}

.setting-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  transform: scaleY(0);
  transition: transform 0.3s ease;
}

.setting-item:hover {
  background: rgba(255, 255, 255, 0.9);
  border-color: rgba(99, 102, 241, 0.2);
  transform: translateX(4px);
}

.setting-item:hover::before {
  transform: scaleY(1);
}

.setting-info {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
  min-width: 0; /* 允许flex项目缩小 */
  max-width: calc(100% - 120px); /* 为右侧控件留出空间 */
  overflow: hidden;
}

.setting-icon {
  font-size: 20px;
  color: #6366f1;
  background: rgba(99, 102, 241, 0.1);
  padding: 8px;
  border-radius: 8px;
  flex-shrink: 0;
}

.setting-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0; /* 允许文本区域缩小 */
}

.setting-title {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  line-height: 1.2;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.setting-desc {
  font-size: 13px;
  color: #64748b;
  line-height: 1.3;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.setting-value {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
  max-width: 110px;
  overflow: hidden;
}

.value-text {
  font-size: 14px;
  color: #475569;
  font-weight: 500;
  background: rgba(99, 102, 241, 0.1);
  padding: 4px 12px;
  border-radius: 20px;
}

.arrow-icon {
  font-size: 16px;
  color: #94a3b8;
  transition: all 0.3s ease;
}

.setting-item:hover .arrow-icon {
  color: #6366f1;
  transform: translateX(2px);
}

/* 开关样式 */
.setting-value :deep(.arco-switch) {
  background: #e2e8f0;
}

.setting-value :deep(.arco-switch.arco-switch-checked) {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .settings-content {
    padding: 16px 16px 24px;
    gap: 16px;
  }
  
  .config-input-group {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .config-input {
    width: 100%;
    max-width: 100%;
  }
  
  .config-actions {
    width: 100%;
    max-width: 100%;
    justify-content: stretch;
    flex-direction: row;
  }
  
  .config-actions .arco-btn {
    flex: 1;
    min-width: 0;
  }
  
  .setting-item {
    padding: 14px 16px;
  }
  
  .setting-info {
    gap: 12px;
    max-width: calc(100% - 80px);
  }
  
  .setting-icon {
    font-size: 18px;
    padding: 6px;
  }
  
  .setting-title {
    font-size: 15px;
  }
  
  .setting-desc {
    font-size: 12px;
  }
}

@media (max-width: 480px) {
  .config-actions {
    flex-direction: column;
    gap: 8px;
  }
  
  .config-actions .arco-btn {
    width: 100%;
    flex: none;
  }
  
  .setting-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .setting-value {
    width: 100%;
    max-width: 100%;
    justify-content: space-between;
  }
}
</style>
