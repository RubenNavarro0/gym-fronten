<template>
  <div class="center-panel">
    <div class="panel-header">
      <div class="tabs">
        <button class="tab" v-for="tab in tabs" :key="tab.id"
          :class="{ active: activeTab === tab.id }" @click="activeTab = tab.id">
          {{ tab.label }}
        </button>
      </div>
      <div class="header-actions">
        <input class="search-input" type="text" placeholder="Buscar socio..."
          v-model="searchQ" @input="onSearch" @blur="cerrarSearch" />
      </div>
    </div>

    <!-- Dropdown búsqueda → abre modal al clickar -->
    <div class="search-results" v-if="searchResults.length > 0">
      <div class="search-result-row" v-for="r in searchResults" :key="r.id_cliente"
        @mousedown.prevent @click="abrirPerfil(r.id_cliente)">
        <div class="sr-avatar" :style="{ background: avatarColor(r.nombre) }">{{ initials(r.nombre) }}</div>
        <div class="sr-info">
          <span class="sr-name">{{ r.nombre }}</span>
          <span class="sr-sub">{{ r.documento }} · {{ r.plan_activo ?? 'Sin plan' }}</span>
        </div>
        <span class="sr-arrow">→</span>
      </div>
    </div>

    <!-- TAB: Cuotas -->
    <div v-if="activeTab === 'cuotas'" class="tab-content">
      <div v-if="loadingResumen" class="skeleton-row">
        <div class="skeleton h80" v-for="i in 4" :key="i"></div>
      </div>
      <div class="cuotas-summary" v-else>
        <div class="summary-card highlight">
          <span class="summary-num">€{{ Number(resumen.facturado).toLocaleString('es') }}</span>
          <span class="summary-label">Facturado este mes</span>
          <div class="mini-bar"><div class="mini-fill" style="width:100%"></div></div>
        </div>
        <div class="summary-card">
          <span class="summary-num accent-green">€{{ Number(resumen.cobrado).toLocaleString('es') }}</span>
          <span class="summary-label">Cobrado</span>
        </div>
        <div class="summary-card">
          <span class="summary-num accent-red">€{{ Number(resumen.pendiente).toLocaleString('es') }}</span>
          <span class="summary-label">Pendiente</span>
        </div>
        <div class="summary-card">
          <span class="summary-num accent-orange">{{ resumen.vencidas }}</span>
          <span class="summary-label">Cuotas vencidas</span>
        </div>
      </div>

      <div class="chart-section">
        <h3 class="chart-title">INGRESOS MENSUALES</h3>
        <div class="bar-chart">
          <div class="bar-group" v-for="b in barData" :key="b.month">
            <div class="bar-wrap">
              <div class="bar-fill" :style="{ height: b.pct + '%', background: b.active ? 'linear-gradient(180deg,#ff8c00,#ff5c00)' : '#1e1e2a' }"></div>
            </div>
            <span class="bar-label">{{ b.month }}</span>
          </div>
        </div>
      </div>

      <div class="table-section">
        <h3 class="chart-title">SUSCRIPCIONES RECIENTES</h3>
        <div v-if="loadingCuotas" class="skeleton-col">
          <div class="skeleton h40" v-for="i in 5" :key="i"></div>
        </div>
        <table class="data-table" v-else>
          <thead>
            <tr><th>Socio</th><th>Plan</th><th>Monto</th><th>Vencimiento</th><th>Estado</th></tr>
          </thead>
          <tbody>
            <!-- ↓ @click abre perfil del cliente -->
            <tr v-for="q in cuotas" :key="q.id" @click="abrirPerfilPorSuscripcion(q)">
              <td>
                <div class="td-user">
                  <div class="td-avatar" :style="{ background: avatarColor(q.nombre) }">{{ initials(q.nombre) }}</div>
                  {{ q.nombre }}
                </div>
              </td>
              <td><span class="plan-tag">{{ q.plan }}</span></td>
              <td class="td-amount">€{{ Number(q.monto).toLocaleString('es') }}</td>
              <td class="td-date">{{ q.vence }}</td>
              <td><span class="status-pill" :class="estadoClass(q.estado)">{{ estadoLabel(q.estado) }}</span></td>
            </tr>
            <tr v-if="cuotas.length === 0">
              <td colspan="5" class="empty-cell">Sin registros</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- TAB: Info General -->
    <div v-if="activeTab === 'info'" class="tab-content info-tab">
      <div class="info-grid">
        <div class="info-card" v-for="info in infoCards" :key="info.title">
          <div class="info-icon">{{ info.icon }}</div>
          <h4 class="info-title">{{ info.title }}</h4>
          <p class="info-body">{{ info.body }}</p>
        </div>
      </div>
    </div>

    <!-- TAB: Clases -->
    <div v-if="activeTab === 'clases'" class="tab-content">
      <div class="schedule-grid">
        <div class="class-card" v-for="cls in classes" :key="cls.name + cls.time">
          <div class="class-time">{{ cls.time }}</div>
          <div class="class-info">
            <span class="class-name">{{ cls.name }}</span>
            <span class="class-trainer">con {{ cls.trainer }}</span>
          </div>
          <div class="class-spots" :class="{ full: cls.spots === 0 }">
            {{ cls.spots > 0 ? cls.spots + ' lugares' : 'LLENO' }}
          </div>
        </div>
      </div>
    </div>

    <!-- Modal perfil cliente -->
    <ClienteModal :id-cliente="perfilId" @close="perfilId = null" />
  </div>
