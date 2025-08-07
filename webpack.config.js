const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const Dotenv = require("dotenv-webpack");
const webpack = require("webpack");

module.exports = {
  mode: "development",
  entry: ["./src/index.js"],
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "build"), // Changed to 'build'
    publicPath: "/", // Ensures proper handling of asset paths
  },
  resolve: {
    modules: ["src", "node_modules"],
    alias: {
      components: path.resolve(__dirname, "src/components"),
      providers: path.resolve(__dirname, "src/providers"),
      views: path.resolve(__dirname, "src/views"),
      services: path.resolve(__dirname, "src/services"),
      utils: path.resolve(__dirname, "src/utils"),
    },
    extensions: [".tsx", ".ts", ".js", ".jsx", ".svg", ".css", ".json", ".psd"],
    fallback: {
      fs: false,
      os: false,
      path: false,
      http: false,
      https: false,
      zlib: false,
      stream: false,
    },
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-react"],
            sourceMaps: true,
          },
        },
      },
      {
        enforce: "pre",
        test: /\.js$/,
        loader: "source-map-loader",
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
      {
        test: /\.(png|jpe?g|gif|svg)$/i,
        use: [
          {
            loader: "file-loader",
            options: {
              name: "[path][name].[ext]",
            },
          },
        ],
      },
      {
        test: /\.psd$/,
        use: [
          {
            loader: "file-loader",
            options: {
              name: "[name].[ext]",
              outputPath: "assets/",
            },
          },
        ],
      },
    ],
  },
  plugins: [
    new CleanWebpackPlugin(), // Ensures the 'build' folder is cleaned
    new HtmlWebpackPlugin({
      title: "Sky Demo",
      template: __dirname + "/src/index.html",
      inject: "body",
      filename: "index.html", // Ensures the correct filename is used in the build
    }),
    new MiniCssExtractPlugin({
      filename: "[name].css",
      chunkFilename: "[id].css",
    }),
    new Dotenv(),
    new webpack.HotModuleReplacementPlugin(),
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, "build"), // Serve files from 'build'
    },
    historyApiFallback: true, // Enable SPA routing
    port: 8443,
    hot: true,
    proxy: [
      {
        context: ["/api"],
        target: "https://localhost:3000",
        changeOrigin: true,
        secure: false,
      },
    ],
  },
  devtool: "inline-source-map",
  performance: {
    hints: false,
  },
  stats: {
    modules: false,
    warnings: false,
  },
};
