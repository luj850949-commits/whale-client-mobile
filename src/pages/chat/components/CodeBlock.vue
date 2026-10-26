<template>
  <view class="code-block">
    <view class="code-head">
      <text class="code-lang">{{ lang || 'text' }}</text>
      <view class="code-copy" @click="copy">
        <text class="code-copy-text">{{ copied ? '已复制' : '复制' }}</text>
      </view>
    </view>

    <scroll-view class="code-scroll" scroll-x>
      <view class="code-body" v-html="html"></view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  code: { type: String, default: '' },
  lang: { type: String, default: '' },
  html: { type: String, default: '' },
})

const copied = ref(false)
let timer = null

function copy() {
  // 复制原始代码，不是着色后的 HTML
  uni.setClipboardData({
    data: props.code,
    success: () => {
      copied.value = true
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        copied.value = false
      }, 1500)
    },
  })
}
</script>

<style scoped>
.code-block {
  margin: 10px 0;
  background: var(--code-bg);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.code-head {
  display: flex !important;
  flex-direction: row !important;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px;
  border-bottom: 1px solid var(--color-border);
}

.code-lang {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.code-copy {
  padding: 2px 8px;
  border-radius: var(--radius-sm);
}

.code-copy-text {
  font-size: 12px;
  color: var(--color-primary);
}

.code-scroll {
  width: 100%;
}

.code-body {
  display: inline-block !important;
  min-width: 100%;
  padding: 10px 12px;
  box-sizing: border-box;
  font-family: ui-monospace, Menlo, Consolas, monospace;
  font-size: 13px;
  line-height: 1.6;
  color: var(--code-text);
  white-space: pre;
}
</style>

<!-- .code-body 的着色样式在 src/styles/rich-content.css，v-html 内容拿不到 scoped 属性 -->
