<template>
  <view class="tabbar-container" :class="{ hidden: tabbarHidden }">
    <view class="tabbar-capsule main-capsule">
      <view
        class="text-[13px] px-2 py-1.5 transition-colors duration-200 text-text-secondary"
        @click="goFirstTab"
      >{{ isHome ? '对话' : '首页' }}</view>

      <view
        v-for="tab in otherTabs"
        :key="tab.key"
        class="text-[13px] px-2 py-1.5 transition-colors duration-200"
        :class="props.current === tab.key
          ? 'text-primary font-semibold'
          : 'text-text-secondary'"
        @click="goTab(tab.key)"
      >{{ tab.label }}</view>
    </view>

    <view class="tabbar-capsule workbench-capsule">
      <view
        class="text-[13px] px-2 py-1.5 transition-colors duration-200"
        :class="props.current === 'workbench'
          ? 'text-primary font-semibold'
          : 'text-text-secondary'"
        @click="goTab('workbench')"
      >工作台</view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { tabbarHidden, tabbarAnimOnEnter } from '@/utils/tabbarState'

const props = defineProps({
  current: { type: String, default: 'home' }
})

const isHome = computed(() => props.current === 'home')

onShow(() => {
  if (tabbarAnimOnEnter.value) {
    // 需要滑入：先隐藏，等一帧再显示
    tabbarHidden.value = true
    setTimeout(() => {
      tabbarHidden.value = false
    }, 50)
  } else {
    // 不需要动画：直接显示
    tabbarHidden.value = false
  }
  // 重置，避免影响下次
  tabbarAnimOnEnter.value = true
})

const otherTabs = [
  { key: 'schedule', label: '日程' },
  { key: 'memo', label: '备忘' },
  { key: 'profile', label: '我的' },
]

function goFirstTab() {
  if (isHome.value) {
    tabbarHidden.value = true
    tabbarAnimOnEnter.value = true
    setTimeout(() => {
      uni.navigateTo({ url: '/pages/chat/index' })
    }, 200)
  } else {
    tabbarAnimOnEnter.value = false
    uni.reLaunch({ url: '/pages/home/index' })
  }
}

function goTab(key) {
  if (key === props.current) return
  tabbarAnimOnEnter.value = false
  const pathMap = {
    schedule: '/pages/schedule/index',
    memo: '/pages/memo/index',
    profile: '/pages/profile/index',
    workbench: '/pages/workbench/index',
  }
  uni.reLaunch({ url: pathMap[key] })
}
</script>

<style scoped>
.tabbar-container {
  position: fixed;
  left: 16px;
  right: 16px;
  bottom: 16px;
  display: flex !important;
  flex-direction: row !important;
  gap: 10px;
  z-index: 50;
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.tabbar-container.hidden {
  transform: translateY(200%);
  opacity: 0;
  pointer-events: none;
}

.tabbar-capsule {
  background: var(--color-surface);
  border-radius: 999px;
  display: flex !important;
  flex-direction: row !important;
  align-items: center;
  padding: 8px 10px;
  box-shadow: var(--shadow-float);
  transition: background-color 0.2s ease;
}

.main-capsule {
  flex: 4;
  justify-content: space-around;
}

.workbench-capsule {
  flex: 1;
  justify-content: center;
}
</style>