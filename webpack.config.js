const fs = require('fs');
const path = require('path');

const outputPath = path.resolve(__dirname, 'lib');
const entriesRootDir = path.resolve(__dirname, 'src', 'entries');
const getEntries = () => {
  try {
    return fs.readdirSync(entriesRootDir)
      .reduce((acc, file) => {
        const name = file.replace(/\.[tj]sx?$/, '');
        acc[name] = path.resolve(entriesRootDir, file);
        return acc;
      }, {});
  } catch (err) {
    console.error('Failed to get webpack entries!', err);
  }
};

module.exports = (env) => {
  const isDev = env.dev;

  return {
    target: 'node',
    entry: getEntries(),
    output: {
      path: outputPath,
      filename: '[name].js',
    },
    mode: isDev ? 'development' : 'production',
    devtool: isDev ? 'source-map' : undefined,
    watch: !!isDev,
    optimization: {
      splitChunks: {
        cacheGroups: {
          commons: {
            test: /[\\/]node_modules[\\/]/,
            name: `vendors`,
            chunks: 'all',
          },
        },
      },
      minimize: !isDev,
    },
    module: {
      rules: [
        {
          test: /(?<!\.d)\.tsx?$/,
          exclude: /node_modules/,
          use: [
            {
              loader: 'ts-loader',
            },
          ],
        },
        {
          test: /\.d\.tsx?$/,
          loader: 'ignore-loader'
        },
        {
          test: /\.(icns|png|gif|jpe?g)$/,
          use: [
            {
              loader: 'file-loader',
              options: {
                name: '[name].[ext]',
                outputPath: 'icons',
                publicPath: './lib/icons',
              },
            },
            'img-loader',
          ],
          type: 'javascript/auto',
        },
      ]
    },
    plugins: [],
    resolve: {
      extensions: ['.tsx', '.ts', '.js'],
    }
  };
};



