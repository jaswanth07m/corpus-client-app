import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    globals: true,
    css: true,
    coverage: {
      include: ['src/components/MediaDetailModal.tsx'],
      reporter: ['text', 'html', 'cobertura'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  coverage: {
    // Only include specific files you want to measure coverage for
    include: [
      'src/components/PeerReviewCard.tsx',
      'src/components/SwechaLogo.tsx',
    ],
    // Exclude test files and UI components that are mocked
    exclude: [
      'src/components/ui/**',
      'src/lib/utils.ts',
      '**/*.test.tsx',
      '**/*.test.ts',
    ],
  },
});
