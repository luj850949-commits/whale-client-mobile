<template>
  <view class="chat-page" :style="{ paddingBottom: pagePadding + 'px' }">
    <!-- 顶部栏：会话列表入口 + 当前会话标题 + 新建 -->
    <view class="top-bar">
      <view class="top-btn" @click="openDrawer">
        <text class="top-btn-text">会话</text>
      </view>
      <text class="top-title">{{ currentTitle }}</text>
      <view class="top-btn" @click="onNewSession">
        <text class="top-btn-text">新建</text>
      </view>
    </view>

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

        <view
          class="bubble"
          :class="msg.role === 'user' ? 'bubble-user' : 'bubble-ai'"
          @longpress="onMessageLongPress(msg)"
        >
          <MessageContent :content="msg.content" :streaming="msg.status === 'streaming'" />
        </view>
      </view>
    </view>

    <!-- 会话抽屉 -->
    <SessionDrawer
      :visible="drawerOpen"
      :sessions="chat.sessions"
      :current-id="chat.currentSessionId"
      @close="drawerOpen = false"
      @create="onNewSession"
      @select="onSelectSession"
      @remove="onRemoveSession"
    />

    <!-- 底部输入栏 -->
    <view class="composer" :style="{ bottom: keyboardHeight + 'px' }">
      <view class="composer-box">
        <!-- 不设 confirm-type：H5 下回车才会换行而不是直接发送 -->
        <textarea
          v-model="draft"
          class="composer-textarea"
          auto-height
          :maxlength="2000"
          :cursor-spacing="20"
          :show-confirm-bar="false"
          placeholder="发消息…"
          @linechange="syncComposerHeight"
          @focus="onComposerFocus"
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
import { computed, getCurrentInstance, nextTick, ref } from 'vue'
import { onHide, onLoad, onReady, onUnload } from '@dcloudio/uni-app'
import { useChatStore } from '@/stores/chat'
import MessageContent from './components/MessageContent.vue'
import SessionDrawer from './components/SessionDrawer.vue'
import { createMockReply } from './utils/mockReply'

// 打字机节奏：每 32ms 吐 2 个字
const TICK_MS = 32
const CHARS_PER_TICK = 2

const chat = useChatStore()
const messages = computed(() => chat.messages)

const instance = getCurrentInstance()
const draft = ref('')
const isStreaming = ref(false)
const canSend = computed(() => draft.value.trim().length > 0)
const drawerOpen = ref(false)
const currentTitle = computed(() => chat.currentSession?.title || '新对话')

// 输入栏高度随行数变化，页面底部留白要跟着算，否则最后一条消息会被挡住
const pagePadding = ref(96)
// App 端软键盘高度，H5 由浏览器自己 resize，这里始终为 0
const keyboardHeight = ref(0)

let timer = null
let streamingId = ''
let composerEl = null

onLoad(() => {
  chat.load()
  chat.ensureSession()
  nextTick(scrollToBottom)

  // 键盘高度事件只有 App 与小程序有，H5 靠浏览器自身 resize
  if (uni.onKeyboardHeightChange) uni.onKeyboardHeightChange(onKeyboardChange)
})

onReady(() => {
  syncComposerHeight()
  bindComposerKeys()
})

// 离开页面时把没跑完的回复收尾，避免状态卡住
onHide(stopReply)
onUnload(() => {
  stopReply()
  if (uni.offKeyboardHeightChange) uni.offKeyboardHeightChange(onKeyboardChange)
  if (composerEl) composerEl.removeEventListener('keydown', onComposerKeydown)
})

function scrollToBottom(duration = 200) {
  uni.pageScrollTo({ scrollTop: 999999, duration })
}

// uni-textarea 不转发键盘事件，只能拿到内部真实 textarea 自己绑
function bindComposerKeys() {
  if (typeof document === 'undefined') return
  const el = document.querySelector('.composer-textarea textarea')
  if (!el || el === composerEl) return
  composerEl = el
  el.addEventListener('keydown', onComposerKeydown)
}

// 回车发送，Shift + Enter 换行；输入法选词时的回车要放行
function onComposerKeydown(event) {
  if (event.key !== 'Enter' || event.shiftKey) return
  if (event.isComposing || event.keyCode === 229) return

  event.preventDefault()
  send()
}

function syncComposerHeight() {
  nextTick(() => {
    uni
      .createSelectorQuery()
      .in(instance.proxy)
      .select('.composer')
      .boundingClientRect((rect) => {
        if (rect) pagePadding.value = rect.height + keyboardHeight.value + 16
      })
      .exec()
    scrollComposerToCaret()
  })
}

