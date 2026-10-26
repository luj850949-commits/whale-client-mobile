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

<!-- `.md-root` / `.md-body` 的样式在 src/styles/rich-content.css，v-html 内容拿不到 scoped 属性 -->