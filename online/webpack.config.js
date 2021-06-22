const { resolve } = require("path");

module.exports = {
  mode: "development",
  entry: "./node_modules/poemd/lib/main.js",
  output: {
    path: resolve(__dirname, "./dist"),
    filename: "bundle.js",
    library: "poemd"
  },
  resolve: {
    alias: {
      util: false
    }
  }
};
