import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
    base: "./",
    plugins: [
      react(),
      visualizer({ open: true })
    ],
    build: {
        chunkSizeWarningLimit: 3000, // Combines your build settings
        outDir: 'dist',             // Combines your build settings
    },
    
    resolve: {
        alias: {
            '@': '/src',
        },
    },
     server: {
    host: true, // allows access from outside the container
    port: 5178,
    strictPort: true,
    watch: {
      usePolling: true, // required inside Docker on some OS
    },
    hmr: {
      clientPort: 5178, // match exposed port
    },
  },
});
