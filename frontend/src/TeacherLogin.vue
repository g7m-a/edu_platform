<template>
  <div class="login">
    <h2>教师登录</h2>
    <input v-model="account" placeholder="工号" /><br>
    <input v-model="password" type="password" placeholder="密码" /><br>
    <button @click="handleLogin">登录</button>
    <p>没有账号？<router-link to="/teacher-register">去注册</router-link></p>
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
    alert('教师登录成功');
    router.push('/TeacherHomePage');
  } else {
    alert('工号和密码不能为空');
  }
};
</script>