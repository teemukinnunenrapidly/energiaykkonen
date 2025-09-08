const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const webpack = require('webpack');

module.exports = {
  mode: 'production',
  entry: './src/widget/standalone.tsx',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'widget.min.js',
    library: 'E1Widget',
    libraryTarget: 'umd',
    globalObject: 'this',
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              [
                '@babel/preset-env',
                {
                  targets: '> 0.25%, not dead',
                  modules: false,
                },
              ],
              [
                '@babel/preset-react',
                {
                  runtime: 'automatic',
                },
              ],
              '@babel/preset-typescript',
            ],
          },
        },
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: [
                  ['autoprefixer', {}],
                  [
                    'cssnano',
                    {
                      preset: [
                        'default',
                        {
                          discardComments: {
                            removeAll: true,
                          },
                        },
                      ],
                    },
                  ],
                ],
              },
            },
          },
        ],
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
      // Use preact for smaller bundle size (optional)
      // 'react': 'preact/compat',
      // 'react-dom': 'preact/compat',
    },
    fallback: {
      'process': require.resolve('process/browser'),
      'buffer': require.resolve('buffer'),
      'util': require.resolve('util'),
      'url': require.resolve('url'),
      'path': require.resolve('path-browserify'),
      'stream': require.resolve('stream-browserify'),
      'crypto': require.resolve('crypto-browserify'),
      'http': require.resolve('stream-http'),
      'https': require.resolve('https-browserify'),
      'os': require.resolve('os-browserify/browser'),
      'fs': false,
      'net': false,
      'tls': false,
    },
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: 'widget.min.css',
    }),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production'),
      'process.env': JSON.stringify({}),
    }),
    new webpack.ProvidePlugin({
      process: 'process/browser',
    }),
  ],
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: true,
            drop_debugger: true,
          },
          mangle: true,
          format: {
            comments: false,
          },
        },
        extractComments: false,
      }),
      new CssMinimizerPlugin(),
    ],
  },
  performance: {
    maxEntrypointSize: 250000, // 250kb
    maxAssetSize: 250000,
    hints: 'warning',
  },
};
