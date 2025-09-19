import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    open: true,
    historyApiFallback: true,  // 👈 ensures /assistant works on reload
  },
});
