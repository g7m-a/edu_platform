const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const OpenAI = require('openai');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const app = express();
app.use(cors()); // 允许所有跨域请求，避免前端端口变化导致CORS错误
app.use(express.json());
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'Birthday0406',
  database: 'edusys'//置换数据库相应值
};

// 初始化OpenAI客户端（Qwen模型）
const openai = new OpenAI({
  apiKey: "sk-9860910600a04bd68d92b1b89036541b",
  baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1"
});

// 创建uploads目录（如果不存在）
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// 配置multer用于文件上传（仅支持Word和PDF）
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // 生成唯一文件名：student_homework_id_时间戳_原文件名
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `hw_${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  // 只允许doc, docx, pdf文件
  const allowedTypes = ['.doc', '.docx', '.pdf'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('只支持上传Word文档(.doc, .docx)和PDF文件(.pdf)'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 限制文件大小为10MB
  }
});

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

    // 1. 删除学生作业记录
    await connection.execute(
      'DELETE FROM student_homework WHERE student_id = ?',
      [account]
    );

    // 2. 删除选课记录
    await connection.execute(
      'DELETE FROM student_course WHERE studentaccount = ?',
      [account]
    );

    // 3. 删除学生记录
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

// 检查时间段是否重叠的辅助函数
function isTimeOverlap(classes1, classes2) {
  const start1 = classes1[0];
  const end1 = classes1[1];
  const start2 = classes2[0];
  const end2 = classes2[1];
  return start1 <= end2 && end1 >= start2;
}

// 检查日期范围是否重叠的辅助函数
function isDateRangeOverlap(start1, end1, start2, end2) {
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
}

// 检查课程时间冲突的辅助函数（考虑起止日期）
function checkCourseTimeConflict(newCourseTimeList, newCourseStartDate, newCourseEndDate, newCourseName, selectedCourses) {
  if (!newCourseTimeList || newCourseTimeList.length === 0) {
    return null; // 新课程没有时间安排，不冲突
  }

  try {
    const newTimeList = typeof newCourseTimeList === 'string' 
      ? JSON.parse(newCourseTimeList) 
      : newCourseTimeList;

    for (const newTime of newTimeList) {
      if (!newTime.week || !newTime.classes || !newTime.classes[0] || !newTime.classes[1]) {
        continue;
      }

      for (const selectedCourse of selectedCourses) {
        // 首先检查课程的有效期是否重叠
        if (!isDateRangeOverlap(
          newCourseStartDate, newCourseEndDate,
          selectedCourse.startdate, selectedCourse.enddate
        )) {
          continue; // 有效期不重叠，不冲突
        }

        if (!selectedCourse.time || !selectedCourse.name) {
          continue;
        }

        let selectedTimeList;
        try {
          selectedTimeList = typeof selectedCourse.time === 'string' 
            ? JSON.parse(selectedCourse.time) 
            : selectedCourse.time;
        } catch (e) {
          continue;
        }

        if (!selectedTimeList || selectedTimeList.length === 0) {
          continue;
        }

        for (const selectedTime of selectedTimeList) {
          if (!selectedTime.week || !selectedTime.classes || !selectedTime.classes[0] || !selectedTime.classes[1]) {
            continue;
          }

          // 检查是否同一天且时间段重叠
          if (newTime.week === selectedTime.week) {
            if (isTimeOverlap(newTime.classes, selectedTime.classes)) {
              return {
                conflict: true,
                newCourseName: newCourseName,
                conflictCourseName: selectedCourse.name,
                day: newTime.week,
                time: `${newTime.classes[0]}-${newTime.classes[1]}节`
              };
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('检查时间冲突时出错:', error);
    // 如果解析失败，不阻止选课，但记录错误
  }

  return null; // 无冲突
}

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
      await connection.end();
      return res.status(404).json({ code: 404, message: '学生不存在' });
    }
    
    // 获取新课程信息（包含时间和起止日期）
    const [courseRows] = await connection.execute(
      'SELECT id, name, maxstu, startdate, enddate, time FROM course WHERE id = ?',
      [courseId]
    );
    if (courseRows.length === 0) {
      await connection.rollback();
      await connection.end();
      return res.status(404).json({ code: 404, message: '课程不存在' });
    }
    const { maxstu: maxStu, startdate, enddate, time: courseTime, name: courseName } = courseRows[0];

    // Check if course has started
    if (startdate && new Date() > new Date(startdate)) {
      await connection.rollback();
      await connection.end();
      return res.status(400).json({ code: 400, message: '该课程已开课，无法选课' });
    }

    const [countRows] = await connection.execute(
      'SELECT COUNT(*) AS currentStu FROM student_course WHERE courseid = ?',
      [courseId]
    );
    const currentStu = countRows[0].currentStu;
    if (currentStu >= maxStu) {
      await connection.rollback();
      await connection.end();
      return res.status(400).json({ code: 400, message: '课程已达最大人数' });
    }
    const [existRows] = await connection.execute(
      'SELECT * FROM student_course WHERE studentaccount = ? AND courseid = ?',
      [studentAccount, courseId]
    );
    if (existRows.length > 0) {
      await connection.rollback();
      await connection.end();
      return res.status(400).json({ code: 400, message: '已选该课程' });
    }

    // 检查时间冲突：获取学生已选的所有课程（包含起止日期）
    const [selectedCourseRows] = await connection.execute(
      `SELECT c.id, c.name, c.time, c.startdate, c.enddate
       FROM course c 
       INNER JOIN student_course sc ON c.id = sc.courseid 
       WHERE sc.studentaccount = ?`,
      [studentAccount]
    );

    // 检查新课程与已选课程的时间冲突（考虑起止日期）
    const conflict = checkCourseTimeConflict(
      courseTime, 
      startdate, 
      enddate, 
      courseName, 
      selectedCourseRows
    );

    if (conflict) {
      await connection.rollback();
      await connection.end();
      return res.status(400).json({ 
        code: 400, 
        message: `选课失败：时间冲突！《${courseName}》的${conflict.day} ${conflict.time}与已选课程《${conflict.conflictCourseName}》的时间冲突。请先退选冲突的课程后再选课。` 
      });
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

    // Check if course has ended
    const [courseRows] = await connection.execute(
      'SELECT enddate FROM course WHERE id = ?',
      [courseId]
    );
    if (courseRows.length > 0) {
       if (new Date() > new Date(courseRows[0].enddate)) {
          await connection.rollback();
          return res.status(400).json({ code: 400, message: '课程已结课，无法退课' });
       }
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
      `SELECT id, name, teacheraccount, time, startdate, enddate, place, maxstu, testratio 
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

    // 0. 检查课程是否已结束
    const [courseRows] = await connection.execute(
      'SELECT enddate, startdate FROM course WHERE id = ?',
      [course_id]
    );
    
    if (courseRows.length === 0) {
      await connection.rollback();
      await connection.end();
      return res.status(404).json({ code: 404, message: '课程不存在' });
    }
    
    const { enddate, startdate } = courseRows[0];
    
    // 检查课程是否已结束
    if (enddate && new Date() > new Date(enddate)) {
      await connection.rollback();
      await connection.end();
      return res.status(400).json({ code: 400, message: '课程已结课，无法发布作业' });
    }
    
    // 检查课程是否还未开课
    if (startdate && new Date() < new Date(startdate)) {
      await connection.rollback();
      await connection.end();
      return res.status(400).json({ code: 400, message: '课程尚未开课，无法发布作业' });
    }

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

