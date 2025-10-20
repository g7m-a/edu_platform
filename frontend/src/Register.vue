<template>
  <div class="register">
    <h2>注册</h2>
    <input v-model="account" placeholder="用户名" /><br>
    <input v-model="password" type="password" placeholder="密码" /><br>
    <button @click="handleRegister">注册</button>
    <p>已有账号？<router-link to="/login">去登录</router-link></p>
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
    //判断是否存在相同账号的用户,不存在则注册成功
    alert('注册成功');
    router.push('/HomePage');
  } else {
    alert('用户名和密码不能为空');
  }
};
</script>