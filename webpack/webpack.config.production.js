/**
 * Production
 *
 * @file webpack.config.production.js
 * @author Jérémy Levron <jeremylevron@19h47.fr> (https://19h47.fr)
 */

const CopyPlugin = require('copy-webpack-plugin');

const resolve = require('./webpack.utils');

module.exports = {
	mode: 'production',
	devtool: false,
	plugins: [
		new CopyPlugin({
			patterns: [{ from: resolve('level-slider.png'), to: resolve('docs/') }],
		}),
	],
};
