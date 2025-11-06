<template>
  <div class="home-container">
    <div class="home-content">
      <header class="page-header">
        <div class="current-time">{{ currentTime }}</div>
      </header>
      <main class="main-content">
        <div class="content-area">
          <div class="management-buttons">
            <button @click="handleTeacherManage" class="manage-btn">教师管理</button>
            <button @click="handleStudentManage" class="manage-btn">学生管理</button>
            <button @click="handleCourseManage" class="manage-btn">课程管理</button>
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
  background-color: #f5f7fa;
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
  padding-bottom: 20px;
  border-bottom: 1px solid #eee;
}

.current-time {
  font-size: 16px;
  color: #333;
  font-weight: 500;
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
  border-radius: 8px;
  padding: 40px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  overflow-y: auto;
  display: flex;
  align-items: center;
  justify-content: center;
}

.management-buttons {
  display: flex;
  gap: 40px;
  width: 100%;
  max-width: 800px;
  justify-content: center;
}

.manage-btn {
  padding: 20px 40px;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 18px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  flex: 1;
  max-width: 220px;
}

.manage-btn:hover {
  background-color: #359e6d;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(66, 185, 131, 0.2);
}

.manage-btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(66, 185, 131, 0.15);
}
</style>