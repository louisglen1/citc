import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Use jsdom environment for DOM testing
    environment: 'jsdom',
    
    // Global test setup
    setupFiles: ['./tests/setup.ts'],
    
    // Test file patterns
    include: ['tests/**/*.test.ts'],
    exclude: ['node_modules', 'dist', 'demo'],
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/index.ts', // Re-export files
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      },
    },
    
    // Test timeout (ms)
    testTimeout: 5000,
    
    // Globals
    globals: true,
    
    // Clear mocks between tests
    clearMocks: true,
    restoreMocks: true,
    mockReset: true,
  },
});
