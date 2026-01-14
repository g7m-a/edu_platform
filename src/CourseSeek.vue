<template>
  <div class="course-select-container">
    <div class="page-header">
      <h2>课程选择</h2>
    </div>

    <div class="filter-area">
      <div class="filter-item">
        <label>课程编号：</label>
        <input
          v-model="filterCourseId"
          placeholder="输入课程编号搜索"
          class="filter-input"
          @input="handleFilter"
        />
      </div>

      <div class="filter-item">
        <label>课程名称：</label>
        <input
          v-model="filterCourseName"
          placeholder="输入课程名搜索"
          class="filter-input"
          @input="handleFilter"
        />
      </div>

      <div class="filter-item">
        <label>授课教师：</label>
        <input
          v-model="filterTeacherName"
          placeholder="输入教师姓名搜索"
          class="filter-input"
          @input="handleFilter"
        />
      </div>
    </div>

    <div class="table-container">
      <table class="course-table">
        <thead>
          <tr>
            <th>课程编号</th>
            <th>课程名称</th>
            <th>授课教师</th>
            <th>开始日期</th>
            <th>结束日期</th>
            <th>授课地点</th>
            <th>上课时间</th>
            <th>已选人数</th>
            <th>最大人数</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="course in filteredCourses" :key="course.id">
            <td>{{ course.id }}</td>
            <td>{{ course.name }}</td>
            <td>{{ course.teachername || '未知教师' }}</td>
            <td>{{ formatDate(course.startdate) }}</td>
            <td>{{ formatDate(course.enddate) }}</td>
            <td>{{ course.place || '未指定' }}</td>
            <td>
              <div v-if="course.timeList && course.timeList.length">
                <div v-for="(item, index) in course.timeList" :key="index" class="time-item">
                  {{ item.week }} {{ item.classes[0] }}-{{ item.classes[1] }}节
                </div>
              </div>
              <div v-else class="empty-time">无</div>
            </td>
            <!-- 已选人数：直接使用课程的 currentstu 字段（后端统计返回） -->
            <td>{{ course.currentstu || 0 }}</td>
            <td>{{ course.maxstu || 0 }}</td>
            <td class="operate-btn-group">
              <button 
                @click="selectCourse(course.id)" 
                class="select-btn"
                :disabled="isCourseSelected(course.id) || (course.currentstu >= course.maxstu)"
              >
                选课
              </button>
              <button 
                @click="dropCourse(course.id)" 
                class="drop-btn"
                :disabled="!isCourseSelected(course.id)"
              >
                退课
              </button>
            </td>
          </tr>
          <tr v-if="filteredCourses.length === 0">
            <td colspan="10" class="empty-tip">暂无匹配课程数据</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { useRouter } from 'vue-router';

