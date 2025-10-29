import { createRouter, createWebHistory } from 'vue-router';
import Entry from '../Entry.vue';
import StudentLogin from '../StudentLogin.vue';
import StudentRegister from '../StudentRegister.vue';
import TeacherLogin from '../TeacherLogin.vue';
import TeacherRegister from '../TeacherRegister.vue';
import TeacherHomePage from '../TeacherHomePage.vue';
import StudentHomePage from '../StudentHomePage.vue';

const routes = [
  { path: '/', redirect: '/Entry' },
  { path: '/Entry', component: Entry },
  { path: '/student-login', component: StudentLogin },
  { path: '/student-register', component: StudentRegister },
  { path: '/teacher-login', component: TeacherLogin },
  { path: '/teacher-register', component: TeacherRegister },
  { path: '/StudentHomePage', component: StudentHomePage },
  { path: '/TeacherHomePage', component: TeacherHomePage }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
