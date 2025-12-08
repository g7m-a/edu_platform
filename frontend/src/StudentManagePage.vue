<template>
  <div class="student-manage-container">
    <div class="page-header">
      <h2>学生管理</h2>
      <button @click="openAddModal" class="add-btn">新增学生</button>
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
        <label>年级搜索：</label>
        <select v-model="filterGrade" class="filter-input" @change="handleFilter">
          <option value="">请选择年级</option>
          <option value="2018">2018</option>
          <option value="2019">2019</option>
          <option value="2020">2020</option>
          <option value="2021">2021</option>
          <option value="2022">2022</option>
          <option value="2023">2023</option>
          <option value="2024">2024</option>
          <option value="2025">2025</option>
        </select>
      </div>

      <div class="filter-item">
        <label>学号搜索：</label>
        <input
          v-model="filterAccount"
          placeholder="输入学号搜索"
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
    </div>

    <div class="table-container">
      <table class="student-table">
        <thead>
          <tr>
            <th>学号</th>
            <th>姓名</th>
            <th>性别</th>
            <th>院系</th>
            <th>年级</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="student in filteredStudents" :key="student.account">
            <td>{{ student.account }}</td>
            <td>{{ student.name }}</td>
            <td>{{ student.gender }}</td>
            <td>{{ student.dept }}</td>
            <td>{{ student.grade }}</td>
            <td class="operate-btn-group">
              <button @click="openEditModal(student)" class="edit-btn">编辑</button>
              <button @click="resetPassword(student.account)" class="reset-btn">重置密码</button>
              <button @click="deleteStudent(student.account)" class="delete-btn">删除</button>
            </td>
          </tr>
          <tr v-if="filteredStudents.length === 0">
            <td colspan="6" class="empty-tip">暂无匹配学生数据</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="modal-mask" v-if="isModalOpen">
      <div class="modal-container">
        <div class="modal-header">
          <h3>{{ isEditMode ? '编辑学生' : '新增学生' }}</h3>
          <button @click="closeModal" class="close-btn">×</button>
        </div>
        <div class="modal-form">
          <div class="form-item">
            <label>学号：</label>
            <input
              v-model="formData.account"
              class="form-control"
              :disabled="isEditMode"
              placeholder="输入唯一学号"
            />
            <p class="error-tip" v-if="idError">{{ idError }}</p>
          </div>

          <div class="form-item">
            <label>姓名：</label>
            <input
              v-model="formData.name"
              class="form-control"
              placeholder="输入学生姓名"
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
              placeholder="输入学生所属院系"
            />
          </div>

          <div class="form-item">
            <label>年级：</label>
            <select v-model="formData.grade" class="form-control">
            <option value="">请选择年级</option>
            <option value="2018">2018</option>
            <option value="2019">2019</option>
            <option value="2020">2020</option>
            <option value="2021">2021</option>
            <option value="2022">2022</option>
            <option value="2023">2023</option>
            <option value="2024">2024</option>
            <option value="2025">2025</option>
            </select>
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
import axios from 'axios';
export default {
  data() {
    return {
      students:[],
      allDepts:[],
      filterDept:'',
      filterGrade:'',
      filterAccount:'',
      filterName:'',
      filteredStudents:[],
      isModalOpen:false,
      isEditMode:false,
      formData:{
        account:'',
        name:'',
        gender:'',
        dept:'',
        grade:'',
        password:''
      },
      idError:'',
      isDeleteModalOpen:false,
      deleteStudentId:''
    };
  },
  async mounted() {
    await this.fetchAllDepts();
    await this.fetchStudents();
    if(this.allDepts.length>0 && !this.formData.dept){
      this.formData.dept = this.allDepts[0];
    }
  },
  methods: {
    async fetchAllDepts(){
      try{
        const response = await axios.get('http://localhost:3000/api/students/depts');
        if(response.data.code === 200){
          this.allDepts = response.data.data;
        }else{
          alert('获取院系数据失败'+response.data.message);
        }
      }catch{
        alert('无法获取院系数据');
      }
    },

    async fetchStudents(){
      try{
        const response = await axios.get('http://localhost:3000/api/students');
        if(response.data.code === 200){
          this.students = response.data.data;
          this.handleFilter();
        }else{
          alert('获取学生数据失败'+response.data.message);
        }
      }catch{
        alert('无法获取学生数据');
      }
    },

    handleFilter() {
      let result = [...this.students];

      if (this.filterDept) {
        result = result.filter(student => student.dept === this.filterDept);
      }

      if (this.filterGrade){
        result = result.filter(student => student.grade === this.filterGrade);
      }

      if (this.filterAccount) {
        result = result.filter(student => student.account === this.filterAccount);
      }

      if (this.filterName) {
        result = result.filter(student => student.name === this.filterName);
      }

      this.filteredStudents = result;
    },

    openAddModal() {
      this.isEditMode = false;
      this.formData = {
        account: '',
        name: '',
        gender: '男',
        dept: this.allDepts[0] || '',
        grade: '',
      };
      this.idError = '';
      this.isModalOpen = true;
    },

    openEditModal(student) {
      this.isEditMode = true;
      this.formData = { 
        account: student.account,
        name: student.name,
        gender: student.gender,
        dept: student.dept,
        grade: student.grade
      };
      this.idError = '';
      this.isModalOpen = true;
    },

    closeModal() {
      this.isModalOpen = false;
    },

    async submitForm(){
      const {account, name, gender, dept, grade} = this.formData;
      if(!account || !name || !grade){
        alert('学号、姓名、年级不能为空！');
        return;
      }
      try{
        if(this.isEditMode){
          const response = await axios.put(
            `http://localhost:3000/api/students/${account}`,
            {name, gender, dept, grade}
          );
          if (response.data.code === 200) {
            alert('编辑成功！');
            await this.fetchStudents();
            this.closeModal();
          } else {
            alert('编辑失败：' + response.data.message);
          }
        }else{
          const response = await axios.post(
            'http://localhost:3000/api/student/add',
            {account, name, gender, dept, grade, password:'123'}
          );
          if (response.data.code === 200) {
            alert('新增成功！');
            await this.fetchStudents();
            this.closeModal();
          } else {
            if (response.data.code === 409) {
              this.idError = '该学号已存在，请输入唯一学号！';
            } else {
              alert('新增失败：' + response.data.message);
            }
          }
        }
      }catch{
        console.error('提交学生数据失败：', error);
        alert('网络错误，操作失败');
      }
    },

    async deleteStudent(account) {
      if (confirm('确定要删除该学生吗？删除后不可恢复！')) {
        try {
          const response = await axios.delete(
            `http://localhost:3000/api/students/${account}`
          );
          if (response.data.code === 200) {
            alert('删除成功！');
            this.fetchStudents();
          } else {
            alert('删除失败：' + response.data.message);
          }
        } catch (error) {
          console.error('删除学生失败：', error);
          alert('网络错误，删除失败');
        }
      }
    },

    async resetPassword(account) {
      if (confirm(`确定要重置学生 ${account} 的密码吗？重置后密码为 123`)) {
        try {
          const response = await axios.put(`http://localhost:3000/api/student/${account}/reset-password`, {
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
    },
  },
};
</script>

<style scoped>
.student-manage-container {
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

.table-container {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.student-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.student-table th,
.student-table td {
  padding: 12px 15px;
  text-align: left;
  color: #000;
  border-bottom: 1px solid #eee;
}

.student-table th {
  background-color: #f8f9fa;
  color: #333;
  font-weight: 600;
}

.student-table tbody tr:hover {
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