<template>
  <div class="search-cliente" ref="rootEl">

    <div class="search-wrap" :class="{ focused }">
      <svg class="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none">
        <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="1.8"/>
        <path d="M16.5 16.5L21 21" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
      </svg>
      <input
        ref="inputEl"
        class="search-input"
        type="text"
        :placeholder="placeholder"
        v-model="query"
        @input="onInput"
        @focus="focused = true; if (results.length) open = true"
        @blur="onBlur"
        @keydown.down.prevent="moveDown"
        @keydown.up.prevent="moveUp"
        @keydown.enter.prevent="selectIndex(highlighted)"
        @keydown.escape="open = false"
        autocomplete="off"
      />
      <span class="spinner" v-if="loading"></span>
      <button class="clear-btn" v-else-if="query" @mousedown.prevent @click="clear">✕</button>
    </div>

    <!-- Dropdown -->
    <div class="dropdown" v-if="open && results.length > 0">
      <div
        class="dropdown-item"
        v-for="(r, idx) in results"
        :key="r.id_cliente"
        :class="{ highlighted: idx === highlighted }"
        @mousedown.prevent
        @click="selectIndex(idx)"
      >
        <div class="item-avatar" :style="{ background: avatarColor(r.nombre) }">
          {{ initials(r.nombre) }}
        </div>
        <div class="item-info">
          <span class="item-name">{{ r.nombre }}</span>
          <span class="item-sub">{{ r.documento }} · {{ r.plan_activo ?? 'Sin plan' }}</span>
        </div>
        <span class="item-badge" v-if="r.plan_activo">activo</span>
      </div>
    </div>

    <!-- Sin resultados -->
    <div class="dropdown" v-else-if="open && query.length >= 2 && !loading">
      <div class="no-results">Sin resultados para "{{ query }}"</div>
    </div>

  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import api from '../api/api.js'

const props = defineProps({
  idGym:       { type: Number, default: null },
  placeholder: { type: String, default: 'Nombre o DNI...' }
})

const emit = defineEmits(['seleccionado'])

const query       = ref('')
const results     = ref([])
const open        = ref(false)
const focused     = ref(false)
const loading     = ref(false)
const highlighted = ref(0)
const rootEl      = ref(null)
const inputEl     = ref(null)

let debounce = null

function onInput() {
  clearTimeout(debounce)
  open.value        = false
  highlighted.value = 0

  if (query.value.length < 2) { results.value = []; return }

  loading.value = true
  debounce = setTimeout(async () => {
    try {
      const params = { q: query.value }
      if (props.idGym) params.id_gym = props.idGym

      const { data } = await api.get('/cliente/buscar', { params })
      results.value = data
      open.value    = data.length > 0
    } catch {
      results.value = []
    } finally {
      loading.value = false
    }
  }, 280)
}

function onBlur() {
  focused.value = false
  // Pequeño delay para que el click en el dropdown se registre antes de cerrar
  setTimeout(() => { open.value = false }, 150)
}

function moveDown() {
  if (!open.value) return
  highlighted.value = Math.min(highlighted.value + 1, results.value.length - 1)
}
function moveUp() {
  highlighted.value = Math.max(highlighted.value - 1, 0)
}

function selectIndex(idx) {
  const r = results.value[idx]
  if (!r) return
  query.value   = r.nombre
  open.value    = false
  emit('seleccionado', r)
}

function clear() {
  query.value   = ''
  results.value = []
  open.value    = false
  inputEl.value?.focus()
  emit('seleccionado', null)
}

// Colores avatar deterministas
const COLORS = [
  'linear-gradient(135deg,#ff5c00,#ff8c00)',
  'linear-gradient(135deg,#6644ff,#9966ff)',
  'linear-gradient(135deg,#00b4d8,#0077b6)',
  'linear-gradient(135deg,#00e676,#00b248)',
  'linear-gradient(135deg,#ff4060,#cc1040)',
  'linear-gradient(135deg,#f7b731,#fc5c65)',
]
function avatarColor(nombre) {
  let h = 0; for (const c of nombre) h += c.charCodeAt(0)
  return COLORS[h % COLORS.length]
}
function initials(nombre) {
  const p = nombre.trim().split(' ')
  return ((p[0]?.[0] ?? '') + (p[1]?.[0] ?? '')).toUpperCase()
}
</script>

<style scoped>
.search-cliente { position: relative; width: 100%; }

/* Input */
.search-wrap {
  display: flex; align-items: center; gap: 8px;
  background: #16161c;
  border: 1px solid #1e1e2a;
  border-radius: 8px;
  padding: 0 12px;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.search-wrap.focused {
  border-color: #ff5c00;
  box-shadow: 0 0 0 3px rgba(255,92,0,0.08);
}
.search-icon { color: #33334a; flex-shrink: 0; transition: color 0.2s; }
.search-wrap.focused .search-icon { color: #ff5c00; }

.search-input {
  flex: 1; background: none; border: none; outline: none;
  padding: 10px 0;
  color: #e8e8ee;
  font-family: 'DM Sans', sans-serif;
  font-size: 13px;
}
.search-input::placeholder { color: #2e2e3a; }

.spinner {
  width: 14px; height: 14px; flex-shrink: 0;
  border: 2px solid #2a2a35;
  border-top-color: #ff5c00;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.clear-btn {
  background: none; border: none; color: #33334a;
  cursor: pointer; font-size: 12px; padding: 0;
  line-height: 1; transition: color 0.15s; flex-shrink: 0;
}
.clear-btn:hover { color: #ff4060; }

/* Dropdown */
.dropdown {
  position: absolute; top: calc(100% + 6px); left: 0; right: 0;
  background: #16161c;
  border: 1px solid #2a2a35;
  border-radius: 10px;
  overflow: hidden;
  z-index: 200;
  box-shadow: 0 16px 40px rgba(0,0,0,0.5);
}

.dropdown-item {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 14px;
  cursor: pointer;
  transition: background 0.15s;
}
.dropdown-item:not(:last-child) { border-bottom: 1px solid #1e1e24; }
.dropdown-item:hover,
.dropdown-item.highlighted { background: #1e1e2a; }

.item-avatar {
  width: 30px; height: 30px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-family: 'Bebas Neue', sans-serif;
  font-size: 12px; color: #fff; flex-shrink: 0;
}
.item-info  { display: flex; flex-direction: column; gap: 1px; flex: 1; min-width: 0; }
.item-name  { font-size: 13px; font-weight: 500; color: #d8d8e8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.item-sub   { font-size: 11px; color: #44445a; }
.item-badge { font-size: 10px; font-weight: 600; padding: 2px 7px; border-radius: 20px; background: rgba(0,230,118,0.1); color: #00e676; flex-shrink: 0; }

.no-results { padding: 12px 14px; font-size: 12px; color: #44445a; text-align: center; }
</style>