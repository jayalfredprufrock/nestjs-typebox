import { defineConfig } from 'vite';
import dts from 'vite-dts';

export default defineConfig({
    build: {
        lib: {
            entry: 'src/index.ts',
            formats: ['es', 'cjs'],
            fileName: format => `nestjs-typebox.${format}.js`,
        },
        rollupOptions: {
            external: [/@nestjs\/.*/, /@sinclair\/.*/, /rxjs\/?.*/],
            output: {
                sourcemapExcludeSources: true,
            },
        },
        sourcemap: true,
        target: 'esnext',
        minify: false,
    },
    plugins: [dts()],
});
