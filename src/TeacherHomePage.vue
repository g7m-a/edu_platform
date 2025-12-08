<template>
  <div class="teacher-home-container">
    <div class="home-content">
      <header class="page-header">
        <div class="teacher-info" v-if="teacher">
          <span>{{ teacher.name }} ({{ teacher.account }}) - 教师</span>
        </div>
      </header>

      <div class="timetable-section">
        <div class="timetable-header-group">
          <h2 class="section-title">我的授课表</h2>
          
          <div class="week-control">
            <button 
              class="week-btn" 
              @click="changeWeek(-1)" 
              :disabled="currentWeek <= 1"
            >
              上一周
            </button>
            <div class="week-input-group">
              <input 
                type="number" 
                v-model.number="currentWeek" 
                min="1" 
                max="18"
                @change="validateWeek"
                class="week-input"
              >
              <span class="week-text">/ 18周</span>
            </div>
            <button 
              class="week-btn" 
              @click="changeWeek(1)" 
              :disabled="currentWeek >= 18"
            >
              下一周
            </button>
            <span class="current-date">
              {{ currentWeekStart }} - {{ currentWeekEnd }}
            </span>
          </div>
        </div>
        
        <div v-if="loading" class="state-container loading">
          <span>加载中...</span>
        </div>
        
        <div v-else-if="timetableError" class="state-container error">
          <span>{{ timetableError }}</span>
        </div>
        
        <div v-else-if="filteredTimetable.length === 0" class="state-container empty">
          <span>本周暂无授课</span>
        </div>
        
        <div v-else class="table-container">
          <div class="timetable-grid">
            <div class="grid-header">
              <div class="grid-cell time-slot">时间/星期</div>
              <div 
                class="grid-cell weekday" 
                v-for="(day, index) in weekdays" 
                :key="index"
              >
                {{ day }}<br>
                <span class="week-date">{{ getWeekDate(index) }}</span>
              </div>
            </div>
            
            <div class="grid-body">
              <div 
                class="grid-row" 
                v-for="slot in morningSlots" 
                :key="slot.index"
              >
                <div class="grid-cell time-slot">
                  <span>{{ slot.label }}</span>
                  <span class="time-range">{{ slot.time }}</span>
                </div>
                
                <div 
                  class="grid-cell class-cell" 
                  v-for="(day, dayIndex) in weekdays" 
                  :key="`${day}-${slot.index}`"
                >
                  <div 
                    class="course-item"
                    v-for="course in getCourseByTime(day, slot.index)" 
                    :key="course.id"
                    :class="{ 'conflict-course': getCourseByTime(day, slot.index).length > 1 }"
                  >
                    <div class="course-name">{{ course.name }}</div>
                    <div class="course-code">课程号：{{ course.id }}</div>
                    <div class="course-place">地点：{{ course.place || '未指定' }}</div>
                    <div class="conflict-tag" v-if="getCourseByTime(day, slot.index).length > 1">
                      冲突
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="grid-row lunch-break">
                <div class="grid-cell time-slot">
                  <span>午休</span>
                  <span class="time-range">12:00-14:00</span>
                </div>
                <div class="grid-cell class-cell" v-for="(day, index) in weekdays" :key="`lunch-${index}`"></div>
              </div>
              
              <div 
                class="grid-row" 
                v-for="slot in afternoonSlots" 
                :key="slot.index"
              >
                <div class="grid-cell time-slot">
                  <span>{{ slot.label }}</span>
                  <span class="time-range">{{ slot.time }}</span>
                </div>
                
                <div 
                  class="grid-cell class-cell" 
                  v-for="(day, dayIndex) in weekdays" 
                  :key="`${day}-${slot.index}`"
                >
                  <div 
                    class="course-item"
                    v-for="course in getCourseByTime(day, slot.index)" 
                    :key="course.id"
                    :class="{ 'conflict-course': getCourseByTime(day, slot.index).length > 1 }"
                  >
                    <div class="course-name">{{ course.name }}</div>
                    <div class="course-code">课程号：{{ course.id }}</div>
                    <div class="course-place">地点：{{ course.place || '未指定' }}</div>
                    <div class="conflict-tag" v-if="getCourseByTime(day, slot.index).length > 1">
                      冲突
                    </div>
                  </div>
                </div>
              </div>
              
              <div 
                class="grid-row" 
                v-for="slot in eveningSlots" 
                :key="slot.index"
              >
                <div class="grid-cell time-slot">
                  <span>{{ slot.label }}</span>
                  <span class="time-range">{{ slot.time }}</span>
                </div>
                
                <div 
                  class="grid-cell class-cell" 
                  v-for="(day, dayIndex) in weekdays" 
                  :key="`${day}-${slot.index}`"
                >
                  <div 
                    class="course-item"
                    v-for="course in getCourseByTime(day, slot.index)" 
                    :key="course.id"
                    :class="{ 'conflict-course': getCourseByTime(day, slot.index).length > 1 }"
                  >
                    <div class="course-name">{{ course.name }}</div>
                    <div class="course-code">课程号：{{ course.id }}</div>
                    <div class="course-place">地点：{{ course.place || '未指定' }}</div>
                    <div class="conflict-tag" v-if="getCourseByTime(day, slot.index).length > 1">
                      冲突
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="homework-section">
        <h2 class="section-title">课程作业管理</h2>
        
        <!-- 发布作业表单 -->
        <div class="homework-form-container">
          <div class="form-group">
            <label class="form-label">选择课程</label>
            <select 
              v-model="selectedCourseId" 
              class="form-select"
              @change="resetHomeworkForm"
            >
              <option value="">-- 请选择课程 --</option>
              <option 
                v-for="course in teachingCourses" 
                :key="course.id" 
                :value="course.id"
              >
                {{ course.name }}（课程号：{{ course.id }}）
              </option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">作业标题</label>
            <input 
              type="text" 
              v-model="homeworkForm.title" 
              class="form-input"
              placeholder="输入作业标题"
              required
            >
          </div>

          <div class="form-group">
            <label class="form-label">作业内容</label>
            <textarea 
              v-model="homeworkForm.content" 
              class="form-textarea"
              placeholder="输入作业要求、内容描述"
              rows="4"
              required
            ></textarea>
          </div>

          <div class="form-group">
            <label class="form-label">截止提交时间</label>
            <input 
              type="datetime-local" 
              v-model="homeworkForm.deadline" 
              class="form-input"
              required
            >
          </div>

          <button 
            class="publish-btn" 
            @click="publishHomework"
            :disabled="!selectedCourseId || !homeworkForm.title || !homeworkForm.deadline"
          >
            发布作业
          </button>
        </div>

        <!-- 已发布作业列表 -->
        <div class="published-homework-list" v-if="publishedHomeworks.length">
          <h3 class="list-title">已发布作业</h3>
          <div class="homework-item" v-for="item in publishedHomeworks" :key="item.id">
            <div class="homework-title">{{ item.title }}</div>
            <div class="homework-meta">
              <span>课程：{{ getCourseName(item.course_id) }}</span>
              <span>截止时间：{{ formatShowTime(item.ddl) }}</span>
              <button class="delete-btn" @click="deleteHomework(item.id)">删除</button>
            </div>
          </div>
        </div>
        <div v-else class="state-container empty">
          <span>暂无已发布作业</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { useRouter } from 'vue-router';

