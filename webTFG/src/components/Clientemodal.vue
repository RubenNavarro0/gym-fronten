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
@import './Clientemodal.css';
</style>