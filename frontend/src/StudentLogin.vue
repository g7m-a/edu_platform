<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <h2>学生登录</h2>
        <p>请输入学号和密码登录系统</p>
      </div>
      
      <div class="login-form">
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
            <label>学号</label>
            <input v-model="pwdForm.account" type="text" placeholder="请输入学号" class="form-input">
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
        const response = await axios.put('http://localhost:3000/api/student/change-password', this.pwdForm);
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
    async handleLogin() {
      if (!this.account || !this.password) {
        alert('学号和密码不能为空');
        return;
      }

      try {
        const response = await axios.post(
          'http://localhost:3000/api/student/login',
          { 
            account: this.account,
            password: this.password
          }
        );

        const { code, message } = response.data;
        if (code === 200) {
          alert(message || '登录成功');
          localStorage.setItem('studentInfo', JSON.stringify(response.data.data.token));
          this.$router.push('/student-homepage');
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

.action-links {
  margin-top: 15px;
  text-align: right;
}

.action-link {
  color: #42b983;
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
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
</style>