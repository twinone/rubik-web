var env = process.env["NODE_ENV"];
var webpack = require("webpack");


var assets = "./assets";
var config = {
    entry: assets + "/main",
    output: {
        path: __dirname + "/build",
        filename: "bundle.js",
        publicPath: "/build/"
    },
    module: {
        loaders: [
            { test: /assets\/\.css$/, loader: "style!css" },
            { test: /assets\/\main.js$/, loader: 'expose-loader?cube' }
        ]
    },
    plugins: [
    ]

};

if (env === "production") {
    config.plugins.push(new webpack.optimize.UglifyJsPlugin());
}

module.exports = config;
