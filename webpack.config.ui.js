const path = require('path');
const FileManagerPlugin = require('filemanager-webpack-plugin');

module.exports = {
  entry: './dev/js/sQueryUI/hcSQueryUI.js',
  mode: "production",
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'squeryui.min.js',
    library: 'hcSQueryUI', //add this line to enable re-use
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
