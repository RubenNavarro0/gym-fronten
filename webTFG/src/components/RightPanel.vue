<template>
  <div class="right-panel">

    <div class="section">
      <h2 class="section-title">ACCIONES RÁPIDAS</h2>
      <div class="action-buttons">
        <button class="action-btn primary" @click="openModal('add')">
          <span class="action-icon">👤</span>
          <div class="action-text"><span class="action-label">Añadir Cliente</span><span class="action-sub">Registrar nuevo socio</span></div>
          <span class="action-arrow">→</span>
        </button>
        <button class="action-btn" @click="openModal('renew')">
          <span class="action-icon">🔄</span>
          <div class="action-text"><span class="action-label">Renovar Suscripción</span><span class="action-sub">Actualizar plan existente</span></div>
          <span class="action-arrow">→</span>
        </button>
        <button class="action-btn" @click="openModal('edit')">
          <span class="action-icon">✏️</span>
          <div class="action-text"><span class="action-label">Modificar Cliente</span><span class="action-sub">Editar datos del socio</span></div>
          <span class="action-arrow">→</span>
        </button>
        <button class="action-btn danger" @click="openModal('checkin')">
          <span class="action-icon">✅</span>
          <div class="action-text"><span class="action-label">Check-in Manual</span><span class="action-sub">Registrar ingreso</span></div>
          <span class="action-arrow">→</span>
        </button>
      </div>
    </div>

    <div class="divider"></div>

    <div class="section">
      <h2 class="section-title">PLANES</h2>
      <div v-if="loadingPlanes" class="loading-col">
        <div class="skeleton" v-for="i in 3" :key="i" style="height:90px"></div>
      </div>
      <div class="plans-list" v-else>
        <div class="plan-card" v-for="(plan, idx) in planes" :key="plan.id" :class="{ featured: idx === 0 }">
          <div class="plan-header">
            <span class="plan-name">{{ plan.nombre }}</span>
            <span class="plan-badge" v-if="idx === 0">Popular</span>
          </div>
          <div class="plan-price">
            <span class="plan-amount">€{{ Number(plan.precio).toLocaleString('es') }}</span>
            <span class="plan-period"> / {{ plan.tipo }}</span>
          </div>
          <div class="plan-count">
            <span class="plan-bar-wrap">
              <span class="plan-bar-fill" :style="{ width: plan.pct + '%', background: planColor(idx) }"></span>
            </span>
            <span class="plan-count-text">{{ plan.miembros }} socios activos</span>
          </div>
        </div>
        <p v-if="planes.length === 0" class="empty-msg">Sin planes configurados</p>
      </div>
    </div>

    <div class="divider"></div>

    <div class="section">
      <h2 class="section-title">ALERTAS</h2>
      <div class="alerts-list">
        <div class="alert-item danger"  v-if="alertas.vencidas  > 0">
          <div class="alert-dot"></div>
          <div class="alert-content"><span class="alert-msg">{{ alertas.vencidas }} cuotas vencidas sin renovar</span><span class="alert-time">Ahora</span></div>
        </div>
        <div class="alert-item warning" v-if="alertas.vencenHoy > 0">
          <div class="alert-dot"></div>
          <div class="alert-content"><span class="alert-msg">{{ alertas.vencenHoy }} suscripciones vencen hoy</span><span class="alert-time">Hoy</span></div>
        </div>
        <div class="alert-item success" v-if="alertas.altasMes  > 0">
          <div class="alert-dot"></div>
          <div class="alert-content"><span class="alert-msg">{{ alertas.altasMes }} altas nuevas este mes</span><span class="alert-time">Este mes</span></div>
        </div>
        <p v-if="!alertas.vencidas && !alertas.vencenHoy && !alertas.altasMes" class="empty-msg">Sin alertas activas</p>
      </div>
    </div>

    <!-- ═══════════ MODAL ═══════════ -->
    <div class="modal-overlay" v-if="modal" @click.self="closeModal">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">{{ modalTitle }}</h3>
          <button class="modal-close" @click="closeModal">✕</button>
        </div>

        <div class="modal-feedback success" v-if="feedback.ok">✓ {{ feedback.ok }}</div>
        <div class="modal-feedback error"   v-if="feedback.err">✗ {{ feedback.err }}</div>

        <div class="modal-body">

          <!-- AÑADIR -->
          <template v-if="modal === 'add'">
            <div class="form-group">
              <label class="form-label">Nombre completo *</label>
              <input class="form-input" v-model="form.nombre" placeholder="Juan García" />
            </div>
            <div class="form-group">
              <label class="form-label">DNI / Documento *</label>
              <input class="form-input" v-model="form.documento" placeholder="12345678A" />
            </div>
            <div class="form-group">
              <label class="form-label">Email</label>
              <input class="form-input" type="email" v-model="form.email" placeholder="juan@email.com" />
            </div>
            <div class="form-group">
              <label class="form-label">Teléfono</label>
              <input class="form-input" v-model="form.telefono" placeholder="+34 600 000 000" />
            </div>
            <div class="form-group">
              <label class="form-label">Contraseña *</label>
              <div class="pass-wrap">
                <input class="form-input" :type="showPass ? 'text' : 'password'" v-model="form.pass" placeholder="Contraseña de acceso" />
                <button class="toggle-pass" type="button" @click="showPass = !showPass">{{ showPass ? '🙈' : '👁️' }}</button>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Plan inicial</label>
              <select class="form-input" v-model="form.id_plan">
                <option value="">Sin plan</option>
                <option v-for="p in planes" :key="p.id" :value="p.id">{{ p.nombre }} — €{{ p.precio }}</option>
              </select>
            </div>
          </template>

          <!-- RENOVAR -->
          <template v-if="modal === 'renew'">
            <div class="form-group">
              <label class="form-label">Buscar socio</label>
              <SearchCliente :id-gym="gymId" @seleccionado="seleccionarCliente" />
              <p class="selected-label" v-if="form.id_cliente">✓ <strong>{{ form.nombreCliente }}</strong></p>
            </div>
            <div class="form-group">
              <label class="form-label">Plan *</label>
              <select class="form-input" v-model="form.id_plan">
                <option value="">Selecciona un plan</option>
                <option v-for="p in planes" :key="p.id" :value="p.id">{{ p.nombre }} — €{{ p.precio }}</option>
              </select>
            </div>
          </template>

          <!-- MODIFICAR -->
          <template v-if="modal === 'edit'">
            <div class="form-group">
              <label class="form-label">Buscar socio</label>
              <SearchCliente :id-gym="gymId" @seleccionado="seleccionarCliente" />
              <p class="selected-label" v-if="form.id_cliente">✓ <strong>{{ form.nombreCliente }}</strong></p>
            </div>
            <div class="form-group">
              <label class="form-label">Nuevo nombre</label>
              <input class="form-input" v-model="form.nombre" placeholder="(sin cambios)" />
            </div>
            <div class="form-group">
              <label class="form-label">Nuevo email</label>
              <input class="form-input" type="email" v-model="form.email" placeholder="(sin cambios)" />
            </div>
            <div class="form-group">
              <label class="form-label">Nuevo teléfono</label>
              <input class="form-input" v-model="form.telefono" placeholder="(sin cambios)" />
            </div>
            <div class="form-group">
              <label class="form-label">Nueva contraseña</label>
              <div class="pass-wrap">
                <input class="form-input" :type="showPass ? 'text' : 'password'" v-model="form.pass" placeholder="(sin cambios)" />
                <button class="toggle-pass" type="button" @click="showPass = !showPass">{{ showPass ? '🙈' : '👁️' }}</button>
              </div>
            </div>
          </template>

          <!-- CHECK-IN -->
          <template v-if="modal === 'checkin'">
            <div class="form-group">
              <label class="form-label">Buscar socio</label>
              <SearchCliente :id-gym="gymId" @seleccionado="seleccionarCliente" />
              <p class="selected-label" v-if="form.id_cliente">✓ <strong>{{ form.nombreCliente }}</strong></p>
            </div>
          </template>

          <button class="btn-submit" @click="submitModal" :disabled="submitting">
            {{ submitting ? 'Procesando...' : modalBtnLabel }}
          </button>

        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, inject, onMounted } from 'vue'
