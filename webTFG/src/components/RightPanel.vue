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
.right-panel { background: #111114; border-left: 1px solid #1e1e24; display: flex; flex-direction: column; overflow-y: auto; scrollbar-width: thin; scrollbar-color: #2a2a35 transparent; position: relative; }
.section { padding: 20px; }
.section-title { font-family: 'Bebas Neue', sans-serif; font-size: 13px; letter-spacing: 2.5px; color: #44445a; margin: 0 0 14px; }
.divider { height: 1px; background: #1e1e24; margin: 0 20px; }
.loading-col { display: flex; flex-direction: column; gap: 10px; }
.skeleton { background: linear-gradient(90deg,#16161c 25%,#1e1e2a 50%,#16161c 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; border-radius: 10px; }
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
.empty-msg { color: #44445a; font-size: 12px; text-align: center; margin: 6px 0 0; }
.action-buttons { display: flex; flex-direction: column; gap: 8px; }
.action-btn { display: flex; align-items: center; gap: 12px; padding: 13px 14px; background: #16161c; border: 1px solid #1e1e2a; border-radius: 12px; cursor: pointer; text-align: left; transition: all 0.2s; width: 100%; font-family: 'DM Sans', sans-serif; }
.action-btn:hover { border-color: rgba(255,92,0,0.4); background: rgba(255,92,0,0.06); transform: translateX(2px); }
.action-btn.primary { border-color: rgba(255,92,0,0.3); background: linear-gradient(135deg,rgba(255,92,0,0.1),rgba(255,140,0,0.05)); }
.action-btn.danger:hover { border-color: rgba(0,230,118,0.4); background: rgba(0,230,118,0.06); }
.action-icon { font-size: 18px; flex-shrink: 0; }
.action-text { display: flex; flex-direction: column; gap: 2px; flex: 1; }
.action-label { font-size: 13px; font-weight: 600; color: #d8d8e8; }
.action-sub { font-size: 11px; color: #44445a; }
.action-arrow { color: #33334a; font-size: 14px; transition: color 0.2s; }
.action-btn:hover .action-arrow { color: #ff5c00; }
.plans-list { display: flex; flex-direction: column; gap: 10px; }
.plan-card { background: #16161c; border: 1px solid #1e1e2a; border-radius: 12px; padding: 14px; }
.plan-card.featured { border-color: rgba(255,92,0,0.3); }
.plan-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.plan-name { font-size: 13px; font-weight: 600; color: #d8d8e8; }
.plan-badge { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 20px; background: rgba(255,92,0,0.15); color: #ff5c00; }
.plan-price { display: flex; align-items: baseline; gap: 3px; margin-bottom: 10px; }
.plan-amount { font-family: 'Bebas Neue', sans-serif; font-size: 22px; color: #fff; letter-spacing: 1px; }
.plan-period { font-size: 11px; color: #44445a; }
.plan-count { display: flex; align-items: center; gap: 8px; }
.plan-bar-wrap { flex: 1; height: 4px; background: #1e1e2a; border-radius: 10px; overflow: hidden; display: block; }
.plan-bar-fill { display: block; height: 100%; border-radius: 10px; }
.plan-count-text { font-size: 11px; color: #44445a; white-space: nowrap; }
.alerts-list { display: flex; flex-direction: column; gap: 8px; }
.alert-item { display: flex; gap: 10px; align-items: flex-start; padding: 10px 12px; border-radius: 10px; background: #16161c; border: 1px solid #1e1e2a; }
.alert-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; margin-top: 3px; }
.alert-item.danger  .alert-dot { background: #ff4060; }
.alert-item.warning .alert-dot { background: #ffa000; }
.alert-item.success .alert-dot { background: #00e676; }
.alert-content { display: flex; flex-direction: column; gap: 2px; }
.alert-msg { font-size: 12px; color: #b0b0c0; line-height: 1.4; }
.alert-time { font-size: 10px; color: #33334a; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.75); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(4px); }
.modal { background: #111114; border: 1px solid #2a2a35; border-radius: 16px; width: 400px; max-width: 92vw; box-shadow: 0 30px 80px rgba(0,0,0,0.6); max-height: 90vh; overflow-y: auto; }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px 0; }
.modal-title { font-family: 'Bebas Neue', sans-serif; font-size: 22px; letter-spacing: 2px; color: #fff; margin: 0; }
.modal-close { background: #1e1e2a; border: none; color: #55556a; width: 30px; height: 30px; border-radius: 8px; cursor: pointer; font-size: 13px; transition: all 0.2s; }
.modal-close:hover { background: rgba(255,60,60,0.15); color: #ff4060; }
.modal-feedback { margin: 12px 24px 0; padding: 10px 14px; border-radius: 8px; font-size: 13px; font-weight: 500; }
.modal-feedback.success { background: rgba(0,230,118,0.1); color: #00e676; }
.modal-feedback.error   { background: rgba(255,60,60,0.1);  color: #ff4060; }
.modal-body { padding: 16px 24px 24px; display: flex; flex-direction: column; gap: 14px; }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-label { font-size: 10px; font-weight: 600; letter-spacing: 1px; color: #55556a; text-transform: uppercase; font-family: 'DM Sans', sans-serif; }
.form-input { background: #16161c; border: 1px solid #1e1e2a; border-radius: 8px; padding: 10px 14px; color: #d8d8e8; font-size: 13px; font-family: 'DM Sans', sans-serif; outline: none; transition: border-color 0.2s; width: 100%; box-sizing: border-box; }
.form-input:focus { border-color: #ff5c00; }
.form-input::placeholder { color: #2e2e3a; }
select.form-input { cursor: pointer; }
select.form-input option { background: #16161c; }
.pass-wrap { position: relative; }
.pass-wrap .form-input { padding-right: 40px; }
.toggle-pass { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; font-size: 14px; opacity: 0.5; transition: opacity 0.2s; padding: 0; }
.toggle-pass:hover { opacity: 1; }
.selected-label { font-size: 12px; color: #00e676; margin: 4px 0 0; }
.btn-submit { background: #ff5c00; border: none; border-radius: 10px; padding: 12px; color: #fff; font-family: 'Bebas Neue', sans-serif; font-size: 18px; letter-spacing: 2px; cursor: pointer; width: 100%; margin-top: 4px; transition: background 0.2s, transform 0.1s; }
.btn-submit:hover:not(:disabled) { background: #ff7722; transform: translateY(-1px); }
.btn-submit:disabled { background: #7a3010; cursor: not-allowed; }
</style>