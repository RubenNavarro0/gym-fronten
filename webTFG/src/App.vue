<template>
  <div class="container">
    <h1>Registro de Usuarios</h1>

    <form @submit.prevent="login">
      <div class="input-group">
        <label>Correo</label>
        <input type="email" v-model="email" placeholder="correo@email.com" />
      </div>

      <div class="input-group">
        <label>Contraseña</label>
        <input type="password" v-model="password" placeholder="********" />
      </div>

      <button type="submit">Entrar</button>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const email = ref('')
const password = ref('')

function login() {
  if (email.value === '' || password.value === '') {
    alert('Por favor completa todos los campos')
    return
  }

  alert(`Email: ${email.value} \nPassword: ${password.value}`)
}
</script>

<style>
body{
  font-family: Arial, Helvetica, sans-serif;
  background:#f2f2f2;
}

.container{
  width:350px;
  margin:100px auto;
  padding:30px;
  background:white;
  border-radius:10px;
  box-shadow:0 0 10px rgba(0,0,0,0.1);
}

h1{
  text-align:center;
}

.input-group{
  margin-bottom:15px;
}

input{
  width:100%;
  padding:10px;
  margin-top:5px;
  border:1px solid #ccc;
  border-radius:5px;
}

button{
  width:100%;
  padding:10px;
  background:#42b883;
  color:white;
  border:none;
  border-radius:5px;
  cursor:pointer;
}

button:hover{
  background:#369f6b;
}
</style>