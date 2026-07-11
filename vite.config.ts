import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify: file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            const normalizedId = id.replace(/\\/g, '/');
            if (!normalizedId.includes('/node_modules/')) return;

            if (
              normalizedId.includes('/node_modules/firebase/firestore') ||
              normalizedId.includes('/node_modules/@firebase/firestore')
            ) {
              return 'firebase-firestore';
            }

            if (
              normalizedId.includes('/node_modules/firebase/auth') ||
              normalizedId.includes('/node_modules/@firebase/auth')
            ) {
              return 'firebase-auth';
            }

            if (
              normalizedId.includes('/node_modules/firebase/storage') ||
              normalizedId.includes('/node_modules/@firebase/storage')
            ) {
              return 'firebase-storage';
            }

            if (
              normalizedId.includes('/node_modules/firebase/') ||
              normalizedId.includes('/node_modules/@firebase/')
            ) {
              return 'firebase-core';
            }

            if (
              normalizedId.includes('/node_modules/@tiptap/') ||
              normalizedId.includes('/node_modules/@milkdown/') ||
              normalizedId.includes('/node_modules/prosemirror-')
            ) {
              return 'vendor-editor';
            }

            if (
              normalizedId.includes('/node_modules/react/') ||
              normalizedId.includes('/node_modules/react-dom/') ||
              normalizedId.includes('/node_modules/scheduler/')
            ) {
              return 'vendor-react';
            }

            if (
              normalizedId.includes('/node_modules/lucide-react/') ||
              normalizedId.includes('/node_modules/motion/')
            ) {
              return 'vendor-ui';
            }

            return 'vendor';
          },
        },
      },
    },
  };
});
