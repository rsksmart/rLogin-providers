const path = require('path')

module.exports = {
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
  resolve: {
    extensions: ['.ts', '.js'],
    fallback: {
      util: require.resolve("util/"),
      url: require.resolve("url/"),
      buffer: require.resolve("buffer/"),
      stream: false 
    }
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
    libraryTarget: 'umd',
    library: "rLoginLedgerProvider",
    umdNamedDefine: true,
    globalObject: "this"
  }
}
