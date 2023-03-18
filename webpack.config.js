const path = require('path');

module.exports = {
  entry: './dev/js/sQuery/hcSQuery.js',
  mode: "production",
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'squery.min.js',
    library: 'hcSQuery', //add this line to enable re-use
  },
};