// auto-height 先撑到 8 行的高度、再被 max-height 截断，浏览器不会自己把光标滚回可视区
function scrollComposerToCaret() {
  if (typeof document === 'undefined') return
  const el = document.querySelector('.composer-textarea textarea')
  if (el) el.scrollTop = el.scrollHeight
}

// 键盘弹出是异步的，等它落定再把最后一条消息顶进可视区
function onComposerFocus() {
  setTimeout(() => scrollToBottom(0), 300)
}

function onKeyboardChange(res) {
  keyboardHeight.value = res.height || 0
  syncComposerHeight()
  nextTick(() => scrollToBottom(0))
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
  runStreaming(aiMsg.id, full)
}

// 往指定消息里逐字吐内容，新建回复和重新生成共用
function runStreaming(messageId, full) {
  streamingId = messageId
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

function openDrawer() {
  drawerOpen.value = true
}

// 切走之前必须先收尾，否则正在流式的那条消息会留在旧会话里卡住
function leaveCurrentReply() {
  if (isStreaming.value) stopReply()
}

function onNewSession() {
  leaveCurrentReply()
  chat.newSession()
  draft.value = ''
  drawerOpen.value = false
  nextTick(scrollToBottom)
}

function onSelectSession(id) {
  drawerOpen.value = false
  if (id === chat.currentSessionId) return

  leaveCurrentReply()
  chat.switchSession(id)
  nextTick(scrollToBottom)
}

function onRemoveSession(id) {
  // 删除即丢聊天记录，先确认一次
  uni.showModal({
    title: '删除对话',
    content: '删除后无法恢复，确定删除吗？',
    confirmText: '删除',
    success: (res) => {
      if (!res.confirm) return
      if (isStreaming.value && id === chat.currentSessionId) leaveCurrentReply()
      chat.deleteSession(id)
      drawerOpen.value = false
      nextTick(scrollToBottom)
    },
  })
}

// 长按消息弹操作菜单，AI 消息才有「重新生成」
function onMessageLongPress(msg) {
  const actions = msg.role === 'ai' ? ['复制全文', '重新生成', '删除消息'] : ['复制全文', '删除消息']

  uni.showActionSheet({
    itemList: actions,
    success: ({ tapIndex }) => {
      if (tapIndex === 0) copyMessage(msg)
      else if (msg.role === 'ai' && tapIndex === 1) regenerateMessage(msg)
      else confirmRemoveMessage(msg)
    },
  })
}

function copyMessage(msg) {
  uni.setClipboardData({ data: msg.content })
}

// 重新生成：以这条 AI 回复前最近的一条用户消息为输入，复跑一次流式输出
function regenerateMessage(msg) {
  const list = chat.messages
  const index = list.findIndex((m) => m.id === msg.id)
  if (index <= 0) return

  let userText = ''
  for (let i = index - 1; i >= 0; i -= 1) {
    if (list[i].role === 'user') {
      userText = list[i].content
      break
    }
  }
  if (!userText) return

  leaveCurrentReply()
  chat.updateMessage(msg.id, { content: '', status: 'streaming' })
  runStreaming(msg.id, createMockReply(userText))
}

function confirmRemoveMessage(msg) {
  uni.showModal({
    title: '删除消息',
    content: '删除后无法恢复，确定删除吗？',
    confirmText: '删除',
    success: (res) => {
      if (!res.confirm) return
      if (isStreaming.value && msg.id === streamingId) leaveCurrentReply()
      chat.removeMessage(msg.id)
    },
  })
}
</script>

<style scoped>
.chat-page {
  min-height: 100vh;
  padding: calc(68px + var(--status-bar-height)) 16px 96px;
  box-sizing: border-box;
}

/* 自定义顶栏，页面已在 pages.json 关掉原生导航栏 */
.top-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex !important;
  flex-direction: row !important;
  align-items: center;
  justify-content: space-between;
  height: calc(52px + var(--status-bar-height));
  padding: var(--status-bar-height) 8px 0;
  box-sizing: border-box;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
}

.top-btn {
  padding: 6px 10px;
}

.top-btn-text {
  font-size: 14px;
  color: var(--color-primary);
}

.top-title {
  display: block !important;
  flex: 1;
  min-width: 0;
  text-align: center;
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
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
  align-items: flex-end;
  gap: 10px;
  padding: 6px 4px 6px 16px;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
}

.composer-textarea {
  flex: 1;
  width: auto;
  max-height: 110px;
  padding: 7px 0;
  box-sizing: border-box;
  font-size: 15px;
  line-height: 1.5;
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

<!-- uni-textarea 内部节点的样式在 src/styles/rich-content.css，scoped 命中不到 -->