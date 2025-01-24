import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/dyslexia-Prediction/', // Make sure this matches your repository name
  plugins: [react()],
});
