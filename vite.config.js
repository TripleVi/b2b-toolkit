import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "127.0.0.1",
    cors: true,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Private-Network": "true",
    },
  },
  plugins: [
    monkey({
      entry: 'src/main.js',
      userscript: {
        name: 'B2B Toolkit',
        icon: 'https://vitejs.dev/logo.svg',
        namespace: 'https://github.com/TripleVi/b2b-toolkit',
        version: '0.1.1',
        description: 'Internal support toolkit for B2B Solution',
        author: 'TripleVi',
        match: ['https://*/*'],
        grant: 'none',
        downloadURL: 'https://triplevi.github.io/b2b-toolkit/b2b-toolkit.user.js',
        updateURL: 'https://triplevi.github.io/b2b-toolkit/b2b-toolkit.user.js',
        supportURL: 'https://github.com/TripleVi/b2b-toolkit/issues',
        'run-at': 'document-start',
        exclude: ['*://cdn.shopify.com/*', '*://shop.app/*', '*://*.shop.app/*'],
      },
    }),
  ],
});
