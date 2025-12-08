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
      'SELECT maxstu FROM course WHERE id = ?',
      [courseId]
    );
    if (courseRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ code: 404, message: '课程不存在' });
    }
    const maxStu = courseRows[0].maxstu;
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
  const { id, name, startdate, enddate, teacheraccount, place, time, maxstu } = req.body;
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
      'INSERT INTO course (id, name, startdate, enddate, teacheraccount, place, time, maxstu) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, name, startdate, enddate, teacheraccount, place, time, maxstu]
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
  const { name, startdate, enddate, teacheraccount, place, time, maxstu } = req.body;
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
      `UPDATE course SET name = ?, startdate = ?, enddate = ?, teacheraccount = ?, place = ?, time = ?, maxstu = ? 
       WHERE id = ?`,
      [name, startdate, enddate, teacheraccount, place, time, maxstu, id]
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

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});//后端运行端口，被占用就换