import { builtinModules } from 'module';
import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import inject from '@rollup/plugin-inject';
import { build } from 'esbuild';
import { polyfillNode } from 'esbuild-plugin-polyfill-node';
import { NodeModulesPolyfillPlugin } from "@esbuild-plugins/node-modules-polyfill";

export default defineConfig({
  plugins: [

    solidPlugin(),
    // polyfillNode(),
  ],
  base:"/EnvironmentalStudy/",
  server: {
    port: 3000,
  },
  build: {
    target: 'esnext',
    commonjsOptions: {
      ignore: [...builtinModules, "ws"],
    }
  },
  preview: {
    host:true,
    port:62875
  },
  optimizeDeps: {
    esbuildOptions: {
      plugins: [NodeModulesPolyfillPlugin()]
    },
  },
});
