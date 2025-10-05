<template>
  <ActionDialog
    :visible="visible"
    :title="config.title || '帮助信息'"
    :width="config.width || 700"
    :height="config.height"
    :canceled-on-touch-outside="!config.keep"
    :module="module"
    :extend="extend"
    :api-url="apiUrl"
    @close="handleClose"
    @toast="(message, type) => emit('toast', message, type)"
    @reset="() => emit('reset')"
  >
    <div class="help-action-modern">
      <!-- 帮助内容 -->
      <div class="help-content-modern">
        <!-- 消息文本 -->
        <div v-if="config.msg" class="help-message-modern glass-effect gradient-primary">
          <div class="message-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 16v-4"/>
              <path d="M12 8h.01"/>
            </svg>
          </div>
          <div 
            class="message-text-modern"
            v-html="formattedMessage"
          ></div>
        </div>

        <!-- 图片 -->
        <div v-if="config.img" class="help-image-modern">
          <div class="image-container glass-effect">
            <img
              :src="config.img"
              :alt="config.imgAlt || '帮助图片'"
              class="image-content-modern"
              @load="onImageLoad"
              @error="onImageError"
            />
            <div v-if="imageError" class="image-error-modern">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7,10 12,15 17,10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              <span>图片加载失败</span>
            </div>
          </div>
        </div>

        <!-- 二维码 -->
        <div v-if="config.qr" class="help-qrcode-modern">
          <div class="qrcode-container-modern glass-effect">
            <div class="qrcode-header">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="5" height="5"/>
                <rect x="16" y="3" width="5" height="5"/>
                <rect x="3" y="16" width="5" height="5"/>
                <path d="M21 16h-3a2 2 0 0 0-2 2v3"/>
                <path d="M21 21v.01"/>
                <path d="M12 7v3a2 2 0 0 1-2 2H7"/>
                <path d="M3 12h.01"/>
                <path d="M12 3h.01"/>
                <path d="M12 16v.01"/>
                <path d="M16 12h1"/>
                <path d="M21 12v.01"/>
                <path d="M12 21v-1"/>
              </svg>
              <span>扫描二维码</span>
            </div>
            <div class="qrcode-image-wrapper">
              <img
                :src="config.qr"
                alt="二维码"
                class="qrcode-image-modern"
                @load="onQrLoad"
                @error="onQrError"
              />
              <div v-if="qrError" class="qrcode-error-modern">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="15" y1="9" x2="9" y2="15"/>
                  <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
                <span>二维码加载失败</span>
              </div>
            </div>
            <div v-if="config.qrText" class="qrcode-text-modern">
              {{ config.qrText }}
            </div>
          </div>
        </div>

        <!-- 详细信息 -->
        <div v-if="config.details" class="help-details-modern">
          <div class="section-header">
            <div class="section-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14,2 14,8 20,8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10,9 9,9 8,9"/>
              </svg>
            </div>
            <h3 class="section-title">详细信息</h3>
          </div>
          <div class="details-content-modern">
            <div
              v-for="(detail, index) in detailsList"
              :key="index"
              class="detail-card glass-effect"
            >
              <div v-if="detail.title" class="detail-title-modern">
                {{ detail.title }}
              </div>
              <div class="detail-text-modern" v-html="detail.content"></div>
            </div>
          </div>
        </div>

        <!-- 步骤说明 -->
        <div v-if="config.steps" class="help-steps-modern">
          <div class="section-header">
            <div class="section-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
            <h3 class="section-title">操作步骤</h3>
          </div>
          <div class="steps-content-modern">
            <div
              v-for="(step, index) in stepsList"
              :key="index"
              class="step-card glass-effect"
            >
              <div class="step-number-modern">{{ index + 1 }}</div>
              <div class="step-content-modern">
                <div v-if="step.title" class="step-title-modern">
                  {{ step.title }}
                </div>
                <div class="step-text-modern" v-html="step.content"></div>
                <div v-if="step.image" class="step-image-modern">
                  <img
                    :src="step.image"
                    :alt="step.title || `步骤${index + 1}`"
                    class="step-img-modern"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- FAQ -->
        <div v-if="config.faq" class="help-faq-modern">
          <div class="section-header">
            <div class="section-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                <path d="M12 17h.01"/>
              </svg>
            </div>
            <h3 class="section-title">常见问题</h3>
          </div>
          <div class="faq-content-modern">
            <div
              v-for="(item, index) in faqList"
              :key="index"
              class="faq-card glass-effect"
              :class="{ expanded: expandedFaq === index }"
            >
              <div 
                class="faq-question-modern"
                @click="toggleFaq(index)"
              >
                <div class="question-content">
                  <div class="question-icon-wrapper">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                      <path d="M12 17h.01"/>
                    </svg>
                  </div>
                  <span class="question-text-modern">{{ item.question }}</span>
                </div>
                <div class="expand-icon" :class="{ rotated: expandedFaq === index }">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="6,9 12,15 18,9"/>
                  </svg>
                </div>
              </div>
              <div v-show="expandedFaq === index" class="faq-answer-modern">
                <div class="answer-text-modern" v-html="item.answer"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- 链接列表 -->
        <div v-if="config.links" class="help-links-modern">
          <div class="section-header">
            <div class="section-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
              </svg>
            </div>
            <h3 class="section-title">相关链接</h3>
          </div>
          <div class="links-content-modern">
            <a
              v-for="(link, index) in linksList"
              :key="index"
              :href="link.url"
              :target="link.target || '_blank'"
              class="link-card glass-effect"
              @click="onLinkClick(link)"
            >
              <div class="link-icon-modern">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                  <polyline points="15,3 21,3 21,9"/>
                  <line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
              </div>
              <div class="link-content">
                <span class="link-text-modern">{{ link.title }}</span>
                <span v-if="link.description" class="link-desc-modern">
                  {{ link.description }}
                </span>
              </div>
              <div class="link-arrow">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="9,18 15,12 9,6"/>
                </svg>
              </div>
            </a>
          </div>
        </div>

        <!-- 联系信息 -->
        <div v-if="config.contact" class="help-contact-modern">
          <div class="section-header">
            <div class="section-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
            </div>
            <h3 class="section-title">联系我们</h3>
          </div>
          <div class="contact-content-modern">
            <div v-if="config.contact.email" class="contact-card glass-effect">
              <div class="contact-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </div>
              <div class="contact-info">
                <span class="contact-label-modern">邮箱</span>
                <a :href="`mailto:${config.contact.email}`" class="contact-value-modern">
                  {{ config.contact.email }}
                </a>
              </div>
            </div>
            <div v-if="config.contact.phone" class="contact-card glass-effect">
              <div class="contact-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
              </div>
              <div class="contact-info">
                <span class="contact-label-modern">电话</span>
                <a :href="`tel:${config.contact.phone}`" class="contact-value-modern">
                  {{ config.contact.phone }}
                </a>
              </div>
            </div>
            <div v-if="config.contact.website" class="contact-card glass-effect">
              <div class="contact-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="2" y1="12" x2="22" y2="12"/>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                </svg>
              </div>
              <div class="contact-info">
                <span class="contact-label-modern">网站</span>
                <a :href="config.contact.website" target="_blank" class="contact-value-modern">
                  {{ config.contact.website }}
                </a>
              </div>
            </div>
            <div v-if="config.contact.address" class="contact-card glass-effect">
              <div class="contact-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
              </div>
              <div class="contact-info">
                <span class="contact-label-modern">地址</span>
                <span class="contact-value-modern">{{ config.contact.address }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 超时提示 -->
      <div v-if="config.timeout && timeLeft > 0" class="help-timeout-modern glass-effect">
        <div class="timeout-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12,6 12,12 16,14"/>
          </svg>
        </div>
        <span>{{ timeLeft }}秒后自动关闭</span>
      </div>
    </div>

    <template #footer>
      <div class="action-dialog-footer">
        <!-- 打印按钮 -->
        <button
          v-if="config.allowPrint"
          class="btn-modern btn-secondary"
          @click="handlePrint"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6,9 6,2 18,2 18,9"/>
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
            <rect x="6" y="14" width="12" height="8"/>
          </svg>
          <span>打印</span>
        </button>
        
        <!-- 复制按钮 -->
        <button
          v-if="config.allowCopy"
          class="btn-modern btn-secondary"
          @click="handleCopy"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
          <span>复制内容</span>
        </button>
        
        <!-- 关闭按钮 -->
        <button
          class="btn-modern btn-primary"
          @click="handleClose"
        >
          <span>{{ config.closeText || '关闭' }}</span>
        </button>
      </div>
    </template>
  </ActionDialog>
</template>

<script>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import ActionDialog from './ActionDialog.vue'

export default {
  name: 'HelpAction',
  components: {
    ActionDialog
  },
  props: {
    config: {
      type: Object,
      required: true
    },
    visible: {
      type: Boolean,
      default: true
    },
    // T4接口调用相关属性
    module: {
      type: String,
      default: ''
    },
    extend: {
      type: [Object, String],
      default: () => ({})
    },
    apiUrl: {
      type: String,
      default: ''
    }
  },
  emits: ['close', 'link-click', 'toast', 'reset'],
  setup(props, { emit }) {
    const imageError = ref(false)
    const qrError = ref(false)
    const expandedFaq = ref(-1)
    const timeLeft = ref(0)
    const timer = ref(null)

    // 计算属性
    const formattedMessage = computed(() => {
      if (!props.config.msg) return ''
      
      // 如果消息已经包含HTML标签，直接返回
      if (/<[^>]+>/.test(props.config.msg)) {
        return props.config.msg
      }
      
      // 否则支持简单的 Markdown 格式转换
      return props.config.msg
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code>$1</code>')
        .replace(/\n/g, '<br>')
    })

    const detailsList = computed(() => {
      if (!props.config.details) return []
      
      if (Array.isArray(props.config.details)) {
        return props.config.details
      }
      
      if (typeof props.config.details === 'string') {
        return [{ content: props.config.details }]
      }
      
      return [props.config.details]
    })

    const stepsList = computed(() => {
      if (!props.config.steps) return []
      
      if (Array.isArray(props.config.steps)) {
        return props.config.steps
      }
      
      return []
    })

    const faqList = computed(() => {
      if (!props.config.faq) return []
      
      if (Array.isArray(props.config.faq)) {
        return props.config.faq
      }
      
      return []
    })

    const linksList = computed(() => {
      if (!props.config.links) return []
      
      if (Array.isArray(props.config.links)) {
        return props.config.links
      }
      
      return []
    })

    // 方法
    const onImageLoad = () => {
      imageError.value = false
    }

    const onImageError = () => {
      imageError.value = true
    }

    const onQrLoad = () => {
      qrError.value = false
    }

    const onQrError = () => {
      qrError.value = true
    }

    const toggleFaq = (index) => {
      expandedFaq.value = expandedFaq.value === index ? -1 : index
    }

    const onLinkClick = (link) => {
      emit('link-click', link)
    }

    const handlePrint = () => {
      try {
        window.print()
      } catch (err) {
        console.warn('打印功能不可用:', err)
      }
    }

    const handleCopy = async () => {
      try {
        // 收集所有文本内容
        const content = []
        
        if (props.config.msg) {
          content.push(props.config.msg)
        }
        
        if (props.config.details) {
          content.push('\n详细信息:')
          detailsList.value.forEach(detail => {
            if (detail.title) content.push(`${detail.title}:`)
            content.push(detail.content.replace(/<[^>]*>/g, ''))
          })
        }
        
        if (props.config.steps) {
          content.push('\n操作步骤:')
          stepsList.value.forEach((step, index) => {
            content.push(`${index + 1}. ${step.title || ''}`)
            content.push(step.content.replace(/<[^>]*>/g, ''))
          })
        }
        
        if (props.config.faq) {
          content.push('\n常见问题:')
          faqList.value.forEach(item => {
            content.push(`Q: ${item.question}`)
            content.push(`A: ${item.answer.replace(/<[^>]*>/g, '')}`)
          })
        }
        
        const text = content.join('\n')
        
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(text)
        } else {
          // 降级方案
          const textarea = document.createElement('textarea')
          textarea.value = text
          document.body.appendChild(textarea)
          textarea.select()
          document.execCommand('copy')
          document.body.removeChild(textarea)
        }
        
        // 可以添加成功提示
        console.log('内容已复制到剪贴板')
      } catch (err) {
        console.warn('复制失败:', err)
      }
    }

    const handleClose = () => {
      emit('close')
    }

    // 超时处理
    const startTimeout = () => {
      if (!props.config.timeout || props.config.timeout <= 0) return

      timeLeft.value = props.config.timeout
      timer.value = setInterval(() => {
        timeLeft.value--
        if (timeLeft.value <= 0) {
          clearInterval(timer.value)
          handleClose()
        }
      }, 1000)
    }

    const stopTimeout = () => {
      if (timer.value) {
        clearInterval(timer.value)
        timer.value = null
      }
      timeLeft.value = 0
    }

    // 监听显示状态
    watch(() => props.visible, (visible) => {
      if (visible) {
        startTimeout()
      } else {
        stopTimeout()
      }
    })

    onMounted(() => {
      if (props.visible && props.config.timeout) {
        startTimeout()
      }
    })

    onUnmounted(() => {
      stopTimeout()
    })

    return {
      imageError,
      qrError,
      expandedFaq,
      timeLeft,
      formattedMessage,
      detailsList,
      stepsList,
      faqList,
      linksList,
      onImageLoad,
      onImageError,
      onQrLoad,
      onQrError,
      toggleFaq,
      onLinkClick,
      handlePrint,
      handleCopy,
      handleClose
    }
  }
}
</script>

