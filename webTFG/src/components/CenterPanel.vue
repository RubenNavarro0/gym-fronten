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
.center-panel { background: #0d0d10; display: flex; flex-direction: column; overflow: hidden; border-left: 1px solid #1e1e24; border-right: 1px solid #1e1e24; position: relative; }
.panel-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 24px; border-bottom: 1px solid #1e1e24; flex-shrink: 0; }
.tabs { display: flex; gap: 4px; }
.tab { background: none; border: none; padding: 7px 16px; border-radius: 8px; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500; color: #44445a; cursor: pointer; transition: all 0.2s; }
.tab.active { background: rgba(255,92,0,0.15); color: #ff5c00; }
.tab:hover:not(.active) { color: #8888a0; }
.header-actions { display: flex; gap: 10px; align-items: center; }
.search-input { background: #16161c; border: 1px solid #1e1e2a; border-radius: 8px; padding: 7px 14px; color: #c0c0d0; font-size: 13px; font-family: 'DM Sans', sans-serif; outline: none; width: 180px; transition: border-color 0.2s; }
.search-input::placeholder { color: #33334a; }
.search-input:focus { border-color: #ff5c00; }
.btn-add { background: #ff5c00; border: none; border-radius: 8px; padding: 7px 16px; color: #fff; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600; cursor: pointer; transition: background 0.2s, transform 0.1s; }
.btn-add:hover { background: #ff7722; transform: translateY(-1px); }
.search-results { position: absolute; top: 72px; right: 24px; width: 300px; background: #16161c; border: 1px solid #2a2a35; border-radius: 10px; z-index: 50; box-shadow: 0 12px 40px rgba(0,0,0,0.5); overflow: hidden; }
.search-result-row { display: flex; align-items: center; gap: 10px; padding: 10px 14px; cursor: pointer; transition: background 0.15s; }
.search-result-row:hover { background: #1e1e2a; }
.sr-avatar { width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-family: 'Bebas Neue', sans-serif; font-size: 12px; color: #fff; flex-shrink: 0; }
.sr-info { display: flex; flex-direction: column; gap: 1px; flex: 1; }
.sr-name { font-size: 13px; font-weight: 500; color: #d8d8e8; }
.sr-sub  { font-size: 11px; color: #44445a; }
.sr-arrow { color: #33334a; font-size: 14px; }
.search-result-row:hover .sr-arrow { color: #ff5c00; }
.tab-content { flex: 1; overflow-y: auto; padding: 20px 24px; scrollbar-width: thin; scrollbar-color: #2a2a35 transparent; }
.skeleton-row { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 12px; margin-bottom: 24px; }
.skeleton-col { display: flex; flex-direction: column; gap: 8px; }
.skeleton { background: linear-gradient(90deg,#16161c 25%,#1e1e2a 50%,#16161c 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; border-radius: 10px; }
.h80 { height: 80px; } .h40 { height: 40px; }
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
.cuotas-summary { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 12px; margin-bottom: 24px; }
.summary-card { background: #16161c; border: 1px solid #1e1e2a; border-radius: 12px; padding: 16px; display: flex; flex-direction: column; gap: 4px; }
.summary-card.highlight { border-color: rgba(255,92,0,0.3); background: linear-gradient(135deg,rgba(255,92,0,0.08),rgba(255,140,0,0.04)); }
.summary-num { font-family: 'Bebas Neue', sans-serif; font-size: 26px; letter-spacing: 1px; color: #ffffff; line-height: 1; }
.accent-green { color: #00e676 !important; } .accent-red { color: #ff4060 !important; } .accent-orange { color: #ffa000 !important; }
.summary-label { font-size: 11px; color: #44445a; }
.mini-bar { height: 3px; background: #1e1e2a; border-radius: 10px; margin-top: 6px; }
.mini-fill { height: 100%; background: linear-gradient(90deg,#ff5c00,#ffa000); border-radius: 10px; }
.chart-section { margin-bottom: 24px; }
.chart-title { font-family: 'Bebas Neue', sans-serif; font-size: 12px; letter-spacing: 2px; color: #33334a; margin: 0 0 14px; }
.bar-chart { display: flex; align-items: flex-end; gap: 10px; height: 100px; }
.bar-group { flex: 1; display: flex; flex-direction: column; align-items: center; height: 100%; gap: 6px; }
.bar-wrap { flex: 1; width: 100%; display: flex; align-items: flex-end; background: #16161c; border-radius: 6px; overflow: hidden; }
.bar-fill { width: 100%; border-radius: 6px; transition: height 0.8s cubic-bezier(0.34,1.56,0.64,1); }
.bar-label { font-size: 10px; color: #44445a; letter-spacing: 0.5px; }
.data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.data-table thead tr th { text-align: left; padding: 8px 12px; font-size: 10px; font-weight: 600; letter-spacing: 1.5px; color: #33334a; text-transform: uppercase; border-bottom: 1px solid #1e1e24; }
.data-table tbody tr { border-bottom: 1px solid #16161c; transition: background 0.15s; cursor: pointer; }
.data-table tbody tr:hover { background: #16161c; }
.data-table tbody tr td { padding: 10px 12px; color: #b0b0c0; }
.td-user { display: flex; align-items: center; gap: 10px; color: #d8d8e8; font-weight: 500; }
.td-avatar { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-family: 'Bebas Neue', sans-serif; font-size: 11px; color: #fff; flex-shrink: 0; }
.plan-tag { background: #1e1e2a; padding: 2px 8px; border-radius: 4px; font-size: 11px; color: #7777aa; }
.td-amount { color: #e8e8ee; font-weight: 600; } .td-date { color: #55556a; font-size: 12px; }
.empty-cell { text-align: center; color: #33334a; padding: 24px !important; }
.status-pill { padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
.status-pill.paid    { background: rgba(0,230,118,0.1); color: #00e676; }
.status-pill.pending { background: rgba(255,160,0,0.1); color: #ffa000; }
.status-pill.overdue { background: rgba(255,60,60,0.1);  color: #ff4060; }
.info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 24px; }
.info-card { background: #16161c; border: 1px solid #1e1e2a; border-radius: 12px; padding: 18px; }
.info-icon { font-size: 22px; margin-bottom: 8px; }
.info-title { font-size: 13px; font-weight: 600; color: #d8d8e8; margin: 0 0 6px; }
.info-body  { font-size: 12px; color: #55556a; margin: 0; line-height: 1.5; }
.schedule-grid { display: flex; flex-direction: column; gap: 10px; }
.class-card { display: flex; align-items: center; gap: 16px; padding: 14px 16px; background: #16161c; border: 1px solid #1e1e2a; border-radius: 12px; cursor: pointer; transition: all 0.2s; }
.class-card:hover { border-color: rgba(255,92,0,0.3); background: rgba(255,92,0,0.05); }
.class-time { font-family: 'Bebas Neue', sans-serif; font-size: 18px; color: #ff5c00; letter-spacing: 1px; width: 48px; flex-shrink: 0; }
.class-info { display: flex; flex-direction: column; gap: 2px; flex: 1; }
.class-name { font-size: 14px; font-weight: 600; color: #e8e8ee; }
.class-trainer { font-size: 12px; color: #55556a; }
.class-spots { font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 8px; background: rgba(0,230,118,0.1); color: #00e676; }
.class-spots.full { background: rgba(255,60,60,0.1); color: #ff4060; }
</style>