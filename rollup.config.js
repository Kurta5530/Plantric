import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import copy from 'rollup-plugin-copy';

export default [
  {
    input: 'src/index.ts',
    output: [
      {
        file: 'dist/index.cjs.js',
        format: 'cjs'
      },
      {
        file: 'dist/index.esm.js',
        format: 'esm'
      }
    ],
    plugins: [
      resolve(),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: true,
        declarationDir: 'dist',
        include: ['src/**/*'],
        exclude: ['node_modules', 'dist', 'src/extension/**/*']
      })
    ]
  },
  {
    input: 'src/extension/index.ts',
    output: [
      {
        file: 'dist/extension.cjs.js',
        format: 'cjs'
      },
      {
        file: 'dist/extension.esm.js',
        format: 'esm'
      }
    ],
    plugins: [
      resolve(),
      commonjs(),
      typescript({ 
        tsconfig: './tsconfig.json',
        declaration: true,
        declarationDir: 'dist',
        include: ['src/types/*', 'src/extension/**/*'],
        exclude: ['src/extension/script']
      }),
      copy({
        targets: [
          { src: 'src/extension/script', dest: 'dist/extension' }
        ]
      })
    ]
  },
  {
    input: 'src/extension/content/index.ts',
    output: {
      file: 'dist/extension_content_script.js',
      format: 'esm'
    },
    plugins: [
      resolve(),
      commonjs(),
      typescript({ 
        tsconfig: './tsconfig.json',
        declaration: false,
        include: ['src/extension/content/*'],
        declarationDir: 'dist'
      })
    ]
  }
];