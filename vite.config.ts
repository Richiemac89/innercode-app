import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
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

