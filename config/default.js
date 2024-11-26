'use strict';

/*!
 * V4Fire Client Core
 * https://github.com/V4Fire/Client
 *
 * Released under the MIT license
 * https://github.com/V4Fire/Client/blob/master/LICENSE
 */

const
	config = require('@v4fire/core/config/default'),
	pzlr = require('@pzlr/build-core');

const
	fs = require('fs'),
	path = require('upath');

const
	o = require('@v4fire/config/options').option;

const
	{nanoid} = require('nanoid');

module.exports = config.createConfig({dirs: [__dirname, 'client']}, {
	__proto__: config,

	/**
	 * Name of the used MVVM library, like Vue or React
	 *
	 * @cli engine
	 * @env ENGINE
	 *
	 * @param {string=} [def] - default value
	 * @returns {string}
	 */
	engine(def = 'vue') {
		return o('engine', {
			env: true,
			default: def,
			validate(v) {
				return Boolean({
					vue: true,
					zero: true
				}[v]);
			}
		});
	},

	/** @inheritDoc */
	build: {
		/**
		 * True, if the build process is running within CI
		 *
		 * @cli build_ci
		 * @env BUILD_CI
		 *
		 * @type {boolean}
		 */
		ci: o('build_ci', {
			env: true,
			default: Boolean(process.env.CI)
		}),

		/**
		 * List of entries to build.
		 * The entries are taken from the "core/entries" directory.
		 *
		 * You can use this parameter when you develop some particular chunk and don't want to build the whole application,
		 * because it may slow down the build time.
		 *
		 * @cli entries
		 * @env ENTRIES
		 *
		 * @type {string}
		 *
		 * @example
		 * ```bash
		 * # Build only entries foo and bar
		 * npx webpack --env entries=foo,bar
		 * ```
		 */
		entries: o('entries', {
			env: true,
			coerce: (v) => v ? v.split(',') : []
		}),

		/**
		 * The number of available CPUs that can be used with application building
		 *
		 * @cli processes
		 * @env PROCESSES
		 *
		 * @type {number}
		 * @default `require('os').cpus().length - 1`
		 */
		processes: o('processes', {
			env: true,
			short: 'p',
			type: 'number',
			default: require('os').cpus().length - 1
		}),

		/**
		 * Returns a prefix for the `components-lock.json` file.
		 * When you have different components loc files related to some execute parameters,
		 * you need to keep them separately.
		 *
		 * @cli component-lock-prefix
		 * @env COMPONENT_LOCK_PREFIX
		 *
		 * @returns {string}
		 */
		componentLockPrefix(def = this.config.webpack.fatHTML() ? 'fat-html' : '') {
			return o('component-lock-prefix', {
				env: true,
				default: def
			});
		},

		/**
		 * Every client build starts with calculating the project graph.
		 * The graph contains information about entry points, dependencies, and other stuff.
		 * This information is used by WebPack to deduplicate code blocks and optimize building,
		 * but the process of graph calculation may take time.
		 *
		 * This option enables that the graph can be taken from the previous build if it exists.
		 * Mind, the invalid graph can produce to the broken build of the application.
		 *
		 * @cli build-graph-from-cache
		 * @env BUILD_GRAPH_FROM_CACHE
		 *
		 * @type {boolean}
		 * @default `false`
		 */
		buildGraphFromCache: o('build-graph-from-cache', {
			env: true,
			type: 'boolean'
		}),

		/**
		 * Returns a list of components to build within the demo page (pages/p-v4-components-demo).
		 * The list contains objects with default properties for each specified component.
		 *
		 * ```js
		 * [
		 *   {name: 'b-button', attrs: {':theme': "'demo'"}, content: {default: 'Hello world'}},
		 *   {name: 'b-select', attrs: {':theme': "'demo'"}}
		 * ]
		 * ```
		 *
		 * To specify the default properties for a component demo, you should create a "demo.js" file and
		 * place it with the component directory, for instance, "b-button/demo.js":
		 *
		 * ```js
		 * module.exports = [
		 *   {
		 *     // Within "attrs" you can specify attributes that will be passed to the component
		 *     attrs: {':theme': "'demo'"},
		 *
		 *     // Within "content" you can specify slots that will be passed to the component
		 *     content: {default: 'Hello world'}
		 *   }
		 * ];
		 * ```
		 *
		 * Every object from the list represents one instance of a component,
		 * i.e. to create two or more examples of a component with different attributes just add more objects to the list.
		 *
		 * ```js
		 * module.exports = [
		 *   {
		 *     attrs: {':theme': "'demo'"},
		 *     content: {default: 'Hello world'}
		 *   },
		 *
		 *   {
		 *     attrs: {':theme': "'demo2'"}
		 *   }
		 * ];
		 * ```
		 *
		 * @cli components
		 * @env COMPONENTS
		 *
		 * @type {!Array<{name: string, args?: Object, content?: Object}>}
		 *
		 * @example
		 * ```bash
		 * # Build the demo page with b-button and b-select
		 * npx webpack --env components=b-button,b-select
		 * ```
		 */
		components: o('components', {
			env: true,
			coerce: (v) => {
				const
					args = require('arg')({'--suit': String}, {permissive: true});

				try {
					const
						obj = JSON.parse(v);

					if (Object.isArray(obj)) {
						return obj;
					}

					return [Object.isDictionary(obj) ? obj : {name: obj}];

				} catch {}

				if (!v) {
					return [];
				}

				return v
					.split(',')
					.flatMap((name) => {
						try {
							const
								demo = require(pzlr.resolve.blockSync(`${name}/demo.js`)),
								suit = (args['--suit'] || 'demo').camelize(false);

							const
								wrap = (d) => [].concat((d || []).map((p) => ({name, ...p})));

							if (Object.isDictionary(demo)) {
								return wrap(demo[suit]);
							}

							return wrap(demo);

						} catch {}

						return {name};
					});
			}
		}),

		/**
		 * A name of the component to build demo examples or tests
		 *
		 * @cli demo-page
		 * @env DEMO_PAGE
		 *
		 * @returns {string}
		 */
		demoPage() {
			return o('demo-page', {
				env: true,
				default: 'p-v4-components-demo'
			});
		},

		/**
		 * Port for a test server
		 * @env TEST_PORT
		 */
		testPort: o('test-port', {
			env: true,
			default: 8000
		}),

		/**
		 * Enables the special kind of demo page to build with
		 * the feature of component inspection by using the "bV4ComponentDemo" component.
		 *
		 * The inspection mode allows us to see all component modifiers/props and dynamically change it.
		 *
		 * @cli inspect-components
		 * @env INSPECT_COMPONENTS
		 *
		 * @type {boolean}
		 */
		inspectComponents: o('inspect-components', {
			env: true,
			type: 'boolean'
		}),

		/**
		 * Project build mode
		 *
		 * @cli build-mode
		 * @env BUILD_MODE
		 *
		 * @param {string=} [def] - default value
		 * @returns {string}
		 */
		mode(def = IS_PROD ? 'production' : 'development') {
			return o('build-mode', {
				env: true,
				default: def
			});
		},

		/**
		 * This option is used with component test files.
		 *
		 * For instance, you have the "b-button/test.js" file that contains tests for the component.
		 * You may export one function to call to run tests, or you can export an object where each key
		 * exports a function to test the component with different attributes.
		 * The value of "suit" refers to the key of the test function to invoke.
		 *
		 * See the "/test" folder for more details.
		 *
		 * @cli suit
		 * @env SUIT
		 *
		 * @type {string}
		 */
		suit: o('suit', {
			env: true,
			default: 'demo'
		}),

		/**
		 * Controls the level of verbosity in the project's build output.
		 * This parameter is useful for users who want to have more detailed information about the project's build.
		 *
		 * @cli verbose
		 * @env VERBOSE
		 */
		verbose: o('verbose', {
			env: true,
			default: false
		})
	},

	/**
	 * WebPack configuration
	 */
	webpack: {
		/**
		 * Returns an object of aliases
		 *
		 * @see https://webpack.js.org/configuration/resolve/#resolvealias
		 * @returns {Object}
		 */
		aliases() {
			return {
				dompurify: this.config.es().toLowerCase() === 'es5' ? 'dompurify-v2' : 'dompurify-v3'
			};
		},

		/**
		 * Returns a value of `mode`
		 *
		 * @cli mode
		 * @env MODE
		 *
		 * @param {string=} [def] - default value
		 * @returns {string}
		 */
		mode(def = IS_PROD ? 'production' : 'development') {
			return o('mode', {
				env: true,
				default: def
			});
		},

		/**
		 * Returns a value of `cache.type`
		 *
		 * @cli cache-type
		 * @env CACHE_TYPE
		 *
		 * @param {string=} [def] - default value
		 * @returns {string}
		 */
		cacheType(def = 'memory') {
			return o('cache-type', {
				env: true,
				default: def
			});
		},

		/**
		 * Returns a value of `target`
		 *
		 * @cli target
		 * @env TARGET
		 *
		 * @param {string=} [def] - default value
		 * @returns {?string}
		 */
		target(
			def = /ES[35]$/.test(this.config.es()) ?
				'browserslist:ie 11' :
				undefined
		) {
			return o('target', {
				env: true,
				default: def
			});
		},

		/**
		 * Returns parameters to show webpack build progress
		 *
		 * @cli progress
		 * @env PROGRESS
		 *
		 * @see https://github.com/npkgz/cli-progress
		 * @param [def] - default value
		 * @returns {Object}
		 */
		progress(def = true) {
			const enabled = o('progress', {
				env: true,
				default: def,
				type: 'boolean'
			});

			if (enabled) {
				return {
					opts: {
						clearOnComplete: true,
						stopOnComplete: true,
						forceRedraw: true,
						noTTYOutput: this.config.build.ci,
						hideCursor: null
					}
				};
			}
		},

		/**
		 * Returns a value of `devtool`
		 *
		 * @cli devtool
		 * @env DEVTOOL
		 *
		 * @param {string=} [def] - default value
		 * @returns {?string}
		 */
		devtool(def) {
			return o('devtool', {
				env: true,
				default: def
			});
		},

		/**
		 * Returns a value of `stats`
		 *
		 * @cli stats
		 * @env STATS
		 *
		 * @param {boolean=} [def] - default value
		 * @returns {(boolean|string|Object)}
		 */
		stats(def = true) {
			return o('stats', {
				env: true,
				type: 'json',
				default: def
			});
		},

		/**
		 * Returns the default hash algorithm to use
		 * @returns {?string}
		 */
		hashFunction() {
			return this.mode() !== 'production' || this.fatHTML() ? undefined : this.config.build.hashAlg;
		},

		/**
		 * Returns
		 *   * `1` if all assets from the build have to inline within HTML files;
		 *   * `2` if all scripts and links from the build have to inline within HTML files;
		 *   * `0` if assets from the build shouldn't inline within HTML files.
		 *
		 * @cli fat-html
		 * @env FAT_HTML
		 *
		 * @param {number=} [def] - default value
		 * @returns {number}
		 */
		fatHTML(def = 0) {
			return o('fat-html', {
				env: true,
				type: 'number',
				coerce: (value) => value === 'script-link' ? 2 : Number(value),
				default: def
			});
		},

		/**
		 * Returns true if all assets from the initial entry point have to inline within HTML files
		 *
		 * @cli inline-initial
		 * @env INLINE_INITIAL
		 *
		 * @param {boolean=} [def] - default value
		 * @returns {boolean}
		 */
		inlineInitial(def = false) {
			return o('inline-initial', {
				env: true,
				type: 'boolean',
				default: def
			});
		},

		/**
		 * Webpack options to optimize build
		 */
		optimize: {
			/**
			 * The minimum size of a chunk file in bytes that can be separated into a single file
			 *
			 * @cli optimize-min-chunk-size
			 * @env OPTIMIZE_MIN_CHUNK_SIZE
			 *
			 * @returns {(number|undefined)}
			 */
			minChunkSize: o('optimize-min-chunk-size', {
				env: true,
				type: 'number',
				default: 10 * 1024
			}),

			/**
			 * Returns parameters for `optimization.splitChunks`
			 * @returns {!Object}
			 */
			splitChunks() {
				return {};
			},

			/**
			 * Returns the maximum size of a file in bytes that can be inline as base64
			 *
			 * @cli optimize-data-uri-limit
			 * @env OPTIMIZE_DATA_URI_LIMIT
			 *
			 * @param {number=} [def] - default value
			 * @returns {(number|undefined)}
			 */
			dataURILimit(def = 2 * 1024) {
				const
					fatHTML = require('@config/config').webpack.fatHTML();

				if (fatHTML === true || fatHTML === 1) {
					return undefined;
				}

				return o('optimize-data-uri-limit', {
					env: true,
					type: 'number',
					default: def
				});
			}
		},

		/**
		 * Value of `externals`
		 */
		externals: {
			vue: 'Vue',
			eventemitter2: 'EventEmitter2',
			setimmediate: 'setImmediate'
		},

		/**
		 * An expression that provides a public path for assets within the runtime.
		 * If the value is provided as a boolean, it enables runtime modifications of `publicPath`,
		 * but takes a value from the static build parameter.
		 *
		 * @cli dynamic-public-path
		 * @env DYNAMIC_PUBLIC_PATH
		 *
		 * @param {(boolean|string)=} [def] - default value
		 * @returns {(?string|boolean)}
		 */
		dynamicPublicPath(def) {
			const v = o('dynamic-public-path', {
				env: true,
				default: def
			});

			try {
				return JSON.parse(v);

			} catch {
				return v;
			}
		},

		/**
		 * If true, a path to load assets can be defined in runtime via the `publicPath` query parameter
		 *
		 * @cli provide-public-path-with-query
		 * @env PROVIDE_PUBLIC_PATH_WITH_QUERY
		 * @default `true`
		 *
		 * @param {boolean=} [def] - default value
		 * @returns {boolean}
		 */
		providePublicPathWithQuery(def = true) {
			return Boolean(this.dynamicPublicPath() && o('provide-public-path-with-query', {
				env: true,
				type: 'boolean',
				default: def
			}));
		},

		/**
		 * Returns a value for `output.publicPath`.
		 * The method can take arguments that will be concatenated to the base value.
		 *
		 * @cli public-path
		 * @env PUBLIC_PATH
		 *
		 * @param args
		 * @returns {string}
		 *
		 * @example
		 * ```bash
		 * npx webpack --env public-path=/s3/hash
		 *
		 * # For local build without a static server
		 * npx webpack --env public-path
		 * ```
		 *
		 * ```js
		 * // PUBLIC_PATH = '/s3/hash'
		 * publicPath('foo', 'bar') // /s3/hash/foo/bar
		 * ```
		 */
		publicPath(...args) {
			const
				{concatURLs} = require('@v4fire/core/lib/core/url');

			let pathVal = o('public-path', {
				env: true,
				default: concatURLs('/', this.config.src.rel('clientOutput'))
			});

			if (!Object.isString(pathVal)) {
				pathVal = '';
			}

			if (pathVal[0] === '\\') {
				pathVal = pathVal.slice(1);
			}

			if (args.length) {
				args = args.map((el) => el.replace(/^\.?/, ''));

				if (pathVal && !/^(\w+:)?\/\//.test(args[0])) {
					return concatURLs(pathVal, ...args);
				}

				return concatURLs(...args);
			}

			if (pathVal) {
				return concatURLs(pathVal, '/').replace(/^[/]+/, '/');
			}

			return pathVal;
		},

		/**
		 * Returns a value for `output.filename`.
		 * The method can take an object with values to expand macros.
		 *
		 * @param params
		 * @returns {string}
		 *
		 * @example
		 * ```js
		 * output() // [hash]_[name]
		 * output({hash: 'foo', name: 'bla'}) // foo_bla
		 * ```
		 */
		output(params) {
			const
				res = this.mode() !== 'production' || this.fatHTML() ? '[name]' : '[hash]_[name]';

			if (params) {
				return res.replace(/_?\[(.*?)]/g, (str, key) => {
					if (params[key] != null) {
						return params[key];
					}

					return '';
				});
			}

			return res;
		},

		/**
		 * Returns a value for `DllPlugin.output.filename`.
		 * The method can take an object with values to expand macros.
		 *
		 * @param params
		 * @returns {string}
		 *
		 * @example
		 * ```js
		 * dllOutput() // [hash]_[name]
		 * dllOutput({hash: 'foo', name: 'bla'}) // foo_bla
		 * ```
		 */
		dllOutput(params) {
			return this.output(params);
		},

		/**
		 * Returns a value for `FileLoader.output.filename`.
		 * The method can take an object with values to expand macros.
		 *
		 * @param params
		 * @returns {string}
		 *
		 * @example
		 * ```js
		 * assetsOutput() // assets/[hash].[ext]
		 * assetsOutput({hash: 'foo'}) // assets/foo.[ext]
		 * ```
		 */
		assetsOutput(params) {
			const
				root = 'assets';

			if (this.mode() !== 'production' || this.fatHTML()) {
				return this.output({
					...params,
					name: `${root}/[path][name].[ext]`,
					hash: null
				});
			}

			return this.output({
				...params,
				hash: `${root}/[hash].[ext]`,
				name: null
			});
		},

		/**
		 * Returns path to the generated assets.json within the output directory.
		 * This file contains a JSON object with links to all JS/CSS files that are declared within "src/entries".
		 * The declaration solves the problem of connection between original files and compiled files:
		 * generated files may have different names (because of hash or other stuff) with original files.
		 *
		 * For instance:
		 *
		 * ```
		 * {
		 *  "index_style": {
		 *     "path": "index_style.css",
		 *     "publicPath": "index_style.css"
		 *  },
		 *  "index_tpl": {
		 *     "path": "index_tpl.js",
		 *     "publicPath": "index_tpl.js"
		 *  }
		 * }
		 * ```
		 *
		 * @returns {string}
		 */
		assetsJSON() {
			return 'assets.json';
		},

		/**
		 * Returns a path to the generated assets.js within the output directory.
		 * This file contains the modified version of "assets.json" to load as a JS script.
		 *
		 * @returns {string}
		 */
		assetsJS() {
			return path.changeExt(this.assetsJSON(), '.js');
		},

		/**
		 * Returns the path to the generated async assets chunks list within the output directory.
		 * It contains an array of async chunks and their file names to inline them into fat-html.
		 * ...
		 * [
		 *  {
		 *   id: 'chunk_id',
		 *   files: ['filename.ext']
		 *  }
		 * ]
		 *
		 * @return {string}
		 */
		asyncAssetsJSON() {
			return 'async-chunks-to-inline.json';
		}
	},

	/**
	 * Options of Content Security Policy
	 */
	csp: {
		/**
		 * If true, the nonce attributes will be post-processed by a proxy, like Nginx
		 * (this mode will insert nonce attributes into inline tags too).
		 *
		 * If false, nonce attributes will be inserted from the JS runtime.
		 * Note, this mode does not support nonce attributes for inline tags.
		 */
		postProcessor: true,

		/**
		 * Return a name of the generated runtime global variable where the nonce value is stored
		 * @returns {?string}
		 */
		nonceStore() {
			if (this.nonce() == null) {
				return 'GLOBAL_NONCE';
			}

			if (this.nonceStore.cachedResult) {
				return this.nonceStore.cachedResult;
			}

			this.nonceStore.cachedResult = nanoid();
			return this.nonceStore.cachedResult;
		},

		/**
		 * Returns a value of the "nonce" hash
		 * @returns {?string}
		 */
		nonce() {
			return undefined;
		}
	},

	/**
	 * Returns parameters for TypeScript:
	 *
	 * 1. server - to compile node.js modules
	 * 2. client - to compile client modules
	 *
	 * @override
	 * @returns {{server: !Object, client: !Object}}
	 */
	typescript() {
		const
			server = super.typescript();

		const configFile = fs.existsSync(path.join(this.src.cwd(), 'client.tsconfig.json')) ?
			'client.tsconfig.json' :
			'tsconfig.json';

		const
			{compilerOptions: {module}} = require(path.join(this.src.cwd(), configFile));

		const client = this.extend({}, server, {
			configFile,
			compilerOptions: {module}
		});

		return {
			client,
			server
		};
	},

	/**
	 * Returns parameters for `TerserPlugin`
	 * @returns {{}}
	 */
	terser() {
		return {};
	},

	/**
	 * Returns parameters for `stylus-loader`
	 * @returns {!Object}
	 */
	stylus() {
		return {
			webpackImporter: false,

			stylusOptions: {
				compress: false
			}
		};
	},

	/**
	 * Returns parameters for `css-loader`
	 * @returns {!Object}
	 */
	css() {
		return {};
	},

	/**
	 * Returns parameters for `CssMinimizerPlugin`
	 * @returns {!Object}
	 */
	cssMinimizer() {
		return {};
	},

	/**
	 * Returns parameters for `MiniCssExtractPlugin`
	 * @returns {!Object}
	 */
	miniCssExtractPlugin() {
		return {};
	},

	/**
	 * Returns parameters for statoscope
	 *
	 * @see https://github.com/statoscope/statoscope/tree/master/packages/webpack-plugin#usage
	 * @returns {!Object}
	 */
	statoscope() {
		return {
			enabled: o('statoscope-webpack-plugin', {
				default: false,
				env: true
			}),

			entryDownloadDiffSizeLimits: {
				runtime: 50 * 1024,
				standalone: 50 * 1024,
				styles: 50 * 1024,
				html: 10 * 1024
			},

			entryDownloadDiffTimeLimits: {
				runtime: 50,
				standalone: 50,
				styles: 50,
				html: 10
			},

			webpackPluginConfig: {
				saveStatsTo: 'statoscope-stats/stats-[name].json',
				saveOnlyStats: true,
				normalizeStats: false,
				watchMode: false,
				open: false
			}
		};
	},

	/**
	 * Returns parameters for `postcss-loader`
	 * @returns {!Object}
	 */
	postcss() {
		return {};
	},

	/**
	 * Returns parameters for `postcss/autoprefixer`
	 * @returns {!Object}
	 */
	autoprefixer() {
		return {remove: false};
	},

	/**
	 * Returns parameters for `style-loader`
	 * @returns {!Object}
	 */
	style() {
		return {
			injectType: 'styleTag'
		};
	},

	/**
	 * Options to manage app themes
	 */
	theme: {
		/**
		 * Returns a name of the default app theme to use
		 *
		 * @cli t
		 * @env THEME
		 *
		 * @param {string=} [def] - default value
		 * @returns {string}
		 */
		default(def) {
			return o('theme', {
				short: 't',
				env: true,
				default: def
			});
		},

		/**
		 * Returns an array of available themes to passing from a design system to the runtime or `true`,
		 * if needed to pass all themes from the design system
		 *
		 * @cli include-themes
		 * @env INCLUDE_THEMES
		 *
		 * @param {string=} [def] - default value
		 * @returns {!Array<string>|boolean}
		 */
		include(def) {
			return o('include-themes', {
				env: true,
				default: def
			});
		},

		/**
		 * Returns a map of user preference parameters that are automatically detected based on the system settings
		 *
		 * @cli detect-user-preferences
		 * @env DETECT_USER_PREFERENCES
		 *
		 * @param {object} [def] - default value
		 * @returns {object}
		 *
		 * @example
		 * ```js
		 * {
		 *   prefersColorScheme: {
		 *     enabled: true,
		 *
		 *     // This flag indicates whether dark or light themes will be detected based on the user's settings.
		 *     // If you want to provide custom aliases for theme names, you can pass them as a dictionary.
		 *     // If your design system does not provide themes from this dictionary, the build will fail.
		 *     // If you do not specify an aliases dictionary, the default values `dark` and `light` will be used.
		 *     aliases: {
		 *       dark: 'night',
		 *       light: 'day'
		 *     }
		 *   }
		 * }
		 * ```
		 */
		detectUserPreferences(def = {prefersColorScheme: {enabled: false}}) {
			return o('detect-user-preferences', {
				env: true,
				default: def
			});
		},

		/**
		 * Returns an attribute name to set a value of the theme to the root element
		 *
		 * @cli theme-attribute
		 * @env THEME_ATTRIBUTE
		 *
		 * @default `data-theme`
		 */
		attribute: o('theme-attribute', {
			env: true,
			default: 'data-theme'
		})
	},

	/**
	 * Returns parameters for `snakeskin-loader`:
	 *
	 * 1. server - for .ess files
	 * 2. client - for .ss files
	 *
	 * @returns {{server: !Object, client: !Object}}
	 */
	snakeskin() {
		const
			snakeskinVars = include('build/snakeskin/vars');

		return {
			client: this.extend(super.snakeskin(), {
				adapter: 'ss2vue',
				adapterOptions: {transpiler: true},
				tagFilter: 'tagFilter',
				tagNameFilter: 'tagNameFilter',
				bemFilter: 'bemFilter',
				vars: snakeskinVars
			}),

			server: this.extend(super.snakeskin(), {
				vars: {
					...snakeskinVars,
					publicPath: this.webpack.publicPath
				}
			})
		};
	},

	/**
	 * Returns parameters for `html-loader`
	 *
	 * @see https://webpack.js.org/loaders/html-loader/#options
	 * @returns {!Object}
	 */
	html() {
		const
			isProd = this.webpack.mode() === 'production';

		return {
			sources: false,
			minimize: isProd && {
				caseSensitive: true,
				collapseWhitespace: true,
				conservativeCollapse: true,
				keepClosingSlash: true,
				minifyCSS: true,
				minifyJS: false,
				// Keep comments for SSI
				removeComments: false,
				removeScriptTypeAttributes: true,
				removeStyleLinkTypeAttributes: true
			}
		};
	},

	/**
	 * Returns parameters for a favicon generator
	 *
	 * @see https://github.com/itgalaxy/favicons#usage
	 * @returns {!Object}
	 */
	favicons() {
		return {
			src: 'logo.png',
			appName: this.appName,
			path: '$faviconPublicPath',
			html: 'favicons.html',
			background: '#2E2929',
			display: 'standalone',
			orientation: 'portrait',
			version: 1.0,
			logging: false,
			manifestName: 'manifest.json',
			// Custom manifest URL
			manifestHref: ''
		};
	},

	/**
	 * Returns parameters for `image-webpack-loader`
	 * @returns {!Object}
	 */
	imageOpts() {
		return {
			svgo: {
				removeUnknownsAndDefaults: false
			},

			webp: {
				quality: 75
			}
		};
	},

	/**
	 * Returns parameters for `typograf`
	 * @returns {!Object}
	 */
	typograf() {
		return {
			// Typograf dont support en locale
			locale: this.locale === 'en' ? 'en-US' : this.locale
		};
	},

	i18n: {
		/**
		 * A strategy for loading localization files into the application:
		 *
		 *  1. `inlineSingleHTML` - all localization files found will be included in the application HTML files themselves;
		 *  2. `inlineMultipleHTML` - based on the original HTML files of the application, new ones will be generated for
		 *      each supported locale;
		 *  3. `externalMultipleJSON` - all found localization files will be combined into several JSON files
		 *      for each locale.
		 *
		 * @cli i18n-strategy
		 * @env I18N_STRATEGY
		 *
		 * @default `inlineSingleHTML`
		 * @returns {string}
		 */
		strategy(def = 'inlineSingleHTML') {
			return o('i18n-strategy', {
				env: true,
				default: def
			});
		},

		/**
		 * A list of supported languages for application internationalization.
		 * JS files with names that match the name of the locale and located in folders named i18n will be
		 * loaded into the application.
		 *
		 * @cli supported-locales
		 * @env SUPPORTED_LOCALES
		 *
		 * @param {string=} [def] - default value
		 * @returns {!Array<Language>}
		 *
		 * @example
		 * ```bash
		 * npx webpack --env supported-locales=en,ru
		 * ```
		 */
		supportedLocales(def = this.config.locale) {
			return o('supported-locales', {
				env: true,
				coerce: (str) => str.split(/\s*,\s*/),
				default: def
			});
		},

		/**
		 * The name of the generated global variable where the language packs are stored
		 */
		langPacksStore: 'LANG_PACKS'
	},

	/** @override */
	runtime() {
		return {
			...super.runtime(),
			engine: this.engine(),

			debug: false,
			noGlobals: false,
			dynamicPublicPath: this.webpack.dynamicPublicPath(),

			svgSprite: true,
			'ds/use-css-vars': false,

			blockNames: false,
			passDesignSystem: false,

			'core/browser': true,
			'core/session': true,

			'prelude/test-env': !isProd,
			'component/async-render': true,
			'component/daemons': true,

			'directives/event': true,
			'directives/image': true,
			'directives/in-view': true,
			'directives/resize-observer': true,
			'directives/update-on': true,
			'directives/safe-html': true,

			iData: true,
			bRouter: true,

			'iInput/validators': true,
			'bInput/validators': true,

			'iInputText/mask': true,

			theme: this.theme.default(),
			includeThemes: this.theme.include(),
			prefersColorSchemeEnabled: this.theme.detectUserPreferences().prefersColorScheme.enabled
		};
	},

	/**
	 * Returns a map of component dependencies.
	 * This map can be used to provide dynamic component dependencies within `index.js` files.
	 *
	 * @returns {!Object}
	 *
	 * @example
	 * ```
	 * componentDependencies() {
	 *   return {'b-dummy': ['b-icon']};
	 * }
	 * ```
	 *
	 * ```
	 * package('b-dummy')
	 *   .extends('i-data')
	 *   .dependencies(...require('@config/config').componentDependencies()['b-dummy'] ?? []);
	 * ```
	 */
	componentDependencies() {
		return {};
	},

	/** @override */
	monic() {
		const
			mode = this.build.mode(),
			runtime = this.runtime(),
			es = this.es(),
			demo = Boolean(this.build.components && this.build.components.length);

		return {
			stylus: {
				flags: {
					mode,
					runtime,
					'+:*': true,
					demo
				}
			},

			typescript: {
				flags: {
					mode,
					runtime,
					es,
					demo
				}
			},

			javascript: {
				flags: {
					mode,
					runtime,
					es,
					demo
				}
			}
		};
	}
});
