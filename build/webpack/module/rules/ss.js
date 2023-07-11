/*!
 * V4Fire Client Core
 * https://github.com/V4Fire/Client
 *
 * Released under the MIT license
 * https://github.com/V4Fire/Client/blob/master/LICENSE
 */

'use strict';

const
	config = require('@config/config');

const
	snakeskin = config.snakeskin(),
	monic = config.monic();

const
	{inherit} = include('build/helpers');

/**
 * Returns webpack rules for the snakeskin files
 *
 * @returns {import('webpack').RuleSetRule}
 */
module.exports = function snakeskinRules() {
	return {
		test: /\.ss$/,
		use: [
			{
				loader: 'monic-loader',
				options: inherit(monic.javascript, {
					replacers: [include('build/monic/dynamic-component-import')]
				})
			},

			{
				loader: 'snakeskin-loader',
				options: snakeskin.client
			}
		]
	};
};
