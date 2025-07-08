import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env variables based on mode (development, production)
  const env = loadEnv(mode, process.cwd());

  return {
    plugins: [react()],
    define: {
      'process.env': env,  // <- Important for accessing .env values
    },
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
  };
});
