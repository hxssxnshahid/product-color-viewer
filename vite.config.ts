/// <reference types="vite/client" />
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    envDir: '.',
    envPrefix: 'VITE_'
});
