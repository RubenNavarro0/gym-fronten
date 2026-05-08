<template>
  <div class="topbar">

    <!-- Left: trabajador → click abre modal de perfil -->
    <div class="left clickable" @click="abrirPerfil">
      <div class="avatar">
        <span class="avatar-initials">{{ initials }}</span>
        <div class="avatar-status"></div>
      </div>
      <div class="user-info">
        <span class="user-label">{{ rolLabel }}</span>
        <span class="user-name">{{ nombreUsuario }}</span>
      </div>
      <span class="profile-hint">ver perfil →</span>
    </div>

    <!-- Center: nombre del gym desde BD -->
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
        <span class="badge-text">{{ loadingGym ? '—' : gymInfo.activosHoy }} activos ahora</span>
      </div>
      <button class="logout-btn" @click="logout">Cerrar sesión</button>
    </div>

  </div>

  <!-- Modal perfil trabajador -->
  <Teleport to="body">
    <div class="overlay" v-if="showPerfil" @click.self="showPerfil = false">
      <div class="modal-perfil">
        <button class="btn-close" @click="showPerfil = false">✕</button>

        <div class="profile-header">
          <div class="profile-avatar" :style="{ background: 'linear-gradient(135deg,#ff5c00,#ff8c00)' }">
            {{ initials }}
          </div>
          <div class="profile-info">
            <h2 class="profile-name">{{ nombreUsuario }}</h2>
            <span class="profile-rol">{{ rolLabel }}</span>
            <span class="profile-email">{{ usuario.email ?? '—' }}</span>
          </div>
        </div>

        <div class="divider"></div>

        <div class="p-section">
          <h3 class="p-section-title">DATOS DEL TRABAJADOR</h3>
          <div class="data-grid">
            <div class="data-item">
              <span class="data-label">Nombre</span>
              <span class="data-value">{{ nombreUsuario }}</span>
            </div>
            <div class="data-item">
              <span class="data-label">Rol</span>
              <span class="data-value">{{ rolLabel }}</span>
            </div>
            <div class="data-item">
              <span class="data-label">Email</span>
              <span class="data-value">{{ usuario.email ?? '—' }}</span>
            </div>
            <div class="data-item">
              <span class="data-label">ID trabajador</span>
              <span class="data-value">#{{ usuario.id_trabajador }}</span>
            </div>
          </div>
        </div>

        <div class="divider"></div>

        <div class="p-section">
          <h3 class="p-section-title">GYM ASIGNADO</h3>
          <div class="data-grid">
            <div class="data-item">
              <span class="data-label">Nombre</span>
              <span class="data-value">{{ gymInfo.nombre || '—' }}</span>
            </div>
            <div class="data-item">
              <span class="data-label">Ciudad</span>
              <span class="data-value">{{ gymInfo.ciudad || '—' }}</span>
            </div>
            <div class="data-item">
              <span class="data-label">Compañía</span>
              <span class="data-value">{{ gymInfo.compania || '—' }}</span>
            </div>
            <div class="data-item">
              <span class="data-label">Activos ahora</span>
              <span class="data-value accent-green">{{ gymInfo.activosHoy }}</span>
            </div>
          </div>
        </div>

        <div class="p-footer">
          <button class="btn-logout-modal" @click="logout">Cerrar sesión</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '../api/api.js'

const router     = useRouter()
const usuario    = ref(JSON.parse(localStorage.getItem('usuario') || '{}'))
const showPerfil = ref(false)

const nombreUsuario = computed(() => usuario.value.nombre || 'Trabajador')
const rolLabel      = computed(() => (usuario.value.rol || 'TRABAJADOR').toUpperCase())
const initials      = computed(() => {
  const p = nombreUsuario.value.trim().split(' ')
  return ((p[0]?.[0] ?? '') + (p[1]?.[0] ?? '')).toUpperCase()
})

function abrirPerfil() { showPerfil.value = true }
function logout()      { localStorage.removeItem('usuario'); router.push('/') }

// ── Gym desde BD ──────────────────────────────────────────
const loadingGym = ref(true)
const gymInfo    = ref({ nombre: '', ciudad: '', compania: '', activosHoy: 0 })
const gymWords   = computed(() => gymInfo.value.nombre.trim().split(' ').filter(Boolean))

async function fetchGym() {
  try { const { data } = await api.get('/gym/info'); gymInfo.value = data }
  catch { gymInfo.value = { nombre: 'MI GYM', ciudad: '', compania: '', activosHoy: 0 } }
  finally { loadingGym.value = false }
}

let gymTimer = null
async function refreshActivos() {
  try { const { data } = await api.get('/gym/info'); gymInfo.value.activosHoy = data.activosHoy }
  catch { /* silencioso */ }
}

// ── Reloj ─────────────────────────────────────────────────
const clock   = ref('00:00:00')
const dateStr = ref('—')
const DAYS    = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado']
const MONTHS  = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

function updateClock() {
  const now = new Date()
  clock.value   = [now.getHours(), now.getMinutes(), now.getSeconds()].map(n => String(n).padStart(2,'0')).join(':')
  dateStr.value = `${DAYS[now.getDay()]}, ${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear()}`
}

let clockTimer = null
onMounted(() => { fetchGym(); updateClock(); clockTimer = setInterval(updateClock, 1_000); gymTimer = setInterval(refreshActivos, 60_000) })
onUnmounted(() => { clearInterval(clockTimer); clearInterval(gymTimer) })
</script>

<style scoped>
@import './TopBar.css';
</style>