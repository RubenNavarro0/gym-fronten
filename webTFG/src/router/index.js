import { createRouter, createWebHistory } from 'vue-router'
import Login     from '../views/Login.vue'
import Dashboard from '../views/dashboard/Dashboard.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'Login',
      component: Login
    },
    {
      path: '/dashboard',
      name: 'Dashboard',
      component: Dashboard,
      meta: { requiresAuth: true }
    }
  ],
})

router.beforeEach((to, _from, next) => {
  let sesionValida = false
  try {
    const raw = localStorage.getItem('usuario')
    if (raw) {
      const usuario = JSON.parse(raw)
      // Solo válido si tiene id_trabajador numérico > 0
      sesionValida = typeof usuario.id_trabajador === 'number' && usuario.id_trabajador > 0
    }
  } catch {
    localStorage.removeItem('usuario')
  }

  if (to.meta.requiresAuth && !sesionValida) {
    next({ name: 'Login' })
  } else if (to.name === 'Login' && sesionValida) {
    next({ name: 'Dashboard' })
  } else {
    next()
  }
})

export default router