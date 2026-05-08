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
@import './LeftPanel.css';
</style>