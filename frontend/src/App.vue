<template>
  <router-view></router-view>
</template>

<script setup>
import './assets/global.css';
</script>

<style scoped>
.login, .register {
  margin: 20px;
  padding: 20px;
  border: 1px solid #ccc;
  max-width: 300px;
}
input {
  width: 100%;
  margin: 8px 0;
  padding: 8px;
}
button {
  margin-top: 10px;
  padding: 8px 16px;
  cursor: pointer;
}
</style>