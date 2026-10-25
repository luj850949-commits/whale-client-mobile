import { marked } from 'marked'
import hljs from 'highlight.js/lib/core'
import bash from 'highlight.js/lib/languages/bash'
import css from 'highlight.js/lib/languages/css'
import javascript from 'highlight.js/lib/languages/javascript'
import json from 'highlight.js/lib/languages/json'
import markdown from 'highlight.js/lib/languages/markdown'
import python from 'highlight.js/lib/languages/python'
import sql from 'highlight.js/lib/languages/sql'
import typescript from 'highlight.js/lib/languages/typescript'
import xml from 'highlight.js/lib/languages/xml'

// 按需注册语言，不引全量语言包，免得把 App 体积撑起来
const LANGUAGES = { bash, css, javascript, json, markdown, python, sql, typescript, xml }
Object.entries(LANGUAGES).forEach(([name, language]) => hljs.registerLanguage(name, language))

// breaks: 单换行也当换行，更贴近聊天习惯
marked.setOptions({ gfm: true, breaks: true })

const FENCE_OPEN = /^\s*```(\S*)\s*$/
const FENCE_CLOSE = /^\s*```\s*$/

function escapeHtml(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function highlightCode(code, lang) {
  const name = (lang || '').toLowerCase()
  if (name && hljs.getLanguage(name)) {
    return hljs.highlight(code, { language: name }).value
  }
  return escapeHtml(code)
}

/**
 * 把一条消息拆成文本块和代码块。
 * 代码块必须独立成块，才能有自己的复制按钮和横向滚动。
 * 返回的 html 已可直接 v-html，代码块的 html 是 highlight.js 的着色结果。
 */
export function splitMessage(content) {
  const lines = String(content || '').split('\n')
  const blocks = []
  let textLines = []

  const flushText = () => {
    const raw = textLines.join('\n').trim()
    textLines = []
    if (raw) blocks.push({ type: 'text', html: marked.parse(raw) })
  }

  let i = 0
  while (i < lines.length) {
    const fence = lines[i].match(FENCE_OPEN)
    if (!fence) {
      textLines.push(lines[i])
      i += 1
      continue
    }

    flushText()
    const lang = fence[1] || ''
    const codeLines = []
    i += 1
    // 流式输出时收尾的 ``` 可能还没吐出来，那就先按代码块渲染，避免露出裸的 ``` 标记
    while (i < lines.length && !FENCE_CLOSE.test(lines[i])) {
      codeLines.push(lines[i])
      i += 1
    }
    if (i < lines.length) i += 1

    const code = codeLines.join('\n')
    blocks.push({ type: 'code', lang, code, html: highlightCode(code, lang) })
  }

  flushText()
  return blocks
}