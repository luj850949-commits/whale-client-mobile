<template>
  <view class="bg-bg p-4 pb-24">
    <view class="bg-surface text-text p-4 rounded-md shadow-md">
      <text class="text-text">卡片测试</text>
      <text class="text-text-secondary block mt-2">次要文字</text>
      <text class="text-primary block mt-2">主色文字</text>
    </view>

    <CustomTabBar current="home" />
  </view>
</template>

<script setup>
import CustomTabBar from '@/components/CustomTabBar.vue'
</script>