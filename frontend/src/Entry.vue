<template>
    <div class="Entry">
        <button @click="goToLogin" class="home-btn">进入</button>
        <router-view></router-view>
    </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
const router = useRouter();
const goToLogin = () => {
  router.push('/login');
};
</script>

<style scoped>
.home-btn {
  margin: 50px;
  padding: 12px 24px;
  font-size: 18px;
  cursor: pointer;
}
</style>