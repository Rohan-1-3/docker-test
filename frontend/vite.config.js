import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0', // Important for Docker
    port: 5173,
    strictPort: true,
    watch: {
      usePolling: true, // Important for file changes in Docker
    },
    hmr: {
      port: 5173, // Hot module reload port
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
  }
})
