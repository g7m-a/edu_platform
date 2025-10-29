<template>
  <div class="login">
    <h2>学生登录</h2>
    <input v-model="account" placeholder="学号" /><br>
    <input v-model="password" type="password" placeholder="密码" /><br>
    <button @click="handleLogin">登录</button>
    <p>没有账号？<router-link to="/student-register">去注册</router-link></p>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const account = ref('');
const password = ref('');
const router = useRouter();

const handleLogin = async () => {
  if (account.value && password.value) {
    alert('学生登录成功');
    router.push('/StudentHomePage');
  } else {
    alert('学号和密码不能为空');
  }
};
</script>