<template>
  <div class="course-manage-container">
    <div class="page-header">
      <h2>课程管理</h2>
      <button @click="openAddModal" class="add-btn">新增课程</button>
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
        <label>授课教师工号：</label>
        <input
          v-model="filterTeacherAccount"
          placeholder="输入授课教师工号搜索"
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
            <th>授课教师工号</th>
            <th>授课教师</th>
            <th>开始日期</th>
            <th>结束日期</th>
            <th>授课地点</th>
            <th>上课时间</th>
            <th>目前学生数</th>
            <th>最大学生数</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="course in filteredCourses" :key="course.id">
            <td>{{ course.id }}</td>
            <td>{{ course.name }}</td>
            <td>{{ course.teacheraccount }}</td>
            <td>{{ course.teachername || '未知教师' }}</td>
            <td>{{ course.startDate }}</td>
            <td>{{ course.endDate }}</td>
            <td>{{ course.place || '未指定' }}</td>
            <td>
              <div v-if="course.timeList && course.timeList.length">
                <div v-for="(item, index) in course.timeList" :key="index" class="time-item">
                  {{ item.week }} {{ item.classes[0] }}-{{ item.classes[1] }}节
                </div>
              </div>
              <div v-else class="empty-time">无</div>
            </td>
            <!-- 核心改动：已选人数从 currentstu 字段获取（后端统计） -->
            <td>{{ course.currentstu || 0 }}</td>
            <td>{{ course.maxstu || 0 }}</td>
            <td class="operate-btn-group">
              <button @click="openEditModal(course)" class="edit-btn">编辑</button>
              <button @click="openStudentModal(course)" class="student-btn">学生管理</button>
              <button @click="deleteCourse(course.id)" class="delete-btn">删除</button>
            </td>
          </tr>
          <tr v-if="filteredCourses.length === 0">
            <!-- 修复：colspan 从 9 改为 11（与表头列数一致） -->
            <td colspan="11" class="empty-tip">暂无匹配课程数据</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="modal-mask" v-if="isModalOpen">
      <div class="modal-container">
        <div class="modal-header">
          <h3>{{ isEditMode ? '编辑课程' : '新增课程' }}</h3>
          <button @click="closeModal" class="close-btn">×</button>
        </div>
        <div class="modal-form">
          <div class="form-item">
            <label>课程编号：</label>
            <input
              v-model="formData.id"
              class="form-control"
              :disabled="isEditMode"
              placeholder="输入唯一课程编号"
            />
            <p class="error-tip" v-if="idError">{{ idError }}</p>
          </div>

          <div class="form-item">
            <label>课程名称：</label>
            <input
              v-model="formData.name"
              class="form-control"
              placeholder="输入课程名称"
            />
          </div>

          <div class="form-item">
            <label>授课教师工号：</label>
            <input
              v-model="formData.teacheraccount"
              class="form-control"
              placeholder="输入授课教师工号"
              @blur="getTeacherName"
            />
            <p class="error-tip" v-if="teacherAccountError">{{ teacherAccountError }}</p>
          </div>
          <div class="form-item">
            <label>授课教师姓名：</label>
            <input
              v-model="formData.teachername"
              class="form-control"
              readonly
              placeholder="输入工号后自动填充"
            />
          </div>

          <div class="form-item">
            <label>开始日期：</label>
            <input
              v-model="formData.startDate"
              type="date"
              class="form-control"
            />
          </div>

          <div class="form-item">
            <label>结束日期：</label>
            <input
              v-model="formData.endDate"
              type="date"
              class="form-control"
            />
          </div>

          <div class="form-item">
            <label>上课地点：</label>
            <input
              v-model="formData.place"
              class="form-control"
              placeholder="上课地点"
            />
          </div>
          <div class="form-item">
            <label>上课时间：</label>
            <div class="time-select-container">
              <div v-for="(item, index) in formData.timeList" :key="index" class="time-select-item">
                <select v-model="item.week" class="week-select" @change="checkRealTimeConflict">
                  <option value="">选择星期</option>
                  <option value="周一">周一</option>
                  <option value="周二">周二</option>
                  <option value="周三">周三</option>
                  <option value="周四">周四</option>
                  <option value="周五">周五</option>
                  <option value="周六">周六</option>
                  <option value="周日">周日</option>
                </select>
                <div class="classes-group">
                  <label>节次：</label>
                  <input
                    type="number"
                    v-model.number="item.classes[0]"
                    min="1"
                    max="12"
                    class="class-input"
                    placeholder="起始节"
                    @change="fixClassOrder(item)"
                  />
                  <input
                    type="number"
                    v-model.number="item.classes[1]"
                    min="1"
                    max="12"
                    class="class-input"
                    placeholder="结束节"
                    @change="fixClassOrder(item)"
                  />
                </div>
                <button @click="removeTimeItem(index)" class="remove-time-btn">×</button>
              </div>
              <button @click="addTimeItem" class="add-time-btn">+ 添加上课时段</button>
            </div>
          </div>
          <div class="form-item">
            <label>最大学生数：</label>
            <input
              v-model="formData.maxstu"
              type="number"
              min="0"
              class="form-control"
              placeholder="最大学生数"
            />
            <p class="error-tip" v-if="maxStuerror">{{ maxStuerror }}</p>
          </div>

          <div class="form-item">
            <label>学分：</label>
            <input
              v-model="formData.credit"
              type="number"
              min="0"
              step="0.5"
              class="form-control"
              placeholder="课程学分"
            />
          </div>

          <div class="form-item">
            <label>考试占比 (%)：</label>
            <input
              v-model="formData.testratio"
              type="number"
              min="0"
              max="100"
              class="form-control"
              placeholder="考试成绩占比 (0-100)"
            />
          </div>
        </div>

        <div class="modal-footer">
          <button @click="closeModal" class="cancel-btn">取消</button>
          <button @click="submitForm" class="confirm-btn">确认</button>
        </div>
      </div>
    </div>
    <!-- 学生管理弹窗 -->
    <div class="modal-mask" v-if="isStudentModalOpen">
      <div class="modal-container student-manage-modal">
        <div class="modal-header">
          <h3>{{ currentCourseName }} - 学生管理</h3>
          <button @click="closeStudentModal" class="close-btn">×</button>
        </div>
        <div class="modal-body-student">
           <div class="student-actions">
              <div class="add-student-group">
                 <input v-model="newStudentId" placeholder="输入学号" class="form-control small-input" />
                 <button @click="addStudent" class="add-btn-small">添加学生</button>
              </div>
              <button class="export-btn" @click="exportStudents">导出名单</button>
           </div>
           
           <div class="table-container-student">
             <table class="student-table">
                <thead>
                  <tr>
                     <th>学号</th>
                     <th>姓名</th>
                     <th>学院</th>
                     <th>年级</th>
                     <th>平时分</th>
                     <th>考试分</th>
                     <th>总评</th>
                     <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="stu in currentCourseStudents" :key="stu.account">
                     <td>{{ stu.account }}</td>
                     <td>{{ stu.name }}</td>
                     <td>{{ stu.dept }}</td>
                     <td>{{ stu.grade }}</td>
                     <td>{{ stu.regular_score || '-' }}</td>
                     <td>{{ stu.exam_score || '-' }}</td>
                     <td>{{ stu.score || '-' }}</td>
                     <td>
                        <button @click="removeStudent(stu.account)" class="delete-btn-small">移除</button>
                     </td>
                  </tr>
                  <tr v-if="currentCourseStudents.length === 0">
                     <td colspan="8" class="empty-text">暂无学生</td>
                  </tr>
                </tbody>
             </table>
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
      courses: [],
      filterCourseId: '',
      filterCourseName: '',
      filterTeacherAccount: '',
      filterTeacherName: '',
      filteredCourses: [],
      maxStuerror: '',
      teacherAccountError: '',
      isModalOpen: false,
      isEditMode: false,
      formData: {
        id: '',
        name: '',
        teacheraccount: '',
        teachername: '',
        startDate: '',
        endDate: '',
        place: '',
        timeList: [],
        currentstu: 0, // 新增：存储已选人数（编辑时用）
        maxstu: 0,
        credit: '',
        testratio: ''
      },
      idError: '',
      
      // Student Manage Data
      isStudentModalOpen: false,
      currentCourseStudents: [],
      currentCourseName: '',
      currentCourseId: null,
      newStudentId: ''
    };
  },
  async mounted() {
    await this.fetchCourses();
    await this.bindTeacherNamesTOCourses();
    this.filteredCourses = [...this.courses];
  },
  methods: {
    // 核心改动：获取课程列表（适配 currentstu 字段，移除 students 依赖）
    async fetchCourses() {
      try {
        const response = await axios.get('http://localhost:3000/api/courses');
        this.courses = (response.data.data || []).map(course => {
          return {
            ...course,
            // 格式化日期
            startDate: new Date(course.startdate).toLocaleDateString('zh-CN'),
            endDate: new Date(course.enddate).toLocaleDateString('zh-CN'),
            // 安全解析上课时间
            timeList: this.safeParse(course.time),
            // 已选人数：直接使用后端返回的 currentstu（关联表统计）
            currentstu: course.currentstu || 0,
            maxstu: course.maxstu || 0,
            credit: course.credit || 0,
            testratio: course.testratio || 0
          };
        });
        this.filteredCourses = [...this.courses];
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
        console.error('解析上课时间失败:', str, e);
        return [];
      }
    },

    // 查询教师姓名绑定至课程（无改动）
    async bindTeacherNamesTOCourses() {
      for (const course of this.courses) {
        try {
          const response = await axios.get(`http://localhost:3000/api/teachername/${course.teacheraccount}`);
          course.teachername = response.data.data || '未知教师';
        } catch (error) {
          course.teachername = '未知教师';
        }
      }
    },

    // 通过教师工号查询教师姓名（修改为失焦时验证）
    async getTeacherName() {
      const teacheraccount = this.formData.teacheraccount;
      this.teacherAccountError = ''; // 清空之前的错误
      
      if (!teacheraccount) {
        this.formData.teachername = '';
        return;
      }
      
      try {
        const response = await axios.get(`http://localhost:3000/api/teachername/${teacheraccount}`);
        if (response.data.code === 200) {
          this.formData.teachername = response.data.data;
          this.teacherAccountError = ''; // 成功时清空错误
        } else {
          this.formData.teachername = '';
          this.teacherAccountError = '教师工号不存在，请检查后重新输入';
        }
      } catch (error) {
        this.formData.teachername = '';
        if (error.response && error.response.status === 404) {
          this.teacherAccountError = '教师工号不存在，请检查后重新输入';
        } else {
          this.teacherAccountError = '无法获取教师信息，请检查网络连接';
        }
      }
    },

    // 筛选课程（无改动）
    handleFilter() {
      let result = [...this.courses];

      if (this.filterCourseId) {
        result = result.filter(course => course.id.toString().includes(this.filterCourseId));
      }

      if (this.filterCourseName) {
        result = result.filter(course => course.name.includes(this.filterCourseName));
      }

      if (this.filterTeacherAccount) {
        result = result.filter(course => course.teacheraccount.includes(this.filterTeacherAccount));
      }

      if (this.filterTeacherName) {
        result = result.filter(course => course.teachername.includes(this.filterTeacherName));
      }

      this.filteredCourses = result;
    },

    // 增加课程模式（无改动）
    openAddModal() {
      this.isEditMode = false;
      this.formData = {
        id: '',
        name: '',
        teacheraccount: '',
        teachername: '',
        startDate: '',
        endDate: '',
        place: '',
        timeList: [{ week: '', classes: [1, 2] }], // 默认添加一个时间段
        currentstu: 0,
        maxstu: 0,
        credit: '',
        testratio: ''
      };
      this.idError = '';
      this.maxStuerror = '';
      this.teacherAccountError = '';
      this.isModalOpen = true;
    },

    async openEditModal(course) {
      this.isEditMode = true;
      this.formData = {
        ...course,
        timeList: JSON.parse(JSON.stringify(course.timeList || [])),
        currentstu: course.currentstu || 0,
        maxstu: course.maxstu || 0,
        credit: course.credit || 0,
        testratio: course.testratio || 0
      };
      await this.getTeacherName();
      this.idError = '';
      this.maxStuerror = '';
      this.teacherAccountError = '';
      this.isModalOpen = true;
    },

    closeModal() {
      this.isModalOpen = false;
    },

    addTimeItem() {
      this.formData.timeList.push({ week: '', classes: [1, 2] });
      this.$nextTick(() => {
        this.checkTimeConflict(this.formData.timeList.filter(item => 
          item.week && item.classes[0] && item.classes[1] && item.classes[0] <= item.classes[1]
        ));
      });
    },

    removeTimeItem(index) {
      if (this.formData.timeList.length > 1) {
        this.formData.timeList.splice(index, 1);
      } else {
        alert('至少保留一个上课时段');
      }
    },

    isTimeOverlap(classes1, classes2) {
      const start1 = classes1[0];
      const end1 = classes1[1];
      const start2 = classes2[0];
      const end2 = classes2[1];
      return start1 <= end2 && end1 >= start2;
    },

    isTimeIdentical(week1, classes1, week2, classes2) {
      return week1 === week2 && classes1[0] === classes2[0] && classes1[1] === classes2[1];
    },

    checkTimeConflict(newTimeList) {
      for (let i = 0; i < newTimeList.length; i++) {
        const curr = newTimeList[i];
        if (!curr.week || !curr.classes[0] || !curr.classes[1]) continue;
        
        for (let j = i + 1; j < newTimeList.length; j++) {
          const next = newTimeList[j];
          if (!next.week || !next.classes[0] || !next.classes[1]) continue;
          
          if (curr.week === next.week) {
            if (this.isTimeIdentical(curr.week, curr.classes, next.week, next.classes)) {
              alert(`冲突：${curr.week} ${curr.classes[0]}-${curr.classes[1]}节 与自身时段完全重复`);
              return true;
            }
            if (this.isTimeOverlap(curr.classes, next.classes)) {
              alert(`冲突：${curr.week} ${curr.classes[0]}-${curr.classes[1]}节 与 ${next.week} ${next.classes[0]}-${next.classes[1]}节 节次重合`);
              return true;
            }
          }
        }
      }
      return false;
    },

    checkRealTimeConflict() {
      const validList = this.formData.timeList.filter(item => 
        item.week && item.classes[0] && item.classes[1] && item.classes[0] <= item.classes[1]
      );
      this.checkTimeConflict(validList);
    },

    fixClassOrder(item) {
      if (item.classes[0] > item.classes[1]) {
        [item.classes[0], item.classes[1]] = [item.classes[1], item.classes[0]];
        alert('节次不合理，已自动修正为“结束节 ≥ 起始节”');
      }
    },
    
    async submitForm() {
      const { id, name, teacheraccount, startDate, endDate, place, timeList, currentstu, credit, testratio } = this.formData;

      if (!id || !name || !teacheraccount || !startDate || !endDate || !place || timeList.length === 0) {
        alert('课程编号、名称、教师、起止日期、上课地点、上课时间不能为空！');
        return;
      }

      if (credit === '' || testratio === '') {
        alert('学分和考试占比不能为空！');
        return;
      }
      
      if (testratio < 0 || testratio > 100) {
        alert('考试占比必须在 0 到 100 之间！');
        return;
      }

      if (this.isEditMode) {
        if (this.formData.maxstu < currentstu) {
          this.maxStuerror = '最大学生数不能小于目前学生数（当前已选：' + currentstu + '人）';
          return;
        }
      }

      if (new Date(startDate) > new Date(endDate)) {
        alert('开始日期不能晚于结束日期！');
        return;
      }

      const validTimeList = timeList.filter(item => {
        const isClassValid = item.classes[0] <= item.classes[1];
        return item.week && item.classes[0] && item.classes[1] && isClassValid;
      });

      if (validTimeList.length === 0) {
        alert('请添加有效的上课时间（需选择星期，且起始节≤结束节）');
        return;
      }

      const hasConflict = this.checkTimeConflict(validTimeList);
      if (hasConflict) {
        return;
      }

      if (!this.isEditMode) {
        const isDuplicate = this.courses.some(course => course.id === id);
        if (isDuplicate) {
          this.idError = '该课程编号已存在，请输入唯一编号！';
          return;
        }
      }

      try {
        const timeStr = JSON.stringify(validTimeList);

        if (this.isEditMode) {
          await axios.put(`http://localhost:3000/api/course/${id}`, {
            id,
            name,
            teacheraccount,
            startdate: startDate,
            enddate: endDate,
            place,
            time: timeStr,
            maxstu: this.formData.maxstu,
            credit: this.formData.credit,
            testratio: this.formData.testratio
          });
        } else {
          await axios.post('http://localhost:3000/api/course/add', {
            id,
            name,
            teacheraccount,
            startdate: startDate,
            enddate: endDate,
            place,
            time: timeStr,
            maxstu: this.formData.maxstu,
            credit: this.formData.credit,
            testratio: this.formData.testratio
          });
        }

        alert(this.isEditMode ? '编辑成功！' : '新增成功！');
        await this.fetchCourses();
        await this.bindTeacherNamesTOCourses();
        this.filteredCourses = [...this.courses];
        this.closeModal();
      } catch (error) {
        console.error('提交课程失败：', error);
        alert(error.response?.data?.message || '网络错误或服务器异常，操作失败');
      }
    },

    openStudentModal(course) {
      this.currentCourseName = course.name;
      this.currentCourseId = course.id;
      this.isStudentModalOpen = true;
      this.fetchCourseStudents(course.id);
    },
    
    closeStudentModal() {
      this.isStudentModalOpen = false;
      this.currentCourseStudents = [];
      this.newStudentId = '';
    },
    
    async fetchCourseStudents(courseId) {
      try {
        const res = await axios.get(`http://localhost:3000/api/course/${courseId}/students`);
        if (res.data.code === 200) {
          this.currentCourseStudents = res.data.data || [];
        }
      } catch (err) {
        console.error('获取学生列表失败:', err);
        alert('获取学生列表失败');
      }
    },
    
    async addStudent() {
      if (!this.newStudentId) {
        alert('请输入学号');
        return;
      }
      try {
        const res = await axios.post(`http://localhost:3000/api/course/${this.currentCourseId}/student`, {
          studentId: this.newStudentId
        });
        if (res.data.code === 200) {
          alert('添加成功');
          this.newStudentId = '';
          this.fetchCourseStudents(this.currentCourseId);
          await this.fetchCourses();
          await this.bindTeacherNamesTOCourses();
          this.filteredCourses = [...this.courses];
        }
      } catch (err) {
        console.error('添加学生失败:', err);
        alert(err.response?.data?.message || '添加失败');
      }
    },
    
    async removeStudent(studentId) {
      if (!confirm(`确定要移除学生 ${studentId} 吗？`)) return;
      try {
        const res = await axios.delete(`http://localhost:3000/api/course/${this.currentCourseId}/student/${studentId}`);
        if (res.data.code === 200) {
          alert('移除成功');
          this.fetchCourseStudents(this.currentCourseId);
          await this.fetchCourses();
          await this.bindTeacherNamesTOCourses();
          this.filteredCourses = [...this.courses];
        }
      } catch (err) {
        console.error('移除学生失败:', err);
        alert('移除失败');
      }
    },
    
    exportStudents() {
      if (!this.currentCourseStudents.length) {
        alert('暂无数据可导出');
        return;
      }
      
      let csvContent = "学号,姓名,学院,年级,平时分,考试分,总评\n";
      
      this.currentCourseStudents.forEach(stu => {
        const row = [
          stu.account,
          stu.name,
          stu.dept,
          stu.grade,
          stu.regular_score || '',
          stu.exam_score || '',
          stu.score || ''
        ];
        csvContent += row.join(",") + "\n";
      });
      
      const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `${this.currentCourseName}_学生名单.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },

    async deleteCourse(id) {
      if (confirm('确定要删除该课程吗？删除后该课程的所有选课记录也会同步删除！')) {
        try {
          await axios.delete(`http://localhost:3000/api/course/${id}`);
          this.courses = this.courses.filter(course => course.id !== id);
          this.handleFilter();
          alert('删除成功！');
        } catch (error) {
          console.error('删除课程失败：', error);
          alert(error.response?.data?.message || '删除失败，请重试');
        }
      }
    }
  }
};
</script>

