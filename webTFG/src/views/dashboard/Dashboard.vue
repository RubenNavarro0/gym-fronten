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

import TopBar     from '../../components/TopBar.vue'
import LeftPanel  from '../../components/LeftPanel.vue'
import CenterPanel from '../../components/CenterPanel.vue'
import RightPanel from '../../components/RightPanel.vue'
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