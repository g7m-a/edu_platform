<template>
  <div class="grade-container">
    <div class="header">
      <button class="back-btn" @click="$router.back()">← 返回</button>
      <h2>作业批改 - {{ homeworkTitle }}</h2>
    </div>

    <div class="content-wrapper">
      <!-- 左侧：学生列表 -->
      <div class="student-list-panel">
        <div class="list-header">
          <h3>提交列表 ({{ submissions.length }})</h3>
          <div class="filter-group">
            <select v-model="filterStatus">
              <option value="all">全部</option>
              <option value="0">未提交</option>
              <option value="1">待批改</option>
              <option value="2">已批改</option>
            </select>
          </div>
        </div>
        
        <div class="student-list">
          <div 
            v-for="sub in filteredSubmissions" 
            :key="sub.id" 
            class="student-item"
            :class="{ active: currentSubmission?.id === sub.id }"
            @click="selectSubmission(sub)"
          >
            <div class="stu-info">
              <span class="stu-name">{{ sub.student_name }}</span>
              <span class="stu-id">{{ sub.student_account }}</span>
            </div>
            <span class="status-badge" :class="getStatusClass(sub.status)">
              {{ getStatusText(sub.status) }}
            </span>
          </div>
        </div>
      </div>

      <!-- 右侧：批改区域 -->
      <div class="grade-panel">
        <div v-if="currentSubmission" class="grading-area">
          <div class="submission-header">
            <div class="stu-detail">
              <h3>{{ currentSubmission.student_name }} 的作业</h3>
              <span class="submit-time">提交时间：{{ formatTime(currentSubmission.submit_time) }}</span>
            </div>
            <div class="status-large" :class="getStatusClass(currentSubmission.status)">
              {{ getStatusText(currentSubmission.status) }}
            </div>
          </div>

          <div class="submission-content">
            <h4>提交内容：</h4>
            <div class="content-box">
              {{ currentSubmission.submit_content || '该学生暂未提交内容' }}
            </div>
          </div>

          <div class="grading-form" v-if="currentSubmission.status !== 0">
            <h4>评分与评语</h4>
            <div class="form-row">
              <label>分数 (0-100)：</label>
              <input 
                type="number" 
                v-model.number="gradeForm.score" 
                min="0" 
                max="100"
                class="score-input"
              >
            </div>
            <div class="form-row">
              <label>教师评语：</label>
              <textarea 
                v-model="gradeForm.comment" 
                rows="4" 
                class="comment-input"
                placeholder="请输入评语..."
              ></textarea>
            </div>
            <div class="action-row">
              <button class="save-btn" @click="submitGrade">提交批改</button>
            </div>
          </div>
          <div v-else class="empty-tip">
            学生未提交，无法批改
          </div>
        </div>
        <div v-else class="empty-state">
          请从左侧选择一名学生进行批改
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
      homeworkTitle: '',
      submissions: [],
      currentSubmission: null,
      filterStatus: 'all',
      gradeForm: {
        score: '',
        comment: ''
      }
    };
  },
  computed: {
    filteredSubmissions() {
      if (this.filterStatus === 'all') return this.submissions;
      return this.submissions.filter(s => s.status == this.filterStatus);
    }
  },
  async created() {
    await this.fetchHomeworkDetail();
    await this.fetchSubmissions();
  },
  methods: {
    async fetchHomeworkDetail() {
      try {
        const res = await axios.get(`http://localhost:3000/api/homework/detail/${this.homeworkId}`);
        if (res.data.code === 200) {
          this.homeworkTitle = res.data.data.title;
        }
      } catch (err) {
        console.error('获取作业详情失败:', err);
      }
    },
    async fetchSubmissions() {
      try {
        const res = await axios.get('http://localhost:3000/api/homework/submissions', {
          params: { homework_id: this.homeworkId }
        });
        if (res.data.code === 200) {
          this.submissions = res.data.data;
        }
      } catch (err) {
        console.error('获取提交列表失败:', err);
      }
    },
    selectSubmission(sub) {
      this.currentSubmission = sub;
      this.gradeForm = {
        score: sub.score,
        comment: sub.comment
      };
    },
    async submitGrade() {
      if (this.gradeForm.score === '' || this.gradeForm.score < 0 || this.gradeForm.score > 100) {
        alert('请输入有效的0-100分数');
        return;
      }
      try {
        const res = await axios.post('http://localhost:3000/api/homework/grade', {
          id: this.currentSubmission.id,
          score: this.gradeForm.score,
          comment: this.gradeForm.comment
        });
        if (res.data.code === 200) {
          alert('批改成功');
          // 更新本地数据
          this.currentSubmission.status = 2;
          this.currentSubmission.score = this.gradeForm.score;
          this.currentSubmission.comment = this.gradeForm.comment;
          this.currentSubmission.correct_time = new Date();
        } else {
          alert(res.data.message);
        }
      } catch (err) {
        alert('网络错误');
      }
    },
    getStatusText(status) {
      const map = { 0: '未提交', 1: '待批改', 2: '已批改' };
      return map[status] || '未知';
    },
    getStatusClass(status) {
      const map = { 0: 'status-un', 1: 'status-wait', 2: 'status-done' };
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
.grade-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
}

.header {
  height: 60px;
  background: white;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
  padding: 0 20px;
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

.back-btn:hover {
  color: #333;
}

.content-wrapper {
  flex: 1;
  display: flex;
  overflow: hidden;
  padding: 20px;
  gap: 20px;
}

.student-list-panel {
  width: 300px;
  background: white;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  border: 1px solid #e0e0e0;
}

.list-header {
  padding: 15px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.list-header h3 {
  margin: 0;
  font-size: 16px;
}

.student-list {
  flex: 1;
  overflow-y: auto;
}

.student-item {
  padding: 12px 15px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: background 0.2s;
}

.student-item:hover {
  background: #f9fafb;
}

.student-item.active {
  background: #e6f7ff;
  border-left: 4px solid #1890ff;
}

.stu-info {
  display: flex;
  flex-direction: column;
}

.stu-name {
  font-weight: 500;
  color: #333;
}

.stu-id {
  font-size: 12px;
  color: #999;
}

.grade-panel {
  flex: 1;
  background: white;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  padding: 20px;
  overflow-y: auto;
}

.submission-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #eee;
}

.status-large {
  padding: 6px 12px;
  border-radius: 4px;
  font-weight: bold;
}

.content-box {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 6px;
  border: 1px solid #eee;
  min-height: 200px;
  white-space: pre-wrap;
  margin-bottom: 30px;
}

.grading-form {
  background: #fff;
  padding: 20px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
}

.form-row {
  margin-bottom: 15px;
}

.form-row label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
}

.score-input {
  width: 100px;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.comment-input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
}

.save-btn {
  background: #1890ff;
  color: white;
  border: none;
  padding: 10px 25px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.save-btn:hover {
  background: #40a9ff;
}

.status-un { color: #ff4d4f; }
.status-wait { color: #1890ff; }
.status-done { color: #52c41a; }
.status-un.status-badge { background: #fff1f0; padding: 2px 6px; border-radius: 4px; font-size: 12px; }
.status-wait.status-badge { background: #e6f7ff; padding: 2px 6px; border-radius: 4px; font-size: 12px; }
.status-done.status-badge { background: #f6ffed; padding: 2px 6px; border-radius: 4px; font-size: 12px; }

.empty-state {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 16px;
}
</style>