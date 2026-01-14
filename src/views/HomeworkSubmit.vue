<template>
  <div class="home-container">
    <div class="home-content">
      <div class="header">
        <div class="header-content">
          <button class="back-btn" @click="$router.back()">← 返回</button>
          <h2>完成作业</h2>
        </div>
      </div>

      <div class="content-wrapper">
        <div v-if="homework" class="main-card">
          <div class="hw-info">
            <div class="info-header">
              <h1 class="hw-title">{{ homework.title }}</h1>
              <span class="status-badge" :class="getStatusClass(homework.status)">
                {{ getStatusText(homework) }}
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
              
              <!-- 文本提交 -->
              <div class="editor-container">
                <textarea 
                  v-model="submitContent" 
                  class="content-editor"
                  placeholder="在此输入作业内容（可选）..."
                  rows="15"
                  :disabled="isOverdue(homework.ddl)"
                ></textarea>
              </div>

              <!-- 文件上传 -->
              <div class="file-upload-section">
                <label class="upload-label">文件上传（可选，仅支持Word/PDF）：</label>
                <div class="file-upload-wrapper">
                  <input 
                    type="file" 
                    ref="fileInput"
                    @change="handleFileSelect"
                    accept=".doc,.docx,.pdf"
                    :disabled="isOverdue(homework.ddl)"
                    class="file-input"
                    id="file-upload"
                  />
                  <label for="file-upload" class="file-upload-btn" :class="{ 'disabled': isOverdue(homework.ddl) }">
                    <span v-if="!selectedFile">📎 选择文件</span>
                    <span v-else class="file-name">{{ selectedFile.name }}</span>
                  </label>
                  <button 
                    v-if="selectedFile" 
                    @click="removeFile"
                    class="remove-file-btn"
                    :disabled="isOverdue(homework.ddl)"
                  >
                    ✕
                  </button>
                </div>
                <div v-if="selectedFile" class="file-info">
                  已选择：{{ selectedFile.name }} ({{ formatFileSize(selectedFile.size) }})
                </div>
              </div>

              <div class="action-bar">
                <span class="last-time" v-if="homework.submit_time">
                  上次提交：{{ formatTime(homework.submit_time) }}
                </span>
                <button 
                  class="submit-btn" 
                  @click="submitHomework"
                  :disabled="isOverdue(homework.ddl) || isSubmitting"
                  :class="{ 'disabled-btn': isOverdue(homework.ddl) || isSubmitting }"
                >
                  {{ isSubmitting ? '提交中...' : (homework.status === 1 ? '更新提交' : '提交作业') }}
                </button>
              </div>
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
      submitContent: '',
      selectedFile: null,
      isSubmitting: false
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
    handleFileSelect(event) {
      const file = event.target.files[0];
      if (file) {
        // 验证文件类型
        const allowedTypes = ['.doc', '.docx', '.pdf'];
        const fileName = file.name.toLowerCase();
        const isValidType = allowedTypes.some(type => fileName.endsWith(type));
        
        if (!isValidType) {
          alert('只支持上传Word文档(.doc, .docx)和PDF文件(.pdf)');
          this.$refs.fileInput.value = '';
          return;
        }
        
        // 验证文件大小（10MB）
        if (file.size > 10 * 1024 * 1024) {
          alert('文件大小不能超过10MB');
          this.$refs.fileInput.value = '';
          return;
        }
        
        this.selectedFile = file;
      }
    },
    removeFile() {
      this.selectedFile = null;
      if (this.$refs.fileInput) {
        this.$refs.fileInput.value = '';
      }
    },
    formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    },
    async submitHomework() {
      // 验证：至少要有文本内容或文件
      if (!this.submitContent.trim() && !this.selectedFile) {
        alert('请至少输入文本内容或上传文件');
        return;
      }

      this.isSubmitting = true;
      try {
        const formData = new FormData();
        formData.append('id', this.homework.sh_id);
        formData.append('submit_content', this.submitContent || '');
        if (this.selectedFile) {
          formData.append('file', this.selectedFile);
        }

        const res = await axios.post('http://localhost:3000/api/homework/submit', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        if (res.data.code === 200) {
          alert('提交成功！');
          this.selectedFile = null;
          if (this.$refs.fileInput) {
            this.$refs.fileInput.value = '';
          }
          await this.fetchHomeworkData();
        } else {
          alert(res.data.message);
        }
      } catch (err) {
        if (err.response && err.response.data && err.response.data.message) {
          alert(err.response.data.message);
        } else {
          alert('网络错误');
        }
      } finally {
        this.isSubmitting = false;
      }
    },
    getStatusText(homework) {
      const map = { 0: '未提交', 1: '已提交', 2: '已批改' };
      let text = map[homework.status] || '未知';
      if (this.isOverdue(homework.ddl) && homework.status !== 2) {
        text += ' (已截止)';
      }
      return text;
    },
    isOverdue(ddl) {
      if (!ddl) return false;
      return new Date() > new Date(ddl);
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
.home-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(180deg, #f0fdf4 0%, #ffffff 100%);
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
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  border-radius: 12px;
  margin-bottom: 20px;
  padding: 0 20px;
  border-left: 4px solid #0d7a3d;
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
  justify-content: center;
}

.main-card {
  width: 100%;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.06);
  padding: 40px;
  box-sizing: border-box;
  border-top: 3px solid #0d7a3d;
}

.info-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #ebeef5;
}

