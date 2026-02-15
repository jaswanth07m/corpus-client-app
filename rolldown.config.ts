import { defineConfig } from 'rolldown';
import url from '@rollup/plugin-url';

export default defineConfig({
  input: './src/main.tsx',
  output: {
    dir: './dist',
    format: 'es',
  },
  plugins: [
    url({
      limit: 0, // Don't inline any files, just copy them to the output directory
      include: ['**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif', '**/*.svg'],
      emitFiles: true,
    }),
  ],
  experimental: {
    // Enable experimental features as needed
  },
});
