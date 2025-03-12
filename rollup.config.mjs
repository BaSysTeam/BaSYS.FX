import typescript from '@rollup/plugin-typescript';

export default {
  input: 'src/index.ts',
  output: [
    // ESM (для import)
    { file: 'dist/basys-fx.esm.js', format: 'es' },
    // UMD (для <script>)
    { file: 'dist/basys-fx.umd.js', format: 'umd', name: 'BaSYSFX' },
    // IIFE (самостоятельный скрипт)
    {
      file: 'dist/basys-fx.iife.js',
      format: 'iife',
      name: 'BaSYSFX',
    }
  ],
  plugins: [typescript()]
};
