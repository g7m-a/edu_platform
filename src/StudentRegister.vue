<template>
  <div class="register-container">
    <div class="register-card">
      <div class="register-header">
        <h2>学生注册</h2>
        <p>请输入合规的学号和密码注册系统</p>
      </div>
      
      <div class="register-form">
        <div class="form-group">
          <input 
            v-model="account" 
            placeholder="请输入学号" 
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

        <div class="form-group">
          <input 
            v-model="aspassword" 
            placeholder="请确认密码" 
            class="form-input"
            type="password"
          />
        </div>
        
        <button @click="handleRegister" class="register-btn">注册</button>
        
        <div class="login-link">
          已有账号？
          <router-link to="/student-login" class="link">去登录</router-link>
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
const aspassword = ref('');
const router = useRouter();

const handleRegister = async () => {
  if (account.value && password.value) {
    if(password.value == aspassword.value){
      alert('学生注册成功');
      router.push('/student-login');
    }else {
      alert('请确认密码')
    }
  } else {
    alert('学号和密码不能为空');
  }
};
</script>

<style scoped>
.register-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #0d7a3d 0%, #1a9d4f 50%, #2db563 100%);
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.register-card {
  position: relative;
  width: 100%;
  max-width: 420px;
  background-color: #fff;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  padding: 40px 35px;
  box-sizing: border-box;
  animation: slideUp 0.5s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.register-header {
  text-align: center;
  margin-bottom: 30px;
}

.register-header h2 {
  color: #333;
  margin: 0 0 10px 0;
  font-size: 24px;
  font-weight: 600;
}

.register-header p {
  color: #666;
  margin: 0;
  font-size: 14px;
}

.register-form {
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
  border-color: #0d7a3d;
  box-shadow: 0 0 0 3px rgba(13, 122, 61, 0.1);
}

.register-btn {
  width: 100%;
  padding: 13px;
  background-color: #0d7a3d;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s ease;
  margin-top: 10px;
}

.register-btn:hover {
  background-color: #0a5f2e;
}

.login-link {
  text-align: center;
  margin-top: 20px;
  color: #666;
  font-size: 14px;
}

.link {
  color: #0d7a3d;
  text-decoration: none;
  margin-left: 5px;
}

.link:hover {
  text-decoration: underline;
}
</style>