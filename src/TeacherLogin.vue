<template>
  <div class="login-container">
    <div class="login-card">
      <div class="back-btn" @click="goBack">
        <span>← 返回</span>
      </div>
      <div class="login-header">
        <div class="header-number">02</div>
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
        <div class="action-links">
          <span @click="openChangePwdModal" class="action-link">修改密码</span>
        </div>
      </div>
    </div>

    <!-- 修改密码弹窗 -->
    <div v-if="showChangePwdModal" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h3>修改密码</h3>
          <span class="close-btn" @click="closeChangePwdModal">&times;</span>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>工号</label>
            <input v-model="pwdForm.account" type="text" placeholder="请输入工号" class="form-input">
          </div>
          <div class="form-group">
            <label>旧密码</label>
            <input v-model="pwdForm.oldPassword" type="password" placeholder="请输入旧密码" class="form-input">
          </div>
          <div class="form-group">
            <label>新密码</label>
            <input v-model="pwdForm.newPassword" type="password" placeholder="请输入新密码" class="form-input">
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeChangePwdModal" class="cancel-btn">取消</button>
          <button @click="handleChangePassword" class="confirm-btn">确认修改</button>
        </div>
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
      password: '',
      showChangePwdModal: false,
      pwdForm: {
        account: '',
        oldPassword: '',
        newPassword: ''
      }
    };
  },
  methods: {
    openChangePwdModal() {
      this.pwdForm = {
        account: '',
        oldPassword: '',
        newPassword: ''
      };
      this.showChangePwdModal = true;
    },
    closeChangePwdModal() {
      this.showChangePwdModal = false;
    },
    async handleChangePassword() {
      if (!this.pwdForm.account || !this.pwdForm.oldPassword || !this.pwdForm.newPassword) {
        alert('请填写所有字段');
        return;
      }
      try {
        const response = await axios.put('http://localhost:3000/api/teacher/change-password', this.pwdForm);
        if (response.data.code === 200) {
          alert('密码修改成功，请重新登录');
          this.closeChangePwdModal();
        } else {
          alert('修改失败：' + response.data.message);
        }
      } catch (error) {
        console.error('修改密码失败：', error);
        if (error.response && error.response.data && error.response.data.message) {
           alert('修改失败：' + error.response.data.message);
        } else {
           alert('修改失败，请检查网络或联系管理员');
        }
      }
    },
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
          'http://localhost:3000/api/teacher/login',
          { 
            account: this.account,
            password: this.password
          }
        );

        const { code, message } = response.data;
        if (code === 200) {
          alert(message || '登录成功');
          localStorage.setItem('teacherInfo', JSON.stringify(response.data.data.token));
          this.$router.push('/teacher-homepage');
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
  color: #1a9d4f;
}

.login-header {
  text-align: center;
  margin-bottom: 35px;
  margin-top: 10px;
}

.header-number {
  font-size: 72px;
  font-weight: 300;
  color: rgba(26, 157, 79, 0.15);
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
  border-color: #1a9d4f;
  box-shadow: 0 0 0 3px rgba(26, 157, 79, 0.1);
}

.login-btn {
  width: 100%;
  padding: 13px;
  background-color: #1a9d4f;
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
  background-color: #15803d;
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

.action-links {
  margin-top: 15px;
  text-align: right;
}

.action-link {
  color: #1a9d4f;
  cursor: pointer;
  font-size: 14px;
}

.action-link:hover {
  text-decoration: underline;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  width: 90%;
  max-width: 400px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.modal-header h3 {
  margin: 0;
  color: #333;
}

.close-btn {
  font-size: 24px;
  cursor: pointer;
  color: #999;
}

.modal-body .form-group {
  margin-bottom: 15px;
}

.modal-body label {
  display: block;
  margin-bottom: 5px;
  color: #666;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.cancel-btn {
  padding: 8px 16px;
  background-color: #f5f7fa;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
}

.confirm-btn {
  padding: 8px 16px;
  background-color: #1a9d4f;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.confirm-btn:hover {
  background-color: #15803d;
}
</style>