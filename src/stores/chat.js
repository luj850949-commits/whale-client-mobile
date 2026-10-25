import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

// 本地持久化的存储键，数据结构有变时递增版本号
const STORAGE_KEY = 'whale-chat-v1'
const DEFAULT_TITLE = '新对话'
const GREETING = '你好，我是 **Whale AI**，有什么可以帮你的？'

let uid = 0
function genId(prefix) {
  uid += 1
  return `${prefix}_${Date.now().toString(36)}_${uid}`
}

/**
 * 对话数据层：会话 + 消息。
 * 目前全部存在本地，接入后端后只需替换页面里的 send()。
 */
export const useChatStore = defineStore('chat', () => {
  // 已从本地读过一次，避免重复 load 覆盖内存态
  const loaded = ref(false)
  const sessions = ref([])
  const currentSessionId = ref('')

  const currentSession = computed(
    () => sessions.value.find((s) => s.id === currentSessionId.value) || null
  )
  const messages = computed(() => currentSession.value?.messages || [])

  // 从本地存储恢复；上次没跑完的流式消息一律收尾为 done
  function load() {
    if (loaded.value) return
    loaded.value = true
    try {
      const raw = uni.getStorageSync(STORAGE_KEY)
      const data = raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : null
      if (data && Array.isArray(data.sessions)) {
        sessions.value = data.sessions
        currentSessionId.value = data.currentSessionId || data.sessions[0]?.id || ''
        sessions.value.forEach((s) => {
          s.messages?.forEach((m) => {
            if (m.status === 'streaming') m.status = 'done'
          })
        })
        return
      }
    } catch (e) {
      // 读取失败按空数据处理，不影响使用
    }
    sessions.value = []
    currentSessionId.value = ''
  }

  function persist() {
    try {
      uni.setStorageSync(
        STORAGE_KEY,
        JSON.stringify({ sessions: sessions.value, currentSessionId: currentSessionId.value })
      )
    } catch (e) {
      // 写盘失败不阻断对话
    }
  }

  function createSession(title = DEFAULT_TITLE) {
    const now = Date.now()
    const session = { id: genId('s'), title, createdAt: now, updatedAt: now, messages: [] }
    sessions.value.unshift(session)
    currentSessionId.value = session.id
    return session
  }

  // 没有会话就建一个，并补上开场白
  function ensureSession() {
    if (currentSession.value) return currentSession.value
    const session = createSession()
    appendMessage('ai', GREETING)
    return session
  }

  function appendMessage(role, content, extra = {}) {
    const session = ensureSession()
    const msg = { id: genId('m'), role, content, createdAt: Date.now(), status: 'done', ...extra }
    // 首条用户消息拿来当会话标题
    if (role === 'user' && session.title === DEFAULT_TITLE) {
      session.title = content.slice(0, 20)
    }
    session.messages.push(msg)
    session.updatedAt = msg.createdAt
    return msg
  }

  function updateMessage(id, patch) {
    const msg = currentSession.value?.messages.find((m) => m.id === id)
    if (msg) Object.assign(msg, patch)
  }

  return {
    sessions,
    currentSessionId,
    currentSession,
    messages,
    load,
    persist,
    createSession,
    ensureSession,
    appendMessage,
    updateMessage,
  }
})