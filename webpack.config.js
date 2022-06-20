const path = require('path');

module.exports = {
  entry: './dev/js/smartFilter/sf.js',
  mode: "production",
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'smartFilter.min.js',
    library: 'SF', //add this line to enable re-use
  },
};
