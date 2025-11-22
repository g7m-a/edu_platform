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
            <td>{{ course.teachername }}</td>
            <td>{{ formatDate(course.startdate) }}</td>
            <td>{{ formatDate(course.enddate) }}</td>
            <td>{{ course.place }}</td>
            <td>
              <div v-if="course.timeList && course.timeList.length">
                <div v-for="(item, index) in course.timeList" :key="index" class="time-item">
                  {{ item.week }} {{ item.classes[0] }}-{{ item.classes[1] }}节
                </div>
              </div>
              <div v-else class="empty-time">无</div>
            </td>
            <td>{{ getStudentCount(course.students) }}</td>
            <td>{{ course.maxstu }}</td>
            <td class="operate-btn-group">
              <button 
                @click="selectCourse(course.id)" 
                class="select-btn"
                :disabled="isCourseSelected(course.id) || getStudentCount(course.students) >= course.maxstu"
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
      courses: [],
      student: null,
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
      return new Date(dateStr).toLocaleDateString('zh-CN');
    },

    getStudentCount(students) {
      return  students.length ;
    },

    isCourseSelected(courseId) {
      return this.student.courses.includes(courseId);
    },

    async fetchCourses() {
      try {
        const response = await axios.get('http://localhost:3000/api/courses');
        this.courses = (response.data.data || []).map(course => ({
          ...course,
          studentsnum:  course.students.length ,
          timeList: JSON.parse(course.time),
          startDate: this.formatDate(course.startdate),
          endDate: this.formatDate(course.enddate),
          maxstu: course.maxstu || 0
        }));
        this.filteredCourses = [...this.courses];
      } catch (error) {
        console.error('获取课程失败：', error);
        alert('无法加载课程数据，请检查网络');
      }
    },

    async bindTeacherNamesTOCourses() {
      for (const course of this.courses) {
        try {
          const response = await axios.get(`http://localhost:3000/api/teachername/${course.teacheraccount}`);
          course.teachername = response.data.data || '';
        } catch (error) {
          course.teachername = '';
        }
      }
    },

    handleFilter() {
      let result = [...this.courses];
      if (this.filterCourseId) {
        result = result.filter(course => course.id === this.filterCourseId);
      }
      if (this.filterCourseName) {
        result = result.filter(course => course.name.includes(this.filterCourseName));
      }
      if (this.filterTeacherName) {
        result = result.filter(course => course.teachername.includes(this.filterTeacherName));
      }
      this.filteredCourses = result;
    },

    async selectCourse(courseId) {
      const course = this.courses.find(c => c.id === courseId);
      if (!course) return;

      if (this.getStudentCount(course.students) >= course.maxstu) {
        alert('该课程已达最大选课人数，无法选择');
        return;
      }

      if (this.isCourseSelected(courseId)) {
        alert('您已选过该课程');
        return;
      }

      try {
        await axios.post('http://localhost:3000/api/student/select-course', {
          studentAccount: this.student.account,
          courseId
        });

        await this.fetchCourses();
        await this.bindTeacherNamesTOCourses();
        const { data } = await axios.get(`http://localhost:3000/api/student/${this.student.account}`);
        this.student = data.data;
        localStorage.setItem('studentInfo', JSON.stringify(this.student));

        alert(`成功选择《${course.name}》`);
      } catch (error) {
        console.error('选课失败：', error);
        alert('选课操作失败');
      }
    },

    async dropCourse(courseId) {
      const course = this.courses.find(c => c.id === courseId);
      if (!course) return;
      if (!this.isCourseSelected(courseId)) {
        alert('您未选择该课程，无法退课');
        return;
      }

      try {
        await axios.post('http://localhost:3000/api/student/drop-course', {
          studentAccount: this.student.account,
          courseId
        });
        await this.fetchCourses();
        await this.bindTeacherNamesTOCourses();
        const { data } = await axios.get(`http://localhost:3000/api/student/${this.student.account}`);
        this.student = data.data;
        localStorage.setItem('studentInfo', JSON.stringify(this.student));

        alert(`成功退选《${course.name}》`);
      } catch (error) {
        console.error('退课失败：', error);
        alert('退课操作失败，请重试');
      }
    }
  },
  mounted() {
    const studentInfo = localStorage.getItem('studentInfo');
    if (studentInfo) {
      this.student = JSON.parse(studentInfo);
      this.fetchCourses().then(() => this.bindTeacherNamesTOCourses());
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
  background-color: #f5f7fa;
  overflow: auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 10px 10px 10px 10px;
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
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  margin-bottom: 20px;
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
  border-color: #42b983;
  box-shadow: 0 0 0 3px rgba(66, 185, 131, 0.1);
}

.table-container {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  overflow: hidden;
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
  background-color: #4299e1;
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
  background-color: #3182ce;
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