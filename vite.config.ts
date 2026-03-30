import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return

          if (
            id.includes('/react-dom/')
          ) {
            return 'react-dom'
          }

          if (
            id.includes('/react/')
          ) {
            return 'react-core'
          }

          if (id.includes('/scheduler/')) {
            return 'react-scheduler'
          }

          if (
            id.includes('/react-router-dom/') ||
            id.includes('/react-router/')
          ) {
            return 'router'
          }

          if (
            id.includes('/@tanstack/react-query/')
          ) {
            return 'query-cache'
          }

          if (id.includes('/@tanstack/react-table/')) {
            return 'data-table'
          }

          if (
            id.includes('/axios/') ||
            id.includes('/zustand/') ||
            id.includes('/date-fns/')
          ) {
            return 'app-data'
          }

          if (id.includes('/@radix-ui/')) {
            if (id.includes('/@radix-ui/react-select/')) {
              return 'radix-select'
            }

            if (id.includes('/@radix-ui/react-dialog/')) {
              return 'radix-dialog'
            }

            if (id.includes('/@radix-ui/react-tabs/')) {
              return 'radix-tabs'
            }

            if (
              id.includes('/@radix-ui/react-label/') ||
              id.includes('/@radix-ui/react-slot/')
            ) {
              return 'radix-core'
            }

            return 'radix-core'
          }

          if (
            id.includes('/react-hook-form/') ||
            id.includes('/@hookform/resolvers/')
          ) {
            return 'forms-runtime'
          }

          if (id.includes('/zod/')) {
            return 'forms-schema'
          }

          if (id.includes('/framer-motion/')) {
            return 'motion'
          }

          if (id.includes('/sonner/')) {
            return 'feedback'
          }

          if (
            id.includes('/lucide-react/') ||
            id.includes('/class-variance-authority/') ||
            id.includes('/clsx/') ||
            id.includes('/tailwind-merge/')
          ) {
            return 'design-utils'
          }
        },
      },
    },
  },
})
