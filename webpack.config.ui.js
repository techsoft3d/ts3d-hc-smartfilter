const path = require('path');

module.exports = {
  entry: './dev/js/smartFilterUI/sfui.js',
  mode: "production",
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'smartFilterUI.min.js',
    library: 'SFUI', //add this line to enable re-use
  },
};
