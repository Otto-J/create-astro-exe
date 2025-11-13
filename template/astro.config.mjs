import { defineConfig } from 'astro/config'

import node from '@astrojs/node';

import db from '@astrojs/db';

import tailwindcss from '@tailwindcss/vite';

import vue from '@astrojs/vue';

// https://astro.build/config
export default defineConfig({
  output: 'server',

  adapter: node({
    mode: 'standalone'
  }),

  integrations: [db({}), vue()],

  vite: {
    plugins: [tailwindcss()],
    ssr: {
      external: process.env.NODE_ENV === 'production'
        ? ['@libsql/client', 'vue', 'picocolors']
        : [],
    }
  }
})