export default {
  data() {
    return {
      courses: [], // 存储所有课程（含 currentstu 已选人数字段）
      student: null,
      selectedCourseIds: [], // 存储学生已选课程ID（单独维护，不依赖 student.courses）
      filterCourseId: '',
      filterCourseName: '',
      filterTeacherName: '',
      filteredCourses: []
    };
  },
  setup() {
    const router = useRouter();
    return { router };
  },
  methods: {
    formatDate(dateStr) {
      if (!dateStr) return '';
      return new Date(dateStr).toLocaleDateString('zh-CN');
    },

    // 核心改动1：判断课程是否已选（基于 selectedCourseIds 数组）
    isCourseSelected(courseId) {
      return this.selectedCourseIds.includes(courseId);
    },

    // 核心改动2：获取学生已选课程ID列表（调用新接口）
    async fetchSelectedCourseIds() {
      if (!this.student?.account) return;
      try {
        const res = await axios.get(`http://localhost:3000/api/student/${this.student.account}/courses`);
        if (res.data.code === 200) {
          // 提取已选课程的ID数组
          this.selectedCourseIds = res.data.data.map(course => course.id);
          console.log('学生已选课程ID:', this.selectedCourseIds);
        }
      } catch (error) {
        console.error('获取已选课程ID失败:', error);
        alert('获取选课状态失败，请重试');
      }
    },

    // 核心改动3：获取所有课程（适配后端返回的 currentstu 字段）
    async fetchCourses() {
      try {
        const response = await axios.get('http://localhost:3000/api/courses');
        this.courses = (response.data.data || []).map(course => ({
          ...course,
          timeList: this.safeParse(course.time), // 安全解析时间
          teachername: '', // 后续绑定教师姓名
          currentstu: course.currentstu || 0, // 已选人数（后端统计）
          maxstu: course.maxstu || 0 // 最大人数
        }));
        this.filteredCourses = [...this.courses];
        await this.bindTeacherNamesTOCourses(); // 绑定教师姓名
      } catch (error) {
        console.error('获取课程失败：', error);
        alert('无法加载课程数据，请检查网络');
      }
    },

    // 安全解析JSON（避免解析失败报错）
    safeParse(str) {
      try {
        return str ? JSON.parse(str) : [];
      } catch (e) {
        console.error('解析时间失败:', str, e);
        return [];
      }
    },

    // 绑定教师姓名（无改动）
    async bindTeacherNamesTOCourses() {
      for (const course of this.courses) {
        try {
          const response = await axios.get(`http://localhost:3000/api/teachername/${course.teacheraccount}`);
          course.teachername = response.data.data || '未知教师';
        } catch (error) {
          course.teachername = '未知教师';
        }
      }
      // 绑定完教师姓名后重新过滤（确保过滤条件生效）
      this.handleFilter();
    },

    // 过滤课程（无改动）
    handleFilter() {
      let result = [...this.courses];
      if (this.filterCourseId) {
        result = result.filter(course => course.id.toString().includes(this.filterCourseId));
      }
      if (this.filterCourseName) {
        result = result.filter(course => course.name.includes(this.filterCourseName));
      }
      if (this.filterTeacherName) {
        result = result.filter(course => course.teachername.includes(this.filterTeacherName));
      }
      this.filteredCourses = result;
    },

    // 检查时间段是否重叠
    isTimeOverlap(classes1, classes2) {
      const start1 = classes1[0];
      const end1 = classes1[1];
      const start2 = classes2[0];
      const end2 = classes2[1];
      return start1 <= end2 && end1 >= start2;
    },

    // 检查日期范围是否重叠
    isDateRangeOverlap(start1, end1, start2, end2) {
      // 如果任一课程没有起止日期，认为不冲突（允许选课）
      if (!start1 || !end1 || !start2 || !end2) {
        return false;
      }
      const s1 = new Date(start1).getTime();
      const e1 = new Date(end1).getTime();
      const s2 = new Date(start2).getTime();
      const e2 = new Date(end2).getTime();
      // 日期范围重叠：start1 <= end2 && end1 >= start2
      return s1 <= e2 && e1 >= s2;
    },

    // 检查课程时间冲突（考虑起止日期）
    checkCourseTimeConflict(newCourse, selectedCourses) {
      if (!newCourse.timeList || newCourse.timeList.length === 0) {
        return null; // 新课程没有时间安排，不冲突
      }

      for (const newTime of newCourse.timeList) {
        if (!newTime.week || !newTime.classes || !newTime.classes[0] || !newTime.classes[1]) {
          continue;
        }

        for (const selectedCourse of selectedCourses) {
          // 首先检查课程的有效期是否重叠
          if (!this.isDateRangeOverlap(
            newCourse.startdate, newCourse.enddate,
            selectedCourse.startdate, selectedCourse.enddate
          )) {
            continue; // 有效期不重叠，不冲突
          }

          if (!selectedCourse.timeList || selectedCourse.timeList.length === 0) {
            continue;
          }

          for (const selectedTime of selectedCourse.timeList) {
            if (!selectedTime.week || !selectedTime.classes || !selectedTime.classes[0] || !selectedTime.classes[1]) {
              continue;
            }

            // 检查是否同一天且时间段重叠
            if (newTime.week === selectedTime.week) {
              if (this.isTimeOverlap(newTime.classes, selectedTime.classes)) {
                return {
                  conflict: true,
                  newCourseName: newCourse.name,
                  conflictCourseName: selectedCourse.name,
                  day: newTime.week,
                  time: `${newTime.classes[0]}-${newTime.classes[1]}节`
                };
              }
            }
          }
        }
      }

      return null; // 无冲突
    },

    // 选课操作（优化：无需刷新学生信息，直接更新 selectedCourseIds）
    async selectCourse(courseId) {
      const course = this.courses.find(c => c.id === courseId);
      if (!course) return;

      // 再次验证（防止前端状态与后端不一致）
      if (this.isCourseSelected(courseId)) {
        alert('您已选过该课程');
        return;
      }
      if (course.currentstu >= course.maxstu) {
        alert('该课程已达最大选课人数，无法选择');
        return;
      }

      // 检查时间冲突
      try {
        // 获取学生已选课程的详细信息（包含时间信息和起止日期）
        const res = await axios.get(`http://localhost:3000/api/student/${this.student.account}/courses`);
        if (res.data.code === 200) {
          const selectedCoursesData = res.data.data || [];
          
          // 将已选课程数据转换为包含timeList和起止日期的格式
          const selectedCourses = selectedCoursesData.map(c => ({
            ...c,
            timeList: this.safeParse(c.time), // 解析时间JSON字符串
            startdate: c.startdate, // 开始日期
            enddate: c.enddate // 结束日期
          }));
          
          // 检查时间冲突（考虑起止日期）
          const conflict = this.checkCourseTimeConflict(course, selectedCourses);
          if (conflict) {
            alert(`选课失败：时间冲突！\n\n《${conflict.newCourseName}》的${conflict.day} ${conflict.time}与已选课程《${conflict.conflictCourseName}》的时间冲突。\n\n请先退选冲突的课程后再选课。`);
            return;
          }
        }
      } catch (error) {
        console.error('获取已选课程失败:', error);
        // 如果获取失败，仍然尝试选课，让后端验证
      }

      try {
        await axios.post('http://localhost:3000/api/student/select-course', {
          studentAccount: this.student.account,
          courseId
        });

        // 核心优化：直接更新前端已选课程ID数组，无需重新请求学生信息
        this.selectedCourseIds.push(courseId);
        // 更新课程已选人数（前端临时更新，提升体验）
        course.currentstu += 1;

        alert(`成功选择《${course.name}》`);
        // 可选：通知课程表页面刷新（如果需要）
        this.$emit('courseChanged');
      } catch (error) {
        console.error('选课失败：', error);
        alert(error.response?.data?.message || '选课操作失败');
      }
    },

    // 退课操作（优化：无需刷新学生信息，直接更新 selectedCourseIds）
    async dropCourse(courseId) {
      const course = this.courses.find(c => c.id === courseId);
      if (!course) return;

      // 再次验证
      if (!this.isCourseSelected(courseId)) {
        alert('您未选择该课程，无法退课');
        return;
      }

      try {
        await axios.post('http://localhost:3000/api/student/drop-course', {
          studentAccount: this.student.account,
          courseId
        });

        // 核心优化：直接更新前端已选课程ID数组
        this.selectedCourseIds = this.selectedCourseIds.filter(id => id !== courseId);
        // 更新课程已选人数（前端临时更新）
        course.currentstu -= 1;

        alert(`成功退选《${course.name}》`);
        // 可选：通知课程表页面刷新
        this.$emit('courseChanged');
      } catch (error) {
        console.error('退课失败：', error);
        alert(error.response?.data?.message || '退课操作失败，请重试');
      }
    }
  },
  mounted() {
    const studentInfo = localStorage.getItem('studentInfo');
    if (studentInfo) {
      this.student = JSON.parse(studentInfo);
      // 并行请求：提升加载速度
      Promise.all([
        this.fetchCourses(),
        this.fetchSelectedCourseIds()
      ]);
    } else {
      alert('请先登录');
      this.router.push('/login');
    }
  }
};
</script>

