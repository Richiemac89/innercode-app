import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { writeFileSync } from 'fs'
import { join } from 'path'

// Plugin: inject build id at build time and write version.json for "new version" check
function buildIdPlugin() {
  let buildId: string
  return {
    name: 'build-id',
    config() {
      buildId = String(Date.now())
      return { define: { __APP_BUILD_ID__: JSON.stringify(buildId) } }
    },
    writeBundle(outputOptions: { dir?: string }) {
      const outDir = outputOptions.dir ?? 'dist'
      try {
        writeFileSync(join(outDir, 'version.json'), JSON.stringify({ buildId }))
      } catch (_e) {
        // ignore if dist not writable
      }
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), buildIdPlugin()],
  
  server: {
    host: '0.0.0.0', // Bind to all network interfaces for mobile testing
    port: 3000,
    strictPort: false,
    open: true
  },

  // Preview (production build) – allow mobile access on same network
  preview: {
    host: '0.0.0.0',
    port: 4173,
    strictPort: false
  },

  // Production build optimizations
  build: {
    target: 'es2015',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor code for better caching
          'react-vendor': ['react', 'react-dom'],
          'supabase-vendor': ['@supabase/supabase-js'],
        },
      },
    },
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
    sourcemap: false, // Disable sourcemaps for production
  },
  
  // Optimize dependency pre-bundling
  optimizeDeps: {
    include: ['react', 'react-dom', '@supabase/supabase-js'],
  },
})

