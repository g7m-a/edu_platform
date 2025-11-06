<template>
  <div class="home-container">
    <div class="home-content">
      <header class="page-header">
        <div class="current-time">{{ currentTime }}</div>
        <div class="student-info" v-if="student">
          <span>{{ student.name }}  {{ student.account }}</span>
        </div>
      </header>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      student: null,
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
    }
  },
  mounted() {
    const studentInfo = localStorage.getItem('studentInfo');
    if (studentInfo) {
      this.student = JSON.parse(studentInfo);
    }
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

.student-info {
  font-size: 16px;
  color: #666;
}
</style>