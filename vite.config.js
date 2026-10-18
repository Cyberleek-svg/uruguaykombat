import { defineConfig } from 'vite';

// La CSP de index.html permite websockets y localhost porque el servidor de
// desarrollo (HMR) los necesita. En el build de produccion se ajusta a lo minimo.
function cspPorModo(command) {
  return {
    name: 'csp-por-modo',
    transformIndexHtml(html) {
      if (command !== 'build') return html;
      return html.replace(/connect-src [^"]*/, "connect-src 'self' blob:");
    },
  };
}

export default defineConfig(({ command }) => ({
  base: './',
  plugins: [cspPorModo(command)],
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          phaser: ['phaser'],
        },
      },
    },
  },
  optimizeDeps: {
    include: ['phaser'],
  },
}));
