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
        namespace: 'npm/vite-plugin-monkey',
        version: '0.1.0',
        description: 'Internal support toolkit for B2B Solution',
        author: 'TripleVi',
        match: ['https://*/*'],
        grant: ['GM_addStyle', 'GM_getValue', 'GM_setValue', 'GM_deleteValue', 'GM_listValues'],
        downloadURL: 'https://triplevi.github.io/b2b-toolkit/b2b-toolkit.user.js',
        updateURL: 'https://triplevi.github.io/b2b-toolkit/b2b-toolkit.user.js',
        supportURL: 'https://github.com/TripleVi/b2b-toolkit',
        'run-at': 'document-start',
      },
    }),
  ],
});