<style scoped>
/* 主容器 */
.help-action-modern {
  padding: 0;
  max-height: 85vh;
  overflow: hidden;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
}

/* 内容区域 */
.help-content-modern {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 24px;
  max-height: calc(85vh - 80px);
  overflow-y: auto;
}

/* 毛玻璃效果 */
.glass-effect {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

/* 消息区域 */
.help-message-modern {
  padding: 24px;
  border-radius: 16px;
  font-size: 16px;
  line-height: 1.7;
  color: #2d3748;
  white-space: pre-wrap;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.7) 100%);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.help-message-modern:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

.message-icon {
  width: 24px;
  height: 24px;
  color: #4299e1;
  margin-bottom: 12px;
}

.message-text-modern {
  line-height: 1.6;
  color: #2d3748;
}

/* 图片区域 */
.help-image-modern {
  text-align: center;
  margin-bottom: 16px;
}

.image-container {
  display: inline-block;
  padding: 16px;
  border-radius: 16px;
  transition: all 0.3s ease;
}

.image-container:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

.image-content-modern {
  max-width: 100%;
  max-height: 300px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.image-content-modern:hover {
  transform: scale(1.02);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
}

.image-error-modern {
  color: #e53e3e;
  font-size: 14px;
  margin-top: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.image-error-modern svg {
  width: 16px;
  height: 16px;
}

/* 二维码区域 */
.help-qrcode-modern {
  text-align: center;
  margin-bottom: 16px;
}

.qrcode-container-modern {
  display: inline-block;
  padding: 20px;
  border-radius: 16px;
  transition: all 0.3s ease;
}

.qrcode-container-modern:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

.qrcode-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 16px;
  color: #4299e1;
  font-weight: 500;
}

.qrcode-header svg {
  width: 20px;
  height: 20px;
}

.qrcode-image-wrapper {
  position: relative;
}

.qrcode-image-modern {
  width: 150px;
  height: 150px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.qrcode-image-modern:hover {
  transform: scale(1.05);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
}

.qrcode-error-modern {
  color: #e53e3e;
  font-size: 14px;
  margin-top: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.qrcode-error-modern svg {
  width: 16px;
  height: 16px;
}

.qrcode-text-modern {
  margin-top: 12px;
  font-size: 14px;
  color: #718096;
  font-weight: 500;
}

/* 通用区域样式 */
.help-details-modern,
.help-steps-modern,
.help-faq-modern,
.help-links-modern,
.help-contact-modern {
  padding: 24px;
  border-radius: 16px;
  transition: all 0.3s ease;
  margin-bottom: 16px;
}

.help-details-modern:hover,
.help-steps-modern:hover,
.help-faq-modern:hover,
.help-links-modern:hover,
.help-contact-modern:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

.help-details-modern {
  border-left: 4px solid #4299e1;
}

.help-steps-modern {
  border-left: 4px solid #48bb78;
}

.help-faq-modern {
  border-left: 4px solid #ed8936;
}

.help-links-modern {
  border-left: 4px solid #38b2ac;
}

.help-contact-modern {
  border-left: 4px solid #9f7aea;
}

/* 通用区域标题 */
.section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.section-icon {
  width: 24px;
  height: 24px;
  color: #4299e1;
  flex-shrink: 0;
}

.section-title {
  margin: 0;
  color: #2d3748;
  font-size: 18px;
  font-weight: 600;
  background: linear-gradient(135deg, #4299e1, #667eea);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* 详细信息内容 */
.details-content-modern {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-card {
  padding: 16px 20px;
  border-radius: 12px;
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.detail-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
}

.detail-title-modern {
  font-weight: 500;
  margin-bottom: 8px;
  color: #2d3748;
  font-size: 16px;
}

.detail-text-modern {
  line-height: 1.6;
  color: #4a5568;
}

/* 步骤内容 */
.steps-content-modern {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.step-card {
  display: flex;
  padding: 20px;
  border-radius: 12px;
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.step-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
}

.step-number-modern {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #48bb78, #38a169);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  margin-right: 16px;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(72, 187, 120, 0.3);
}

.step-content-modern {
  flex: 1;
}

.step-title-modern {
  font-weight: 500;
  margin-bottom: 8px;
  color: #2d3748;
  font-size: 16px;
}

.step-text-modern {
  line-height: 1.6;
  color: #4a5568;
  margin-bottom: 12px;
}

.step-image-modern {
  margin-top: 12px;
}

.step-img-modern {
  max-width: 100%;
  max-height: 200px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* FAQ内容 */
.faq-content-modern {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.faq-card {
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.faq-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

.faq-card.expanded {
  box-shadow: 0 12px 40px rgba(66, 153, 225, 0.2);
}

.faq-question-modern {
  padding: 20px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.1);
}

.faq-question-modern:hover {
  background: rgba(255, 255, 255, 0.2);
}

.question-content {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.question-icon-wrapper {
  width: 20px;
  height: 20px;
  color: #4299e1;
  flex-shrink: 0;
}

.question-text-modern {
  font-weight: 500;
  color: #2d3748;
  font-size: 16px;
}

.expand-icon {
  width: 20px;
  height: 20px;
  color: #4299e1;
  transition: transform 0.3s ease;
  flex-shrink: 0;
}

.expand-icon.rotated {
  transform: rotate(180deg);
}

.faq-answer-modern {
  background: rgba(255, 255, 255, 0.05);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.answer-text-modern {
  padding: 20px;
  line-height: 1.6;
  color: #4a5568;
}

/* 链接内容 */
.links-content-modern {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.link-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  border-radius: 12px;
  text-decoration: none;
  color: #2d3748;
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.link-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
  text-decoration: none;
  color: #4299e1;
  background: rgba(66, 153, 225, 0.1);
}

.link-icon-modern {
  width: 20px;
  height: 20px;
  color: #4299e1;
  flex-shrink: 0;
}

.link-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.link-text-modern {
  font-weight: 500;
  font-size: 16px;
}

.link-desc-modern {
  font-size: 14px;
  color: #718096;
}

.link-arrow {
  width: 16px;
  height: 16px;
  color: #a0aec0;
  flex-shrink: 0;
  transition: all 0.3s ease;
}

.link-card:hover .link-arrow {
  color: #4299e1;
  transform: translateX(4px);
}

/* 联系信息内容 */
.contact-content-modern {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}

.contact-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  border-radius: 12px;
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.contact-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
}

.contact-icon {
  width: 24px;
  height: 24px;
  color: #9f7aea;
  flex-shrink: 0;
}

.contact-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.contact-label-modern {
  font-size: 14px;
  color: #718096;
  font-weight: 500;
}

.contact-value-modern {
  color: #4299e1;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.3s ease;
}

.contact-value-modern:hover {
  color: #2b6cb0;
  text-decoration: underline;
}

/* 超时提示 */
.help-timeout-modern {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 16px 24px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(255, 193, 7, 0.9) 0%, rgba(255, 152, 0, 0.9) 100%);
  color: #744210;
  font-weight: 500;
  margin-top: 24px;
  animation: pulse 2s infinite;
}

.timeout-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
}

/* 底部按钮 */
.action-dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 24px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.btn-modern {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.btn-modern::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.btn-modern:hover::before {
  left: 100%;
}

.btn-modern svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.1);
  color: #4a5568;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.2);
  color: #2d3748;
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.btn-primary {
  background: linear-gradient(135deg, #4299e1, #667eea);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.btn-primary:hover {
  background: linear-gradient(135deg, #3182ce, #5a67d8);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(66, 153, 225, 0.4);
}

.btn-modern:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
}

/* 代码样式 */
.help-content-modern :deep(code) {
  background: rgba(66, 153, 225, 0.1);
  color: #2b6cb0;
  padding: 4px 8px;
  border-radius: 6px;
  font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
  font-size: 0.9em;
  font-weight: 500;
}

.help-content-modern :deep(pre) {
  background: rgba(45, 55, 72, 0.9);
  color: #e2e8f0;
  padding: 20px;
  border-radius: 12px;
  overflow-x: auto;
  border-left: 4px solid #4299e1;
  margin: 16px 0;
}

.help-content-modern :deep(pre code) {
  background: none;
  color: inherit;
  padding: 0;
}

.help-content-modern :deep(strong) {
  font-weight: 600;
  color: #2d3748;
}

.help-content-modern :deep(em) {
  font-style: italic;
  color: #4a5568;
}

/* 滚动条样式 */
.help-content-modern::-webkit-scrollbar {
  width: 8px;
}

.help-content-modern::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

.help-content-modern::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 4px;
}

.help-content-modern::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .help-action-modern {
    max-height: 90vh;
  }
  
  .help-content-modern {
    padding: 16px;
    gap: 16px;
    max-height: calc(90vh - 70px);
  }
  
  .help-message-modern,
  .help-details-modern,
  .help-steps-modern,
  .help-faq-modern,
  .help-links-modern,
  .help-contact-modern {
    padding: 16px;
  }
  
  .step-card {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .step-number-modern {
    margin-right: 0;
    margin-bottom: 12px;
  }
  
  .contact-content-modern {
    grid-template-columns: 1fr;
  }
  
  .action-dialog-footer {
    flex-direction: column;
    gap: 8px;
    padding: 16px;
  }
  
  .btn-modern {
    width: 100%;
    justify-content: center;
  }
  
  .section-title {
    font-size: 16px;
  }
  
  .link-card {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .link-arrow {
    align-self: flex-end;
  }
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .help-action-modern {
    background: linear-gradient(135deg, #2d3748 0%, #4a5568 100%);
  }
  
  .glass-effect {
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .help-message-modern,
  .help-details-modern,
  .help-steps-modern,
  .help-faq-modern,
  .help-links-modern,
  .help-contact-modern {
    background: linear-gradient(135deg, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.1) 100%);
    color: #e2e8f0;
  }
  
  .section-title,
  .question-text-modern,
  .link-text-modern,
  .message-text-modern,
  .detail-title-modern,
  .step-title-modern {
    color: #e2e8f0;
  }
  
  .detail-text-modern,
  .step-text-modern,
  .answer-text-modern {
    color: #cbd5e0;
  }
}

/* 高对比度模式 */
@media (prefers-contrast: high) {
  .glass-effect {
    background: rgba(255, 255, 255, 0.95);
    border: 2px solid #000;
  }
  
  .btn-modern {
    border: 2px solid #000;
  }
  
  .section-title,
  .question-text-modern,
  .link-text-modern {
    color: #000;
    font-weight: 700;
  }
}

/* 减少动画模式 */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  
  .btn-modern::before {
    display: none;
  }
}
</style>