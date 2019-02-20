'use strict';

/*!
 * V4Fire Client Core
 * https://github.com/V4Fire/Client
 *
 * Released under the MIT license
 * https://github.com/V4Fire/Client/blob/master/LICENSE
 */

const
	config = include('config/default');

module.exports = config.createConfig({dirs: [__dirname, 'client']}, {
	__proto__: config,

	api: {
		proxy: false
	},

	externals: {
		'raven-js': 'Raven'
	}
});