import api from '../api/api.js'
import SearchCliente from './SearchCliente.vue'

// ── Refresco global ───────────────────────────────────────
const refreshKey = inject('refreshKey')

function triggerRefresh() {
  // Cierra el modal y notifica a todos los paneles
  modal.value = null
  refreshKey.value++
}

// ── Gym del trabajador logueado ───────────────────────────
const gymId = ref(null)
async function fetchGymId() {
  try { const { data } = await api.get('/gym/info'); gymId.value = data.id_gym }
  catch { /* silencioso */ }
}

// ── Planes ────────────────────────────────────────────────
const loadingPlanes = ref(true)
const planes        = ref([])
const PLAN_COLORS   = ['#ff5c00', '#6644ff', '#00e676', '#00b4d8', '#ffa000']
const planColor     = (i) => PLAN_COLORS[i % PLAN_COLORS.length]

async function fetchPlanes() {
  try { const { data } = await api.get('/plan'); planes.value = [...data].sort((a, b) => b.miembros - a.miembros) }
  catch { /* silencioso */ } finally { loadingPlanes.value = false }
}

// ── Alertas ───────────────────────────────────────────────
const alertas = ref({ vencidas: 0, vencenHoy: 0, altasMes: 0 })

async function fetchAlertas() {
  try {
    const [stats, resumen] = await Promise.all([api.get('/dashboard/stats'), api.get('/suscripcion/resumen')])
    alertas.value = { vencenHoy: stats.data.vencenHoy, altasMes: stats.data.altasMes, vencidas: resumen.data.vencidas }
  } catch { /* silencioso */ }
}

