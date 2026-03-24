import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Fail the build if VITE_API_URL is missing in production so deployed apps
// never silently fall back to localhost.
if (process.env.NODE_ENV === 'production' && !process.env.VITE_API_URL) {
  throw new Error('VITE_API_URL must be set for production builds');
}

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
