import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-icons': ['lucide-react'],
        },
      },
    },
    chunkSizeWarningLimit: 500,
    sourcemap: false,
    target: 'es2020',
    // Minify with esbuild (fastest) — default but explicit
    minify: 'esbuild',
    // Remove console.log in production
    esbuild: {
      drop: ['debugger'],
    },
  },
  // Optimize dependency pre-bundling
  optimizeDeps: {
    include: ['react', 'react-dom', 'lucide-react'],
  },
})
