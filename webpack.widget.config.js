const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const webpack = require('webpack');

module.exports = {
  mode: 'production', // Production mode for better performance
  entry: './src/widget/standalone-widget.tsx',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'e1-calculator-widget.min.js',
    library: {
      name: 'E1Calculator',
      type: 'umd',
      export: 'default',
    },
    globalObject: 'this',
    clean: true,
  },
  module: {
    rules: [
      // Use null-loader for files that shouldn't be included in widget
      {
        test: /supabase\.ts$/,
        use: 'null-loader'
      },
      {
        test: /session-data-table\.ts$/,
        use: 'null-loader'
      },
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
            compact: false, // Preserve UTF-8 characters
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
      filename: 'e1-calculator-widget.min.css',
    }),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production'),
      'process.env.NEXT_PUBLIC_SUPABASE_URL': JSON.stringify(process.env.NEXT_PUBLIC_SUPABASE_URL || ''),
      'process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY': JSON.stringify(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''),
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
            ascii_only: false, // Preserve UTF-8 characters
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
