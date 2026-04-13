<template>
  <Teleport to="body">
    <div class="overlay" v-if="visible" @click.self="close">
      <div class="modal" :class="{ loaded: !loading }">

        <!-- Cierre -->
        <button class="btn-close" @click="close">✕</button>

        <!-- Cargando -->
        <div v-if="loading" class="loading-state">
          <div class="sk-avatar"></div>
          <div class="sk-lines">
            <div class="sk-line w60"></div>
            <div class="sk-line w40"></div>
            <div class="sk-line w80"></div>
          </div>
        </div>

        <!-- Error -->
        <div v-else-if="error" class="error-state">
          <span class="err-icon">⚠</span>
          <p>{{ error }}</p>
        </div>

        <!-- Contenido -->
        <template v-else-if="cliente">

          <!-- Header perfil -->
          <div class="profile-header">
            <div class="profile-avatar" :style="{ background: avatarColor(cliente.nombre) }">
              {{ initials(cliente.nombre) }}
            </div>
            <div class="profile-info">
              <h2 class="profile-name">{{ cliente.nombre }}</h2>
              <span class="profile-doc">{{ cliente.documento }}</span>
              <div class="profile-badges">
                <span class="badge-plan" v-if="suscripcionActiva">
                  {{ suscripcionActiva.plan }}
                </span>
                <span class="badge-estado activa"  v-if="suscripcionActiva?.estado === 'activa'">Activo</span>
                <span class="badge-estado inactiva" v-else-if="suscripcionActiva?.estado === 'inactiva'">Inactivo</span>
                <span class="badge-estado vencida"  v-else>Sin suscripción</span>
              </div>
            </div>
          </div>

          <div class="divider"></div>

          <!-- Datos de contacto -->
          <div class="section">
            <h3 class="section-title">DATOS DE CONTACTO</h3>
            <div class="data-grid">
              <div class="data-item">
                <span class="data-label">Email</span>
                <span class="data-value">{{ cliente.email ?? '—' }}</span>
              </div>
              <div class="data-item">
                <span class="data-label">Teléfono</span>
                <span class="data-value">{{ cliente.telefono ?? '—' }}</span>
              </div>
              <div class="data-item">
                <span class="data-label">Documento</span>
                <span class="data-value">{{ cliente.documento }}</span>
              </div>
              <div class="data-item">
                <span class="data-label">ID cliente</span>
                <span class="data-value">#{{ cliente.id_cliente }}</span>
              </div>
            </div>
          </div>

          <div class="divider"></div>

          <!-- Suscripción activa -->
          <div class="section" v-if="suscripcionActiva">
            <h3 class="section-title">SUSCRIPCIÓN ACTIVA</h3>
            <div class="sus-card">
              <div class="sus-top">
                <span class="sus-plan">{{ suscripcionActiva.plan }}</span>
                <span class="sus-precio">€{{ Number(suscripcionActiva.precio).toLocaleString('es') }}</span>
              </div>
              <div class="sus-data-row">
                <div class="sus-data">
                  <span class="sus-label">Inicio</span>
                  <span class="sus-val">{{ suscripcionActiva.fecha_inicio }}</span>
                </div>
                <div class="sus-data">
                  <span class="sus-label">Vencimiento</span>
                  <span class="sus-val">{{ suscripcionActiva.fecha_fin }}</span>
                </div>
                <div class="sus-data">
                  <span class="sus-label">Accesos restantes</span>
                  <span class="sus-val accent-orange">{{ suscripcionActiva.accesos }}</span>
                </div>
                <div class="sus-data">
                  <span class="sus-label">Días restantes</span>
                  <span class="sus-val" :class="suscripcionActiva.dias_restantes <= 7 ? 'accent-red' : 'accent-green'">
                    {{ suscripcionActiva.dias_restantes }}
                  </span>
                </div>
              </div>
              <!-- Barra de días restantes -->
              <div class="dias-bar">
                <div class="dias-fill" :style="{ width: pctDias + '%', background: colorDias }"></div>
              </div>
            </div>
          </div>

          <!-- Historial suscripciones -->
          <div class="section" v-if="historial.length > 0">
            <h3 class="section-title">HISTORIAL</h3>
            <div class="historial-list">
              <div class="historial-row" v-for="s in historial" :key="s.id">
                <div class="h-dot" :class="s.estado"></div>
                <div class="h-info">
                  <span class="h-plan">{{ s.plan }}</span>
                  <span class="h-dates">{{ s.fecha_inicio }} → {{ s.fecha_fin }}</span>
                </div>
                <span class="h-estado" :class="s.estado">{{ estadoLabel(s.estado) }}</span>
              </div>
            </div>
          </div>

        </template>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import api from '../api/api.js'

