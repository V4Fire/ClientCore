'use strict';

/*!
 * V4Fire Client Core
 * https://github.com/V4Fire/Client
 *
 * Released under the MIT license
 * https://github.com/V4Fire/Client/blob/master/LICENSE
 */

const
	$C = require('collection.js');

const
	config = require('@config/config'),
	webpack = require('webpack');

const AsyncChunksPlugin = include('build/webpack/plugins/async-chunks-plugin');

/**
 * Returns options for `webpack.plugins`
 * @returns {!Map}
 */
module.exports = async function plugins({name}) {
	const
		globals = include('build/globals.webpack');

	const
		DependenciesPlugin = include('build/webpack/plugins/dependencies'),
		createProgressPlugin = include('build/webpack/plugins/progress-plugin'),
		IgnoreInvalidWarningsPlugin = include('build/webpack/plugins/ignore-invalid-warnings'),
		I18NGeneratorPlugin = include('build/webpack/plugins/i18n-plugin'),
		InvalidateExternalCachePlugin = include('build/webpack/plugins/invalidate-external-cache'),
		StatoscopeWebpackPlugin = require('@statoscope/webpack-plugin').default;

	const plugins = new Map([
		['globals', new webpack.DefinePlugin(await $C(globals).async.map())],
		['dependencies', new DependenciesPlugin()],
		['ignoreNotFoundExport', new IgnoreInvalidWarningsPlugin()],
		['i18nGeneratorPlugin', new I18NGeneratorPlugin()],
		['invalidateExternalCache', new InvalidateExternalCachePlugin()]
	]);

	const
		statoscopeConfig = config.statoscope();

	if (statoscopeConfig.enabled) {
		plugins.set(
			'statoscope-webpack-plugin',
			new StatoscopeWebpackPlugin(statoscopeConfig.webpackPluginConfig)
		);
	}

	if (config.webpack.progress()) {
		plugins.set('progress-plugin', createProgressPlugin(name));
	}

	if (config.webpack.fatHTML()) {
		plugins.set('async-chunk-plugin', new AsyncChunksPlugin());
	}

	return plugins;
};
