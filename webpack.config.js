const path = require('path');

module.exports = {
  entry: './dev/js/smartFilter/hcSmartFilter.js',
  mode: "production",
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'smartFilter.min.js',
    library: 'hcSmartFilter', //add this line to enable re-use
  },
};
