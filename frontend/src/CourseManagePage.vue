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
          v-model="filterTeacherId"
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
            <th>上课时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="course in filteredCourses" :key="course.id">
            <td>{{ course.id }}</td>
            <td>{{ course.name }}</td>
            <td>{{ course.teacherid }}</td>
            <td>{{ course.teachername }}</td><!--同样通过函数搜索教师姓名 -->
            <td>{{ course.startDate }}</td>
            <td>{{ course.endDate }}</td>
            <td>
              <div v-for="(item, index) in course.classTime" :key="index">
                {{ item.week }} 第{{ item.classes.join('-') }}节
              </div>
            </td>
            <td class="operate-btn-group">
              <button @click="openEditModal(course)" class="edit-btn">编辑</button>
              <button @click="deleteCourse(course.id)" class="delete-btn">删除</button>
            </td>
          </tr>
          <tr v-if="filteredCourses.length === 0">
            <td colspan="7" class="empty-tip">暂无匹配课程数据</td>
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
            <label>授课教师：</label>
            <input
              v-model="formData.teacherid"
              class="form-control"
              placeholder="输入授课教师工号"
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
            <label>上课时间：</label>
            <div class="time-group-container">
              <div 
                v-for="(timeGroup, groupIndex) in formData.classTime" 
                :key="groupIndex" 
                class="time-group"
              >
                <select 
                  v-model="timeGroup.week" 
                  class="week-selector form-control"
                >
                  <option value="">选择星期</option>
                  <option value="周一">周一</option>
                  <option value="周二">周二</option>
                  <option value="周三">周三</option>
                  <option value="周四">周四</option>
                  <option value="周五">周五</option>
                </select>

                <div class="class-selector">
                  <label class="class-label">节次：</label>
                  <div class="class-options">
                    <label v-for="classNum in 11" :key="classNum" class="class-option">
                      <input
                        type="checkbox"
                        :checked="timeGroup.classes.includes(classNum)"
                        @change="handleClassChange(groupIndex, classNum, $event)"
                        class="class-checkbox"
                      />
                      {{ classNum }}
                    </label>
                  </div>
                </div>

                <button 
                  @click="removeTimeGroup(groupIndex)" 
                  class="remove-group-btn"
                  v-if="formData.classTime.length > 1"
                >
                  删除
                </button>
              </div>
            </div>
            <button @click="addTimeGroup" class="add-group-btn">+ 添加时间段</button>
            <p class="error-tip" v-if="timeError">{{ timeError }}</p>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeModal" class="cancel-btn">取消</button>
          <button @click="submitForm" class="confirm-btn">确认</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      courses: [
        { 
          id: 'C001', 
          name: '数据结构', 
          teacherid: '20001', 
          teachername: '张三',
          startDate: '2023-09-01', 
          endDate: '2023-12-31', 
          classTime: [
            { week: '周一', classes: [1, 2] },
            { week: '周三', classes: [3, 4] }
          ] 
        },
        { 
          id: 'C002', 
          name: '高等数学', 
          teacherid: '20002',
          teachername: '李四', 
          startDate: '2023-09-01', 
          endDate: '2023-12-31', 
          classTime: [
            { week: '周二', classes: [5, 6] }
          ] 
        }
      ],
      filterCourseId: '',
      filterCourseName: '',
      filterTeacherId: '',
      filterTeacherName: '',
      filteredCourses: [],
      isModalOpen: false,
      isEditMode: false,
      formData: {
        id: '',
        name: '',
        teacherid: '',
        teachername: '',
        startDate: '',
        endDate: '',
        classTime: [
          { week: '', classes: [] }
        ]
      },
      idError: '',
      timeError: ''
    };
  },
  mounted() {
    this.filteredCourses = [...this.courses];
  },
  methods: {
    handleFilter() {
      let result = [...this.courses];

      if (this.filterCourseId) {
        result = result.filter(course => course.id === this.filterCourseId);
      }

      if (this.filterCourseName) {
        result = result.filter(course => course.name.includes(this.filterCourseName));
      }

      if (this.filterTeacherId) {
        result = result.filter(course => course.teacherid === this.filterTeacherId);
      }

      if (this.filterTeacherName) {
        // 这里需要函数通过id搜索教师姓名
        result = result.filter(course => course.teachername.includes(this.filterTeacherName));
      }

      this.filteredCourses = result;
    },

    openAddModal() {
      this.isEditMode = false;
      this.formData = {
        id: '',
        name: '',
        teacher: '',
        startDate: '',
        endDate: '',
        classTime: [
          { week: '', classes: [] }
        ]
      };
      this.idError = '';
      this.timeError = '';
      this.isModalOpen = true;
    },

    openEditModal(course) {
      this.isEditMode = true;
      this.formData = { 
        ...course,
        classTime: course.classTime.map(item => ({
          week: item.week,
          classes: [...item.classes]
        }))
      };
      this.idError = '';
      this.timeError = '';
      this.isModalOpen = true;
    },

    closeModal() {
      this.isModalOpen = false;
    },

    addTimeGroup() {
      this.formData.classTime.push({
        week: '',
        classes: []
      });
    },

    removeTimeGroup(index) {
      if (this.formData.classTime.length > 1) {
        this.formData.classTime.splice(index, 1);
      }
    },

    handleClassChange(groupIndex, classNum, event) {
      const group = this.formData.classTime[groupIndex];
      if (event.target.checked) {
        if (!group.classes.includes(classNum)) {
          group.classes.push(classNum);
          group.classes.sort((a, b) => a - b);
        }
      } else {
        group.classes = group.classes.filter(num => num !== classNum);
      }
    },

    submitForm() {
      const { id, name, teacher, startDate, endDate, classTime } = this.formData;
      
      if (!id || !name || !teacher || !startDate || !endDate) {
        alert('课程编号、名称、教师、起止日期不能为空！');
        return;
      }

      if (new Date(startDate) > new Date(endDate)) {
        alert('开始日期不能晚于结束日期！');
        return;
      }

      let timeValid = true;
      classTime.forEach((group, index) => {
        if (!group.week) {
          timeValid = false;
        }
        if (group.classes.length === 0) {
          timeValid = false;
        }
      });

      if (!timeValid || classTime.length === 0) {
        this.timeError = '请完善所有时间段的星期和节次信息';
        return;
      }
      this.timeError = '';

      if (!this.isEditMode) {
        const isDuplicate = this.courses.some(course => course.id === id);
        if (isDuplicate) {
          this.idError = '该课程编号已存在，请输入唯一编号！';
          return;
        }
      }

      if (this.isEditMode) {
        const index = this.courses.findIndex(course => course.id === id);
        this.courses[index] = { ...this.formData };
        alert('编辑成功！');
      } else {
        this.courses.push({ ...this.formData });
        alert('新增成功！');
      }

      this.handleFilter();
      this.closeModal();
    },

    deleteCourse(id) {
      if (confirm('确定要删除该课程吗？')) {
        this.courses = this.courses.filter(course => course.id !== id);
        this.handleFilter();
        alert('删除成功！');
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

.add-btn {
  padding: 8px 16px;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.add-btn:hover {
  background-color: #359e6d;
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

.edit-btn {
  padding: 4px 8px;
  background-color: #4299e1;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.edit-btn:hover {
  background-color: #3182ce;
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
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.modal-header {
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
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
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
  border-color: #42b983;
  box-shadow: 0 0 0 3px rgba(66, 185, 131, 0.1);
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
  accent-color: #42b983;
}

.add-group-btn {
  align-self: flex-start;
  padding: 6px 12px;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.add-group-btn:hover {
  background-color: #359e6d;
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
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.confirm-btn:hover {
  background-color: #359e6d;
}
</style>