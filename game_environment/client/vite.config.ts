import { defineConfig } from 'vite';

export default defineConfig({
    server: {
        host: '0.0.0.0', // Listen on all network interfaces for LAN/external access
        port: 3000
    },
    build: {
        outDir: 'dist'
    }
});