export default {
  data() {
    return {
      teacher: null,
      teachingCourses: [],
      loading: false,
      timetableError: '',
      currentWeek: 1,
      semesterStart: new Date('2025-09-01'),
      weekdays: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
      conflictAlertShown: false,
      selectedCourseId: '',
      homeworkForm: {
        title: '',
        content: '',
        deadline: ''
      },
      publishedHomeworks: [],
      morningSlots: [
        { index: 1, label: '第1节', time: '08:00-08:45' },
        { index: 2, label: '第2节', time: '08:55-09:40' },
        { index: 3, label: '第3节', time: '10:00-10:45' },
        { index: 4, label: '第4节', time: '10:55-11:40' }
      ],
      afternoonSlots: [
        { index: 5, label: '第5节', time: '14:00-14:45' },
        { index: 6, label: '第6节', time: '14:55-15:40' },
        { index: 7, label: '第7节', time: '16:00-16:45' },
        { index: 8, label: '第8节', time: '16:55-17:40' }
      ],
      eveningSlots: [
        { index: 9, label: '第9节', time: '18:30-19:15' },
        { index: 10, label: '第10节', time: '19:25-20:10' },
        { index: 11, label: '第11节', time: '20:20-21:05' },
        { index: 12, label: '第12节', time: '21:15-22:00' }
      ]
    };
  },
  setup() {
    const router = useRouter();
    return { router };
  },
  computed: {
    allTimeSlots() {
      return [...this.morningSlots, ...this.afternoonSlots, ...this.eveningSlots];
    },
    
    timetable() {
      return this.teachingCourses.map(course => ({
        ...course,
        timeList: this.safeParse(course.time),
        startDate: course.startdate ? new Date(course.startdate) : null,
        endDate: course.enddate ? new Date(course.enddate) : null
      })).filter(course => course.startDate && course.endDate);
    },
    
    filteredTimetable() {
      const weekStart = this.getWeekStartDate(this.currentWeek);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      return this.timetable.filter(course => {
        return course.startDate <= weekEnd && course.endDate >= weekStart;
      });
    },
    
    currentWeekStart() {
      const start = this.getWeekStartDate(this.currentWeek);
      return this.formatDate(start);
    },
    currentWeekEnd() {
      const end = new Date(this.getWeekStartDate(this.currentWeek));
      end.setDate(end.getDate() + 6);
      return this.formatDate(end);
    },
    
    hasCourseConflict() {
      for (const day of this.weekdays) {
        for (const slot of this.allTimeSlots) {
          const coursesInSlot = this.getCourseByTime(day, slot.index);
          if (coursesInSlot.length >= 2) {
            return true;
          }
        }
      }
      return false;
    },
    
    conflictDetails() {
      const conflicts = [];
      for (const day of this.weekdays) {
        for (const slot of this.allTimeSlots) {
          const coursesInSlot = this.getCourseByTime(day, slot.index);
          if (coursesInSlot.length >= 2) {
            conflicts.push({
              day,
              slot: slot.label,
              courses: coursesInSlot.map(c => c.name)
            });
          }
        }
      }
      return conflicts;
    }
  },
  watch: {
    filteredTimetable: {
      deep: true,
      handler() {
        this.checkAndAlertConflict();
      }
    }
  },
  methods: {
    safeParse(str) {
      try {
        return str ? JSON.parse(str) : [];
      } catch (e) {
        console.error('解析时间失败:', e);
        return [];
      }
    },

    changeWeek(step) {
      const newWeek = this.currentWeek + step;
      if (newWeek >= 1 && newWeek <= 18) {
        this.currentWeek = newWeek;
        this.conflictAlertShown = false;
      }
    },
    
    validateWeek() {
      if (this.currentWeek < 1) this.currentWeek = 1;
      if (this.currentWeek > 18) this.currentWeek = 18;
      this.conflictAlertShown = false;
    },
    
    getWeekStartDate(weekNum) {
      const start = new Date(this.semesterStart);
      start.setDate(start.getDate() + (weekNum - 1) * 7);
      return start;
    },
    
    getWeekDate(dayIndex) {
      const date = new Date(this.getWeekStartDate(this.currentWeek));
      date.setDate(date.getDate() + dayIndex);
      return this.formatDate(date, 'm-d');
    },
    
    formatDate(date, format = 'yyyy-mm-dd') {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      if (format === 'm-d') {
        return `${month}-${day}`;
      }
      return `${year}-${month}-${day}`;
    },
    
    getCourseByTime(weekday, slotIndex) {
      return this.filteredTimetable.filter(course => {
        return course.timeList.some(item => {
          const weekMatch = item.week === weekday;
          const startClass = item.classes?.[0] || 0;
          const endClass = item.classes?.[1] || 0;
          const classMatch = startClass <= slotIndex && slotIndex <= endClass;
          
          return weekMatch && classMatch;
        });
      });
    },
    
    checkAndAlertConflict() {
      if (this.hasCourseConflict && !this.conflictAlertShown) {
        let alertText = '⚠️ 发现授课冲突！以下节次存在多门授课安排，请尽快调整：\n';
        this.conflictDetails.forEach(conflict => {
          alertText += `\n${conflict.day}${conflict.slot}：${conflict.courses.join('、')}`;
        });
        alertText += '\n\n请联系管理员调整授课时间，避免影响教学。';
        alert(alertText);
        this.conflictAlertShown = true;
      }
    },
    
    async fetchTeachingCourses() {
      if (!this.teacher?.courses?.length) return;

      this.loading = true;
      this.timetableError = '';
      try {
        const res = await axios.post('http://localhost:3000/api/courses/by-ids', {
          courseIds: this.teacher.courses
        });
        this.teachingCourses = res.data.data || [];
      } catch (err) {
        console.error('获取授课课程失败:', err);
        this.timetableError = '加载授课表失败，请重试';
      } finally {
        this.loading = false;
      }
    },
    
    calculateCurrentWeek() {
      const today = new Date();
      const semesterStart = new Date(this.semesterStart);
      if (today < semesterStart) {
        this.currentWeek = 1;
        return;
      }
      
      const diffTime = today - semesterStart;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const weekNum = Math.floor(diffDays / 7) + 1;
      this.currentWeek = Math.min(Math.max(weekNum, 1), 18);
    },

    resetHomeworkForm() {
      this.homeworkForm = {
        title: '',
        content: '',
        deadline: ''
      };
    },

    getCourseName(courseId) {
      const course = this.teachingCourses.find(item => item.id === courseId);
      return course ? course.name : '未知课程';
    },

    formatShowTime(timeStr) {
      if (!timeStr) return '无';
      const date = new Date(timeStr);
      if (isNaN(date.getTime())) return '无效时间';
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day} ${hours}:${minutes}`;
    },

    async fetchPublishedHomeworks() {
      if (!this.teacher?.account) return;
      try {
        const res = await axios.post('http://localhost:3000/api/homework/teacher/list', {
          teacher_id: this.teacher.account
        });
        if (res.data.code === 200) {
          this.publishedHomeworks = res.data.data || [];
        }
      } catch (err) {
        console.error('获取已发布作业失败:', err);
      }
    },

    async publishHomework() {
      try {
        const formattedDdl = this.homeworkForm.deadline.replace('T', ' ') + ':00';

        const homeworkData = {
          id: 'HW_' + Date.now() + Math.random().toString(36).substr(2, 6),
          course_id: this.selectedCourseId,
          teacher_id: this.teacher.account,
          title: this.homeworkForm.title,
          content: this.homeworkForm.content,
          ddl: formattedDdl
        };

        const res = await axios.post('http://localhost:3000/api/homework/publish', homeworkData);
        
        if (res.data.code === 200) {
          alert('作业发布成功！');
          this.fetchPublishedHomeworks();
          this.resetHomeworkForm();
          this.selectedCourseId = '';
        } else {
          alert('作业发布失败：' + res.data.message);
        }
      } catch (err) {
        console.error('发布作业失败:', err);
        alert('网络错误，作业发布失败，请重试');
      }
    },

    // 新增：删除作业方法
    async deleteHomework(homeworkId) {
      if (!confirm('确定要删除该作业吗？删除后将同时删除所有学生的相关作业记录！')) {
        return;
      }
      try {
        const res = await axios.post('http://localhost:3000/api/homework/delete', {
          homework_id: homeworkId,
          teacher_id: this.teacher.account
        });
        if (res.data.code === 200) {
          alert('作业删除成功！');
          this.fetchPublishedHomeworks(); // 重新加载作业列表
        } else {
          alert('作业删除失败：' + res.data.message);
        }
      } catch (err) {
        console.error('删除作业失败:', err);
        alert('网络错误，作业删除失败，请重试');
      }
    }
  },
  mounted() {
    const teacherInfo = localStorage.getItem('teacherInfo');
    if (teacherInfo) {
      this.teacher = JSON.parse(teacherInfo);
      if (!Array.isArray(this.teacher.courses)) {
        this.teacher.courses = [];
      }
      this.calculateCurrentWeek();
      this.fetchTeachingCourses();
      this.fetchPublishedHomeworks();
    } else {
      alert('请先登录');
      this.router.push('/teacher-login');
    }
  }
};
</script>

<style scoped>
.teacher-home-container {
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

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.teacher-info {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.timetable-header-group {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.week-control {
  display: flex;
  align-items: center;
  gap: 10px;
}

.week-btn {
  padding: 4px 10px;
  background-color: #fff;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.week-btn:disabled {
  background-color: #f5f5f5;
  color: #999;
  cursor: not-allowed;
}

.week-btn:not(:disabled):hover {
  border-color: #42b983;
  color: #42b983;
}

.week-input-group {
  display: flex;
  align-items: center;
}

.week-input {
  width: 50px;
  padding: 4px;
  text-align: center;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.week-text {
  margin-left: 5px;
  color: #666;
  font-size: 14px;
}

.current-date {
  color: #666;
  font-size: 14px;
  white-space: nowrap;
}

.state-container {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  padding: 40px 0;
  text-align: center;
  margin-bottom: 20px;
}

.loading span {
  color: #666;
}

.error span {
  color: #e53e3e;
}

.empty span {
  color: #999;
}

.table-container {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  margin-bottom: 20px;
}

.time-section {
  border-bottom: 1px solid #eee;
}

.time-section:last-child {
  border-bottom: none;
}

.section-label {
  padding: 8px 12px;
  background-color: #f0f2f5;
  color: #666;
  font-size: 14px;
  font-weight: 500;
}

.timetable-grid {
  width: 100%;
}

.grid-header {
  display: grid;
  grid-template-columns: 130px repeat(7, 1fr);
  border-bottom: 1px solid #eee;
}

.grid-body {
  display: flex;
  flex-direction: column;
}

.grid-row {
  display: grid;
  grid-template-columns: 130px repeat(7, 1fr);
  border-bottom: 1px solid #eee;
}

.grid-row:last-child {
  border-bottom: none;
}

.lunch-break {
  background-color: #fff8e6;
}

.lunch-break .time-slot {
  background-color: #fff0c8;
  color: #d48806;
  font-weight: 600;
}

.grid-cell {
  padding: 12px;
  box-sizing: border-box;
  min-height: 100px;
  border-right: 1px solid #eee;
}

.grid-cell:last-child {
  border-right: none;
}

.time-slot {
  background-color: #f8f9fa;
  color: #333;
  text-align: center;
  padding: 8px 5px;
}

.time-range {
  display: block;
  font-size: 12px;
  color: #666;
  font-weight: normal;
  margin-top: 4px;
}

.weekday {
  background-color: #e6f7ff;
  font-weight: 600;
  color: #333;
  text-align: center;
  padding: 8px 5px;
}

.week-date {
  font-size: 12px;
  color: #666;
  font-weight: normal;
}

.class-cell {
  vertical-align: top;
}

.course-item {
  background-color: #e8f5e9;
  border-radius: 6px;
  padding: 8px;
  margin-bottom: 8px;
  font-size: 14px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  position: relative;
}

.course-name {
  font-weight: 600;
  color: #2e7d32;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.course-code {
  font-size: 12px;
  color: #666;
  margin-bottom: 3px;
}

.course-place {
  font-size: 12px;
  color: #1a73e8;
}

.homework-section {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  padding: 20px;
  margin-top: 20px;
}

/* 作业表单样式 */
.homework-form-container {
  padding: 20px 0;
  border-bottom: 1px solid #eee;
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 15px;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #333;
}

.form-select, .form-input, .form-textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
}

.form-textarea {
  resize: vertical;
}

.publish-btn {
  padding: 8px 20px;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.publish-btn:disabled {
  background-color: #a5d6a7;
  cursor: not-allowed;
}

.publish-btn:hover:not(:disabled) {
  background-color: #35945a;
}

/* 已发布作业列表样式 */
.published-homework-list {
  padding: 10px 0;
}

.list-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 10px;
  color: #333;
}

.homework-item {
  background-color: #f8f9fa;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 10px;
  display: flex;
  flex-direction: column;
}

.homework-title {
  font-weight: 600;
  color: #2e7d32;
  margin-bottom: 5px;
}

.homework-meta {
  font-size: 12px;
  color: #666;
  display: flex;
  gap: 20px;
  align-items: center;
}

/* 新增删除按钮样式 */
.delete-btn {
  padding: 4px 8px;
  background-color: #e53e3e;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  margin-left: auto;
}

.delete-btn:hover {
  background-color: #c53030;
}

@media (max-width: 1200px) {
  .grid-cell {
    min-height: 80px;
  }
  
  .course-item {
    font-size: 13px;
    padding: 6px;
  }
}

.conflict-course {
  border: 2px solid #e53e3e;
  background-color: #fff8f8;
}

.conflict-tag {
  position: absolute;
  top: 4px;
  right: 4px;
  background-color: #e53e3e;
  color: white;
  font-size: 11px;
  padding: 1px 4px;
  border-radius: 3px;
}
</style>