</template>

<script setup>
import { ref, inject, watch, onMounted } from 'vue'
import api from '../api/api.js'
import ClienteModal from './Clientemodal.vue'

// ── Refresco global ───────────────────────────────────────
const refreshKey = inject('refreshKey')
watch(refreshKey, () => { fetchResumen(); fetchBars(); fetchCuotas() })

// ── Perfil modal ──────────────────────────────────────────
const perfilId = ref(null)

function abrirPerfil(id) {
  searchResults.value = []
  searchQ.value       = ''
  perfilId.value      = null          // reset para que el watch re-dispare aunque sea el mismo id
  setTimeout(() => { perfilId.value = id }, 0)
}

// Las filas de suscripciones solo tienen nombre, necesitamos buscar el id_cliente
async function abrirPerfilPorSuscripcion(q) {
  try {
    const { data } = await api.get('/cliente/buscar', { params: { q: q.nombre } })
    if (data.length > 0) abrirPerfil(data[0].id_cliente)
  } catch { /* silencioso */ }
}

const activeTab = ref('cuotas')
const tabs = [
  { id: 'cuotas', label: 'Cuotas' },
  { id: 'info',   label: 'Info General' },
  { id: 'clases', label: 'Clases' },
]

// ── Búsqueda ──────────────────────────────────────────────
const searchQ       = ref('')
const searchResults = ref([])
let   searchTimer   = null

function onSearch() {
  clearTimeout(searchTimer)
  if (searchQ.value.length < 2) { searchResults.value = []; return }
  searchTimer = setTimeout(async () => {
    try {
      const { data } = await api.get('/cliente/buscar', { params: { q: searchQ.value } })
      searchResults.value = data
    } catch { searchResults.value = [] }
  }, 300)
}

function cerrarSearch() {
  setTimeout(() => { searchResults.value = [] }, 150)
}

// ── Cuotas ────────────────────────────────────────────────
const loadingResumen = ref(true)
const loadingBars    = ref(true)
const loadingCuotas  = ref(true)
const resumen        = ref({ facturado: 0, cobrado: 0, pendiente: 0, vencidas: 0 })
const barData        = ref([])
const cuotas         = ref([])

function estadoClass(e) { return { activa: 'paid', inactiva: 'pending', vencida: 'overdue' }[e] ?? 'pending' }
function estadoLabel(e) { return { activa: 'Activa', inactiva: 'Inactiva', vencida: 'Vencida' }[e] ?? e }

async function fetchResumen() {
  loadingResumen.value = true
  try { const { data } = await api.get('/suscripcion/resumen'); resumen.value = data }
  catch (e) { console.error(e) } finally { loadingResumen.value = false }
}
async function fetchBars() {
  loadingBars.value = true
  try { const { data } = await api.get('/suscripcion/ingresos-mensuales'); barData.value = data }
  catch (e) { console.error(e) } finally { loadingBars.value = false }
}
async function fetchCuotas() {
  loadingCuotas.value = true
  try { const { data } = await api.get('/suscripcion/recientes'); cuotas.value = data }
  catch (e) { console.error(e) } finally { loadingCuotas.value = false }
}

// ── Helpers avatar ────────────────────────────────────────
const COLORS = ['linear-gradient(135deg,#ff5c00,#ff8c00)','linear-gradient(135deg,#6644ff,#9966ff)','linear-gradient(135deg,#00b4d8,#0077b6)','linear-gradient(135deg,#00e676,#00b248)','linear-gradient(135deg,#ff4060,#cc1040)']
function avatarColor(n) { let h = 0; for (const c of n) h += c.charCodeAt(0); return COLORS[h % COLORS.length] }
function initials(n)    { const p = n.trim().split(' '); return ((p[0]?.[0] ?? '') + (p[1]?.[0] ?? '')).toUpperCase() }

const infoCards = [
  { icon: '🏋️', title: 'Horarios',  body: 'Lun–Vie: 6:00–23:00  |  Sáb–Dom: 8:00–20:00' },
  { icon: '📍', title: 'Ubicación', body: 'Av. Libertad 1240, piso 2, Centro' },
  { icon: '📞', title: 'Contacto',  body: '+34 968 123 456  |  info@ironpeak.com' },
  { icon: '🌐', title: 'Web',       body: 'www.ironpeakgym.com' },
]
const classes = [
  { time: '07:00', name: 'Funcional', trainer: 'Lucas P.',    spots: 3  },
  { time: '08:30', name: 'Spinning',  trainer: 'María G.',    spots: 0  },
  { time: '10:00', name: 'Yoga',      trainer: 'Ana R.',      spots: 8  },
  { time: '12:00', name: 'Box',       trainer: 'Rodrigo V.',  spots: 2  },
  { time: '17:00', name: 'CrossFit',  trainer: 'Daniela M.',  spots: 5  },
  { time: '19:00', name: 'Zumba',     trainer: 'Carolina S.', spots: 12 },
  { time: '20:30', name: 'Funcional', trainer: 'Lucas P.',    spots: 1  },
]

onMounted(() => { fetchResumen(); fetchBars(); fetchCuotas() })
</script>

<style scoped>
@import './CenterPanel.css';
</style>