// ── Modal ─────────────────────────────────────────────────
const modal      = ref(null)
const submitting = ref(false)
const feedback   = ref({ ok: '', err: '' })
const form       = ref({})
const showPass   = ref(false)

const modalConfig = {
  add:     { title: 'Añadir Cliente',      btn: 'Registrar' },
  renew:   { title: 'Renovar Suscripción', btn: 'Renovar' },
  edit:    { title: 'Modificar Cliente',   btn: 'Guardar cambios' },
  checkin: { title: 'Check-in Manual',     btn: 'Registrar ingreso' },
}
const modalTitle    = computed(() => modal.value ? modalConfig[modal.value].title : '')
const modalBtnLabel = computed(() => modal.value ? modalConfig[modal.value].btn   : '')

function openModal(type) { modal.value = type; form.value = {}; feedback.value = { ok: '', err: '' }; showPass.value = false }
function closeModal()    { modal.value = null }

function seleccionarCliente(r) {
  if (!r) return
  form.value.id_cliente    = r.id_cliente
  form.value.nombreCliente = r.nombre
}

async function submitModal() {
  feedback.value = { ok: '', err: '' }
  submitting.value = true
  try {
    if (modal.value === 'add') {
      if (!form.value.nombre || !form.value.documento || !form.value.pass)
        throw new Error('Nombre, documento y contraseña son obligatorios')
      await api.post('/cliente', {
        nombre: form.value.nombre, documento_identidad: form.value.documento,
        pass: form.value.pass, email: form.value.email || null,
        telefono: form.value.telefono || null, id_plan: form.value.id_plan || null,
      })
    }

    if (modal.value === 'renew') {
      if (!form.value.id_cliente) throw new Error('Selecciona un socio primero')
      if (!form.value.id_plan)    throw new Error('Selecciona un plan')
      await api.post(`/cliente/${form.value.id_cliente}/renovar`, { id_plan: Number(form.value.id_plan) })
    }

    if (modal.value === 'edit') {
      if (!form.value.id_cliente) throw new Error('Selecciona un socio primero')
      await api.put(`/cliente/${form.value.id_cliente}`, {
        nombre: form.value.nombre || null, email: form.value.email || null,
        telefono: form.value.telefono || null, pass: form.value.pass || null,
      })
    }

    if (modal.value === 'checkin') {
      if (!form.value.id_cliente) throw new Error('Selecciona un socio primero')
      await api.post('/registroentrada/checkin', { busqueda: form.value.nombreCliente })
    }

    // ✅ Éxito: cierra el modal y recarga todos los paneles
    triggerRefresh()

  } catch (e) {
    feedback.value.err = e.response?.data?.message ?? e.message ?? 'Error inesperado'
  } finally {
    submitting.value = false
  }
}

onMounted(() => { fetchGymId(); fetchPlanes(); fetchAlertas() })
</script>

<style scoped>
@import './RightPanel.css';
</style>