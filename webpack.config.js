const path = require('path');
const FileManagerPlugin = require('filemanager-webpack-plugin');
const webpack = require('webpack');

module.exports = {
  entry: './dev/js/SmartSearch/hcSmartSearch.js',
  mode: "production",
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'hcSmartSearch.min.js',
    library: 'hcSmartSearch', //add this line to enable re-use
  },
  plugins: [
    new webpack.DefinePlugin({
      __VERSION__: JSON.stringify(require("./package.json").version)
    }),
    new FileManagerPlugin({
      events: {
        onEnd: {
          copy: [
            {
              source: path.join(__dirname, 'dev/css/hcSmartSearchUI.css'),
              destination: path.join(__dirname, 'dist/hcSmartSearchUI.css')
            }
          ]
        }
      }
    })
  ]
};
