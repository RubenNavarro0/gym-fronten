<template>
  <div class="dashboard">
    <TopBar />
    <div class="main">
      <LeftPanel />
      <CenterPanel />
      <RightPanel />
    </div>
  </div>
</template>

<script setup>
import { ref, provide } from 'vue'
import TopBar      from '../../components/TopBar.vue'
import LeftPanel   from '../../components/LeftPanel.vue'
import CenterPanel from '../../components/CenterPanel.vue'
import RightPanel  from '../../components/RightPanel.vue'

// Contador global de refresco. Cada vez que RightPanel hace una acción
// con éxito lo incrementa, y LeftPanel/CenterPanel lo escuchan con watch.
const refreshKey = ref(0)
provide('refreshKey', refreshKey)
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&display=swap');

.dashboard {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #0a0a0b;
  font-family: 'DM Sans', sans-serif;
  overflow: hidden;
}

.main {
  flex: 1;
  display: grid;
  grid-template-columns: 280px 1fr 300px;
  gap: 0;
  overflow: hidden;
}
</style>