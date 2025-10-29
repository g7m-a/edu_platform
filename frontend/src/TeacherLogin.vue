<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <h2>教师登录</h2>
        <p>请输入工号和密码登录系统</p>
      </div>
      
      <div class="login-form">
        <div class="form-group">
          <input 
            v-model="account" 
            placeholder="请输入工号" 
            class="form-input"
            type="text"
          />
        </div>
        
        <div class="form-group">
          <input 
            v-model="password" 
            placeholder="请输入密码" 
            class="form-input"
            type="password"
          />
        </div>
        
        <button @click="handleLogin" class="login-btn">登录</button>
        
        <div class="register-link">
          没有账号？
          <router-link to="/teacher-register" class="link">去注册</router-link>
        </div>
      </div>
    </div>
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
    alert('工号和密码不能为空');
  }
};
</script>

<style scoped>
.login-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #f5f7fa;
  overflow: hidden;
}

.login-card {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  max-width: 400px;
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  padding: 30px 25px;
  box-sizing: border-box;
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.login-header h2 {
  color: #333;
  margin: 0 0 10px 0;
  font-size: 24px;
  font-weight: 600;
}

.login-header p {
  color: #666;
  margin: 0;
  font-size: 14px;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.form-group {
  width: 100%;
}

.form-input {
  width: 100%;
  padding: 12px 15px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 15px;
  transition: all 0.3s ease;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: #42b983;
  box-shadow: 0 0 0 3px rgba(66, 185, 131, 0.1);
}

.login-btn {
  width: 100%;
  padding: 13px;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s ease;
  margin-top: 10px;
}

.login-btn:hover {
  background-color: #359e6d;
}

.register-link {
  text-align: center;
  margin-top: 20px;
  color: #666;
  font-size: 14px;
}

.link {
  color: #42b983;
  text-decoration: none;
  margin-left: 5px;
}

.link:hover {
  text-decoration: underline;
}
</style>
