<script setup>
import { ref, onMounted } from 'vue'

const message = ref('加载中...')

onMounted(async () => {
  try {
    const res = await fetch('/api/')
    message.value = await res.text()
  } catch (err) {
    message.value = '后端未连接: ' + err.message
  }
})
</script>

<template>
  <div style="font-family: sans-serif; padding: 30px;">
    <h1>{{ message }}</h1>
  </div>
</template>
