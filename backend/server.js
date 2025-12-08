const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const app = express();
app.use(cors()); // 允许所有跨域请求，避免前端端口变化导致CORS错误
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

//获取学生信息
app.get('/api/student/:account', async (req, res) => {
  try {
    const { account } = req.params;
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      'SELECT * FROM student WHERE account = ?',
      [account]
    );
    await connection.end();
    if (rows.length === 0) {
      return res.status(404).json({ code: 404, message: '学生不存在' });
    }
    const student = rows[0];
    res.json({ code: 200, data: student });
  } catch (error) {
    console.error('获取学生信息错误：', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

//更新学生信息
app.put('/api/students/:account', async (req, res) => {
  const { account } = req.params;
  const { name, gender, dept, grade } = req.body;
  
  if (name === undefined || gender === undefined || dept === undefined || grade === undefined) {
      return res.status(400).json({ code: 400, message: '参数缺失' });
  }

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

// 学生自行修改密码
app.put('/api/student/change-password', async (req, res) => {
  const { account, oldPassword, newPassword } = req.body;
  try {
    const connection = await mysql.createConnection(dbConfig);
    // 验证旧密码
    const [rows] = await connection.execute(
      'SELECT * FROM student WHERE account = ? AND password = ?',
      [account, oldPassword]
    );
    
    if (rows.length === 0) {
      await connection.end();
      return res.status(401).json({ code: 401, message: '旧密码错误' });
    }
    
    // 更新密码
    await connection.execute(
      'UPDATE student SET password = ? WHERE account = ?',
      [newPassword, account]
    );
    
    await connection.end();
    res.json({ code: 200, message: '密码修改成功' });
  } catch (error) {
    console.error('修改密码错误：', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// 管理员重置学生密码
app.put('/api/student/:account/reset-password', async (req, res) => {
  const { account } = req.params;
  const { password } = req.body; // 允许传入特定密码，或者默认
  const newPassword = password || '123';
  
  try {
    const connection = await mysql.createConnection(dbConfig);
    await connection.execute(
      'UPDATE student SET password = ? WHERE account = ?',
      [newPassword, account]
    );
    await connection.end();
    res.json({ code: 200, message: '重置学生密码成功' });
  } catch (error) {
    console.error('重置学生密码错误：', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// 删除学生
app.delete('/api/students/:account', async (req, res) => {
  const { account } = req.params;
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    await connection.beginTransaction();

    await connection.execute(
      'DELETE FROM student_course WHERE studentaccount = ?',
      [account]
    );

    await connection.execute(
      'DELETE FROM student WHERE account = ?',
      [account]
    );

    await connection.commit();
    await connection.end();
    res.json({ code: 200, message: '删除学生成功' });
  } catch (error) {
    if (connection) {
      await connection.rollback();
      await connection.end();
    }
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

app.post('/api/student/select-course', async (req, res) => {
  const { studentAccount, courseId } = req.body;
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    await connection.beginTransaction();
    const [studentRows] = await connection.execute(
      'SELECT * FROM student WHERE account = ?',
      [studentAccount]
    );
    if (studentRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ code: 404, message: '学生不存在' });
    }
    const [courseRows] = await connection.execute(
      'SELECT maxstu, startdate FROM course WHERE id = ?',
      [courseId]
    );
    if (courseRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ code: 404, message: '课程不存在' });
    }
    const { maxstu: maxStu, startdate } = courseRows[0];

    // Check if course has started
    if (new Date() > new Date(startdate)) {
      await connection.rollback();
      return res.status(400).json({ code: 400, message: '该课程已开课，无法选课' });
    }

    const [countRows] = await connection.execute(
      'SELECT COUNT(*) AS currentStu FROM student_course WHERE courseid = ?',
      [courseId]
    );
    const currentStu = countRows[0].currentStu;
    if (currentStu >= maxStu) {
      await connection.rollback();
      return res.status(400).json({ code: 400, message: '课程已达最大人数' });
    }
    const [existRows] = await connection.execute(
      'SELECT * FROM student_course WHERE studentaccount = ? AND courseid = ?',
      [studentAccount, courseId]
    );
    if (existRows.length > 0) {
      await connection.rollback();
      return res.status(400).json({ code: 400, message: '已选该课程' });
    }
    await connection.execute(
      'INSERT INTO student_course (studentaccount, courseid) VALUES (?, ?)',
      [studentAccount, courseId]
    );

    await connection.commit();
    await connection.end();
    res.json({ code: 200, message: '选课成功' });
  } catch (error) {
    if (connection) {
      await connection.rollback();
      await connection.end();
    }
    console.error('选课错误：', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// 退课
app.post('/api/student/drop-course', async (req, res) => {
  const { studentAccount, courseId } = req.body;
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    await connection.beginTransaction();
    const [existRows] = await connection.execute(
      'SELECT * FROM student_course WHERE studentaccount = ? AND courseid = ?',
      [studentAccount, courseId]
    );
    if (existRows.length === 0) {
      await connection.rollback();
      return res.status(400).json({ code: 400, message: '未选该课程' });
    }
    await connection.execute(
      'DELETE FROM student_course WHERE studentaccount = ? AND courseid = ?',
      [studentAccount, courseId]
    );

    await connection.commit();
    await connection.end();
    res.json({ code: 200, message: '退课成功' });
  } catch (error) {
    if (connection) {
      await connection.rollback();
      await connection.end();
    }
    console.error('退课错误：', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

//获取学生已选课程
app.get('/api/student/:account/courses', async (req, res) => {
  const { account } = req.params;
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(`
      SELECT c.id, c.name, c.startdate, c.enddate, c.teacheraccount, 
             c.place, c.time, c.maxstu, t.name AS teachername
      FROM student_course sc
      JOIN course c ON sc.courseid = c.id
      LEFT JOIN teacher t ON c.teacheraccount = t.account
      WHERE sc.studentaccount = ?
    `, [account]);

    await connection.end();
    res.json({ code: 200, data: rows });
  } catch (error) {
    if (connection) await connection.end();
    console.error('获取学生已选课程错误：', error);
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
    const [rows] = await connection.execute('SELECT * FROM teacher');
    const [courses] = await connection.execute('SELECT id, name FROM course');
    await connection.end();

    const courseMap = {};
    courses.forEach(c => {
      courseMap[c.id] = c.name;
    });

    const formattedTeachers = rows.map(teacher => {
      let teacherCourses = teacher.courses;
      // Ensure it's an array
      if (!Array.isArray(teacherCourses)) {
         teacherCourses = [];
      }
      
      const displayCourses = teacherCourses.map(cid => {
        const cname = courseMap[cid] || '未知课程';
        return `${cname} (${cid})`;
      });

      return {
        ...teacher,
        courses: displayCourses
      };
    });

    res.json({code:200,data:formattedTeachers});
  }catch(error){
    console.error('获取教师列表失败:', error);
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

// 教师自行修改密码
app.put('/api/teacher/change-password', async (req, res) => {
  const { account, oldPassword, newPassword } = req.body;
  try {
    const connection = await mysql.createConnection(dbConfig);
    // 验证旧密码
    const [rows] = await connection.execute(
      'SELECT * FROM teacher WHERE account = ? AND password = ?',
      [account, oldPassword]
    );
    
    if (rows.length === 0) {
      await connection.end();
      return res.status(401).json({ code: 401, message: '旧密码错误' });
    }
    
    // 更新密码
    await connection.execute(
      'UPDATE teacher SET password = ? WHERE account = ?',
      [newPassword, account]
    );
    
    await connection.end();
    res.json({ code: 200, message: '密码修改成功' });
  } catch (error) {
    console.error('修改密码错误：', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// 管理员重置教师密码
app.put('/api/teacher/:account/reset-password', async (req, res) => {
  const { account } = req.params;
  const { password } = req.body;
  const newPassword = password || '123';
  
  try {
    const connection = await mysql.createConnection(dbConfig);
    await connection.execute(
      'UPDATE teacher SET password = ? WHERE account = ?',
      [newPassword, account]
    );
    await connection.end();
    res.json({ code: 200, message: '重置教师密码成功' });
  } catch (error) {
    console.error('重置教师密码错误：', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

//更新教师信息
app.put('/api/teacher/:account', async (req, res) => {
  const { account } = req.params;
  const { name, gender, dept } = req.body;
  
  if (name === undefined || gender === undefined || dept === undefined) {
      return res.status(400).json({ code: 400, message: '参数缺失' });
  }

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
    const [rows] = await connection.execute(`
      SELECT c.id, c.name, c.startdate, c.enddate, c.teacheraccount, 
             c.place, c.time, c.maxstu,
             (SELECT COUNT(*) FROM student_course sc WHERE sc.courseid = c.id) AS currentstu
      FROM course c
    `);
    await connection.end();
    res.json({ code: 200, data: rows });
  } catch (error) {
    console.error('获取课程列表错误：', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

app.post('/api/courses/by-ids', async (req, res) => {
  const { courseIds } = req.body;
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const placeholders = courseIds.map(() => '?').join(',');
    const [courses] = await connection.execute(
      `SELECT id, name, teacheraccount, time, startdate, enddate, place, maxstu 
       FROM course WHERE id IN (${placeholders})`,
      courseIds
    );

    for (const course of courses) {
      const [teacherRows] = await connection.execute(
        'SELECT name FROM teacher WHERE account = ?',
        [course.teacheraccount]
      );
      course.teachername = teacherRows.length > 0 ? teacherRows[0].name : '未知教师';
      const [countRows] = await connection.execute(
        'SELECT COUNT(*) AS currentstu FROM student_course WHERE courseid = ?',
        [course.id]
      );
      course.currentstu = countRows[0].currentstu;
    }

    res.json({ code: 200, data: courses });
  } catch (error) {
    console.error('批量查询课程失败：', error);
    res.status(500).json({ code: 500, message: '查询课程失败' });
  } finally {
    if (connection) await connection.end();
  }
});

// 教师发布作业接口（修复批量插入SQL语法错误）
app.post('/api/homework/publish', async (req, res) => {
  const { id: homework_id, course_id, teacher_id, title, content, ddl } = req.body;

  let connection = null;
  try {
    connection = await mysql.createConnection(dbConfig);
    await connection.beginTransaction(); // 开启事务

    // 1. 插入作业主表（homework）
    await connection.execute(
      `INSERT INTO homework 
       (id, course_id, teacher_id, title, content, ddl) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [homework_id, course_id, teacher_id, title, content, ddl]
    );

    // 2. 从student_course表查询选该课程的所有学生
    const [students] = await connection.execute(
      `SELECT studentaccount FROM student_course WHERE courseid = ?`,
      [course_id]
    );

    // 3. 批量插入student_homework记录（修复SQL语法错误）
    if (students.length > 0) {
      // 构造批量插入的values数组
      const values = [];
      const placeholders = [];
      students.forEach((student, index) => {
        const shwId = `SHW_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        // 每个学生的参数占位符
        placeholders.push(`(?, ?, ?, ?, ?, ?, ?, ?, ?)`);
        // 每个学生的参数值
        values.push(
          shwId,          // id
          student.studentaccount, // student_id
          homework_id,    // homework_id
          0,              // status（未提交）
          null,           // submit_content
          null,           // score
          null,           // comment
          null,           // correct_time
          null            // submit_time
        );
      });

      // 拼接SQL语句（改用query方法支持批量插入）
      const sql = `INSERT INTO student_homework 
        (id, student_id, homework_id, status, submit_content, score, comment, correct_time, submit_time) 
        VALUES ${placeholders.join(',')}`;
      
      await connection.query(sql, values); // 用query方法执行批量插入
    }

    await connection.commit(); // 提交事务
    res.json({ 
      code: 200, 
      message: '作业发布成功，已为选课学生初始化作业记录',
      data: { homeworkId: homework_id }
    });

  } catch (error) {
    if (connection) await connection.rollback(); // 事务回滚
    console.error('发布作业失败：', error);
    res.status(500).json({ code: 500, message: `服务器内部错误：${error.message}` });
  } finally {
    if (connection) await connection.end();
  }
});

app.post('/api/homework/teacher/list', async (req, res) => {
  const { teacher_id } = req.body;

  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      `SELECT h.*, c.name AS course_name 
       FROM homework h 
       LEFT JOIN course c ON h.course_id = c.id 
       WHERE h.teacher_id = ? 
       ORDER BY h.id DESC`,
      [teacher_id]
    );

    await connection.end();
    res.json({ 
      code: 200, 
      message: '获取作业列表成功',
      data: rows
    });
  } catch (error) {
    console.error('获取作业列表错误：', error);
    res.status(500).json({ code: 500, message: `服务器内部错误：${error.message}` });
  }
});

// 教师删除作业接口（同步删除student_homework表中关联记录）
app.post('/api/homework/delete', async (req, res) => {
  const { homework_id, teacher_id } = req.body;

  // 参数校验
  if (!homework_id || !teacher_id) {
    return res.status(400).json({ code: 400, message: '作业ID和教师ID不能为空' });
  }

  let connection = null;
  try {
    connection = await mysql.createConnection(dbConfig);
    await connection.beginTransaction(); // 开启事务

    // 1. 校验作业归属（防止删除其他教师的作业）
    const [homework] = await connection.execute(
      `SELECT id FROM homework WHERE id = ? AND teacher_id = ?`,
      [homework_id, teacher_id]
    );
    if (homework.length === 0) {
      throw new Error('该作业不存在或不属于当前教师');
    }

    // 2. 删除student_homework表中关联记录
    await connection.execute(
      `DELETE FROM student_homework WHERE homework_id = ?`,
      [homework_id]
    );

    // 3. 删除homework表中主记录
    await connection.execute(
      `DELETE FROM homework WHERE id = ? AND teacher_id = ?`,
      [homework_id, teacher_id]
    );

    await connection.commit(); // 提交事务
    res.json({ 
      code: 200, 
      message: '作业删除成功，已同步删除所有学生的相关作业记录' 
    });

  } catch (error) {
    if (connection) await connection.rollback(); // 事务回滚
    console.error('删除作业失败：', error);
    res.status(500).json({ 
      code: 500, 
      message: `删除作业失败：${error.message}` 
    });
  } finally {
    if (connection) await connection.end();
  }
});

// 教师更新作业接口
app.put('/api/homework/update', async (req, res) => {
  const { homework_id, teacher_id, title, content, ddl } = req.body;

  if (!homework_id || !teacher_id || !title || !content || !ddl) {
    return res.status(400).json({ code: 400, message: '所有字段都不能为空' });
  }

  let connection = null;
  try {
    connection = await mysql.createConnection(dbConfig);
    
    // 校验作业归属
    const [homework] = await connection.execute(
      `SELECT id FROM homework WHERE id = ? AND teacher_id = ?`,
      [homework_id, teacher_id]
    );
    if (homework.length === 0) {
      await connection.end();
      return res.status(403).json({ code: 403, message: '该作业不存在或不属于当前教师' });
    }

    // 更新作业
    await connection.execute(
      `UPDATE homework SET title = ?, content = ?, ddl = ? WHERE id = ?`,
      [title, content, ddl, homework_id]
    );

    await connection.end();
    res.json({ code: 200, message: '作业更新成功' });
  } catch (error) {
    console.error('更新作业失败：', error);
    res.status(500).json({ code: 500, message: `服务器内部错误：${error.message}` });
  }
});

// 获取单个作业详情
app.get('/api/homework/detail/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      `SELECT h.*, c.name AS course_name, t.name AS teacher_name
       FROM homework h
       LEFT JOIN course c ON h.course_id = c.id
       LEFT JOIN teacher t ON h.teacher_id = t.account
       WHERE h.id = ?`,
      [id]
    );
    await connection.end();
    
    if (rows.length === 0) {
      return res.status(404).json({ code: 404, message: '作业不存在' });
    }
    
    res.json({ code: 200, data: rows[0] });
  } catch (error) {
    console.error('获取作业详情失败：', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// 获取学生作业列表
app.get('/api/homework/student/list', async (req, res) => {
  const { student_id } = req.query;
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      `SELECT sh.id AS sh_id, sh.status, sh.score, sh.comment, sh.submit_time, sh.correct_time, sh.submit_content,
              h.id AS homework_id, h.title, h.content, h.ddl,
              c.name AS course_name, t.name AS teacher_name
       FROM student_homework sh
       JOIN homework h ON sh.homework_id = h.id
       JOIN course c ON h.course_id = c.id
       LEFT JOIN teacher t ON h.teacher_id = t.account
       WHERE sh.student_id = ?
       ORDER BY h.ddl DESC`,
      [student_id]
    );
    await connection.end();
    res.json({ code: 200, data: rows });
  } catch (error) {
    console.error('获取学生作业列表错误：', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// 学生提交作业
app.post('/api/homework/submit', async (req, res) => {
  const { id, submit_content } = req.body; // id is student_homework id
  try {
    const connection = await mysql.createConnection(dbConfig);
    
    // Check DDL
    const [hwRows] = await connection.execute(
      `SELECT h.ddl FROM student_homework sh 
       JOIN homework h ON sh.homework_id = h.id 
       WHERE sh.id = ?`,
      [id]
    );
    
    if (hwRows.length > 0) {
      const ddl = new Date(hwRows[0].ddl);
      if (new Date() > ddl) {
        await connection.end();
        return res.status(400).json({ code: 400, message: '截止时间已过' });
      }
    }

    const now = new Date();
    await connection.execute(
      `UPDATE student_homework 
       SET status = 1, submit_content = ?, submit_time = ? 
       WHERE id = ?`,
      [submit_content, now, id]
    );
    await connection.end();
    res.json({ code: 200, message: '作业提交成功' });
  } catch (error) {
    console.error('作业提交失败：', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// 教师获取某作业的所有提交记录
app.get('/api/homework/submissions', async (req, res) => {
  const { homework_id } = req.query;
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      `SELECT sh.*, s.name AS student_name, s.account AS student_account
       FROM student_homework sh
       JOIN student s ON sh.student_id = s.account
       WHERE sh.homework_id = ?
       ORDER BY sh.status DESC, sh.submit_time ASC`, // 已提交的排前面
      [homework_id]
    );
    await connection.end();
    res.json({ code: 200, data: rows });
  } catch (error) {
    console.error('获取作业提交记录失败：', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// 教师批改作业
app.post('/api/homework/grade', async (req, res) => {
  const { id, score, comment } = req.body; // id is student_homework id
  try {
    const connection = await mysql.createConnection(dbConfig);
    const now = new Date();
    await connection.execute(
      `UPDATE student_homework 
       SET status = 2, score = ?, comment = ?, correct_time = ? 
       WHERE id = ?`,
      [score, comment, now, id]
    );
    await connection.end();
    res.json({ code: 200, message: '批改成功' });
  } catch (error) {
    console.error('批改作业失败：', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// 添加课程
app.post('/api/course/add', async (req, res) => {
  const { id, name, startdate, enddate, teacheraccount, place, time, maxstu, testratio, credit } = req.body;
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    await connection.beginTransaction();

    const [existRows] = await connection.execute(
      'SELECT * FROM course WHERE id = ?',
      [id]
    );
    if (existRows.length > 0) {
      await connection.rollback();
      await connection.end();
      return res.status(409).json({ code: 409, message: '课程编号已存在' });
    }

    await connection.execute(
      'INSERT INTO course (id, name, startdate, enddate, teacheraccount, place, time, maxstu, testratio, credit) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, name, startdate, enddate, teacheraccount, place, time, maxstu, testratio || 0, credit || 0]
    );

    await connection.execute(
      'UPDATE teacher SET courses = JSON_ARRAY_APPEND(IFNULL(courses, "[]"), "$", ?) WHERE account = ?',
      [id, teacheraccount]
    );

    await connection.commit();
    await connection.end();
    res.json({ code: 200, message: '新增课程成功' });
  } catch (error) {
    if (connection) {
      await connection.rollback();
      await connection.end();
    }
    console.error('添加课程错误：', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

app.delete('/api/course/:id', async (req, res) => {
  const { id } = req.params;
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    await connection.beginTransaction();

    const [teacherRows] = await connection.execute(
      'SELECT teacheraccount FROM course WHERE id = ?',
      [id]
    );
    const teacherAccount = teacherRows[0]?.teacheraccount;

    await connection.execute(
      'DELETE FROM student_course WHERE courseid = ?',
      [id]
    );

    await connection.execute(
      'DELETE FROM course WHERE id = ?',
      [id]
    );

    if (teacherAccount) {
      await connection.execute(
        'UPDATE teacher SET courses = JSON_REMOVE(courses, JSON_UNQUOTE(JSON_SEARCH(courses, "one", ?))) WHERE account = ?',
        [id, teacherAccount]
      );
    }

    await connection.commit();
    await connection.end();
    res.json({ code: 200, message: '删除课程成功' });
  } catch (error) {
    if (connection) {
      await connection.rollback();
      await connection.end();
    }
    console.error('删除课程错误：', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// 更新课程
app.put('/api/course/:id', async (req, res) => {
  const { id } = req.params;
  const { name, startdate, enddate, teacheraccount, place, time, maxstu, testratio, credit } = req.body;
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    await connection.beginTransaction();
    
    const [stuCountRow] = await connection.execute(
      'SELECT COUNT(*) AS stuNum FROM student_course WHERE courseid = ?',
      [id]
    );
    const currentStuNum = stuCountRow[0]?.stuNum || 0;
    
    if (maxstu < currentStuNum) {
      await connection.rollback();
      await connection.end();
      return res.status(400).json({ 
        code: 400, 
        message: `最大学生数不能小于目前学生数（当前已选：${currentStuNum}人）` 
      });
    }
    
    const [oldTeacherRows] = await connection.execute(
      'SELECT teacheraccount FROM course WHERE id = ?',
      [id]
    );
    const originalTeacherAccount = oldTeacherRows[0]?.teacheraccount;
    
    await connection.execute(
      `UPDATE course SET name = ?, startdate = ?, enddate = ?, teacheraccount = ?, place = ?, time = ?, maxstu = ?, testratio = ?, credit = ? 
       WHERE id = ?`,
      [name, startdate, enddate, teacheraccount, place, time, maxstu, testratio || 0, credit || 0, id]
    );
    
    if (originalTeacherAccount && originalTeacherAccount !== teacheraccount) {
      await connection.execute(
        'UPDATE teacher SET courses = JSON_REMOVE(courses, JSON_UNQUOTE(JSON_SEARCH(courses, "one", ?))) WHERE account = ?',
        [id, originalTeacherAccount]
      );
      
      await connection.execute(
        'UPDATE teacher SET courses = JSON_ARRAY_APPEND(IFNULL(courses, "[]"), "$", ?) WHERE account = ?',
        [id, teacheraccount]
      );
    }
    
    await connection.commit();
    await connection.end();
    res.json({ code: 200, message: '更新课程成功' });
  } catch (error) {
    if (connection) {
      await connection.rollback();
      await connection.end();
    }
    console.error('更新课程错误：', error);
    res.status(500).json({ 
      code: 500, 
      message: '服务器内部错误，更新课程失败' 
    });
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

// 教师录入期末成绩并计算总评
app.post('/api/course/grades/finalize', async (req, res) => {
  const { course_id, student_scores } = req.body; // student_scores: [{ student_id, exam_score }]
  
  if (!student_scores || !Array.isArray(student_scores)) {
    return res.status(400).json({ code: 400, message: '成绩数据格式错误' });
  }

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    await connection.beginTransaction();

    // 1. 获取课程信息（testratio）
    const [courseRows] = await connection.execute(
      'SELECT testratio FROM course WHERE id = ?',
      [course_id]
    );
    if (courseRows.length === 0) {
      throw new Error('课程不存在');
    }
    const testRatio = (courseRows[0].testratio || 0) / 100; // Assuming input 0-100

    // 2. 获取该课程作业总数
    const [hwCountRows] = await connection.execute(
      'SELECT COUNT(*) as count FROM homework WHERE course_id = ?',
      [course_id]
    );
    const hwCount = hwCountRows[0].count;

    // 3. 遍历学生，计算平时成绩和总评
    for (const item of student_scores) {
      const { student_id, exam_score } = item;
      
      let regularScore = 0;
      
      if (hwCount === 0) {
        // 如果未发布作业，平时分自动为100
        regularScore = 100;
      } else {
        // 有作业：计算平均分（未提交/未批改视为0分）
        // 逻辑：总得分 / 作业总数
        // 注意：这里假设 student_homework 表中已为每个学生初始化了所有作业记录
        // 如果记录缺失，COUNT(*) 可能会小于 hwCount，导致分母偏小，分数偏高。
        // 为严谨起见，分母应使用 hwCount (课程发布的作业总数)
        
        const [scoreRows] = await connection.execute(
          `SELECT SUM(IFNULL(score, 0)) as total_score
           FROM student_homework sh
           JOIN homework h ON sh.homework_id = h.id
           WHERE sh.student_id = ? AND h.course_id = ?`,
          [student_id, course_id]
        );
        
        const totalScore = parseFloat(scoreRows[0].total_score || 0);
        regularScore = totalScore / hwCount;
      }
      
      // 保留两位小数
      regularScore = parseFloat(regularScore.toFixed(2));

      const finalScore = Math.round(testRatio * exam_score + (1 - testRatio) * regularScore);

      await connection.execute(
        `UPDATE student_course 
         SET score = ?, exam_score = ?, regular_score = ?
         WHERE studentaccount = ? AND courseid = ?`,
        [finalScore, exam_score, regularScore, student_id, course_id]
      );
    }

    await connection.commit();
    res.json({ code: 200, message: '成绩录入及计算成功' });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('录入成绩失败：', error);
    res.status(500).json({ code: 500, message: '服务器内部错误：' + error.message });
  } finally {
    if (connection) await connection.end();
  }
});

// 获取学生所有课程成绩及统计
app.get('/api/student/:account/grades', async (req, res) => {
  const { account } = req.params;
  try {
    const connection = await mysql.createConnection(dbConfig);
    
    // 获取已出成绩的课程（score 不为 NULL）
    const [rows] = await connection.execute(
      `SELECT sc.score, sc.exam_score, sc.regular_score, 
              c.name as course_name, c.credit, c.testratio
       FROM student_course sc
       JOIN course c ON sc.courseid = c.id
       WHERE sc.studentaccount = ? AND sc.score IS NOT NULL`,
      [account]
    );

    // 计算排名 (需要额外查询)
    for (const row of rows) {
        const [rankRows] = await connection.execute(
            `SELECT COUNT(*) as rank_num FROM student_course 
             WHERE courseid = (SELECT id FROM course WHERE name = ?) 
             AND score > ?`,
            [row.course_name, row.score]
        );
        row.rank = rankRows[0].rank_num + 1;
    }
    
    await connection.end();
    res.json({ code: 200, data: rows });
  } catch (error) {
    console.error('获取学生成绩失败：', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// 获取课程成绩统计（教师端）
app.get('/api/teacher/course/:id/stats', async (req, res) => {
  const { id } = req.params;
  try {
    const connection = await mysql.createConnection(dbConfig);
    
    const [rows] = await connection.execute(
      `SELECT s.name, s.account, sc.score, sc.exam_score, sc.regular_score
       FROM student_course sc
       JOIN student s ON sc.studentaccount = s.account
       WHERE sc.courseid = ? AND sc.score IS NOT NULL
       ORDER BY sc.score DESC`,
      [id]
    );
    
    // 计算平均分
    const totalScore = rows.reduce((sum, r) => sum + (r.score || 0), 0);
    const avgScore = rows.length > 0 ? (totalScore / rows.length).toFixed(1) : 0;
    
    await connection.end();
    res.json({ 
        code: 200, 
        data: {
            students: rows,
            avgScore: avgScore,
            count: rows.length
        } 
    });
  } catch (error) {
    console.error('获取课程统计失败：', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// 获取学生在同院系中的综合学分排名
app.get('/api/student/:account/department-rank', async (req, res) => {
  const { account } = req.params;
  try {
    const connection = await mysql.createConnection(dbConfig);
    
    // 1. 获取该学生的院系
    const [studentRows] = await connection.execute(
      'SELECT dept FROM student WHERE account = ?',
      [account]
    );
    if (studentRows.length === 0) {
      await connection.end();
      return res.status(404).json({ code: 404, message: '学生不存在' });
    }
    const dept = studentRows[0].dept;

    // 2. 获取该院系所有学生的加权平均分
    const [rows] = await connection.execute(`
      SELECT 
        s.account,
        SUM(sc.score * c.credit) / SUM(c.credit) as weighted_avg
      FROM student s
      JOIN student_course sc ON s.account = sc.studentaccount
      JOIN course c ON sc.courseid = c.id
      WHERE s.dept = ? AND sc.score IS NOT NULL
      GROUP BY s.account
    `, [dept]);

    await connection.end();

    // 3. 计算综合学分并排序
    const rankings = rows.map(row => {
      const weightedAvg = parseFloat(row.weighted_avg || 0);
      // 综合学分 = (加权平均分 - 50) / 10
      const comprehensiveCredit = (weightedAvg - 50) / 10;
      return {
        account: row.account,
        weightedAvg: weightedAvg.toFixed(2),
        comprehensiveCredit: comprehensiveCredit
      };
    });

    // 按综合学分降序排序
    rankings.sort((a, b) => b.comprehensiveCredit - a.comprehensiveCredit);

    // 4. 找到目标学生的排名
    const rankIndex = rankings.findIndex(r => r.account === account);
    const myRank = rankIndex !== -1 ? rankIndex + 1 : 0;
    const myData = rankIndex !== -1 ? rankings[rankIndex] : null;

    res.json({ 
      code: 200, 
      data: {
        rank: myRank,
        totalStudents: rankings.length,
        comprehensiveCredit: myData ? myData.comprehensiveCredit.toFixed(2) : '0.00',
        weightedAvg: myData ? myData.weightedAvg : '0.00'
      }
    });

  } catch (error) {
    console.error('获取排名失败：', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// 获取课程学生列表
app.get('/api/course/:courseId/students', async (req, res) => {
  const { courseId } = req.params;
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      `SELECT s.account, s.name, s.dept, s.grade, sc.score, sc.regular_score, sc.exam_score
       FROM student_course sc
       JOIN student s ON sc.studentaccount = s.account
       WHERE sc.courseid = ?`,
      [courseId]
    );
    await connection.end();
    res.json({ code: 200, data: rows });
  } catch (error) {
    console.error('获取课程学生失败:', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// 移除课程学生
app.delete('/api/course/:courseId/student/:studentId', async (req, res) => {
  const { courseId, studentId } = req.params;
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    await connection.beginTransaction();

    // 删除选课记录
    await connection.execute(
      'DELETE FROM student_course WHERE courseid = ? AND studentaccount = ?',
      [courseId, studentId]
    );

    // 删除相关的作业记录
    const [homeworks] = await connection.execute(
      'SELECT id FROM homework WHERE course_id = ?',
      [courseId]
    );
    
    if (homeworks.length > 0) {
      const homeworkIds = homeworks.map(h => h.id);
      const placeholders = homeworkIds.map(() => '?').join(',');
      await connection.execute(
        `DELETE FROM student_homework WHERE student_id = ? AND homework_id IN (${placeholders})`,
        [studentId, ...homeworkIds]
      );
    }
    
    // 减少课程当前人数
    // await connection.execute(
    //    'UPDATE course SET currentstu = GREATEST(currentstu - 1, 0) WHERE id = ?',
    //    [courseId]
    // );

    await connection.commit();
    res.json({ code: 200, message: '移除学生成功' });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('移除学生失败:', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  } finally {
    if (connection) await connection.end();
  }
});

// 添加学生到课程
app.post('/api/course/:courseId/student', async (req, res) => {
  const { courseId } = req.params;
  const { studentId } = req.body;
  
  if (!studentId) {
    return res.status(400).json({ code: 400, message: '学生学号不能为空' });
  }

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    await connection.beginTransaction();

    // 检查学生是否存在
    const [students] = await connection.execute('SELECT account FROM student WHERE account = ?', [studentId]);
    if (students.length === 0) {
      throw new Error('学生不存在');
    }

    // 检查是否已选
    const [exists] = await connection.execute(
      'SELECT * FROM student_course WHERE courseid = ? AND studentaccount = ?',
      [courseId, studentId]
    );
    if (exists.length > 0) {
      throw new Error('学生已选修该课程');
    }
    
    // 添加选课记录
    await connection.execute(
      'INSERT INTO student_course (studentaccount, courseid) VALUES (?, ?)',
      [studentId, courseId]
    );
    
    // 更新课程人数
    // await connection.execute(
    //   'UPDATE course SET currentstu = currentstu + 1 WHERE id = ?',
    //   [courseId]
    // );

    // 回补作业
    const [homeworks] = await connection.execute(
      'SELECT id FROM homework WHERE course_id = ?',
      [courseId]
    );
    
    for (const hw of homeworks) {
      // 生成唯一的 student_homework ID
      const shwId = `SHW_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      await connection.execute(
        `INSERT INTO student_homework 
         (id, homework_id, student_id, status, submit_content, score, comment, correct_time, submit_time) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [shwId, hw.id, studentId, 0, null, null, null, null, null] 
      );
    }

    await connection.commit();
    res.json({ code: 200, message: '添加学生成功' });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('添加学生失败:', error);
    res.status(500).json({ code: 500, message: error.message });
  } finally {
    if (connection) await connection.end();
  }
});

const port = 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});