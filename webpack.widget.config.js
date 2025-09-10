const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const webpack = require('webpack');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  
  // Base configuration shared between both builds
  const getBaseConfig = (cssMode) => ({
    mode: isProduction ? 'production' : 'development',
    entry: {
      'e1-calculator-widget': './src/widget/enhanced-standalone-widget.tsx',
      'wordpress-loader': './src/widget/wordpress-loader.js',
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: cssMode === 'namespaced' ? '[name].namespaced.js' : '[name].min.js',
      library: {
        name: 'E1Calculator',
        type: 'umd',
        export: 'E1CalculatorWidget',
      },
      globalObject: 'this',
      clean: cssMode === 'shadow', // Clean only on first build
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
        // Raw CSS imports for Shadow DOM injection
        {
          test: /\.css$/,
          resourceQuery: /raw/,
          type: 'asset/source',
        },
        {
          test: /\.css$/,
          exclude: [
            /\.css\?raw$/
          ],
          use: [
            MiniCssExtractPlugin.loader,
            {
              loader: 'css-loader',
              options: {
                modules: {
                  auto: true,
                  localIdentName: isProduction 
                    ? 'e1w_[hash:base64:5]'
                    : '[name]__[local]___[hash:base64:5]',
                },
              },
            },
            {
              loader: 'postcss-loader',
              options: {
                postcssOptions: {
                  plugins: [
                    require('autoprefixer'),
                    // Add prefixwrap only for namespaced build
                    ...(cssMode === 'namespaced' ? [
                      require('postcss-prefixwrap')('.e1-calculator-isolated-root', {
                        ignoredSelectors: [':root', 'html', 'body', ':host'],
                        prefixRootTags: true,
                      })
                    ] : []),
                    // Minification for production
                    ...(isProduction ? [
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
                    ] : [])
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
        filename: cssMode === 'namespaced' 
          ? 'widget-namespaced.min.css' 
          : '[name].min.css',
      }),
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(isProduction ? 'production' : 'development'),
        'process.env.NEXT_PUBLIC_SUPABASE_URL': JSON.stringify(process.env.NEXT_PUBLIC_SUPABASE_URL || ''),
        'process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY': JSON.stringify(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''),
      }),
      new webpack.ProvidePlugin({
        process: 'process/browser',
      }),
    ],
    optimization: {
      minimize: isProduction,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            format: {
              comments: false,
            },
          },
          extractComments: false,
        }),
        new CssMinimizerPlugin(),
      ],
    },
    externals: {},
    performance: {
      maxEntrypointSize: 300000, // 300kb
      maxAssetSize: 300000,
      hints: 'warning',
    },
  });

  // Return array of configurations for multi-build
  return [
    // Shadow DOM build (normal CSS)
    {
      ...getBaseConfig('shadow'),
      name: 'shadow-dom',
    },
    // Namespace build (prefixed CSS)
    {
      ...getBaseConfig('namespaced'),
      name: 'namespaced',
      // Avoid conflicting JS outputs by only emitting CSS for namespaced build
      optimization: {
        ...getBaseConfig('namespaced').optimization,
        // Don't emit JS files for the namespaced build, only CSS
        splitChunks: {
          cacheGroups: {
            styles: {
              name: 'styles',
              type: 'css/mini-extract',
              chunks: 'all',
              enforce: true,
            },
          },
        },
      },
    },
  ];
};