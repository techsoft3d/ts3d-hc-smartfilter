const path = require('path');
const FileManagerPlugin = require('filemanager-webpack-plugin');

module.exports = {
  entry: './dev/js/sQuery/hcSQuery.js',
  mode: "production",
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'squery.min.js',
    library: 'hcSQuery', //add this line to enable re-use
  },
  plugins: [
    new FileManagerPlugin({
      events: {
        onEnd: {
          copy: [
            {
              source: path.join(__dirname, 'dev/css/squeryui.css'),
              destination: path.join(__dirname, 'dist/squeryui.css')
            }
          ]
        }
      }
    })
  ]
};
