const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const app = express();
app.use(cors({ origin: 'http://localhost:5173' }));//置换成本机前端运行端口
app.use(express.json());
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '123',
  database: 'edusys'//置换数据库相应值
};

//学生登录
app.post('/api/student/login', async (req, res) => {
  const { account, password } = req.body;

  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      'SELECT * FROM student WHERE account = ? AND password = ?',
      [account, password]
    );

    await connection.end();
    if (rows.length > 0) {
      const studentInfo = rows[0];
      res.json({ 
        code: 200, 
        message: '学生登录成功', 
        data: { token: studentInfo, role: 'student' }
      });
    } else {
      res.json({ code: 401, message: '学号或密码错误' });
    }
  } catch (error) {
    console.error('学生登录数据库错误：', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

//添加学生
app.post('/api/student/add',async(req,res)=>{
  const {account,name,gender,dept,grade,password} = req.body;
  try{
    const connection = await mysql.createConnection(dbConfig);
    const [existRows] = await connection.execute(
      'SELECT * FROM student WHERE account = ?',
      [account]
    );
    if(existRows.length>0){
      await connection.end();
      return res.status(409).json({code:409,message:'学号已存在'});
    }
    await connection.execute(
      'INSERT INTO student (account,name,gender,dept,grade,password) VALUES (?,?,?,?,?,?)',
      [account,name,gender,dept,grade,password]
    );
    await connection.end();
    res.json({code:200,message:'新增学生成功'});
  }catch(error){
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
})

//获取所有学生
app.get('/api/students',async(req,res)=>{
  try{
    const connection = await mysql.createConnection(dbConfig);
    const[rows] = await connection.execute('SELECT * FROM student');
    await connection.end();
    res.json({code:200,data:rows});
  }catch(error){
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
})

//更新学生信息
app.put('/api/students/:account', async (req, res) => {
  const { account } = req.params;
  const { name, gender, dept, grade } = req.body;
  try {
    const connection = await mysql.createConnection(dbConfig);
    await connection.execute(
      `UPDATE student SET name = ?, gender = ?, dept = ?, grade = ? 
       WHERE account = ?`,
      [name, gender, dept, grade, account]
    );
    await connection.end();
    res.json({ code: 200, message: '更新学生成功' });
  } catch (error) {
    console.error('更新学生错误：', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

//删除学生
app.delete('/api/students/:account', async (req, res) => {
  const { account } = req.params;
  try {
    const connection = await mysql.createConnection(dbConfig);
    await connection.execute(
      //应添加从学生courses中删除该学生逻辑
      'DELETE FROM student WHERE account = ?',
      [account]
    );
    await connection.end();
    res.json({ code: 200, message: '删除学生成功' });
  } catch (error) {
    console.error('删除学生错误：', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

//获取学生表内出现的所有院系
app.get('/api/students/depts', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      'SELECT DISTINCT dept FROM student ORDER BY dept'
    );
    await connection.end();
    const depts = rows.map(item => item.dept);
    res.json({ code: 200, data: depts });
  } catch (error) {
    console.error('获取院系列表错误：', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

//教师登录
app.post('/api/teacher/login', async (req, res) => {
  const { account, password } = req.body;

  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      'SELECT * FROM teacher WHERE account = ? AND password = ?',
      [account, password]
    );

    await connection.end();
    if (rows.length > 0) {
      const teacherInfo = rows[0];
      res.json({ 
        code: 200, 
        message: '老师登录成功', 
        data: { token: teacherInfo, role: 'teacher' }
      });
    } else {
      res.json({ code: 401, message: '工号或密码错误' });
    }
  } catch (error) {
    console.error('老师登录数据库错误：', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});


//获取所有教师
app.get('/api/teachers',async(req,res)=>{
  try{
    const connection = await mysql.createConnection(dbConfig);
    const[rows] = await connection.execute('SELECT * FROM teacher');
    await connection.end();
    const formattedTeachers = rows.map(teacher => ({
      ...teacher,
      courses: teacher.courses || []
    }));
    res.json({code:200,data:rows});
  }catch(error){
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
})

//添加教师
app.post('/api/teacher/add',async (req, res) => {
  const {account, name, gender, dept, password} = req.body;
  try{
    const connection = await mysql.createConnection(dbConfig);
    const [existRows] = await connection.execute(
      'SELECT * FROM teacher WHERE account = ?',
      [account]
    );
    if(existRows.length>0){
      await connection.end();
      return res.status(409).json({code:409,message:'工号已存在'});
    }
    await connection.execute(
      'INSERT INTO teacher (account,name,gender,dept,password) VALUES (?,?,?,?,?)',
      [account,name,gender,dept,password]
    );
    await connection.end();
    res.json({code:200,message:'新增教师成功'});
  }catch(error){
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
})

//获取教师姓名
app.get('/api/teachername/:account',async(req,res)=>{
  const {account} = req.params;
  try{
    const connection = await mysql.createConnection(dbConfig);
    const[rows] = await connection.execute('SELECT name FROM teacher WHERE account = ?',
    [account]
  );
    await connection.end();
    if (rows.length === 0) {
      return res.status(404).json({ code: 404, message: '该教师账号不存在' });
    }
    res.json({code:200,data:rows[0].name});
  }catch(error){
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
})

//更新教师信息
app.put('/api/teacher/:account', async (req, res) => {
  const { account } = req.params;
  const { name, gender, dept } = req.body;
  try {
    const connection = await mysql.createConnection(dbConfig);
    await connection.execute(
      `UPDATE teacher SET name = ?, gender = ?, dept = ? 
       WHERE account = ?`,
      [name, gender, dept, account]
    );
    await connection.end();
    res.json({ code: 200, message: '更新教师成功' });
  } catch (error) {
    console.error('更新教师错误：', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

//删除教师
app.delete('/api/teacher/:account', async (req, res) => {
  const { account } = req.params;
  try {
    const connection = await mysql.createConnection(dbConfig);
    await connection.execute(
      'DELETE FROM teacher WHERE account = ?',
      [account]
    );
    await connection.end();
    res.json({ code: 200, message: '删除教师成功' });
  } catch (error) {
    console.error('删除教师错误：', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

//获取教师表内出现的所有院系
app.get('/api/teachers/depts', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      'SELECT DISTINCT dept FROM teacher ORDER BY dept'
    );
    await connection.end();
    const depts = rows.map(item => item.dept);
    res.json({ code: 200, data: depts });
  } catch (error) {
    console.error('获取院系列表错误：', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// 获取所有课程
app.get('/api/courses', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      'SELECT id, name, startdate, enddate, teacheraccount, place, time FROM course'
    );
    await connection.end();
    res.json({ code: 200, data: rows });
  } catch (error) {
    console.error('获取课程列表错误：', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// 添加课程
app.post('/api/course/add', async (req, res) => {
  const { id, name, startdate, enddate, teacheraccount, place, time } = req.body; // 接收前端传递的 time 字符串
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [existRows] = await connection.execute(
      'SELECT * FROM course WHERE id = ?',
      [id]
    );
    if (existRows.length > 0) {
      await connection.end();
      return res.status(409).json({ code: 409, message: '课程编号已存在' });
    }
    await connection.execute(
      'INSERT INTO course (id, name, startdate, enddate, teacheraccount, place, time) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, name, startdate, enddate, teacheraccount, place, time]
    );
    await connection.end();
    res.json({ code: 200, message: '新增课程成功' });
  } catch (error) {
    console.error('添加课程错误：', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// 删除课程
app.delete('/api/course/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const connection = await mysql.createConnection(dbConfig);
    await connection.execute(
      'DELETE FROM course WHERE id = ?',
      [id]
    );
    await connection.end();
    res.json({ code: 200, message: '删除课程成功' });
  } catch (error) {
    console.error('删除课程错误：', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// 更新课程
app.put('/api/course/:id', async (req, res) => {
  const { id } = req.params;
  const { name, startdate, enddate, teacheraccount, place, time } = req.body; // 接收更新后的 time 字符串
  try {
    const connection = await mysql.createConnection(dbConfig);
    await connection.execute(
      `UPDATE course SET name = ?, startdate = ?, enddate = ?, teacheraccount = ?, place = ?, time = ? 
       WHERE id = ?`,
      [name, startdate, enddate, teacheraccount, place, time, id]
    );
    await connection.end();
    res.json({ code: 200, message: '更新课程成功' });
  } catch (error) {
    console.error('更新课程错误：', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

//管理员登录
app.post('/api/admin/login', async (req, res) => {
  const { account, password } = req.body;

  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      'SELECT * FROM admin WHERE account = ? AND password = ?',
      [account, password]
    );

    await connection.end();
    if (rows.length > 0) {
      res.json({ 
        code: 200, 
        message: '管理员登录成功', 
        data: { token: '', role: 'admin' }
      });
    } else {
      res.json({ code: 401, message: '工号或密码错误' });
    }
  } catch (error) {
    console.error('管理员登录数据库错误：', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

app.listen(3000, () => {});//后端运行端口，被占用就换
