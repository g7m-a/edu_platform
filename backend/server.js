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

app.post('/api/students',async(req,res)=>{
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

app.delete('/api/students/:account', async (req, res) => {
  const { account } = req.params;
  try {
    const connection = await mysql.createConnection(dbConfig);
    await connection.execute(
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
