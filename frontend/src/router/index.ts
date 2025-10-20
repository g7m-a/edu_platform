import { createRouter, createWebHistory } from 'vue-router';
import Entry from '../Entry.vue';
import Login from '../Login.vue';
import Register from '../Register.vue';
import HomePage from '../HomePage.vue';

const routes = [
  { path: '/', redirect: '/Entry' },
  { path: '/Entry', component: Entry },
  { path: '/login', component: Login },
  { path: '/register', component: Register },
  { path: '/HomePage', component: HomePage }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
