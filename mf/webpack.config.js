const HtmlWebpackPlugin = require('html-webpack-plugin');
const ModuleFederationPlugin = require('webpack').container.ModuleFederationPlugin;
const path = require('path');
const deps = require('./package.json').dependencies;
const webpack = require('webpack');
/**
 * dotenv here is only used when running `npm run build && npm run start` outside of Docker
 * it could potentially be removed
 */
require('dotenv').config();

module.exports = {
  entry: './src/index',
  mode: 'development',
  devtool: 'source-map',
  devServer: {
    contentBase: path.join(__dirname, 'dist'),
    host: '0.0.0.0',
    port: 9001,
    historyApiFallback: true,
    hot: false,
    hotOnly: false,
    disableHostCheck: true,
  },
  resolve: {
    alias: {
      GlobalComponents: path.resolve(__dirname, './src/components/'),
      Services: path.resolve(__dirname, './src/services/'),
      Constants: path.resolve(__dirname, './src/utils/constants'),
      Helpers: path.resolve(__dirname, './src/utils/helpers'),
      Svg: path.resolve(__dirname, './src/static/images/svg'),
    },
    extensions: ['.js', '.jsx'],
  },
  module: {
    rules: [
      {
        test: /\.m?js$/,
        type: 'javascript/auto',
        resolve: {
          fullySpecified: false,
        },
      },
      {
        test: /\.jsx?$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
        options: {
          presets: ['@babel/preset-react'],
        },
      },
      {
        test: /\.(jpg|png|woff|woff2|eot|ttf|svg)$/,
        use: {
          loader: 'url-loader?limit=100000',
        },
      },
      {
        test: /\.scss$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              importLoaders: 1,
              modules: true, //CSS modules integration for component level stylesheets
            },
          },
          {
            loader: 'sass-loader',
            options: {
              sourceMap: true,
            },
          },
        ],
      },
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': JSON.stringify(process.env),
    }),
    new ModuleFederationPlugin({
      name: 'mf',
      filename: 'remoteEntry.js',
      remotes: {
        shell: `shell@${process.env.CONTAINER_HOST}/remoteEntry.js`,
      },
      exposes: {
        './routes': './src/routes',
      },
      shared: [
        {
          ...deps,
          react: {
            singleton: true,
            requiredVersion: deps.react,
          },
          'react-dom': {
            singleton: true,
            requiredVersion: deps['react-dom'],
          },
        },
        // Workaround explaination: https://www.youtube.com/watch?v=-LNcpralkjM&t=540
      ],
    }),
    new HtmlWebpackPlugin({
      template: './public/index.html',
      title: 'MF',
    }),
  ],
  output: {
    publicPath: process.env.MF_HOST,
    chunkFilename: '[id].[contenthash].js',
  },
};