.hw-title {
  margin: 0;
  font-size: 24px;
  color: #000;
}

.status-badge {
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
}

.meta-row {
  display: flex;
  gap: 30px;
  margin-bottom: 30px;
  color: #000;
  font-size: 14px;
  background: #f8f9fa;
  padding: 15px 20px;
  border-radius: 6px;
  font-weight: 500;
}

.meta-item {
  display: flex;
  align-items: center;
}

.hw-description {
  margin-bottom: 40px;
}

.hw-description h3 {
  font-size: 18px;
  color: #000;
  margin-bottom: 15px;
}

.desc-content {
  color: #333;
  line-height: 1.8;
  font-size: 15px;
  white-space: pre-wrap;
  background: #fff;
  border: 1px solid #ebeef5;
  padding: 20px;
  border-radius: 6px;
}

.submission-area {
  border-top: 1px solid #ebeef5;
  padding-top: 30px;
}

.input-form h3 {
  font-size: 18px;
  color: #000;
  margin-bottom: 20px;
}

.content-editor {
  width: 100%;
  padding: 15px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  font-family: inherit;
  font-size: 15px;
  line-height: 1.6;
  resize: vertical;
  min-height: 200px;
  transition: border-color 0.3s;
  box-sizing: border-box;
}

.content-editor:focus {
  border-color: #0d7a3d;
  outline: none;
  box-shadow: 0 0 0 3px rgba(13, 122, 61, 0.1);
}

.action-bar {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 20px;
}

.last-time {
  color: #555;
  font-size: 13px;
}

.submit-btn {
  background: #0d7a3d;
  color: white;
  border: none;
  padding: 12px 36px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  transition: all 0.3s;
}

.submit-btn:hover {
  background: #0a5f2e;
  transform: translateY(-1px);
}

.submit-btn:disabled {
  background-color: #909399;
  cursor: not-allowed;
  transform: none;
  opacity: 0.7;
}

.content-editor:disabled {
  background-color: #f5f7fa;
  cursor: not-allowed;
  color: #909399;
}

.file-upload-section {
  margin-top: 20px;
  margin-bottom: 20px;
}

.upload-label {
  display: block;
  margin-bottom: 10px;
  font-weight: 500;
  color: #333;
  font-size: 14px;
}

.file-upload-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
}

.file-input {
  display: none;
}

.file-upload-btn {
  display: inline-block;
  padding: 10px 20px;
  background: #0d7a3d;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.file-upload-btn:hover {
  background: #0a5f2e;
}

.file-upload-btn:hover:not(.disabled) {
  background: #0a5f2e;
}

.file-upload-btn.disabled {
  background: #c0c4cc;
  cursor: not-allowed;
}

.file-upload-btn .file-name {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: inline-block;
}

.remove-file-btn {
  padding: 8px 12px;
  background: #f56c6c;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.remove-file-btn:hover:not(:disabled) {
  background: #f78989;
}

.remove-file-btn:disabled {
  background: #c0c4cc;
  cursor: not-allowed;
}

.file-info {
  margin-top: 8px;
  font-size: 13px;
  color: #666;
}

.graded-result {
  background: #f0f9eb;
  padding: 30px;
  border-radius: 8px;
  border: 1px solid #e1f3d8;
}

.result-header {
  font-size: 18px;
  font-weight: bold;
  color: #67c23a;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
}

.result-header::before {
  content: '✓';
  display: inline-block;
  margin-right: 8px;
  background: #67c23a;
  color: white;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  text-align: center;
  line-height: 24px;
  font-size: 14px;
}

.score-box {
  font-size: 18px;
  margin-bottom: 20px;
  display: flex;
  align-items: baseline;
}

.score {
  font-size: 36px;
  font-weight: bold;
  color: #67c23a;
  margin: 0 5px;
}

.total {
  color: #555;
  font-size: 14px;
}

.comment-box {
  margin-bottom: 20px;
  background: white;
  padding: 15px;
  border-radius: 6px;
  border: 1px dashed #c0c4cc;
}

.comment-box p {
  margin: 5px 0 0 0;
  color: #333;
}

.my-content {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #e1f3d8;
}

.read-only-content {
  margin-top: 10px;
  padding: 15px;
  background: white;
  border-radius: 4px;
  color: #333;
  white-space: pre-wrap;
  border: 1px solid #ebeef5;
}

.status-un { color: #f56c6c; background: #fef0f0; border: 1px solid #fde2e2; }
.status-sub { color: #0d7a3d; background: #f0fdf4; border: 1px solid #86efac; }
.status-done { color: #67c23a; background: #f0f9eb; border: 1px solid #e1f3d8; }
</style>