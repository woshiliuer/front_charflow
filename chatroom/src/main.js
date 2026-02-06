// Polyfill for sockjs-client: define global if not exists
if (typeof global === 'undefined') {
  window.global = window.global || globalThis
}

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import './style.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
