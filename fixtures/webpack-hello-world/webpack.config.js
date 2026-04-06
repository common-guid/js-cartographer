const path = require('path');

module.exports = {
  // Production mode: enables Terser minification + tree shaking
  mode: 'production',

  entry: './src/app.js',

  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
    // Clean output before each build
    clean: true,
  },

  module: {
    rules: [
      {
        test: /\.js$/,
        use: 'babel-loader',
        exclude: /node_modules/,
      },
    ],
  },

  // Enable source maps if the environment variable is set
  devtool: process.env.GENERATE_SOURCEMAP === 'true' ? 'source-map' : false,

  // Target ES5 via browserslist (reinforced by .babelrc)
  target: ['web', 'es5'],
};
