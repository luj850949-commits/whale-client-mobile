<template>
  <view class="drawer-root" :class="{ 'is-open': visible }">
    <view class="drawer-mask" @click="close"></view>

    <view class="drawer-panel">
      <view class="drawer-head">
        <text class="drawer-title">对话</text>
        <view class="drawer-close" @click="close">
          <text class="drawer-close-text">关闭</text>
        </view>
      </view>

      <view class="drawer-new" @click="$emit('create')">
        <text class="drawer-new-text">＋ 新建对话</text>
      </view>

      <scroll-view class="drawer-list" scroll-y>
        <view
          v-for="session in sessions"
          :key="session.id"
          class="session-item"
          :class="{ 'is-active': session.id === currentId }"
          @click="$emit('select', session.id)"
        >
          <view class="session-main">
            <text class="session-title">{{ session.title }}</text>
            <text class="session-time">{{ formatTime(session.updatedAt) }}</text>
          </view>
          <view class="session-del" @click.stop="$emit('remove', session.id)">
            <text class="session-del-text">删除</text>
          </view>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script setup>
defineProps({
  visible: { type: Boolean, default: false },
  sessions: { type: Array, default: () => [] },
  currentId: { type: String, default: '' },
})

const emit = defineEmits(['close', 'create', 'select', 'remove'])

function close() {
  emit('close')
}

// 会话列表只关心「多久之前」，不做完整日期格式化
function formatTime(ts) {
  if (!ts) return ''
  const diff = Date.now() - ts
  if (diff < 60 * 1000) return '刚刚'
  if (diff < 60 * 60 * 1000) return `${Math.floor(diff / 60000)} 分钟前`

  const date = new Date(ts)
  const pad = (n) => String(n).padStart(2, '0')
  if (date.toDateString() === new Date().toDateString()) {
    return `${pad(date.getHours())}:${pad(date.getMinutes())}`
  }
  return `${date.getMonth() + 1}月${date.getDate()}日`
}
</script>

<style scoped>
.drawer-root {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 200;
  visibility: hidden;
  transition: visibility 0.2s;
}

.drawer-root.is-open {
  visibility: visible;
}

.drawer-mask {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background: rgba(0, 0, 0, 0.35); /* 遮罩用半透明黑，不随主题变化 */
  opacity: 0;
  transition: opacity 0.2s ease;
}

.is-open .drawer-mask {
  opacity: 1;
}

.drawer-panel {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 76%;
  max-width: 320px;
  display: flex !important;
  flex-direction: column !important;
  box-sizing: border-box;
  padding-top: env(safe-area-inset-top);
  background: var(--color-surface);
  border-right: 1px solid var(--color-border);
  transform: translateX(-100%);
  transition: transform 0.24s ease;
}

.is-open .drawer-panel {
  transform: translateX(0);
}

.drawer-head {
  display: flex !important;
  flex-direction: row !important;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px 8px;
}

.drawer-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--color-text);
}

.drawer-close {
  padding: 2px 6px;
}

.drawer-close-text {
  font-size: 13px;
  color: var(--color-text-secondary);
}

.drawer-new {
  margin: 4px 12px 8px;
  padding: 10px 12px;
  border-radius: var(--radius-md);
  background: var(--color-primary-soft);
}

.drawer-new-text {
  font-size: 14px;
  color: var(--color-primary);
}

.drawer-list {
  flex: 1;
  height: 0;
  padding: 0 12px;
  box-sizing: border-box;
}

.session-item {
  display: flex !important;
  flex-direction: row !important;
  align-items: center;
  padding: 10px 12px;
  margin-bottom: 4px;
  border-radius: var(--radius-md);
}

.session-item.is-active {
  background: var(--color-primary-soft);
}

.session-main {
  flex: 1;
  display: flex !important;
  flex-direction: column !important;
  min-width: 0;
}

.session-title {
  font-size: 14px;
  color: var(--color-text);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.session-item.is-active .session-title {
  color: var(--color-primary);
}

.session-time {
  margin-top: 2px;
  font-size: 12px;
  color: var(--color-text-disabled);
}

.session-del {
  flex-shrink: 0;
  padding: 2px 6px;
  margin-left: 8px;
}

.session-del-text {
  font-size: 12px;
  color: var(--color-text-disabled);
}
</style>