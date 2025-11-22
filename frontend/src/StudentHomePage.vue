<template>
  <div class="home-container">
    <div class="home-content">
      <header class="page-header">
        <div class="student-info" v-if="student">
          <span>{{ student.name }} ({{ student.account }})</span>
        </div>
        <div class="function-buttons">
          <button @click="toCourseSeek" class="seek-btn">查询课程信息</button>
        </div>
      </header>

      <div class="timetable-section">
        <div class="timetable-header-group">
          <h2 class="section-title">我的课程表</h2>
          
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
          <span>本周暂无课程</span>
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
              <!-- 上午节次 -->
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
                  >
                    <div class="course-name">{{ course.name }}</div>
                    <div class="course-teacher">教师：{{ course.teachername || '未知' }}</div>
                    <div class="course-place">地点：{{ course.place || '未指定' }}</div>
                  </div>
                </div>
              </div>
              
              <!-- 午休 -->
              <div class="grid-row lunch-break">
                <div class="grid-cell time-slot">
                  <span>午休</span>
                  <span class="time-range">12:00-14:00</span>
                </div>
                <div class="grid-cell class-cell" v-for="(day, index) in weekdays" :key="`lunch-${index}`"></div>
              </div>
              
              <!-- 下午节次 -->
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
                  >
                    <div class="course-name">{{ course.name }}</div>
                    <div class="course-teacher">教师：{{ course.teachername || '未知' }}</div>
                    <div class="course-place">地点：{{ course.place || '未指定' }}</div>
                  </div>
                </div>
              </div>
              
              <!-- 晚上节次 -->
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
                  >
                    <div class="course-name">{{ course.name }}</div>
                    <div class="course-teacher">教师：{{ course.teachername || '未知' }}</div>
                    <div class="course-place">地点：{{ course.place || '未指定' }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="homework-section">
        <h2 class="section-title">已选课程作业提示</h2>
        <div class="state-container empty homework-placeholder">
          <span>作业提示信息即将上线</span>
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
      student: null,
      selectedCourses: [],
      loading: false,
      timetableError: '',
      currentWeek: 1,
      semesterStart: new Date('2025-09-01'),
      weekdays: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
      
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
      const result = this.selectedCourses.map(course => {
        const parsedTime = this.safeParse(course.time);
        console.log(`课程[${course.name}]的time解析结果:`, parsedTime, '原始time值:', course.time);
        
        const startDate = new Date(course.startdate);
        const endDate = new Date(course.enddate);
        console.log(`课程[${course.name}]日期范围:`, 
          'startdate原始值:', course.startdate, '解析后:', startDate,
          'enddate原始值:', course.enddate, '解析后:', endDate
        );
        
        return {
          ...course,
          timeList: parsedTime,
          startDate,
          endDate
        };
      });
      return result;
    },
    
    filteredTimetable() {
      const weekStart = this.getWeekStartDate(this.currentWeek);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      console.log(`当前第${this.currentWeek}周日期范围:`, 
        '开始:', weekStart, '结束:', weekEnd
      );
      
      const filtered = this.timetable.filter(course => {
        const isInRange = course.startDate <= weekEnd && course.endDate >= weekStart;
        console.log(`课程[${course.name}]是否在当前周:`, isInRange,
          '课程开始:', course.startDate, '课程结束:', course.endDate
        );
        return isInRange;
      });
      
      console.log(`当前周过滤后课程(${filtered.length}门):`, filtered.map(c => c.name));
      return filtered;
    },
    
    currentWeekStart() {
      const start = this.getWeekStartDate(this.currentWeek);
      return this.formatDate(start);
    },
    currentWeekEnd() {
      const end = new Date(this.getWeekStartDate(this.currentWeek));
      end.setDate(end.getDate() + 6);
      return this.formatDate(end);
    }
  },
  methods: {
    safeParse(str) {
      try {
        const result = str ? JSON.parse(str) : [];
        return result;
      } catch (e) {
        console.error('解析时间失败:', '原始字符串:', str, '错误:', e);
        return [];
      }
    },
    
    toCourseSeek() {
      this.router.push('/course-seek');
    },

    changeWeek(step) {
      const newWeek = this.currentWeek + step;
      if (newWeek >= 1 && newWeek <= 18) {
        this.currentWeek = newWeek;
        console.log('切换到第', newWeek, '周');
      }
    },
    
    validateWeek() {
      if (this.currentWeek < 1) this.currentWeek = 1;
      if (this.currentWeek > 18) this.currentWeek = 18;
      console.log('验证后当前周:', this.currentWeek);
    },
    getWeekStartDate(weekNum) {
      const start = new Date(this.semesterStart);
      start.setDate(start.getDate() + (weekNum - 1) * 7);
      console.log(`第${weekNum}周的起始日期:`, start);
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
      const matched = this.filteredTimetable.filter(course => {
        const hasMatch = course.timeList.some(item => {
          const weekMatch = item.week === weekday;
          const classMatch = item.classes?.includes(slotIndex);
          if (weekMatch && classMatch) {
            console.log(`课程[${course.name}]匹配成功:`, 
              '星期:', weekday, '节次:', slotIndex, 
              '课程时间项:', item
            );
          }
          return weekMatch && classMatch;
        });
        return hasMatch;
      });
      
      console.log(`[${weekday}第${slotIndex}节]匹配课程(${matched.length}门):`, 
        matched.map(c => c.name)
      );
      return matched;
    },
    
    async fetchSelectedCourses() {
      console.log('学生已选课程ID列表:', this.student?.courses);
      
      if (!this.student?.courses?.length) {
        console.log('学生未选择任何课程或courses字段为空');
        return;
      }

      this.loading = true;
      this.timetableError = '';
      try {
        console.log('开始请求课程详情，courseIds:', this.student.courses);
        const res = await axios.post('http://localhost:3000/api/courses/by-ids', {
          courseIds: this.student.courses
        });
        
        console.log('课程详情接口返回:', res.data);
        this.selectedCourses = res.data.data || [];
        console.log('获取到的课程列表:', this.selectedCourses.map(c => c.name));
      } catch (err) {
        console.error('加载课程表失败:', err);
        this.timetableError = '加载课程表失败，请重试';
      } finally {
        this.loading = false;
      }
    },
    
    calculateCurrentWeek() {
      const today = new Date();
      const semesterStart = new Date(this.semesterStart);
      console.log('计算当前周 - 今天:', today, '学期开始:', semesterStart);
      
      if (today < semesterStart) {
        this.currentWeek = 1;
        console.log('当前日期在学期开始前，默认第1周');
        return;
      }
      
      const diffTime = today - semesterStart;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const weekNum = Math.floor(diffDays / 7) + 1;
      this.currentWeek = Math.min(Math.max(weekNum, 1), 18);
      console.log('计算得到当前周:', this.currentWeek, '相差天数:', diffDays);
    }
  },
  mounted() {
    try {
      const studentInfo = localStorage.getItem('studentInfo');
      console.log('从localStorage获取的studentInfo:', studentInfo);
      
      if (studentInfo) {
        this.student = JSON.parse(studentInfo);
        console.log('解析后的学生信息:', this.student);
        this.calculateCurrentWeek();
        this.fetchSelectedCourses();
      } else {
        console.log('localStorage中无studentInfo');
        alert('请先登录');
        this.router.push('/login');
      }
    } catch (error) {
      console.error('登录信息解析失败:', error);
      alert('登录信息异常，请重新登录');
      this.router.push('/login');
    }
  }
};
</script>

<style scoped>
/* 保持原有样式 */
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

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.student-info {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.seek-btn {
  padding: 8px 16px;
  background-color: #4299e1;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.seek-btn:hover {
  background-color: #3182ce;
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
  border-color: #4299e1;
  color: #4299e1;
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
  background-color: #e6f7ff;
  border-radius: 6px;
  padding: 8px;
  margin-bottom: 8px;
  font-size: 14px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

.course-name {
  font-weight: 600;
  color: #1a73e8;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.course-teacher {
  font-size: 12px;
  color: #666;
  margin-bottom: 3px;
}

.course-place {
  font-size: 12px;
  color: #2e7d32;
}

.homework-section {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  padding: 20px;
}

.homework-placeholder {
  margin-bottom: 0;
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
</style>