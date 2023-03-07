const path = require('path');

module.exports = {
  entry: './dev/js/smartFilterUI/hcSmartFilterUI.js',
  mode: "production",
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'smartFilterUI.min.js',
    library: 'hcSmartFilterUI', //add this line to enable re-use
  },
};
