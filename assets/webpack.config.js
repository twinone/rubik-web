var webpack = require("webpack");

module.exports = {
    entry: "./main",
    output: {
        path: __dirname + "/../build",
        filename: "bundle.js"
    },
    module: {
        loaders: [
            { test: /\.css$/, loader: "style!css" }
        ],
        plugins: [
            new webpack.optimize.UglifyJsPlugin()
        ]
    }
};
