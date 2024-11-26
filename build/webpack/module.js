'use strict';

/*!
 * V4Fire Client Core
 * https://github.com/V4Fire/Client
 *
 * Released under the MIT license
 * https://github.com/V4Fire/Client/blob/master/LICENSE
 */

const
	config = require('@config/config'),
	MiniCssExtractPlugin = require('mini-css-extract-plugin');

const
	path = require('upath'),
	projectGraph = include('build/graph');

const
	{webpack} = config,
	{resolve} = require('@pzlr/build-core');

const
	{isExternalDep} = include('build/const'),
	{hashRgxp, hash, output, assetsOutput, inherit} = include('build/helpers');

const
	typescript = config.typescript(),
	tsTransformers = include('build/ts-transformers');

const
	snakeskin = config.snakeskin(),
	monic = config.monic(),
	imageOpts = config.imageOpts();

const urlLoaderOpts = {
	name: path.basename(assetsOutput),
	outputPath: path.dirname(assetsOutput),
	limit: webpack.optimize.dataURILimit(),
	encoding: true,
	esModule: false
};

const urlLoaderInlineOpts = {
	...urlLoaderOpts,
	limit: undefined
};

const isTsFile = /\.ts$/,
	isJsFile = /\.js$/;

/**
 * Returns options for `webpack.module`
 *
 * @param {!Map} plugins - list of plugins
 * @returns {!Promise<Object>}
 */
