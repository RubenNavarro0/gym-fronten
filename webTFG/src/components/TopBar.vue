<template>
  <div class="topbar">

    <!-- Left: trabajador desde localStorage -->
    <div class="left">
      <div class="avatar">
        <span class="avatar-initials">{{ initials }}</span>
        <div class="avatar-status"></div>
      </div>
      <div class="user-info">
        <span class="user-label">{{ rolLabel }}</span>
        <span class="user-name">{{ nombreUsuario }}</span>
      </div>
    </div>

    <!-- Center: nombre del gym desde la BD -->
    <div class="center">
      <div class="gym-logo">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M6 4h2v16H6V4zM16 4h2v16h-2V4zM2 9h4v6H2V9zM18 9h4v6h-4V9zM10 10h4v4h-4v-4z" fill="#ff5c00"/>
        </svg>
      </div>
      <div class="gym-name-block">
        <div v-if="loadingGym" class="skeleton-name"></div>
        <h1 v-else class="gym-name">
          {{ gymWords[0] ?? '—' }}
          <span v-if="gymWords[1]" class="gym-sub"> {{ gymWords[1] }}</span>
          <template v-for="w in gymWords.slice(2)" :key="w"> {{ w }}</template>
        </h1>
        <span class="gym-city" v-if="!loadingGym && gymInfo.ciudad">{{ gymInfo.ciudad }}</span>
      </div>
    </div>

    <!-- Right: reloj + activos + logout -->
    <div class="right">
      <div class="time-block">
        <span class="time">{{ clock }}</span>
        <span class="date">{{ dateStr }}</span>
      </div>

      <div class="active-badge">
        <span class="badge-dot"></span>
        <span class="badge-text">
          {{ loadingGym ? '—' : gymInfo.activosHoy }} activos ahora
        </span>
      </div>

      <button class="logout-btn" @click="logout">Cerrar sesión</button>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '../api/api.js'

const router  = useRouter()
const usuario = ref(JSON.parse(localStorage.getItem('usuario') || '{}'))

const nombreUsuario = computed(() => usuario.value.nombre || 'Trabajador')

// Muestra el rol en mayúsculas (ej. "RECEPCIONISTA", "ENTRENADOR")
const rolLabel = computed(() => (usuario.value.rol || 'TRABAJADOR').toUpperCase())

const initials = computed(() => {
  const parts = nombreUsuario.value.trim().split(' ')
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase()
})

function logout() {
  localStorage.removeItem('usuario')
  router.push('/')
}

// ── Gym desde BD ──────────────────────────────────────────
const loadingGym = ref(true)
const gymInfo    = ref({ nombre: '', ciudad: '', activosHoy: 0 })
const gymWords   = computed(() => gymInfo.value.nombre.trim().split(' ').filter(Boolean))

async function fetchGym() {
  try {
    const { data } = await api.get('/gym/info')
    gymInfo.value = data
  } catch {
    gymInfo.value = { nombre: 'MI GYM', ciudad: '', activosHoy: 0 }
  } finally {
    loadingGym.value = false
  }
}

let gymRefreshTimer = null
async function refreshActivos() {
  try {
    const { data } = await api.get('/gym/info')
    gymInfo.value.activosHoy = data.activosHoy
  } catch { /* silencioso */ }
}

// ── Reloj ─────────────────────────────────────────────────
const clock   = ref('00:00:00')
const dateStr = ref('—')
const DAYS    = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado']
const MONTHS  = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

function updateClock() {
  const now = new Date()
  clock.value = [now.getHours(), now.getMinutes(), now.getSeconds()]
    .map(n => String(n).padStart(2, '0')).join(':')
  dateStr.value = `${DAYS[now.getDay()]}, ${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear()}`
}

let clockTimer = null

onMounted(() => {
  fetchGym()
  updateClock()
  clockTimer      = setInterval(updateClock,    1_000)
  gymRefreshTimer = setInterval(refreshActivos, 60_000)
})

onUnmounted(() => {
  clearInterval(clockTimer)
  clearInterval(gymRefreshTimer)
})
</script>

<style scoped>
.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 28px;
  height: 72px;
  background: #111114;
  border-bottom: 1px solid #1e1e24;
  position: relative;
  z-index: 10;
  flex-shrink: 0;
}
.topbar::after {
  content: '';
  position: absolute;
  bottom: 0; left: 0; right: 0; height: 1px;
  background: linear-gradient(90deg, transparent, #ff5c00 30%, #ff5c00 70%, transparent);
  opacity: 0.4;
}

.left { display: flex; align-items: center; gap: 14px; }
.avatar {
  position: relative;
  width: 44px; height: 44px; border-radius: 50%;
  background: linear-gradient(135deg,#ff5c00,#ff8c00);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.avatar-initials {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 16px; color: #fff; letter-spacing: 1px;
}
.avatar-status {
  position: absolute; bottom: 1px; right: 1px;
  width: 10px; height: 10px; border-radius: 50%;
  background: #00e676; border: 2px solid #111114;
}
.user-info  { display: flex; flex-direction: column; gap: 2px; }
.user-label { font-size: 10px; font-weight: 600; letter-spacing: 1.5px; color: #ff5c00; text-transform: uppercase; }
.user-name  { font-size: 14px; font-weight: 500; color: #e8e8ee; }

.center {
  display: flex; align-items: center; gap: 12px;
  position: absolute; left: 50%; transform: translateX(-50%);
}
.gym-logo {
  width: 36px; height: 36px; border-radius: 8px;
  background: rgba(255,92,0,0.12);
  border: 1px solid rgba(255,92,0,0.3);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.gym-name-block { display: flex; flex-direction: column; align-items: center; gap: 1px; }
.skeleton-name {
  width: 180px; height: 28px; border-radius: 6px;
  background: linear-gradient(90deg,#1e1e2a 25%,#2a2a35 50%,#1e1e2a 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}
@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
.gym-name {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 28px; letter-spacing: 4px; color: #ffffff; margin: 0; line-height: 1;
}
.gym-sub  { color: #ff5c00; }
.gym-city { font-size: 10px; color: #44445a; letter-spacing: 2px; text-transform: uppercase; }

.right { display: flex; align-items: center; gap: 16px; }
.time-block { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; }
.time {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 22px; letter-spacing: 2px; color: #ffffff; line-height: 1;
}
.date { font-size: 11px; color: #555566; letter-spacing: 0.5px; }

.active-badge {
  display: flex; align-items: center; gap: 7px;
  background: rgba(0,230,118,0.08);
  border: 1px solid rgba(0,230,118,0.2);
  border-radius: 20px; padding: 5px 12px;
}
.badge-dot {
  width: 7px; height: 7px; border-radius: 50%;
  background: #00e676; animation: pulse 2s infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: 0.5; transform: scale(0.8); }
}
.badge-text { font-size: 12px; font-weight: 500; color: #00e676; }

.logout-btn {
  background: rgba(255,60,60,0.1);
  border: 1px solid rgba(255,60,60,0.25);
  border-radius: 8px; padding: 7px 14px;
  color: #ff4060;
  font-family: 'DM Sans', sans-serif;
  font-size: 12px; font-weight: 600;
  cursor: pointer; transition: all 0.2s;
}
.logout-btn:hover {
  background: rgba(255,60,60,0.2);
  border-color: rgba(255,60,60,0.5);
}
</style>