import babel from 'rollup-plugin-babel';
import uglify from 'rollup-plugin-uglify';
import {minify} from 'uglify-js';

export default {
  entry: 'js/src/app.js',
  dest: 'js/build/app.js',
  plugins: [
    babel({
      exclude: 'node_modules/**'
    }),

    uglify({}, minify)
  ]
};