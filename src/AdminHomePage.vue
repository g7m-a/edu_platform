<template>
  <div class="home-container">
    <div class="home-content">
      <header class="page-header">
        <div class="current-time">{{ currentTime }}</div>
        <div class="function-buttons">
          <button @click="handleLogout" class="logout-btn">退出登录</button>
        </div>
      </header>
      <main class="main-content">
        <div class="content-area">
          <h2 class="section-title">系统管理</h2>
          <div class="management-cards">
            <div class="management-card teacher-card" @click="handleTeacherManage">
              <div class="card-number">01</div>
              <h3 class="card-title">教师管理</h3>
              <p class="card-desc">管理教师信息、账号权限</p>
              <div class="card-line"></div>
            </div>
            
            <div class="management-card student-card" @click="handleStudentManage">
              <div class="card-number">02</div>
              <h3 class="card-title">学生管理</h3>
              <p class="card-desc">管理学生信息、账号权限</p>
              <div class="card-line"></div>
            </div>
            
            <div class="management-card course-card" @click="handleCourseManage">
              <div class="card-number">03</div>
              <h3 class="card-title">课程管理</h3>
              <p class="card-desc">管理课程信息、选课设置</p>
              <div class="card-line"></div>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      currentTime: ''
    };
  },
  methods: {
    updateTime() {
      const now = new Date();
      const options = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        weekday: 'long',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      };
      this.currentTime = now.toLocaleString('zh-CN', options);
    },
    handleTeacherManage() {
      this.$router.push('/teachermanage-page');
    },
    handleStudentManage() {
      this.$router.push('/studentmanage-page');
    },
    handleCourseManage() {
      this.$router.push('/coursemanage-page');
    },
    handleLogout() {
      if (confirm('确定要退出登录吗？')) {
        localStorage.removeItem('token');
        this.$router.push('/Entry');
      }
    }
  },
  mounted() {
    this.updateTime();
    this.timeInterval = setInterval(() => {
      this.updateTime();
    }, 60000);
  },
  beforeUnmount() {
    clearInterval(this.timeInterval);
  }
};
</script>

<style scoped>
.home-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(180deg, #f0fdf4 0%, #ffffff 100%);
  overflow: auto;
}

.home-content {
  width: 100%;
  height: 100%;
  padding: 20px;
  box-sizing: border-box;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding: 20px 25px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  border-left: 4px solid #2db563;
}

.current-time {
  font-size: 16px;
  color: #333;
  font-weight: 500;
}

.function-buttons {
  display: flex;
  gap: 10px;
  align-items: center;
}

.logout-btn {
  padding: 8px 16px;
  background-color: #ef4444;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.logout-btn:hover {
  background-color: #dc2626;
}

.page-title {
  color: #333;
  font-size: 24px;
  font-weight: 600;
  margin: 0;
}

.admin-info {
  font-size: 16px;
  color: #666;
}

.main-content {
  display: flex;
  gap: 30px;
  height: calc(100% - 120px);
}

.content-area {
  flex: 1;
  background-color: #fff;
  border-radius: 12px;
  padding: 50px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  overflow-y: auto;
  border-top: 3px solid #2db563;
}

.section-title {
  text-align: center;
  color: #333;
  font-size: 32px;
  font-weight: 600;
  margin: 0 0 50px 0;
  position: relative;
  padding-bottom: 20px;
}

.section-title::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 80px;
  height: 4px;
  background: linear-gradient(90deg, #0d7a3d 0%, #1a9d4f 50%, #2db563 100%);
  border-radius: 2px;
}

.management-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 30px;
  max-width: 1000px;
  margin: 0 auto;
}

.management-card {
  background: #ffffff;
  border-radius: 12px;
  padding: 45px 35px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid #e8e8e8;
  text-align: center;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  position: relative;
  overflow: hidden;
}

.management-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: currentColor;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.management-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  border-color: currentColor;
}

.management-card:hover::before {
  opacity: 1;
}

.management-card:active {
  transform: translateY(-3px);
}

.teacher-card {
  color: #1a9d4f;
}

.student-card {
  color: #0d7a3d;
}

.course-card {
  color: #2db563;
}

.card-number {
  font-size: 56px;
  font-weight: 300;
  color: rgba(0, 0, 0, 0.06);
  margin-bottom: 20px;
  line-height: 1;
  transition: color 0.3s ease;
}

.management-card:hover .card-number {
  color: currentColor;
  opacity: 0.2;
}

.card-line {
  width: 40px;
  height: 2px;
  background: currentColor;
  margin: 25px auto 0;
  opacity: 0.3;
  transition: all 0.3s ease;
}

.management-card:hover .card-line {
  width: 60px;
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
</style>