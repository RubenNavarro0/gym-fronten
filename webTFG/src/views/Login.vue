<template>
  <div class="login-page">

    <!-- Fondo con grid decorativo -->
    <div class="bg-grid"></div>

    <!-- Glow naranja de fondo -->
    <div class="bg-glow"></div>

    <div class="login-card">

      <!-- Header con logo del gym -->
      <div class="card-header">
        <div class="gym-logo">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <path d="M6 4h2v16H6V4zM16 4h2v16h-2V4zM2 9h4v6H2V9zM18 9h4v6h-4V9zM10 10h4v4h-4v-4z" fill="#ff5c00"/>
          </svg>
        </div>
        <div class="header-text">
          <h1 class="gym-name">ADR <span class="accent">GYM</span> SOFTWARE</h1>
          <p class="gym-sub">Panel de gestión · Solo trabajadores</p>
        </div>
      </div>

      <div class="divider"></div>

      <!-- Formulario -->
      <div class="card-body">
        <h2 class="form-title">ACCESO AL SISTEMA</h2>

        <div class="input-group">
          <label class="input-label">CORREO ELECTRÓNICO</label>
          <div class="input-wrap" :class="{ focused: focusEmail }">
            <svg class="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M4 4h16v16H4V4zm0 0l8 9 8-9" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
            </svg>
            <input
              type="email"
              v-model="email"
              placeholder="trabajador@gym.com"
              autocomplete="email"
              @focus="focusEmail = true"
              @blur="focusEmail = false"
              @keyup.enter="login"
            />
          </div>
        </div>

        <div class="input-group">
          <label class="input-label">CONTRASEÑA</label>
          <div class="input-wrap" :class="{ focused: focusPass }">
            <svg class="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
              <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" stroke-width="1.5"/>
              <path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            <input
              :type="showPass ? 'text' : 'password'"
              v-model="pass"
              placeholder="••••••••"
              autocomplete="current-password"
              @focus="focusPass = true"
              @blur="focusPass = false"
              @keyup.enter="login"
            />
            <button class="toggle-pass" type="button" @click="showPass = !showPass" tabindex="-1">
              {{ showPass ? '🙈' : '👁️' }}
            </button>
          </div>
        </div>

        <!-- Error -->
        <div class="error-box" v-if="errorMsg">
          <span class="error-dot"></span>
          {{ errorMsg }}
        </div>

        <button class="btn-login" @click="login" :disabled="loading" :class="{ loading }">
          <span v-if="!loading">ENTRAR</span>
          <span v-else class="spinner"></span>
        </button>
      </div>

      <!-- Footer -->
      <div class="card-footer">
        <span class="footer-dot"></span>
        <span class="footer-text">Acceso restringido a personal autorizado</span>
        <span class="footer-dot"></span>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '../api/api.js'

const email     = ref('')
const pass      = ref('')
const errorMsg  = ref('')
const loading   = ref(false)
const showPass  = ref(false)
const focusEmail = ref(false)
const focusPass  = ref(false)
const router    = useRouter()

async function login() {
  errorMsg.value = ''

  if (!email.value || !pass.value) {
    errorMsg.value = 'Introduce email y contraseña'
    return
  }

  loading.value = true
  try {
    const { data } = await api.post('/auth/login', {
      email: email.value,
      pass:  pass.value
    })

    localStorage.setItem('usuario', JSON.stringify({
      nombre:       data.nombre,
      email:        data.email,
      id_trabajador: data.id_trabajador,
      rol:          data.rol
    }))

    router.push('/dashboard')
  } catch (err) {
    errorMsg.value = err.response?.data?.message || 'Error al conectar con el servidor'
  } finally {
    loading.value = false
  }
}
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&display=swap');

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: 'DM Sans', sans-serif;
  background: #0a0a0b;
}
</style>

<style scoped>
/* ── PAGE ─────────────────────────────────────────────── */
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0a0a0b;
  position: relative;
  overflow: hidden;
}

/* Grid decorativo de fondo */
.bg-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255,92,0,0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,92,0,0.03) 1px, transparent 1px);
  background-size: 40px 40px;
  pointer-events: none;
}

/* Glow naranja central */
.bg-glow {
  position: absolute;
  width: 600px;
  height: 600px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255,92,0,0.08) 0%, transparent 70%);
  pointer-events: none;
}

/* ── CARD ─────────────────────────────────────────────── */
.login-card {
  position: relative;
  width: 420px;
  background: #111114;
  border: 1px solid #1e1e24;
  border-radius: 20px;
  box-shadow: 0 40px 100px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,92,0,0.06);
  overflow: hidden;
}

/* Línea naranja superior */
.login-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, #ff5c00 30%, #ff8c00 70%, transparent);
}

/* ── HEADER ───────────────────────────────────────────── */
.card-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 28px 28px 22px;
}

.gym-logo {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: rgba(255,92,0,0.1);
  border: 1px solid rgba(255,92,0,0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.header-text { display: flex; flex-direction: column; gap: 4px; }

.gym-name {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 26px;
  letter-spacing: 4px;
  color: #ffffff;
  line-height: 1;
}

.accent { color: #ff5c00; }

.gym-sub {
  font-size: 11px;
  color: #44445a;
  letter-spacing: 0.5px;
  font-weight: 400;
}

.divider {
  height: 1px;
  background: linear-gradient(90deg, transparent, #1e1e24 20%, #1e1e24 80%, transparent);
  margin: 0 28px;
}

/* ── BODY ─────────────────────────────────────────────── */
.card-body {
  padding: 24px 28px 20px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.form-title {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 15px;
  letter-spacing: 3px;
  color: #33334a;
  margin-bottom: 2px;
}

/* Inputs */
.input-group { display: flex; flex-direction: column; gap: 7px; }

.input-label {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 1.5px;
  color: #44445a;
  text-transform: uppercase;
}

.input-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #16161c;
  border: 1px solid #1e1e2a;
  border-radius: 10px;
  padding: 0 14px;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.input-wrap.focused {
  border-color: #ff5c00;
  box-shadow: 0 0 0 3px rgba(255,92,0,0.08);
}

.input-icon {
  color: #33334a;
  flex-shrink: 0;
  transition: color 0.2s;
}
.input-wrap.focused .input-icon { color: #ff5c00; }

.input-wrap input {
  flex: 1;
  background: none;
  border: none;
  outline: none;
  padding: 12px 0;
  color: #e8e8ee;
  font-family: 'DM Sans', sans-serif;
  font-size: 14px;
}
.input-wrap input::placeholder { color: #2e2e3a; }

.toggle-pass {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  padding: 0;
  line-height: 1;
  opacity: 0.5;
  transition: opacity 0.2s;
}
.toggle-pass:hover { opacity: 1; }

/* Error */
.error-box {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255,60,60,0.08);
  border: 1px solid rgba(255,60,60,0.2);
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 13px;
  color: #ff4060;
}

.error-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #ff4060;
  flex-shrink: 0;
}

/* Botón */
.btn-login {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #ff5c00, #ff8c00);
  border: none;
  border-radius: 10px;
  color: #fff;
  font-family: 'Bebas Neue', sans-serif;
  font-size: 20px;
  letter-spacing: 3px;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.1s;
  margin-top: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 50px;
}
.btn-login:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-1px);
}
.btn-login:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Spinner */
.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  display: inline-block;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ── FOOTER ───────────────────────────────────────────── */
.card-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 14px 28px 20px;
  border-top: 1px solid #16161c;
}

.footer-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #2a2a35;
}

.footer-text {
  font-size: 11px;
  color: #2a2a35;
  letter-spacing: 0.5px;
}
</style>