<template>
  <view class="chat-page">
    <!-- 后端未接入前，明确回复来源 -->
    <view class="hint">
      <text class="hint-text">本地模拟回复 · 未接入后端</text>
    </view>

    <!-- 消息列表：AI 气泡靠左，用户气泡靠右 -->
    <view class="msg-list">
      <view
        v-for="msg in messages"
        :key="msg.id"
        class="msg-row"
        :class="msg.role === 'user' ? 'is-user' : 'is-ai'"
      >
        <view class="avatar" :class="msg.role === 'user' ? 'avatar-user' : 'avatar-ai'">
          <text class="avatar-text">{{ msg.role === 'user' ? '我' : 'AI' }}</text>
        </view>

        <view class="bubble" :class="msg.role === 'user' ? 'bubble-user' : 'bubble-ai'">
          <MessageContent :content="msg.content" :streaming="msg.status === 'streaming'" />
        </view>
      </view>
    </view>

    <!-- 底部输入栏 -->
    <view class="composer">
      <view class="composer-box">
        <input
          v-model="draft"
          class="composer-input"
          type="text"
          confirm-type="send"
          placeholder="发消息…"
          @confirm="onPrimary"
        />
        <view
          class="send-btn"
          :class="{ 'send-btn-disabled': !isStreaming && !canSend }"
          @click="onPrimary"
        >
          <text class="send-text">{{ isStreaming ? '停止' : '发送' }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, nextTick, ref } from 'vue'
import { onHide, onLoad, onUnload } from '@dcloudio/uni-app'
import { useChatStore } from '@/stores/chat'
import MessageContent from './components/MessageContent.vue'
import { createMockReply } from './utils/mockReply'

// 打字机节奏：每 32ms 吐 2 个字
const TICK_MS = 32
const CHARS_PER_TICK = 2

const chat = useChatStore()
const messages = computed(() => chat.messages)

const draft = ref('')
const isStreaming = ref(false)
const canSend = computed(() => draft.value.trim().length > 0)

let timer = null
let streamingId = ''

onLoad(() => {
  chat.load()
  chat.ensureSession()
  nextTick(scrollToBottom)
})

// 离开页面时把没跑完的回复收尾，避免状态卡住
onHide(stopReply)
onUnload(stopReply)

function scrollToBottom(duration = 200) {
  uni.pageScrollTo({ scrollTop: 999999, duration })
}

function send() {
  const content = draft.value.trim()
  if (!content || isStreaming.value) return

  chat.appendMessage('user', content)
  draft.value = ''
  nextTick(scrollToBottom)
  startReply(content)
}

// 用本地模拟回复跑一遍流式输出，接口就绪后换成真实的流式请求
function startReply(userText) {
  const full = createMockReply(userText)
  const aiMsg = chat.appendMessage('ai', '', { status: 'streaming' })
  streamingId = aiMsg.id
  isStreaming.value = true

  let shown = 0
  timer = setInterval(() => {
    shown += CHARS_PER_TICK
    chat.updateMessage(streamingId, { content: full.slice(0, shown) })
    // 流式期间节流跟滚，避免和每次吐字抢动画
    if (shown % 8 === 0) scrollToBottom(0)
    if (shown >= full.length) stopReply()
  }, TICK_MS)
}

// 结束或手动停止生成，统一收尾并落盘
function stopReply() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
  if (streamingId) {
    chat.updateMessage(streamingId, { status: 'done' })
    streamingId = ''
  }
  isStreaming.value = false
  chat.persist()
  scrollToBottom(0)
}

function onPrimary() {
  if (isStreaming.value) stopReply()
  else send()
}
</script>

<style scoped>
.chat-page {
  min-height: 100vh;
  padding: 16px 16px 96px;
  box-sizing: border-box;
}

.hint {
  display: flex !important;
  justify-content: center;
  margin-bottom: 16px;
}

.hint-text {
  font-size: 12px;
  color: var(--color-text-disabled);
}

.msg-list {
  display: flex !important;
  flex-direction: column !important;
}

.msg-row {
  display: flex !important;
  flex-direction: row !important;
  align-items: flex-start;
  margin-bottom: 16px;
}

/* 用户消息整体镜像，气泡贴右 */
.msg-row.is-user {
  flex-direction: row-reverse !important;
}

.avatar {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex !important;
  align-items: center;
  justify-content: center;
}

.avatar-text {
  font-size: 11px;
}

.avatar-ai {
  background: var(--color-primary-soft);
  color: var(--color-primary);
}

.avatar-user {
  background: var(--color-primary);
  color: var(--color-on-primary);
}

.bubble {
  max-width: 80%;
  margin: 0 10px;
  padding: 10px 14px;
  border-radius: var(--radius-lg);
}

.bubble-ai {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-top-left-radius: 4px;
  color: var(--color-text);
  box-shadow: var(--shadow-sm);
}

.bubble-user {
  background: var(--color-primary);
  border-top-right-radius: 4px;
  color: var(--color-on-primary);
}

.composer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 10px 16px calc(10px + env(safe-area-inset-bottom));
  box-sizing: border-box;
  background: var(--color-surface);
  border-top: 1px solid var(--color-border);
}

.composer-box {
  display: flex !important;
  flex-direction: row !important;
  align-items: center;
  gap: 10px;
  padding: 4px 4px 4px 16px;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-pill);
}

.composer-input {
  flex: 1;
  height: 36px;
  font-size: 15px;
  color: var(--color-text);
}

.send-btn {
  flex-shrink: 0;
  height: 36px;
  padding: 0 18px;
  border-radius: var(--radius-pill);
  display: flex !important;
  align-items: center;
  justify-content: center;
  background: var(--color-primary);
}

.send-btn-disabled {
  background: var(--color-surface-hover);
}

.send-text {
  font-size: 14px;
  color: var(--color-on-primary);
}

.send-btn-disabled .send-text {
  color: var(--color-text-disabled);
}
</style>