<template>
  <div class="register">
    <h2>学生注册</h2>
    <input v-model="account" placeholder="学号" /><br>
    <input v-model="password" type="password" placeholder="密码" /><br>
    <button @click="handleRegister">注册</button>
    <p>已有账号？<router-link to="/student-login">去登录</router-link></p>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const account = ref('');
const password = ref('');
const router = useRouter();

const handleRegister = async () => {
  if (account.value && password.value) {
    alert('学生注册成功');
    router.push('/student-login');
  } else {
    alert('学号和密码不能为空');
  }
};
</script>