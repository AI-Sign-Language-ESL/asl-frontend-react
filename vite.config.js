import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import fs from 'fs'

// Generate self-signed cert for local HTTPS dev
const certDir = path.resolve('./cert')
if (!fs.existsSync(certDir)) {
  fs.mkdirSync(certDir)
}
const keyPath = path.join(certDir, 'key.pem')
const certPath = path.join(certDir, 'cert.pem')

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [react(), tailwindcss()],
  server: {
    port: 5180,
    host: true,
    strictPort: false,
    https: fs.existsSync(keyPath) && fs.existsSync(certPath) 
      ? { key: fs.readFileSync(keyPath), cert: fs.readFileSync(certPath) }
      : false
  }
})
