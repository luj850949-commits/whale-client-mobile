<template>
  <view class="md-root">
    <template v-for="(block, index) in blocks" :key="index">
      <CodeBlock
        v-if="block.type === 'code'"
        :code="block.code"
        :lang="block.lang"
        :html="block.html"
      />
      <view v-else class="md-body" v-html="block.html"></view>
    </template>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import CodeBlock from './CodeBlock.vue'
import { splitMessage } from '../utils/markdown'

const props = defineProps({
  content: { type: String, default: '' },
  streaming: { type: Boolean, default: false },
})

const CARET = '<span class="md-caret">▍</span>'

// 光标要保持在行内，所以插在最后一个闭合标签之前，而不是直接拼在末尾
function withCaret(html) {
  const index = html.lastIndexOf('</')
  if (index === -1) return html + CARET
  return html.slice(0, index) + CARET + html.slice(index)
}

const blocks = computed(() => {
  const list = splitMessage(props.content)
  if (!props.streaming) return list

  for (let i = list.length - 1; i >= 0; i -= 1) {
    if (list[i].type === 'text') {
      return list.map((block, index) =>
        index === i ? { ...block, html: withCaret(block.html) } : block
      )
    }
  }
  // 全是代码块时没有文本块可挂，补一个只含光标的块，保证空内容也能看到光标
  return [...list, { type: 'text', html: `<p>${CARET}</p>` }]
})
</script>

<!-- v-html 渲染的是 innerHTML，没有 scoped 的 data-v 属性，样式必须是全局的 -->
<style>
.md-root {
  display: flex !important;
  flex-direction: column !important;
  align-items: stretch;
}

.md-body {
  width: 100%;
  font-size: 15px;
  line-height: 1.6;
  word-break: break-word;
}

/* 首尾元素不要多余外边距，免得气泡上下留白过大 */
.md-body > :first-child {
  margin-top: 0 !important;
}

.md-body > :last-child {
  margin-bottom: 0 !important;
}

.md-body p {
  margin: 0 0 8px !important;
}

.md-body h1,
.md-body h2,
.md-body h3,
.md-body h4,
.md-body h5,
.md-body h6 {
  margin: 12px 0 6px !important;
  font-weight: 600;
  line-height: 1.35;
}

.md-body h1 {
  font-size: 19px;
}

.md-body h2 {
  font-size: 17px;
}

.md-body h3 {
  font-size: 16px;
}

.md-body h4,
.md-body h5,
.md-body h6 {
  font-size: 15px;
}

.md-body ul,
.md-body ol {
  margin: 0 0 8px !important;
  padding-left: 20px !important;
}

.md-body li {
  margin: 2px 0 !important;
}

.md-body li > ul,
.md-body li > ol {
  margin: 2px 0 !important;
}

.md-body blockquote {
  margin: 8px 0 !important;
  padding: 2px 0 2px 10px !important;
  border-left: 3px solid var(--color-primary);
  color: var(--color-text-secondary);
}

.md-body pre {
  margin: 8px 0 !important;
  overflow-x: auto;
}

.md-body code {
  padding: 1px 5px;
  border-radius: var(--radius-sm);
  background: var(--code-bg);
  color: var(--code-text);
  font-family: ui-monospace, Menlo, Consolas, monospace;
  font-size: 13px;
}

.md-body a {
  color: var(--color-primary);
  text-decoration: underline;
}

.md-body hr {
  margin: 12px 0 !important;
  border: none;
  border-top: 1px solid var(--color-border);
}

.md-body strong {
  font-weight: 600;
}

.md-body em {
  font-style: italic;
}

.md-body del {
  text-decoration: line-through;
  color: var(--color-text-disabled);
}

.md-body table {
  display: block;
  width: 100%;
  margin: 8px 0 !important;
  overflow-x: auto;
  border-collapse: collapse;
  font-size: 14px;
}

.md-body th,
.md-body td {
  padding: 5px 10px;
  border: 1px solid var(--color-border);
  text-align: left;
}

.md-body th {
  background: var(--color-surface-hover);
  font-weight: 600;
}

/* 用户气泡是主色底，链接和引用得跟着反色，否则看不见 */
.bubble-user .md-body a {
  color: inherit;
}

.bubble-user .md-body blockquote {
  border-left-color: var(--color-on-primary);
  color: inherit;
}

.md-caret {
  color: var(--color-primary);
  animation: md-caret-blink 1s steps(1) infinite;
}

.bubble-user .md-caret {
  color: var(--color-on-primary);
}

@keyframes md-caret-blink {
  50% {
    opacity: 0;
  }
}
</style>