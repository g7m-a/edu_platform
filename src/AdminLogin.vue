<template>
  <div class="login-container">
    <div class="login-card">
      <div class="back-btn" @click="goBack">
        <span>← 返回</span>
      </div>
      <div class="login-header">
        <div class="header-number">03</div>
        <h2>管理员登录</h2>
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
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
export default {
  data() {
    return {
      account: '',
      password: ''
    };
  },
  methods: {
    goBack() {
      this.$router.push('/Entry');
    },
    async handleLogin() {
      if (!this.account || !this.password) {
        alert('工号和密码不能为空');
        return;
      }

      try {
        const response = await axios.post(
          'http://localhost:3000/api/admin/login',
          { 
            account: this.account,
            password: this.password
          }
        );

        const { code, message } = response.data;
        if (code === 200) {
          alert(message || '登录成功');
          localStorage.setItem('token', response.data.data.token);
          this.$router.push('/admin-homepage');
        } else {
          alert(message || '登录失败');
        }
      } catch (error) {
        console.error('登录请求失败：', error);
        alert('网络错误或服务器异常，请稍后重试');
      }
    }
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
  background: linear-gradient(135deg, #0d7a3d 0%, #1a9d4f 50%, #2db563 100%);
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.login-card {
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

.back-btn {
  position: absolute;
  top: 20px;
  left: 20px;
  color: #666;
  cursor: pointer;
  font-size: 14px;
  transition: color 0.3s ease;
  display: flex;
  align-items: center;
  gap: 5px;
}

.back-btn:hover {
  color: #2db563;
}

.login-header {
  text-align: center;
  margin-bottom: 35px;
  margin-top: 10px;
}

.header-number {
  font-size: 72px;
  font-weight: 300;
  color: rgba(45, 181, 99, 0.15);
  margin-bottom: 10px;
  line-height: 1;
  display: block;
}

.login-header h2 {
  color: #333;
  margin: 0 0 10px 0;
  font-size: 28px;
  font-weight: 600;
}

.login-header p {
  color: #666;
  margin: 0;
  font-size: 14px;
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
  border-color: #2db563;
  box-shadow: 0 0 0 3px rgba(45, 181, 99, 0.1);
}

.login-btn {
  width: 100%;
  padding: 13px;
  background-color: #2db563;
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
  background-color: #25a050;
}
</style>