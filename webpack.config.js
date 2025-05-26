const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './src/js/main.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  mode: 'development',
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(png|jpg|gif)$/, 
        use: [{
          loader: 'file-loader',
          options: {
            name: '[name].[ext]',
            outputPath: 'img/'
          }
        }],
      },
      {
        test: /\.svg$/,
        use: [{
          loader: 'file-loader',
          options: {
            name: '[name].[ext]',
            outputPath: 'img/svg/'
          }
        }],
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/, 
        use: [{
          loader: 'file-loader',
          options: {
            name: '[name].[ext]',
            outputPath: 'fonts/'
          }
        }],
      },
      {
        test: /\.s[ac]ss$/i,
        use: [
          'style-loader',
          'css-loader',
          {
            loader: 'sass-loader',
            options: {
              // Предпочтительно использовать Dart Sass
              implementation: require('sass'),
              sassOptions: {
                includePaths: [path.resolve(__dirname, 'src/scss')],
              },
            },
          },
        ],
      },
    ],
  },
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist'), 
    },
    compress: true,
    port: 9000, 
    open: true, // автоматически открыть браузер
    hot: true   // включить горячую замену модулей
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html', // указываем шаблон HTML
      filename: 'index.html',       // имя выходного файла
    }),
  ],
};