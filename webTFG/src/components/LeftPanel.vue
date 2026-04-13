<template>
  <div class="left-panel">
    <div class="section">
      <h2 class="section-title">RESUMEN</h2>
      <div v-if="loadingStats" class="loading-block">
        <div class="skeleton" v-for="i in 4" :key="i"></div>
      </div>
      <div class="stats-grid" v-else>
        <div class="stat-card" v-for="stat in stats" :key="stat.label">
          <div class="stat-icon" :style="{ background: stat.bg }"><span v-html="stat.icon"></span></div>
          <div class="stat-info">
            <span class="stat-value">{{ stat.value }}</span>
            <span class="stat-label">{{ stat.label }}</span>
          </div>
          <div class="stat-trend" :class="stat.up ? 'up' : 'down'">{{ stat.up ? '↑' : '↓' }} {{ stat.trend }}</div>
        </div>
      </div>
    </div>

    <div class="divider"></div>

    <div class="section flex-grow">
      <div class="section-header">
        <h2 class="section-title">MIEMBROS RECIENTES</h2>
      </div>
      <div v-if="loadingMembers" class="loading-block">
        <div class="skeleton tall" v-for="i in 5" :key="i"></div>
      </div>
      <div class="members-list" v-else>
        <!-- ↓ @click abre el modal de perfil -->
        <div class="member-row" v-for="m in members" :key="m.id" @click="abrirPerfil(m.id)">
          <div class="member-avatar" :style="{ background: avatarColor(m.nombre) }">
            {{ initials(m.nombre) }}
          </div>
          <div class="member-info">
            <span class="member-name">{{ m.nombre }}</span>
            <span class="member-plan">{{ m.plan }}</span>
          </div>
          <div class="member-badge" :class="m.status">
            {{ m.status === 'active' ? 'Activo' : 'Vence pronto' }}
          </div>
        </div>
        <p v-if="members.length === 0" class="empty-msg">Sin miembros registrados</p>
      </div>
    </div>

    <div class="divider"></div>

    <div class="section">
      <h2 class="section-title">OCUPACIÓN ACTUAL</h2>
      <div v-if="loadingOcupacion" class="skeleton" style="height:20px;margin-bottom:8px"></div>
      <template v-else>
        <div class="capacity-bar-wrap">
          <div class="capacity-bar">
            <div class="capacity-fill" :style="{ width: ocupacion.porcentaje + '%' }"></div>
          </div>
          <span class="capacity-value">{{ ocupacion.porcentaje }}%</span>
        </div>
        <p class="capacity-text">{{ ocupacion.dentro }} / {{ ocupacion.aforoMax }} personas dentro ahora</p>
      </template>
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
watch(refreshKey, () => { fetchStats(); fetchMembers(); fetchOcupacion() })

// ── Perfil modal ──────────────────────────────────────────
const perfilId = ref(null)
function abrirPerfil(id) { perfilId.value = id }

// ── Data ──────────────────────────────────────────────────
const loadingStats     = ref(true)
const loadingMembers   = ref(true)
const loadingOcupacion = ref(true)
const stats            = ref([])
const members          = ref([])
const ocupacion        = ref({ porcentaje: 0, dentro: 0, aforoMax: 100 })

const COLORS = ['linear-gradient(135deg,#ff5c00,#ff8c00)','linear-gradient(135deg,#6644ff,#9966ff)','linear-gradient(135deg,#00b4d8,#0077b6)','linear-gradient(135deg,#00e676,#00b248)','linear-gradient(135deg,#ff4060,#cc1040)','linear-gradient(135deg,#f7b731,#fc5c65)']
function avatarColor(nombre) { let h = 0; for (const c of nombre) h += c.charCodeAt(0); return COLORS[h % COLORS.length] }
function initials(nombre)    { const p = nombre.trim().split(' '); return ((p[0]?.[0] ?? '') + (p[1]?.[0] ?? '')).toUpperCase() }

