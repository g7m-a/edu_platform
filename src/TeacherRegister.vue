<template>
  <div class="register-container">
    <div class="register-card">
      <div class="register-header">
        <h2>教师注册</h2>
        <p>请输入合规的工号和密码注册系统</p>
      </div>
      
      <div class="register-form">
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
          <router-link to="/teacher-login" class="link">去登录</router-link>
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
      alert('教师注册成功');
      router.push('/student-login');
    }else {
      alert('请确认密码')
    }
  } else {
    alert('工号和密码不能为空');
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
  background-color: #f5f7fa;
  overflow: hidden;
}

.register-card {
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
  border-color: #42b983;
  box-shadow: 0 0 0 3px rgba(66, 185, 131, 0.1);
}

.register-btn {
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

.register-btn:hover {
  background-color: #359e6d;
}

.login-link {
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