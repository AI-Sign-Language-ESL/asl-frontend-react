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

function unityDevServerPlugin() {
  return {
    name: 'unity-dev-server',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        // Strip query params just in case
        const pathname = req.url.split('?')[0]
        if (pathname.match(/\.(wasm|js|data)\.gz$/) || pathname.endsWith('.wasm')) {
          let contentType = 'application/octet-stream'
          if (pathname.includes('.wasm')) contentType = 'application/wasm'
          else if (pathname.includes('.js')) contentType = 'application/javascript'
          
          res.setHeader('Content-Type', contentType)
          
          if (pathname.endsWith('.gz')) {
            res.setHeader('Content-Encoding', 'gzip')
          }
          
          const filePath = path.join(process.cwd(), 'public', pathname)
          if (fs.existsSync(filePath)) {
            const stat = fs.statSync(filePath)
            res.setHeader('Content-Length', stat.size)
            res.writeHead(200)
            fs.createReadStream(filePath).pipe(res)
            return
          }
        }
        next()
      })
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        const pathname = req.url.split('?')[0]
        if (pathname.match(/\.(wasm|js|data)\.gz$/) || pathname.endsWith('.wasm')) {
          let contentType = 'application/octet-stream'
          if (pathname.includes('.wasm')) contentType = 'application/wasm'
          else if (pathname.includes('.js')) contentType = 'application/javascript'
          
          res.setHeader('Content-Type', contentType)
          
          if (pathname.endsWith('.gz')) {
            res.setHeader('Content-Encoding', 'gzip')
          }
          
          const filePath = path.join(process.cwd(), 'dist', pathname)
          if (fs.existsSync(filePath)) {
            const stat = fs.statSync(filePath)
            res.setHeader('Content-Length', stat.size)
            res.writeHead(200)
            fs.createReadStream(filePath).pipe(res)
            return
          }
        }
        next()
      })
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [react(), tailwindcss(), unityDevServerPlugin()],
  server: {
    port: 5180,
    host: true,
    strictPort: false,
    https: fs.existsSync(keyPath) && fs.existsSync(certPath) 
      ? { key: fs.readFileSync(keyPath), cert: fs.readFileSync(certPath) }
      : false
  }
})