async function fetchStats() {
  loadingStats.value = true
  try {
    const { data } = await api.get('/dashboard/stats')
    stats.value = [
      { label: 'Socios totales',   value: data.totalClientes.toLocaleString('es'), trend: '', up: true,  bg: 'rgba(255,92,0,0.15)',    icon: '👥' },
      { label: 'Ingresos del mes', value: '€' + Number(data.ingresosMes).toLocaleString('es'), trend: '', up: true, bg: 'rgba(0,230,118,0.12)', icon: '💰' },
      { label: 'Vencen hoy',       value: String(data.vencenHoy), trend: '', up: false, bg: 'rgba(255,60,60,0.12)',   icon: '⏰' },
      { label: 'Altas este mes',   value: String(data.altasMes),  trend: '', up: true,  bg: 'rgba(100,100,255,0.12)', icon: '⚡' },
    ]
  } catch (e) { console.error(e) } finally { loadingStats.value = false }
}

async function fetchMembers() {
  loadingMembers.value = true
  try { const { data } = await api.get('/dashboard/miembros-recientes'); members.value = data }
  catch (e) { console.error(e) } finally { loadingMembers.value = false }
}

async function fetchOcupacion() {
  loadingOcupacion.value = true
  try { const { data } = await api.get('/dashboard/ocupacion'); ocupacion.value = data }
  catch (e) { console.error(e) } finally { loadingOcupacion.value = false }
}

onMounted(() => { fetchStats(); fetchMembers(); fetchOcupacion() })
</script>

<style scoped>
.left-panel { background: #111114; border-right: 1px solid #1e1e24; display: flex; flex-direction: column; overflow-y: auto; scrollbar-width: thin; scrollbar-color: #2a2a35 transparent; }
.section { padding: 20px 20px 16px; }
.flex-grow { flex: 1; }
.section-title { font-family: 'Bebas Neue', sans-serif; font-size: 13px; letter-spacing: 2.5px; color: #44445a; margin: 0 0 14px; }
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
.divider { height: 1px; background: #1e1e24; margin: 0 20px; }
.loading-block { display: flex; flex-direction: column; gap: 10px; }
.skeleton { height: 54px; background: linear-gradient(90deg,#16161c 25%,#1e1e2a 50%,#16161c 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; border-radius: 10px; }
.skeleton.tall { height: 44px; }
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
.empty-msg { color: #44445a; font-size: 12px; text-align: center; margin: 12px 0 0; }
.stats-grid { display: flex; flex-direction: column; gap: 10px; }
.stat-card { display: flex; align-items: center; gap: 12px; padding: 10px 12px; background: #16161c; border-radius: 10px; border: 1px solid #1e1e2a; transition: border-color 0.2s; }
.stat-card:hover { border-color: #2e2e3e; }
.stat-icon { width: 34px; height: 34px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 15px; flex-shrink: 0; }
.stat-info { display: flex; flex-direction: column; gap: 1px; flex: 1; }
.stat-value { font-size: 16px; font-weight: 600; color: #e8e8ee; line-height: 1.2; }
.stat-label { font-size: 11px; color: #55556a; font-weight: 400; }
.stat-trend { font-size: 11px; font-weight: 600; padding: 2px 7px; border-radius: 4px; }
.stat-trend.up   { background: rgba(0,230,118,0.1); color: #00e676; }
.stat-trend.down { background: rgba(255,60,60,0.1);  color: #ff4060; }
.members-list { display: flex; flex-direction: column; gap: 8px; }
.member-row { display: flex; align-items: center; gap: 10px; padding: 9px 10px; border-radius: 10px; transition: background 0.2s; cursor: pointer; }
.member-row:hover { background: #16161c; }
.member-avatar { width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-family: 'Bebas Neue', sans-serif; font-size: 13px; color: #fff; flex-shrink: 0; }
.member-info { display: flex; flex-direction: column; flex: 1; min-width: 0; }
.member-name { font-size: 13px; font-weight: 500; color: #d8d8e8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.member-plan { font-size: 11px; color: #44445a; }
.member-badge { font-size: 10px; font-weight: 600; padding: 3px 8px; border-radius: 20px; white-space: nowrap; flex-shrink: 0; }
.member-badge.active  { background: rgba(0,230,118,0.1); color: #00e676; }
.member-badge.warning { background: rgba(255,160,0,0.1); color: #ffa000; }
.capacity-bar-wrap { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
.capacity-bar { flex: 1; height: 6px; background: #1e1e2a; border-radius: 10px; overflow: hidden; }
.capacity-fill { height: 100%; background: linear-gradient(90deg,#ff5c00,#ffa000); border-radius: 10px; transition: width 1s ease; }
.capacity-value { font-size: 13px; font-weight: 600; color: #ff5c00; }
.capacity-text { margin: 0; font-size: 11px; color: #44445a; }
</style>