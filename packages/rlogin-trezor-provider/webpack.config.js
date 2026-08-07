const path = require('path')
const webpack = require('webpack')

module.exports = {
  mode: 'production',
  entry: './src/index.ts',
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  // Trezor Connect is a singleton: it installs a window "message" listener and hands out
  // sequential request ids starting at 1. Bundling a private copy here put a second instance
  // on the page alongside the host application's own, and the two cross-resolved each other's
  // postMessage responses. Keeping it external makes the consumer's single copy authoritative,
  // and stops a stale Connect (with its own transitive dependencies) being frozen into dist/.
  externals: {
    '@trezor/connect-web': {
      commonjs: '@trezor/connect-web',
      commonjs2: '@trezor/connect-web',
      amd: '@trezor/connect-web',
      root: 'TrezorConnect'
    }
  },
  resolve: {
    extensions: ['.ts', '.js'],
    fallback: {
      stream: require.resolve('stream-browserify'),
      url: require.resolve('url/'),
      zlib: require.resolve('browserify-zlib'),
      https: require.resolve('https-browserify'),
      http: require.resolve('stream-http')
    }
  },
  plugins: [
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer']
    }),
    new webpack.DefinePlugin({ process: { env: { DEBUG: false } } })
  ],
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
    libraryTarget: 'umd',
    library: 'rLoginTrezorProvider',
    umdNamedDefine: true,
    globalObject: 'this'
  }
}