<style scoped>
.course-select-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(180deg, #f0fdf4 0%, #ffffff 100%);
  overflow: auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 20px 25px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  border-left: 4px solid #0d7a3d;
}

.page-header h2 {
  color: #333;
  font-size: 22px;
  font-weight: 600;
  margin: 0;
}

.filter-area {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  background-color: #fff;
  padding: 15px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  margin-bottom: 20px;
  border-top: 3px solid #0d7a3d;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-item label {
  color: #666;
  font-size: 14px;
  white-space: nowrap;
}

.filter-input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  width: 180px;
  box-sizing: border-box;
}

.filter-input:focus {
  outline: none;
  border-color: #0d7a3d;
  box-shadow: 0 0 0 3px rgba(13, 122, 61, 0.1);
}

.table-container {
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  border-top: 3px solid #0d7a3d;
}

.course-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.course-table th,
.course-table td {
  padding: 12px 15px;
  text-align: left;
  color: #000;
  border-bottom: 1px solid #eee;
}

.course-table th {
  background-color: #f8f9fa;
  color: #333;
  font-weight: 600;
}

.course-table tbody tr:hover {
  background-color: #f9f9f9;
}

.empty-tip {
  text-align: center;
  color: #999;
  padding: 40px 0;
}

.operate-btn-group {
  display: flex;
  gap: 8px;
}

.select-btn {
  padding: 4px 8px;
  background-color: #0d7a3d;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.select-btn:disabled {
  background-color: #b3d4fc;
  cursor: not-allowed;
}

.select-btn:not(:disabled):hover {
  background-color: #0a5f2e;
}

.drop-btn {
  padding: 4px 8px;
  background-color: #e53e3e;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.drop-btn:disabled {
  background-color: #feb2b2;
  cursor: not-allowed;
}

.drop-btn:not(:disabled):hover {
  background-color: #c53030;
}

.time-item {
  line-height: 1.8;
  color: #333;
}

.empty-time {
  color: #999;
  font-size: 14px;
}
</style>