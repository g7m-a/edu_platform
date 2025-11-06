<template>
  <div class="home-container">
    <div class="home-content">
      <header class="page-header">
        <div class="current-time">{{ currentTime }}</div>
        <div class="teacher-info" v-if="teacher">
          <span>{{ teacher.name }}  {{ teacher.account }}</span>
        </div>
      </header>
    </div>
  </div>
</template>

<script>
export default {
    data() {
    return {
      teacher:null,
      currentTime:''
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
    const teacherInfo = localStorage.getItem('teacherInfo');
    if(teacherInfo){
      this.teacher = JSON.parse(teacherInfo);
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

.page-title {
  color: #333;
  font-size: 24px;
  font-weight: 600;
  margin: 0;
}

.teacher-info {
  font-size: 16px;
  color: #666;
}

.main-content {
  display: flex;
  gap: 30px;
  height: calc(100% - 120px);
}

.tobecom_work {
  width: 300px;
  background-color: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  overflow-y: auto;
}

.tobecom_work h2 {
  text-align: center;
  font-size: 20px;
  color: #34495e;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e1e5eb;
}

.tobecom_work ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.tobecom_work li {
  padding: 12px 10px;
  border-bottom: 1px dashed #e1e5eb;
  color: #2c3e50;
  transition: background-color 0.2s;
}

.tobecom_work li:last-child {
  border-bottom: none;
}

.tobecom_work li:hover {
  background-color: #f1f1f1;
}

.content-area {
  flex: 1;
  background-color: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  overflow-y: auto;
}
</style>