import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'
import type { Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

const root = path.dirname(fileURLToPath(import.meta.url))
const dataDir = path.resolve(root, '../data')

/** Serve ../data at /token-dashboard/data during vite dev */
function serveRepoData(): Plugin {
  return {
    name: 'serve-repo-data',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url || ''
        const prefix = '/token-dashboard/data/'
        if (!url.startsWith(prefix) && url !== '/token-dashboard/data' && !url.startsWith('/data/')) {
          return next()
        }
        let rel = url.startsWith(prefix)
          ? url.slice(prefix.length)
          : url.startsWith('/data/')
            ? url.slice('/data/'.length)
            : ''
        rel = decodeURIComponent(rel.split('?')[0])
        const file = path.normalize(path.join(dataDir, rel))
        if (!file.startsWith(dataDir)) {
          res.statusCode = 403
          res.end('forbidden')
          return
        }
        if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
          res.statusCode = 404
          res.end('not found')
          return
        }
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        fs.createReadStream(file).pipe(res)
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), serveRepoData()],
  base: '/token-dashboard/',
  resolve: {
    alias: {
      '@': path.resolve(root, './src'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    chunkSizeWarningLimit: 900,
  },
})
