<template>
  <div class="entry-container">
    <div class="entry-content">
      <div class="welcome-section">
        <h1 class="main-title">智慧教务管理系统</h1>
        <p class="subtitle">Smart Educational Management System</p>
        <div class="divider"></div>
      </div>
      
      <div class="btn-group">
        <div class="role-card student-card" @click="goToStudentLogin">
          <div class="card-number">01</div>
          <h3 class="card-title">学生入口</h3>
          <p class="card-desc">选课、提交作业、查看成绩</p>
          <div class="card-line"></div>
        </div>
        
        <div class="role-card teacher-card" @click="goToTeacherLogin">
          <div class="card-number">02</div>
          <h3 class="card-title">教师入口</h3>
          <p class="card-desc">发布作业、批改作业、成绩管理</p>
          <div class="card-line"></div>
        </div>
        
        <div class="role-card admin-card" @click="goToAdminLogin">
          <div class="card-number">03</div>
          <h3 class="card-title">管理员入口</h3>
          <p class="card-desc">学生管理、教师管理、课程管理</p>
          <div class="card-line"></div>
        </div>
      </div>
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
  background: linear-gradient(135deg, #0d7a3d 0%, #1a9d4f 50%, #2db563 100%);
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  padding: 20px;
}

.entry-content {
  width: 100%;
  max-width: 1200px;
  text-align: center;
}

.welcome-section {
  margin-bottom: 60px;
  animation: fadeInDown 0.8s ease;
}

.main-title {
  color: #fff;
  font-size: 48px;
  font-weight: 700;
  margin: 0 0 15px 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
  letter-spacing: 2px;
}

.subtitle {
  color: rgba(255, 255, 255, 0.9);
  font-size: 18px;
  margin: 0 0 20px 0;
  font-weight: 300;
  letter-spacing: 1px;
}

.divider {
  width: 80px;
  height: 4px;
  background: rgba(255, 255, 255, 0.8);
  margin: 0 auto;
  border-radius: 2px;
}

.btn-group {
  display: flex;
  gap: 30px;
  justify-content: center;
  flex-wrap: wrap;
  animation: fadeInUp 0.8s ease 0.2s both;
}

.role-card {
  background: rgba(255, 255, 255, 0.98);
  border-radius: 12px;
  padding: 45px 35px;
  cursor: pointer;
  transition: all 0.3s ease;
  flex: 1;
  min-width: 280px;
  max-width: 320px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  position: relative;
  overflow: hidden;
}

.role-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, transparent, currentColor, transparent);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.role-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
}

.role-card:hover::before {
  opacity: 1;
}

.role-card:active {
  transform: translateY(-4px);
}

.student-card {
  color: #0d7a3d;
}

.teacher-card {
  color: #1a9d4f;
}

.admin-card {
  color: #2db563;
}

.card-number {
  font-size: 48px;
  font-weight: 300;
  color: rgba(0, 0, 0, 0.08);
  margin-bottom: 20px;
  line-height: 1;
  transition: color 0.3s ease;
}

.role-card:hover .card-number {
  color: currentColor;
  opacity: 0.3;
}

.card-line {
  width: 50px;
  height: 2px;
  background: currentColor;
  margin: 25px auto 0;
  opacity: 0.3;
  transition: all 0.3s ease;
}

.role-card:hover .card-line {
  width: 80px;
  opacity: 0.6;
}

.card-title {
  color: #333;
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 12px 0;
}

.card-desc {
  color: #666;
  font-size: 14px;
  margin: 0;
  line-height: 1.6;
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .main-title {
    font-size: 36px;
  }
  
  .btn-group {
    flex-direction: column;
    align-items: center;
  }
  
  .role-card {
    width: 100%;
    max-width: 100%;
  }
}
</style>