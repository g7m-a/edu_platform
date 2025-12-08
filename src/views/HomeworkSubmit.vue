<template>
  <div class="submit-page">
    <div class="header">
      <button class="back-btn" @click="$router.back()">← 返回</button>
      <h2>完成作业</h2>
    </div>

    <div class="content-wrapper">
      <div v-if="homework" class="main-card">
        <div class="hw-info">
          <div class="info-header">
            <h1 class="hw-title">{{ homework.title }}</h1>
            <span class="status-badge" :class="getStatusClass(homework.status)">
              {{ getStatusText(homework.status) }}
            </span>
          </div>
          
          <div class="meta-row">
            <span class="meta-item">课程：{{ homework.course_name }}</span>
            <span class="meta-item">教师：{{ homework.teacher_name }}</span>
            <span class="meta-item">截止时间：{{ formatTime(homework.ddl) }}</span>
          </div>

          <div class="hw-description">
            <h3>作业要求：</h3>
            <div class="desc-content">{{ homework.content }}</div>
          </div>
        </div>

        <div class="submission-area">
          <div v-if="homework.status === 2" class="graded-result">
            <div class="result-header">批改结果</div>
            <div class="score-box">
              <span class="label">得分：</span>
              <span class="score">{{ homework.score }}</span>
              <span class="total">/ 100</span>
            </div>
            <div class="comment-box">
              <span class="label">评语：</span>
              <p>{{ homework.comment || '暂无评语' }}</p>
            </div>
            <div class="my-content">
              <span class="label">我的提交：</span>
              <div class="read-only-content">{{ homework.submit_content }}</div>
            </div>
          </div>

          <div v-else class="input-form">
            <h3>我的提交</h3>
            <div class="editor-container">
              <textarea 
                v-model="submitContent" 
                class="content-editor" 
                placeholder="在此输入作业内容..."
                rows="15"
              ></textarea>
            </div>
            <div class="action-bar">
              <span class="last-time" v-if="homework.submit_time">
                上次提交：{{ formatTime(homework.submit_time) }}
              </span>
              <button class="submit-btn" @click="submitHomework">
                {{ homework.status === 1 ? '更新提交' : '提交作业' }}
              </button>
            </div>
          </div>
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
      homeworkId: this.$route.params.homeworkId,
      studentId: '',
      homework: null,
      submitContent: ''
    };
  },
  async created() {
    const studentInfo = localStorage.getItem('studentInfo');
    if (studentInfo) {
      this.studentId = JSON.parse(studentInfo).account;
      await this.fetchHomeworkData();
    } else {
      this.$router.push('/login');
    }
  },
  methods: {
    async fetchHomeworkData() {
      try {
        // 复用列表接口筛选，或者创建新接口。这里为了方便，我们直接从列表中筛选出当前作业
        // 也可以新增一个 api/homework/student/detail 接口。
        // 为了稳健，我们使用现有的 list 接口筛选
        const res = await axios.get('http://localhost:3000/api/homework/student/list', {
          params: { student_id: this.studentId }
        });
        
        if (res.data.code === 200) {
          // 注意：这里 homeworkId 可能是 string，数据里是 number，做个转换比较
          // 路由传参的是 student_homework.id 还是 homework.id? 
          // 从 StudentHomePage 跳转过来传的是 sh_id (student_homework id)
          this.homework = res.data.data.find(h => h.sh_id == this.homeworkId);
          if (this.homework) {
            this.submitContent = this.homework.submit_content || '';
          }
        }
      } catch (err) {
        console.error('加载作业失败:', err);
      }
    },
    async submitHomework() {
      if (!this.submitContent.trim()) {
        alert('请输入内容后再提交');
        return;
      }
      try {
        const res = await axios.post('http://localhost:3000/api/homework/submit', {
          id: this.homework.sh_id,
          submit_content: this.submitContent
        });
        if (res.data.code === 200) {
          alert('提交成功！');
          await this.fetchHomeworkData();
        } else {
          alert(res.data.message);
        }
      } catch (err) {
        alert('网络错误');
      }
    },
    getStatusText(status) {
      const map = { 0: '未提交', 1: '已提交', 2: '已批改' };
      return map[status] || '未知';
    },
    getStatusClass(status) {
      const map = { 0: 'status-un', 1: 'status-sub', 2: 'status-done' };
      return map[status] || '';
    },
    formatTime(timeStr) {
      if (!timeStr) return '无';
      const date = new Date(timeStr);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    }
  }
};
</script>

<style scoped>
.submit-page {
  min-height: 100vh;
  background: #f5f7fa;
  display: flex;
  flex-direction: column;
}

.header {
  height: 60px;
  background: white;
  display: flex;
  align-items: center;
  padding: 0 40px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.back-btn {
  margin-right: 20px;
  border: none;
  background: none;
  font-size: 16px;
  cursor: pointer;
  color: #666;
}

.content-wrapper {
  flex: 1;
  padding: 40px;
  display: flex;
  justify-content: center;
}

.main-card {
  width: 100%;
  max-width: 900px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  padding: 40px;
}

.info-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.hw-title {
  margin: 0;
  font-size: 24px;
  color: #333;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
}

.status-un { background: #fff1f0; color: #f5222d; }
.status-sub { background: #e6f7ff; color: #1890ff; }
.status-done { background: #f6ffed; color: #52c41a; }

.meta-row {
  color: #666;
  font-size: 14px;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #eee;
  display: flex;
  gap: 30px;
}

.hw-description {
  margin-bottom: 40px;
}

.desc-content {
  background: #f9f9f9;
  padding: 20px;
  border-radius: 6px;
  line-height: 1.6;
  color: #444;
}

.editor-container {
  margin-bottom: 20px;
}

.content-editor {
  width: 100%;
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 16px;
  line-height: 1.6;
  resize: vertical;
  box-sizing: border-box;
}

.content-editor:focus {
  border-color: #40a9ff;
  outline: none;
}

.action-bar {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 20px;
}

.last-time {
  color: #999;
  font-size: 14px;
}

.submit-btn {
  background: #1890ff;
  color: white;
  border: none;
  padding: 12px 30px;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.3s;
}

.submit-btn:hover {
  background: #40a9ff;
}

.graded-result {
  background: #f6ffed;
  border: 1px solid #b7eb8f;
  border-radius: 8px;
  padding: 30px;
}

.result-header {
  font-size: 18px;
  font-weight: bold;
  color: #52c41a;
  margin-bottom: 20px;
  border-bottom: 1px dashed #b7eb8f;
  padding-bottom: 10px;
}

.score-box {
  font-size: 24px;
  margin-bottom: 15px;
}

.score {
  color: #52c41a;
  font-weight: bold;
  font-size: 32px;
}

.comment-box {
  margin-bottom: 20px;
  color: #666;
}

.label {
  font-weight: 500;
  color: #333;
  margin-right: 10px;
}

.read-only-content {
  background: white;
  padding: 15px;
  border-radius: 4px;
  border: 1px solid #d9d9d9;
  color: #666;
}
</style>