const props = defineProps({
  idCliente: { type: Number, default: null }
})
const emit = defineEmits(['close'])

const visible = ref(false)
const loading = ref(false)
const error   = ref('')
const cliente = ref(null)

// Abre cuando recibe un id
watch(() => props.idCliente, async (id) => {
  if (!id) return
  visible.value = true
  loading.value = true
  error.value   = ''
  cliente.value = null
  try {
    const { data } = await api.get(`/cliente/${id}`)
    cliente.value = data
  } catch (e) {
    error.value = e.response?.data?.message ?? 'Error cargando el perfil'
  } finally {
    loading.value = false
  }
})

function close() {
  visible.value = false
  cliente.value = null
  emit('close')
}

// Suscripción activa (la primera activa, o la más reciente si no hay)
const suscripcionActiva = computed(() => {
  if (!cliente.value?.suscripciones?.length) return null
  return cliente.value.suscripciones.find(s => s.estado === 'activa')
      ?? cliente.value.suscripciones[0]
})

// Historial: todas menos la activa
const historial = computed(() => {
  if (!cliente.value?.suscripciones) return []
  return cliente.value.suscripciones.filter(s => s !== suscripcionActiva.value)
})

// Porcentaje días restantes (asume plan de 30 días por defecto)
const pctDias = computed(() => {
  if (!suscripcionActiva.value) return 0
  const total = 30 // aproximación visual
  return Math.min(100, Math.round(suscripcionActiva.value.dias_restantes / total * 100))
})
const colorDias = computed(() => {
  const d = suscripcionActiva.value?.dias_restantes ?? 0
  if (d <= 3)  return '#ff4060'
  if (d <= 7)  return '#ffa000'
  return '#00e676'
})

function estadoLabel(e) {
  return { activa: 'Activa', inactiva: 'Inactiva', vencida: 'Vencida' }[e] ?? e
}

// Helpers avatar
const COLORS = [
  'linear-gradient(135deg,#ff5c00,#ff8c00)',
  'linear-gradient(135deg,#6644ff,#9966ff)',
  'linear-gradient(135deg,#00b4d8,#0077b6)',
  'linear-gradient(135deg,#00e676,#00b248)',
  'linear-gradient(135deg,#ff4060,#cc1040)',
  'linear-gradient(135deg,#f7b731,#fc5c65)',
]
function avatarColor(n) {
  let h = 0; for (const c of n) h += c.charCodeAt(0)
  return COLORS[h % COLORS.length]
}
function initials(n) {
  const p = n.trim().split(' ')
  return ((p[0]?.[0] ?? '') + (p[1]?.[0] ?? '')).toUpperCase()
}
</script>

<style scoped>
/* ── OVERLAY ──────────────────────────────────────────── */
.overlay {
  position: fixed; inset: 0; z-index: 2000;
  background: rgba(0,0,0,0.7);
  backdrop-filter: blur(6px);
  display: flex; align-items: center; justify-content: center;
  padding: 20px;
}

