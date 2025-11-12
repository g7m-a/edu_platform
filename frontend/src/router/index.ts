import { createRouter, createWebHistory } from 'vue-router';
import Entry from '../Entry.vue';
import StudentLogin from '../StudentLogin.vue';
import StudentRegister from '../StudentRegister.vue';
import TeacherLogin from '../TeacherLogin.vue';
import TeacherRegister from '../TeacherRegister.vue';
import AdminLogin from '../AdminLogin.vue';
import TeacherHomePage from '../TeacherHomePage.vue';
import StudentHomePage from '../StudentHomePage.vue';
import AdminHomePage from '../AdminHomePage.vue';
import StudentManagePage from '../StudentManagePage.vue';
import TeacherManagePage from '../TeacherManagePage.vue';
import CourseManagePage from '../CourseManagePage.vue';
import CourseSeek from '../CourseSeek.vue';

const routes = [
  { path: '/', redirect: '/Entry' },
  { path: '/Entry', component: Entry },
  { path: '/student-login', component: StudentLogin },
  { path: '/student-register', component: StudentRegister },
  { path: '/teacher-login', component: TeacherLogin },
  { path: '/teacher-register', component: TeacherRegister },
  { path: '/admin-login', component: AdminLogin },
  { path: '/student-homepage', component: StudentHomePage },
  { path: '/teacher-homepage', component: TeacherHomePage },
  { path: '/admin-homepage', component: AdminHomePage },
  { path: '/teachermanage-page', component: TeacherManagePage },
  { path: '/studentmanage-page', component: StudentManagePage },
  { path: '/coursemanage-page', component: CourseManagePage },
  { path: '/course-seek', component: CourseSeek }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
