// rollup.config.js
import typescript from '@rollup/plugin-typescript'
import merge from 'deepmerge'
import dts from 'rollup-plugin-dts'
import esbuild from 'rollup-plugin-esbuild'
import withSolid from 'rollup-preset-solid'

export default withSolid()

// export default [
//     {
//         input: "src/App.tsx",
//         external : "src/index.css",
//         output: {
//             dir: "public/bundle.js",
//             format: "cjs",
//             sourcemaps: true
//         },
//         plugins: [
//             typescript({
//                 tsconfig: "./tsconfig.json"
//             })
//         ]
//     }
// ]