/* ── MODAL ────────────────────────────────────────────── */
.modal {
  position: relative;
  width: 480px; max-width: 100%;
  max-height: 90vh; overflow-y: auto;
  background: #111114;
  border: 1px solid #1e1e24;
  border-radius: 20px;
  box-shadow: 0 40px 100px rgba(0,0,0,0.7);
  scrollbar-width: thin;
  scrollbar-color: #2a2a35 transparent;
}
/* Línea naranja superior */
.modal::before {
  content: '';
  position: absolute; top: 0; left: 0; right: 0; height: 2px;
  background: linear-gradient(90deg, transparent, #ff5c00 30%, #ff8c00 70%, transparent);
  border-radius: 20px 20px 0 0;
}

.btn-close {
  position: absolute; top: 16px; right: 16px;
  background: #1e1e2a; border: none; color: #55556a;
  width: 30px; height: 30px; border-radius: 8px;
  cursor: pointer; font-size: 13px; transition: all 0.2s;
  z-index: 1;
}
.btn-close:hover { background: rgba(255,60,60,0.15); color: #ff4060; }

/* ── SKELETON ─────────────────────────────────────────── */
.loading-state {
  display: flex; align-items: center; gap: 20px;
  padding: 32px 28px;
}
.sk-avatar {
  width: 72px; height: 72px; border-radius: 50%; flex-shrink: 0;
  background: linear-gradient(90deg,#16161c 25%,#1e1e2a 50%,#16161c 75%);
  background-size: 200% 100%; animation: shimmer 1.4s infinite;
}
.sk-lines { display: flex; flex-direction: column; gap: 10px; flex: 1; }
.sk-line  { height: 14px; border-radius: 6px; background: linear-gradient(90deg,#16161c 25%,#1e1e2a 50%,#16161c 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; }
.w60 { width: 60%; } .w40 { width: 40%; } .w80 { width: 80%; }
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

/* ── ERROR ────────────────────────────────────────────── */
.error-state { padding: 40px; text-align: center; }
.err-icon { font-size: 32px; display: block; margin-bottom: 12px; color: #ff4060; }
.error-state p { color: #ff4060; font-size: 14px; }

/* ── PROFILE HEADER ───────────────────────────────────── */
.profile-header {
  display: flex; align-items: center; gap: 20px;
  padding: 28px 28px 24px;
}
.profile-avatar {
  width: 72px; height: 72px; border-radius: 50%; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  font-family: 'Bebas Neue', sans-serif; font-size: 26px; color: #fff;
  box-shadow: 0 8px 24px rgba(0,0,0,0.4);
}
.profile-info { display: flex; flex-direction: column; gap: 4px; }
.profile-name { font-family: 'Bebas Neue', sans-serif; font-size: 24px; letter-spacing: 1px; color: #fff; margin: 0; line-height: 1.1; }
.profile-doc  { font-size: 12px; color: #44445a; letter-spacing: 0.5px; }
.profile-badges { display: flex; gap: 6px; margin-top: 4px; flex-wrap: wrap; }

.badge-plan {
  font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 20px;
  background: rgba(255,92,0,0.12); color: #ff5c00;
  border: 1px solid rgba(255,92,0,0.2);
}
.badge-estado { font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 20px; }
.badge-estado.activa   { background: rgba(0,230,118,0.1);  color: #00e676; }
.badge-estado.inactiva { background: rgba(255,160,0,0.1);  color: #ffa000; }
.badge-estado.vencida  { background: rgba(255,60,60,0.1);  color: #ff4060; }

/* ── SECTIONS ─────────────────────────────────────────── */
.divider { height: 1px; background: #1e1e24; margin: 0 28px; }

.section { padding: 20px 28px; }
.section-title {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 11px; letter-spacing: 2.5px; color: #33334a; margin: 0 0 14px;
}

/* ── DATOS DE CONTACTO ────────────────────────────────── */
.data-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.data-item { display: flex; flex-direction: column; gap: 3px; background: #16161c; border: 1px solid #1e1e2a; border-radius: 10px; padding: 12px 14px; }
.data-label { font-size: 10px; font-weight: 600; color: #33334a; letter-spacing: 1px; text-transform: uppercase; }
.data-value { font-size: 13px; color: #d8d8e8; font-weight: 500; word-break: break-all; }

/* ── SUSCRIPCIÓN ACTIVA ───────────────────────────────── */
.sus-card { background: #16161c; border: 1px solid rgba(255,92,0,0.2); border-radius: 12px; padding: 16px; }
.sus-top  { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
.sus-plan { font-size: 15px; font-weight: 600; color: #e8e8ee; }
.sus-precio { font-family: 'Bebas Neue', sans-serif; font-size: 20px; color: #ff5c00; letter-spacing: 1px; }

.sus-data-row { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 8px; margin-bottom: 14px; }
.sus-data { display: flex; flex-direction: column; gap: 3px; }
.sus-label { font-size: 9px; font-weight: 600; color: #33334a; letter-spacing: 1px; text-transform: uppercase; }
.sus-val   { font-size: 13px; font-weight: 600; color: #d8d8e8; }

.accent-green  { color: #00e676 !important; }
.accent-orange { color: #ffa000 !important; }
.accent-red    { color: #ff4060 !important; }

.dias-bar  { height: 4px; background: #1e1e2a; border-radius: 10px; overflow: hidden; }
.dias-fill { height: 100%; border-radius: 10px; transition: width 0.8s ease; }

/* ── HISTORIAL ────────────────────────────────────────── */
.historial-list { display: flex; flex-direction: column; gap: 8px; }
.historial-row  { display: flex; align-items: center; gap: 12px; padding: 10px 12px; background: #16161c; border: 1px solid #1e1e2a; border-radius: 10px; }
.h-dot  { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.h-dot.activa   { background: #00e676; }
.h-dot.inactiva { background: #ffa000; }
.h-dot.vencida  { background: #ff4060; }
.h-info  { display: flex; flex-direction: column; gap: 2px; flex: 1; }
.h-plan  { font-size: 13px; font-weight: 500; color: #c0c0d0; }
.h-dates { font-size: 11px; color: #44445a; }
.h-estado { font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 20px; flex-shrink: 0; }
.h-estado.activa   { background: rgba(0,230,118,0.1);  color: #00e676; }
.h-estado.inactiva { background: rgba(255,160,0,0.1);  color: #ffa000; }
.h-estado.vencida  { background: rgba(255,60,60,0.1);  color: #ff4060; }
</style>