module.exports = async function module({plugins}) {
	const
		g = await projectGraph,
		isProd = webpack.mode() === 'production';

	const loaders = {
		rules: new Map()
	};

	const tsHelperLoaders = [
		{
			loader: 'symbol-generator-loader',
			options: {
				modules: [resolve.blockSync(), resolve.sourceDir, ...resolve.rootDependencies]
			}
		},

		'prelude-loader',

		{
			loader: 'monic-loader',
			options: inherit(monic.typescript, {
				replacers: [
						include('build/monic/attach-component-dependencies'),
						include('build/monic/require-context'),
						include('build/monic/super-import'),
						include('build/monic/ts-import'),
						include('build/monic/dynamic-component-import')
					]
			})
		}
	];

	loaders.rules.set('ts', {
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

			...tsHelperLoaders
		]
	});

	const jsHelperLoaders = [
		'prelude-loader',

		{
			loader: 'monic-loader',
			options: inherit(monic.javascript, {
				replacers: [
					include('build/monic/require-context'),
					include('build/monic/super-import'),
					include('build/monic/dynamic-component-import')
				]
			})
		}
	];

	loaders.rules.set('js', {
		test: isJsFile,
		exclude: isExternalDep,
		use: jsHelperLoaders
	});

	plugins.set('extractCSS', new MiniCssExtractPlugin(inherit(config.miniCssExtractPlugin(), {
		filename: `${hash(output, true)}.css`,
		chunkFilename: '[id].css'
	})));

	const styleHelperLoaders = (isStatic) => {
		const
			useLink = /linkTag/i.test(config.style().injectType),
			usePureCSSFiles = isStatic || useLink;

		return [].concat(
			usePureCSSFiles ? MiniCssExtractPlugin.loader : [],

			[
				{
					loader: 'css-loader',
					options: {
						...config.css(),
						importLoaders: 1
					}
				},

				'svg-transform-loader/encode-query',

				{
					loader: 'postcss-loader',
					options: inherit(config.postcss(), {
						postcssOptions: {
							plugins: [].concat(
								require('autoprefixer')(config.autoprefixer()),

								webpack.mode() === 'production' && !usePureCSSFiles ?
									require('cssnano')(config.cssMinimizer().minimizerOptions) :
									[]
							)
						}
					})
				},

				{
					loader: 'stylus-loader',
					options: inherit(config.stylus(), {
						stylusOptions: {
							use: include('build/stylus')
						}
					})
				}
			]
		);
	};

	const staticCSSFiles = [].concat(
		styleHelperLoaders(true),

		{
			loader: 'monic-loader',
			options: inherit(monic.stylus, {
				replacers: [
					require('@pzlr/stylus-inheritance')({resolveImports: true}),
					include('build/monic/project-name')
				]
			})
		}
	);

	// Load via import() functions
	const dynamicCSSFiles = [].concat(
		{
			loader: 'style-loader',
			options: config.style()
		},

		styleHelperLoaders(),

		{
			loader: 'monic-loader',
			options: inherit(monic.stylus, {
				replacers: [
					require('@pzlr/stylus-inheritance')({resolveImports: true}),
					include('build/monic/project-name'),
					include('build/monic/apply-dynamic-component-styles')
				]
			})
		}
	);

	loaders.rules.set('styl', {
		test: /\.styl$/,

		...webpack.dynamicPublicPath() ?
			{use: dynamicCSSFiles} :

			{
				oneOf: [
					{resourceQuery: /static/, use: staticCSSFiles},
					{use: dynamicCSSFiles}
				]
			}
	});

	loaders.rules.set('ess', {
		test: /\.ess$/,
		use: [
			{
				loader: 'file-loader',
				options: {
					name: `${output.replace(hashRgxp, '')}.html`
				}
			},

			{
				loader: 'monic-loader',
				options: inherit(monic.html, {
					replacers: [
						include('build/monic/include'),
						include('build/monic/dynamic-component-import')
					]
				})
			},

			{
				loader: 'snakeskin-loader',
				options: inherit(snakeskin.server, {
					exec: true,
					vars: {
						entryPoints: g.dependencies
					}
				})
			}
		]
	});

	loaders.rules.set('ss', {
		test: /\.ss$/,
		use: [
			'prelude-loader',

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
	});

	const assetsHelperLoaders = (inline) => [
		{
			loader: 'url-loader',
			options: inline ? urlLoaderInlineOpts : urlLoaderOpts
		}
	];

	loaders.rules.set('assets', {
		test: /\.(?:ttf|eot|woff|woff2|mp3|ogg|aac)$/,

		oneOf: [
			{
				resourceQuery: /inline/,
				use: assetsHelperLoaders(true)
			},

			{use: assetsHelperLoaders()}
		]
	});

	const imgHelperLoaders = (inline) => [
		{
			loader: 'url-loader',
			options: inline ? urlLoaderInlineOpts : urlLoaderOpts
		}
	].concat(
		isProd ? {loader: 'image-webpack-loader', options: Object.reject(imageOpts, ['webp'])} : []
	);

	loaders.rules.set('img', {
		test: /\.(?:ico|png|gif|jpe?g)$/,

		oneOf: [
			{
				resourceQuery: /inline/,
				use: imgHelperLoaders(true)
			},

			{use: imgHelperLoaders()}
		]
	});

	const webpHelperLoaders = (inline) => [
		{
			loader: 'url-loader',
			options: inline ? urlLoaderInlineOpts : urlLoaderOpts
		}
	].concat(
		isProd ? {loader: 'image-webpack-loader', options: imageOpts} : []
	);

	loaders.rules.set('img.webp', {
		test: /\.webp$/,
		oneOf: [
			{
				resourceQuery: /inline/,
				use: webpHelperLoaders(true)
			},

			{use: webpHelperLoaders()}
		]
	});

	const svgHelperLoaders = (inline) => [
		{
			loader: 'svg-url-loader',
			options: inline ? urlLoaderInlineOpts : urlLoaderOpts
		},
		{
			loader: 'svg-transform-loader'
		}
	].concat(
		isProd ? {loader: 'svgo-loader', options: imageOpts.svgo} : []
	);

	loaders.rules.set('img.svg', {
		test: /\.svg(\?.*)?$/,
		oneOf: [
			{
				resourceQuery: /inline/,
				use: svgHelperLoaders(true)
			},

			{use: svgHelperLoaders()}
		]
	});

	return loaders;
};

Object.assign(module.exports, {
	urlLoaderOpts,
	isNotTSWorker: isTsFile,
	isNotJSWorker: isJsFile
});
