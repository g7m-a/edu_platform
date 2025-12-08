<template>
  <div class="entry-container">
    <h1>欢迎使用</h1>
    <div class="btn-group">
      <button @click="goToStudentLogin" class="role-btn">学生入口</button>
      <button @click="goToTeacherLogin" class="role-btn">教师入口</button>
      <button @click="goToAdminLogin" class="role-btn">管理员入口</button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
const router = useRouter();

const goToStudentLogin = () => {
  router.push('/student-login');
};

const goToTeacherLogin = () => {
  router.push('/teacher-login');
};

const goToAdminLogin = () => {
  router.push('/admin-login');
};
</script>

<style scoped>
.entry-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #f5f7fa;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}

h1 {
  color: #333;
  margin-bottom: 30px;
  font-size: 28px;
}

.btn-group {
  display: flex;
  gap: 20px;
}

.role-btn {
  padding: 15px 30px;
  font-size: 18px;
  cursor: pointer;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 5px;
  transition: background-color 0.3s ease;
}

.role-btn:hover {
  background-color: #359e6d;
}
</style>