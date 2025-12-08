<template>
  <div class="teacher-manage-container">
    <div class="page-header">
      <h2>教师管理</h2>
      <button @click="openAddModal" class="add-btn">新增教师</button>
    </div>

    <div class="filter-area">
      <div class="filter-item">
        <label>院系筛选：</label>
        <select v-model="filterDept" class="filter-input" @change="handleFilter">
          <option value="">全部院系</option>
          <option v-for="dept in allDepts" :key="dept" :value="dept">
            {{ dept }}
          </option>
        </select>
      </div>

      <div class="filter-item">
        <label>工号搜索：</label>
        <input
          v-model="filterId"
          placeholder="输入工号搜索"
          class="filter-input"
          @input="handleFilter"
        />
      </div>

      <div class="filter-item">
        <label>姓名搜索：</label>
        <input
          v-model="filterName"
          placeholder="输入姓名搜索"
          class="filter-input"
          @input="handleFilter"
        />
      </div>

      <div class="filter-item">
        <label>教授课程搜索：</label>
        <input
          v-model="filterCourses"
          placeholder="输入教授课程搜索"
          class="filter-input"
          @input="handleFilter"
        />
      </div>
    </div>

    <div class="table-container">
      <table class="teacher-table">
        <thead>
          <tr>
            <th>工号</th>
            <th>姓名</th>
            <th>性别</th>
            <th>院系</th>
            <th>教授课程</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="teacher in filteredteachers" :key="teacher.account">
            <td>{{ teacher.account }}</td>
            <td>{{ teacher.name }}</td>
            <td>{{ teacher.gender }}</td>
            <td>{{ teacher.dept }}</td>
            <td>
              {{ teacher.courses && teacher.courses.length > 0 ? teacher.courses.join('，') : '无' }}
            </td>
            <td class="operate-btn-group">
              <button @click="openEditModal(teacher)" class="edit-btn">编辑</button>
              <button @click="resetPassword(teacher.account)" class="reset-btn">重置密码</button>
              <!-- 有课程时禁用删除按钮并添加提示 -->
              <button 
                @click="showDeleteConfirm(teacher.account)" 
                class="delete-btn"
                :disabled="teacher.courses.length > 0"
                :title="teacher.courses.length > 0 ? '该教师有授课，禁止删除' : '删除教师'"
              >
                删除
              </button>
            </td>
          </tr>
          <tr v-if="filteredteachers.length === 0">
            <td colspan="6" class="empty-tip">暂无匹配教师数据</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="modal-mask" v-if="isModalOpen">
      <div class="modal-container">
        <div class="modal-header">
          <h3>{{ isEditMode ? '编辑教师' : '新增教师' }}</h3>
          <button @click="closeModal" class="close-btn">×</button>
        </div>
        <div class="modal-form">
          <div class="form-item">
            <label>工号：</label>
            <input
              v-model="formData.account"
              class="form-control"
              :disabled="isEditMode"
              placeholder="输入唯一工号"
            />
            <p class="error-tip" v-if="idError">{{ idError }}</p>
          </div>

          <div class="form-item">
            <label>姓名：</label>
            <input
              v-model="formData.name"
              class="form-control"
              placeholder="输入教师姓名"
            />
          </div>

          <div class="form-item">
            <label>性别：</label>
            <select v-model="formData.gender" class="form-control">
              <option value="男">男</option>
              <option value="女">女</option>
            </select>
          </div>

          <div class="form-item">
            <label>院系：</label>
            <input
              v-model="formData.dept"
              class="form-control"
              placeholder="输入教师所属院系"
            />
          </div>

          <div class="form-item" v-if="isEditMode">
            <label>教授课程：</label>
            <div class="course-display">
              {{ formData.courses.length > 0 ? formData.courses.join('，') : '无' }}
            </div>
            <p class="filter-hint">如需更改请在课程管理界面操作</p>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeModal" class="cancel-btn">取消</button>
          <button @click="submitForm" class="confirm-btn">确认</button>
        </div>
      </div>
    </div>

    <div class="modal-mask" v-if="isDeleteModalOpen">
      <div class="modal-container">
        <div class="modal-header">
          <h3>确认删除教师</h3>
          <button @click="closeDeleteModal" class="close-btn">×</button>
        </div>
        <div class="modal-form">
          <p class="delete-tip">确认删除该教师？</p>
        </div>
        <div class="modal-footer">
          <button @click="closeDeleteModal" class="cancel-btn">取消</button>
          <button @click="confirmDelete" class="confirm-btn delete-confirm-btn">确认删除</button>
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
      teachers: [],
      allDepts:[],
      filterDept: '',
      filterId: '',
      filterName: '',
      filterCourses: '',
      filteredteachers: [],
      isModalOpen: false,
      isEditMode: false,
      formData: {
        account: '',
        name: '',
        gender: '',
        dept: '',
        courses: []
      },
      idError: '',
      isDeleteModalOpen: false,
      deleteTeacherId: ''
    };
  },
  async mounted() {
    await this.fetchAllDepts();
    await this.fetchTeachers();
    if(this.allDepts.length>0 && !this.formData.dept){
      this.formData.dept = this.allDepts[0];
    }
  },
  methods: {
    async fetchAllDepts(){
      try{
        const response = await axios.get('http://localhost:3000/api/teachers/depts');
        if(response.data.code === 200){
          this.allDepts = response.data.data;
        }else{
          alert('获取院系数据失败'+response.data.message);
        }
      }catch{
        alert('无法获取院系数据');
      }
    },

    async fetchTeachers(){
      try{
        const response = await axios.get('http://localhost:3000/api/teachers');
        if(response.data.code === 200){
          this.teachers = response.data.data.map(teacher => ({
            ...teacher,
            courses: teacher.courses || []
          }));
          this.handleFilter();
        }else{
          alert('获取教师数据失败'+response.data.message);
        }
      }catch{
        alert('无法获取教师数据');
      }
    },

    handleFilter() {
      let result = [...this.teachers];

      if (this.filterDept) {
        result = result.filter(teacher => teacher.dept === this.filterDept);
      }

      if (this.filterId) {
        result = result.filter(teacher => teacher.account === this.filterId);
      }

      if (this.filterName) {
        result = result.filter(teacher => teacher.name === this.filterName);
      }

      if (this.filterCourses) {
        const searchCourse = this.filterCourses.trim();
        result = result.filter(teacher => 
          teacher.courses.some(course => course.includes(searchCourse))
        );
      }

      this.filteredteachers = result;
    },

    openAddModal() {
      this.isEditMode = false;
      this.formData = {
        account: '',
        name: '',
        gender: '男',
        dept: this.allDepts[0] || '',
        courses: [],
      };
      this.idError = '';
      this.isModalOpen = true;
    },

    openEditModal(teacher) {
      this.isEditMode = true;
      this.formData = { ...teacher, courses: [...teacher.courses] };
      this.idError = '';
      this.isModalOpen = true;
    },

    closeModal() {
      this.isModalOpen = false;
    },

    async submitForm() {
  const { account, name, gender, dept } = this.formData;

  if (!account || !name) {
    alert('工号、姓名不能为空！');
    return;
  }

  try {
    if (this.isEditMode) {
      const response = await axios.put(
        `http://localhost:3000/api/teacher/${account}`,
        { name, gender, dept }
      );
      if (response.data.code === 200) {
        alert('编辑成功！');
        await this.fetchTeachers();
        this.closeModal();
      } else {
        alert('编辑失败：' + response.data.message);
      }
    } else {
      const response = await axios.post(
        'http://localhost:3000/api/teacher/add',
        { account, name, gender, dept, password: '123' }
      );
      if (response.data.code === 200) {
        alert('新增成功！');
        await this.fetchTeachers();
        this.closeModal();
      } else if (response.data.code === 409) {
        this.idError = '该工号已存在，请输入唯一工号！';
      } else {
        alert('新增失败：' + response.data.message);
      }
    }
  } catch (error) {
    console.error('提交教师数据失败：', error);
    alert('网络错误，操作失败');
  }
},

    showDeleteConfirm(account) {
      const teacher = this.teachers.find(t => t.account === account);
      //校验是否有课程，有则直接禁止删除
      if (teacher.courses.length > 0) {
        alert('该教师当前有授课任务，禁止删除！');
        return;
      }
      //无课程则打开删除确认弹窗
      this.deleteTeacherId = account;
      this.isDeleteModalOpen = true;
    },

    closeDeleteModal() {
      this.isDeleteModalOpen = false;
    },

    async confirmDelete() {
      try {
        const response = await axios.delete(
          `http://localhost:3000/api/teacher/${this.deleteTeacherId}`
        );
        if (response.data.code === 200) {
          alert('删除成功！');
          this.fetchTeachers(); // 重新拉取数据
          this.closeDeleteModal();
        } else {
          alert('删除失败：' + response.data.message);
        }
      } catch (error) {
        console.error('删除教师失败：', error);
        alert('网络错误，删除失败');
      }
    },

    async resetPassword(account) {
      if (confirm(`确定要重置教师 ${account} 的密码吗？重置后密码为 123`)) {
        try {
          const response = await axios.put(`http://localhost:3000/api/teacher/${account}/reset-password`, {
            password: '123'
          });
          if (response.data.code === 200) {
            alert('密码重置成功！');
          } else {
            alert('重置失败：' + response.data.message);
          }
        } catch (error) {
          console.error('重置密码失败：', error);
          alert('网络错误，操作失败');
        }
      }
    }
  },
};
</script>

<style scoped>
.teacher-manage-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #f5f7fa;
  overflow: auto;
  padding: 16px;
  box-sizing: border-box;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
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

.filter-hint {
  margin: 5px 0 0 0;
  font-size: 12px;
  color: #999;
}

.table-container {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.teacher-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.teacher-table th,
.teacher-table td {
  padding: 12px 15px;
  text-align: left;
  color: #000;
  border-bottom: 1px solid #eee;
}

.teacher-table th {
  background-color: #f8f9fa;
  color: #333;
  font-weight: 600;
}

.teacher-table tbody tr:hover {
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

.reset-btn {
  padding: 4px 8px;
  background-color: #ed8936;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.reset-btn:hover {
  background-color: #dd6b20;
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

/* 禁用状态样式 */
.delete-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.delete-btn:hover:not(:disabled) {
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
  max-width: 500px;
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

.course-display {
  padding: 10px 12px;
  background-color: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  color: #333;
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

.delete-tip {
  color: #666;
  font-size: 14px;
  margin: 0 0 10px 0;
  line-height: 1.5;
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

.delete-confirm-btn {
  background-color: #e53e3e;
}

.delete-confirm-btn:hover {
  background-color: #c53030;
}
</style>