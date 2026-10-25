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

<!-- v-html 渲染的是 innerHTML，scoped 选择器命中不到，着色样式必须是全局的 -->
<style>
.code-body .hljs-comment,
.code-body .hljs-quote {
  color: var(--code-comment);
}

.code-body .hljs-keyword,
.code-body .hljs-selector-tag,
.code-body .hljs-literal,
.code-body .hljs-section,
.code-body .hljs-name,
.code-body .hljs-tag,
.code-body .hljs-doctag {
  color: var(--code-keyword);
}

.code-body .hljs-string,
.code-body .hljs-attribute,
.code-body .hljs-symbol,
.code-body .hljs-bullet,
.code-body .hljs-addition,
.code-body .hljs-template-tag,
.code-body .hljs-template-variable,
.code-body .hljs-variable,
.code-body .hljs-regexp {
  color: var(--code-string);
}

.code-body .hljs-number,
.code-body .hljs-deletion,
.code-body .hljs-selector-attr,
.code-body .hljs-selector-pseudo {
  color: var(--code-number);
}

.code-body .hljs-title,
.code-body .hljs-title.function_,
.code-body .hljs-built_in,
.code-body .hljs-type,
.code-body .hljs-class .hljs-title,
.code-body .hljs-meta {
  color: var(--code-function);
}

.code-body .hljs-emphasis {
  font-style: italic;
}

.code-body .hljs-strong {
  font-weight: 600;
}
</style>