// 学生提交作业（支持文本和文件上传）
// 注意：需要先在数据库中添加submit_file字段：ALTER TABLE student_homework ADD COLUMN submit_file VARCHAR(255) NULL;
app.post('/api/homework/submit', upload.single('file'), async (req, res) => {
  const { id, submit_content } = req.body; // id is student_homework id
  const file = req.file; // 上传的文件
  
  // 验证：至少要有文本内容或文件
  if (!submit_content && !file) {
    if (file) {
      // 如果上传了文件但验证失败，删除文件
      fs.unlinkSync(file.path);
    }
    return res.status(400).json({ code: 400, message: '请至少输入文本内容或上传文件' });
  }

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
        // 如果已过期，删除上传的文件
        if (file) {
          fs.unlinkSync(file.path);
        }
        return res.status(400).json({ code: 400, message: '截止时间已过' });
      }
    }

    const now = new Date();
    const fileName = file ? file.filename : null;
    
    // 更新数据库：如果表中有submit_file字段就更新，没有就只更新原有字段
    try {
      await connection.execute(
        `UPDATE student_homework 
         SET status = 1, submit_content = ?, submit_time = ?, submit_file = ? 
         WHERE id = ?`,
        [submit_content || null, now, fileName, id]
      );
    } catch (sqlError) {
      // 如果submit_file字段不存在，尝试不更新该字段
      if (sqlError.code === 'ER_BAD_FIELD_ERROR') {
        await connection.execute(
          `UPDATE student_homework 
           SET status = 1, submit_content = ?, submit_time = ? 
           WHERE id = ?`,
          [submit_content || null, now, id]
        );
        console.warn('警告：数据库表student_homework中不存在submit_file字段，文件信息未保存。请执行SQL：ALTER TABLE student_homework ADD COLUMN submit_file VARCHAR(255) NULL;');
      } else {
        throw sqlError;
      }
    }
    
    await connection.end();
    res.json({ code: 200, message: '作业提交成功', data: { hasFile: !!file } });
  } catch (error) {
    // 如果出错，删除上传的文件
    if (file) {
      fs.unlinkSync(file.path);
    }
    console.error('作业提交失败：', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// 教师获取某作业的所有提交记录
app.get('/api/homework/submissions', async (req, res) => {
  const { homework_id } = req.query;
  try {
    const connection = await mysql.createConnection(dbConfig);
    // 尝试查询submit_file字段，如果不存在也不会报错（在应用层处理）
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

// 下载学生提交的文件
app.get('/api/homework/file/:submissionId', async (req, res) => {
  const { submissionId } = req.params;
  
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      `SELECT submit_file FROM student_homework WHERE id = ?`,
      [submissionId]
    );
    await connection.end();
    
    if (rows.length === 0 || !rows[0].submit_file) {
      return res.status(404).json({ code: 404, message: '文件不存在' });
    }
    
    const fileName = rows[0].submit_file;
    const filePath = path.join(uploadsDir, fileName);
    
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ code: 404, message: '文件不存在' });
    }
    
    // 设置响应头，让浏览器下载文件
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    
    // 发送文件
    res.sendFile(filePath);
  } catch (error) {
    console.error('下载文件失败：', error);
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

// 提取文件内容的辅助函数
async function extractFileContent(filePath, fileName) {
  const ext = path.extname(fileName).toLowerCase();
  
  try {
    if (ext === '.pdf') {
      // 提取PDF文件内容
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      return data.text;
    } else if (ext === '.docx') {
      // 提取Word文档内容
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value;
    } else if (ext === '.doc') {
      // .doc文件较难处理，返回提示信息
      return '[提示：系统暂时无法直接解析.doc格式文件，请将文件转换为.docx或.pdf格式后重新上传]';
    } else {
      throw new Error(`不支持的文件格式: ${ext}`);
    }
  } catch (error) {
    console.error('提取文件内容失败:', error);
    throw new Error(`文件解析失败: ${error.message}`);
  }
}

// AI生成作业评语（支持文本和文件）
app.post('/api/homework/ai-generate-comment', async (req, res) => {
  const { homework_id, submission_id, homework_title, homework_content, student_submit_content, score, use_file } = req.body;
  
  try {
    // 验证必要参数
    if (!homework_title) {
      return res.status(400).json({ code: 400, message: '作业标题不能为空' });
    }

    let studentContent = student_submit_content || '';
    
    // 如果指定使用文件，从文件提取内容
    if (use_file && submission_id) {
      try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute(
          `SELECT submit_file FROM student_homework WHERE id = ?`,
          [submission_id]
        );
        await connection.end();
        
        if (rows.length > 0 && rows[0].submit_file) {
          const fileName = rows[0].submit_file;
          const filePath = path.join(uploadsDir, fileName);
          
          if (fs.existsSync(filePath)) {
            const fileContent = await extractFileContent(filePath, fileName);
            studentContent = fileContent;
            console.log(`成功从文件提取内容: ${fileName}`);
          } else {
            return res.status(404).json({ code: 404, message: '文件不存在，无法提取内容' });
          }
        } else {
          return res.status(400).json({ code: 400, message: '学生未上传文件' });
        }
      } catch (fileError) {
        console.error('处理文件时出错:', fileError);
        return res.status(500).json({ code: 500, message: `文件处理失败: ${fileError.message}` });
      }
    }
    
    // 验证：至少要有文本内容或文件内容
    if (!studentContent || studentContent.trim().length === 0) {
      return res.status(400).json({ code: 400, message: '学生提交内容为空，无法生成评语' });
    }

    // 构建提示词
    let userContent = `【作业题目】\n${homework_title}\n\n`;
    
    if (homework_content) {
      userContent += `【作业要求/内容】\n${homework_content}\n\n`;
    }
    
    userContent += `【学生答案】\n${studentContent}\n`;
    
    if (score !== null && score !== undefined) {
      userContent += `\n【已评分】\n${score}分（满分100分）`;
    }

    // 调用Qwen API生成评分和评语
    const completion = await openai.chat.completions.create({
      model: "qwen-flash",
      messages: [
        { 
          role: "system", 
          content: `你是一位经验丰富的教师。你需要根据作业题目评估学生的答案，并给出分数（0-100分）和详细评语。

请以JSON格式返回结果，格式如下：
{
  "score": 85,
  "comment": "总体评价：学生的答案基本正确，但在某些方面还有改进空间...（200-400字的详细评语，包括：1) 总体评价，2) 各维度分析（准确性、完整性、逻辑性等），3) 详细的优点和不足，4) 改进建议）"
}

要求：
1. score必须是0-100之间的整数
2. comment应当是专业、客观、具有建设性的评语，字数控制在200-400字之间
3. 必须严格返回有效的JSON格式，不要包含任何其他文字`
        },
        { 
          role: "user", 
          content: userContent
        }
      ],
      temperature: 0.7,
      max_tokens: 1500,
      response_format: { type: "json_object" }
    });

    // 提取AI生成的内容
    const aiResponse = completion?.choices?.[0]?.message?.content || '';
    
    if (!aiResponse) {
      return res.status(500).json({ code: 500, message: 'AI生成评分失败，返回内容为空' });
    }

    // 解析JSON响应
    let result;
    try {
      // 尝试直接解析JSON
      result = JSON.parse(aiResponse);
    } catch (parseError) {
      // 如果直接解析失败，尝试提取JSON部分（可能AI返回了额外的文本）
      try {
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          result = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('未找到JSON格式内容');
        }
      } catch (extractError) {
        console.error('解析AI响应JSON失败:', parseError, '原始内容:', aiResponse);
        return res.status(500).json({ code: 500, message: 'AI返回格式错误，无法解析JSON。请检查AI服务配置。' });
      }
    }

    // 验证和提取分数和评语
    const aiScore = parseInt(result.score);
    const aiComment = result.comment || '';

    // 验证分数范围
    if (isNaN(aiScore) || aiScore < 0 || aiScore > 100) {
      console.error('AI返回的分数无效:', aiScore);
      return res.status(500).json({ code: 500, message: 'AI返回的分数格式不正确（应为0-100的整数）' });
    }

    if (!aiComment || aiComment.trim().length === 0) {
      return res.status(500).json({ code: 500, message: 'AI生成的评语为空' });
    }

    res.json({ 
      code: 200, 
      message: 'AI评分和评语生成成功',
      data: { 
        score: aiScore,
        comment: aiComment.trim()
      }
    });

  } catch (error) {
    console.error('AI生成评分和评语失败：', error);
    
    // 处理OpenAI SDK的错误
    let errorMessage = 'AI服务异常，请稍后重试';
    
    if (error.response) {
      // API返回的错误（OpenAI SDK的错误结构）
      errorMessage = error.response.data?.error?.message || error.message || errorMessage;
    } else if (error.message) {
      // 其他错误（如网络错误、API Key错误等）
      errorMessage = error.message;
    }
    
    return res.status(500).json({ 
      code: 500, 
      message: errorMessage
    });
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

    // 1. 获取该课程的所有作业ID
    const [homeworks] = await connection.execute(
      'SELECT id FROM homework WHERE course_id = ?',
      [id]
    );
    
    // 2. 删除学生作业记录（如果有作业）
    if (homeworks.length > 0) {
      const homeworkIds = homeworks.map(h => h.id);
      const placeholders = homeworkIds.map(() => '?').join(',');
      await connection.execute(
        `DELETE FROM student_homework WHERE homework_id IN (${placeholders})`,
        homeworkIds
      );
    }

    // 3. 删除作业记录
    await connection.execute(
      'DELETE FROM homework WHERE course_id = ?',
      [id]
    );

    // 4. 删除选课记录
    await connection.execute(
      'DELETE FROM student_course WHERE courseid = ?',
      [id]
    );

    // 5. 删除课程记录
    await connection.execute(
      'DELETE FROM course WHERE id = ?',
      [id]
    );

    // 6. 更新教师的courses字段
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
    res.status(500).json({ code: 500, message: `服务器内部错误：${error.message}` });
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

// 计算并返回课程中所有学生的平时成绩（不更新数据库，仅计算）
app.post('/api/course/grades/calculate-regular', async (req, res) => {
  const { course_id } = req.body;
  
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    
    // 1. 获取该课程作业总数
    const [hwCountRows] = await connection.execute(
      'SELECT COUNT(*) as count FROM homework WHERE course_id = ?',
      [course_id]
    );
    const hwCount = hwCountRows[0].count;
    
    // 2. 获取所有学生列表
    const [students] = await connection.execute(
      'SELECT studentaccount FROM student_course WHERE courseid = ?',
      [course_id]
    );
    
    const regularScores = {};
    
    for (const stu of students) {
      let regularScore = 0;
      
      if (hwCount === 0) {
        regularScore = 100;
      } else {
        const [scoreRows] = await connection.execute(
          `SELECT SUM(IFNULL(score, 0)) as total_score
           FROM student_homework sh
           JOIN homework h ON sh.homework_id = h.id
           WHERE sh.student_id = ? AND h.course_id = ?`,
          [stu.studentaccount, course_id]
        );
        
        const totalScore = parseFloat(scoreRows[0].total_score || 0);
        regularScore = totalScore / hwCount;
      }
      
      regularScores[stu.studentaccount] = parseFloat(regularScore.toFixed(2));
    }
    
    await connection.end();
    res.json({ code: 200, data: regularScores });
    
  } catch (error) {
    console.error('计算平时成绩失败：', error);
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
    
    // Get course info for testratio
    const [courseRows] = await connection.execute(
      'SELECT testratio FROM course WHERE id = ?',
      [id]
    );
    const testRatio = courseRows.length > 0 ? (courseRows[0].testratio || 0) : 0;

    const [rows] = await connection.execute(
      `SELECT s.name, s.account, sc.score, sc.exam_score, sc.regular_score
       FROM student_course sc
       JOIN student s ON sc.studentaccount = s.account
       WHERE sc.courseid = ?
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
            count: rows.length,
            testRatio: testRatio / 100 // Return as decimal
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

    // 2. 获取该院系所有学生的加权平均分和综合学分
    const [rows] = await connection.execute(`
      SELECT 
        s.account,
        SUM(sc.score * c.credit) / SUM(c.credit) as weighted_avg,
        SUM( (CASE WHEN sc.score >= 60 THEN (sc.score - 60)/8.0 ELSE 0 END) * c.credit ) / SUM(c.credit) as comp_credit
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
      const comprehensiveCredit = parseFloat(row.comp_credit || 0);
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
        comprehensiveCredit: myData ? myData.comprehensiveCredit.toFixed(4) : '0.0000',
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