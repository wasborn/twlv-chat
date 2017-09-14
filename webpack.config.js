const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
module.exports = function (env = { hmr: false }) {
  return {
    context: path.join(__dirname, 'src'),
    entry: getEntry(env),
    output: {
      path: path.join(__dirname, 'www'),
      filename: 'lib/[name].js',
    },
    devtool: env.dev ? 'inline-source-map' : 'sourcemap',
    module: {
      rules: [
        {
          test: /\.s?css$/,
          use: [ 'style-loader', 'css-loader' ],
        },
        {
          test: /\.html$/,
          use: 'html-loader',
        },
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: getBabelLoader(env),
        },
      ],
    },
    plugins: getPlugins(env),
  };
};

function getEntry (env) {
  if (env.hmr) {
    return {
      index: [
        'webpack-hot-middleware/client?path=/__webpack_hmr&timeout=20000',
        './index.js',
      ],
    };
  } else {
    return {
      index: './index.js',
    };
  }
}

function getPlugins (env) {
  let plugins = [
    new HtmlWebpackPlugin({
      template: './index.html',
    }),
  ];

  if (env.hmr) {
    plugins.push(
      new webpack.HotModuleReplacementPlugin(),
      new webpack.NoEmitOnErrorsPlugin(),
    );
  }

  return plugins;
}

function getBabelLoader (env) {
  let plugins = [
    // 'syntax-dynamic-import',
    // require.resolve('babel-plugin-transform-async-to-generator'),
    // [ require.resolve('babel-plugin-__coverage__'), { 'ignore': 'node_modules' } ],
    // require.resolve('babel-plugin-syntax-dynamic-import'),
    // require.resolve('babel-plugin-istanbul')
  ];

  let presets = [
    // require.resolve('babel-preset-es2015'),
    // require.resolve('babel-preset-stage-3'),
  ];

  return {
    loader: 'babel-loader',
    options: {
      babelrc: false,
      plugins,
      presets,
      cacheDirectory: true,
    },
  };
}
