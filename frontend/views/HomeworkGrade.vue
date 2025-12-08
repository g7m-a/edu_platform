<template>
  <div class="home-container">
    <div class="home-content">
      <div class="header">
        <div class="header-content">
          <button class="back-btn" @click="$router.back()">← 返回</button>
          <h2>作业批改 - {{ homeworkTitle }}</h2>
        </div>
      </div>

      <div class="content-wrapper">
        <!-- 左侧：学生列表 -->
        <div class="student-list-panel">
          <div class="list-header">
            <div class="header-top">
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
            <div class="stats-bar">
              <span class="stat-item">未交: {{ stats.unsubmitted }}</span>
              <span class="stat-item">待改: {{ stats.pending }}</span>
              <span class="stat-item">已改: {{ stats.graded }}</span>
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
    stats() {
      return {
        unsubmitted: this.submissions.filter(s => s.status === 0).length,
        pending: this.submissions.filter(s => s.status === 1).length,
        graded: this.submissions.filter(s => s.status === 2).length
      };
    },
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
.home-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #f5f7fa;
  overflow: auto;
  padding: 20px;
  box-sizing: border-box;
}

.home-content {
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

.header {
  height: 60px;
  background: white;
  display: flex;
  align-items: center;
  box-shadow: 0 1px 4px rgba(0,21,41,0.08);
  border-radius: 8px;
  margin-bottom: 20px;
  padding: 0 20px;
}

.header-content {
  width: 100%;
  display: flex;
  align-items: center;
}

.back-btn {
  margin-right: 20px;
  border: none;
  background: none;
  font-size: 15px;
  cursor: pointer;
  color: #333;
  display: flex;
  align-items: center;
  transition: color 0.3s;
}

.back-btn:hover {
  color: #000;
}

.content-wrapper {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.student-list-panel {
  width: 320px;
  background: white;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  min-height: 500px;
}

.list-header {
  padding: 16px 20px;
  border-bottom: 1px solid #ebeef5;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 8px 8px 0 0;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  width: 100%;
}

.stats-bar {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #333;
  background: #f5f7fa;
  padding: 8px 12px;
  border-radius: 4px;
}

.stat-item {
  display: flex;
  align-items: center;
}

.list-header h3 {
  margin: 0;
  font-size: 16px;
  color: #000;
}

.student-list {
  padding: 8px 0;
}

.student-item {
  padding: 12px 20px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.3s;
  border-left: 3px solid transparent;
}

.student-item:hover {
  background: #f5f7fa;
}

.student-item.active {
  background: #ecf5ff;
  border-left-color: #409eff;
}

.stu-info {
  display: flex;
  flex-direction: column;
}

.stu-name {
  font-weight: 500;
  color: #000;
  font-size: 15px;
}

.stu-id {
  font-size: 13px;
  color: #555;
  margin-top: 4px;
}

.grade-panel {
  flex: 1;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  padding: 30px;
  display: flex;
  flex-direction: column;
  min-height: 500px;
}

.submission-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid #ebeef5;
}

.stu-detail h3 {
  margin: 0 0 8px 0;
  color: #000;
  font-size: 20px;
}

.submit-time {
  color: #555;
  font-size: 13px;
}

.status-large {
  padding: 6px 16px;
  border-radius: 20px;
  font-weight: 500;
  font-size: 14px;
}

.submission-content h4 {
  margin: 0 0 12px 0;
  color: #333;
  font-size: 16px;
}

.content-box {
  background: #f8f9fa;
  padding: 24px;
  border-radius: 8px;
  border: 1px solid #ebeef5;
  min-height: 200px;
  white-space: pre-wrap;
  margin-bottom: 30px;
  color: #000;
  line-height: 1.6;
  font-size: 15px;
}

.grading-form {
  background: #fff;
  padding: 24px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.02);
}

.grading-form h4 {
  margin: 0 0 20px 0;
  color: #000;
  font-size: 18px;
}

.form-row {
  margin-bottom: 20px;
}

.form-row label {
  display: block;
  margin-bottom: 10px;
  font-weight: 500;
  color: #333;
}

.score-input {
  width: 120px;
  padding: 10px 15px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 16px;
  transition: border-color 0.3s;
}

.score-input:focus,
.comment-input:focus {
  border-color: #409eff;
  outline: none;
}

.comment-input {
  width: 100%;
  padding: 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  box-sizing: border-box;
  font-family: inherit;
  font-size: 14px;
  resize: vertical;
  min-height: 100px;
}

.action-row {
  margin-top: 24px;
  text-align: right;
}

.save-btn {
  background: #409eff;
  color: white;
  border: none;
  padding: 12px 30px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s;
}

.save-btn:hover {
  background: #66b1ff;
  transform: translateY(-1px);
}

.status-un { color: #f56c6c; }
.status-wait { color: #e6a23c; } /* Changed to orange for waiting */
.status-done { color: #67c23a; }

.status-un.status-badge { background: #fef0f0; padding: 2px 8px; border-radius: 10px; font-size: 12px; }
.status-wait.status-badge { background: #fdf6ec; padding: 2px 8px; border-radius: 10px; font-size: 12px; }
.status-done.status-badge { background: #f0f9eb; padding: 2px 8px; border-radius: 10px; font-size: 12px; }

.status-large.status-un { background: #fef0f0; border: 1px solid #fde2e2; }
.status-large.status-wait { background: #fdf6ec; border: 1px solid #faecd8; }
.status-large.status-done { background: #f0f9eb; border: 1px solid #e1f3d8; }

.empty-state {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #555;
  font-size: 16px;
}

.empty-tip {
  color: #555;
  text-align: center;
  padding: 40px 0;
}
</style>