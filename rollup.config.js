import { uglify } from 'rollup-plugin-uglify'
import { minify } from 'uglify-es'
import babel from 'rollup-plugin-babel'
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default {
    input: 'src/index.js',
    output: {
      file: 'dist/yett.min.js',
      format: 'umd',
      name: 'yett',
      sourcemap: true
    },
    plugins: [
        resolve(),
        commonjs(),
        babel({
            exclude: 'node_modules/**'
        }),
        uglify({}, minify)
    ]
}
