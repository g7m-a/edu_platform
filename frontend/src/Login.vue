<template>
  <div class="login">
    <h2>登录</h2>
    <input v-model="account" placeholder="用户名" /><br>
    <input v-model="password" type="password" placeholder="密码" /><br>
    <button @click="handleLogin">登录</button>
    <p>没有账号？<router-link to="/register">去注册</router-link></p>
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
    //判断是否存在该用户，存在则导入数据
    alert('登录成功');
    router.push('/HomePage');
  } else {
    alert('用户名和密码不能为空');
  }
};
</script>