import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  base: '/dyslexia-Prediction/',  // Make sure this is the name of your repository
  plugins: [react()],
});
