/*!
 * V4Fire Client Core
 * https://github.com/V4Fire/Client
 *
 * Released under the MIT license
 * https://github.com/V4Fire/Client/blob/master/LICENSE
 */

'use strict';

const
	config = require('@config/config'),
	{resolve} = require('@pzlr/build-core');

const
	{isExternalDep} = include('build/const'),
	{isTsFile} = include('build/webpack/module/const');

const
	{webpack} = config,
	tsTransformers = include('build/ts-transformers');

const
	typescript = config.typescript(),
	monic = config.monic();

const
	{inherit} = include('build/helpers');

/**
 * Returns webpack rules for the typescript files
 *
 * @returns {import('webpack').RuleSetRule}
 */
module.exports = function tsRules() {
	const fatHTML = webpack.fatHTML();

	return {
		test: isTsFile,
		exclude: isExternalDep,
		use: [
			{
				loader: 'ts-loader',
				options: {
					...typescript.client,
					getCustomTransformers: tsTransformers
				}
			},

			{
				loader: 'symbol-generator-loader',
				options: {
					modules: [resolve.blockSync(), resolve.sourceDir, ...resolve.rootDependencies]
				}
			},

			{
				loader: 'monic-loader',
				options: inherit(monic.typescript, {
					replacers: [].concat(
						fatHTML ?
							[] :
							include('build/monic/attach-component-dependencies'),

						[
							include('build/monic/require-context'),
							include('build/monic/super-import'),
							include('build/monic/ts-import'),
							include('build/monic/dynamic-component-import')
						]
					)
				})
			}
		]
	};
};