<style scoped>
.course-manage-container {
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
  border-left: 4px solid #2db563;
}

.page-header h2 {
  color: #333;
  font-size: 22px;
  font-weight: 600;
  margin: 0;
}

.add-btn {
  padding: 8px 16px;
  background-color: #0d7a3d;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.add-btn:hover {
  background-color: #0a5f2e;
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
  border-top: 3px solid #2db563;
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
  border-top: 3px solid #2db563;
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

.edit-btn {
  padding: 4px 8px;
  background-color: #1a9d4f;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.edit-btn:hover {
  background-color: #15803d;
}

.delete-btn {
  padding: 4px 8px;
  background-color: #e53e3e;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.delete-btn:hover {
  background-color: #c53030;
}

.modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-container {
  width: 100%;
  max-width: 600px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.modal-header {
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
}

.modal-header h3 {
  color: #333;
  font-size: 18px;
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  color: #999;
  cursor: pointer;
  transition: color 0.3s ease;
}

.close-btn:hover {
  color: #333;
}

.modal-form {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 15px;
  overflow-y: auto;
  flex: 1;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.modal-footer {
  flex-shrink: 0;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 15px 20px;
  border-top: 1px solid #eee;
}

.form-item label {
  color: #666;
  font-size: 14px;
}

.form-control {
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  box-sizing: border-box;
}

.form-control:focus {
  outline: none;
  border-color: #0d7a3d;
  box-shadow: 0 0 0 3px rgba(13, 122, 61, 0.1);
}

.form-control:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.error-tip {
  color: #e53e3e;
  font-size: 12px;
  margin: 0;
}

.time-group-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 10px;
}

.time-group {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  padding: 10px;
  border: 1px solid #eee;
  border-radius: 6px;
  flex-wrap: wrap;
}

.week-selector {
  width: 100px;
}

.class-selector {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.class-label {
  white-space: nowrap;
  color: #666;
}

.class-options {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.class-option {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #333;
  font-size: 14px;
}

.class-checkbox {
  width: 14px;
  height: 14px;
  accent-color: #0d7a3d;
}

.add-group-btn {
  align-self: flex-start;
  padding: 6px 12px;
  background-color: #0d7a3d;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.add-group-btn:hover {
  background-color: #0a5f2e;
}

.remove-group-btn {
  padding: 4px 8px;
  background-color: #e53e3e;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.remove-group-btn:hover {
  background-color: #c53030;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 15px 20px;
  border-top: 1px solid #eee;
}

.cancel-btn {
  padding: 8px 16px;
  background-color: #f5f5f5;
  color: #666;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.cancel-btn:hover {
  background-color: #eee;
}

.confirm-btn {
  padding: 8px 16px;
  background-color: #0d7a3d;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.confirm-btn:hover {
  background-color: #0a5f2e;
}

/* 新增：上课时间选择组件样式 */
.time-select-container {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.time-select-item {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.week-select {
  padding: 6px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  flex: 0 0 120px;
  outline: none;
}

.week-select:focus {
  border-color: #0d7a3d;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

.classes-group {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 0 0 200px;
}

.class-input {
  width: 60px;
  padding: 6px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  text-align: center;
  outline: none;
}

.class-input:focus {
  border-color: #0d7a3d;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

.separator {
  color: #666;
  font-size: 14px;
}

.add-time-btn {
  padding: 6px 12px;
  border: 1px solid #409eff;
  border-radius: 4px;
  background: #f0f9ff;
  color: #0d7a3d;
  cursor: pointer;
  width: fit-content;
  transition: all 0.2s;
}

.add-time-btn:hover {
  background: #1a9d4f;
  color: white;
}

.time-tag.selected:hover {
  background: #15803d;
}

.remove-time-btn {
  padding: 2px 6px;
  border: 1px solid #ff4d4f;
  border-radius: 50%;
  background: transparent;
  color: #ff4d4f;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.remove-time-btn:hover {
  background: #ff4d4f;
  color: white;
}

.time-item {
  line-height: 1.8;
  color: #333;
}

.empty-time {
  color: #999;
  font-size: 14px;
}

/* Student Management Modal Styles */
.student-manage-modal {
  width: 900px;
  max-width: 95vw;
}

.modal-body-student {
  display: flex;
  flex-direction: column;
  padding: 20px;
  height: 100%;
  overflow: hidden;
  flex: 1;
}

.student-actions {
  display: flex;
  justify-content: space-between;
  margin-bottom: 15px;
}

.add-student-group {
  display: flex;
  gap: 10px;
}

.small-input {
  width: 150px;
  padding: 6px 10px;
}

.add-btn-small {
  background-color: #0d7a3d;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
}

.add-btn-small:hover {
  background-color: #0a5f2e;
}

.export-btn {
  background-color: #28a745;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
}

.export-btn:hover {
  background-color: #218838;
}

.table-container-student {
  flex: 1;
  overflow-y: auto;
  border: 1px solid #eee;
  border-radius: 4px;
}

.student-table {
  width: 100%;
  border-collapse: collapse;
}

.student-table th,
.student-table td {
  padding: 10px;
  text-align: left;
  border-bottom: 1px solid #eee;
  color: #333; /* Darker text color */
}

.student-table th {
  background-color: #f9fafc;
  position: sticky;
  top: 0;
  z-index: 1;
  color: #000; /* Even darker for headers */
  font-weight: 600;
}

.delete-btn-small {
  background-color: #ff4d4f;
  color: white;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.delete-btn-small:hover {
  background-color: #d9363e;
}

.student-btn {
  background-color: #1a9d4f;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  margin-right: 5px;
  transition: background-color 0.3s;
}

.student-btn:hover {
  background-color: #15803d;
}
</style>