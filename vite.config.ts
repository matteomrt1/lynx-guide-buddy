import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react' // o il plugin che stai usando

export default defineConfig({
  plugins: [react()],
  base: '/lynx-guide-buddy/', // SOSTITUISCI con il nome esatto del tuo repository su GitHub
})
