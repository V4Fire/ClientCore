/*!
 * V4Fire Client Core
 * https://github.com/V4Fire/Client
 *
 * Released under the MIT license
 * https://github.com/V4Fire/Client/blob/master/LICENSE
 */

const
	config = require('@config/config'),
	{src, webpack, csp} = config;

const
	fs = require('fs-extra');

const
	buble = require('buble'),
	monic = require('monic');

const
	{getAssetsDecl} = include('src/super/i-static-page/modules/ss-helpers/assets'),
	{getScriptDecl, getStyleDecl, normalizeAttrs} = include('src/super/i-static-page/modules/ss-helpers/tags'),
	{loadLibs, loadStyles, loadLinks} = include('src/super/i-static-page/modules/ss-helpers/libs');

const
	{getVarsDecl} = include('src/super/i-static-page/modules/ss-helpers/base-declarations'),
	{needInline, addPublicPath} = include('src/super/i-static-page/modules/ss-helpers/helpers');

const
	canLoadStylesDeferred = !csp.nonce(),
	needLoadStylesAsJS = webpack.dynamicPublicPath();

const defAttrs = {
	crossorigin: webpack.publicPath() === '' ? undefined : 'anonymous'
};

exports.getPageScriptDepsDecl = getPageScriptDepsDecl;

/**
 * Returns code to load script dependencies of a page.
 *
 * The function returns JS code to load the library by using JS.
 * You need to put this declaration within a script tag or use the "wrap" option.
 *
 * @param {Array<string>} dependencies - list of dependencies to load
 * @param {!Object<string>} assets - map with static page assets
 * @param {boolean=} [wrap] - if true, the final code is wrapped by a script tag
 * @returns {string}
 */
function getPageScriptDepsDecl(dependencies, {assets, wrap} = {}) {
	if (!dependencies) {
		return '';
	}

	let
		decl = '';

	for (const dep of dependencies) {
		const scripts = [
			getScriptDeclByName(`${dep}_tpl`, {assets}),
			getScriptDeclByName(dep, {assets})
		];

		// We can't compile styles into static CSS files because
		// we have to provide a dynamic public path to them via runtime
		if (needLoadStylesAsJS) {
			scripts.unshift(getScriptDeclByName(`${dep}_style`, {assets}));
		}

		if (dep === 'index') {
			scripts.reverse();
		}

		decl += `${scripts.join('\n')}\n`;
	}

	if (wrap) {
		decl = getScriptDecl(decl);
	}

	return decl;
}

exports.getPageAsyncScripts = getPageAsyncScripts;

function getPageAsyncScripts() {
	if (!needInline()) {
		return '';
	}

	const
		fileName = webpack.asyncAssetsJSON(),
		filePath = src.clientOutput(fileName);

	try {
		const
			fileContent = fs.readFileSync(filePath, 'utf-8'),
			asyncChunks = JSON.parse(fileContent);

		if (webpack.mode() === 'production') {
			return asyncChunks.reduce((result, chunk) => `${result}<template id="${chunk.id}"><script>${
				chunk.files.map((fileName) => `include('${src.clientOutput(fileName)}');\n`).join()
			}</script></template>`, '');
		}

		return `<div id="scripts-shadow-store">${asyncChunks.reduce((result, chunk) => `${result}<template id="${chunk.id}"><script id="${chunk.id}">${
				chunk.files.map((fileName) => `include('${src.clientOutput(fileName)}');\n`).join()
			}</script></template>`, '')}</div>`;

	} catch (e) {
		return '';
	}
}

exports.getPageStyleDepsDecl = getPageStyleDepsDecl;

/**
 * Returns code to load style dependencies of a page.
 *
 * The function can return JS code to load the style by using `document.write` or pure CSS to inline.
 * You may use the "wrap" option to wrap the final code with a tag to load.
 *
 * @param {Array<string>} dependencies - list of dependencies to load
 * @param {!Object<string>} assets - map with static page assets
 * @param {boolean=} [wrap] - if true, the final code is wrapped by a tag to load
 * @param {boolean=} [js] - if true, the function will always return JS code to load the dependency
 * @returns {string}
 */
function getPageStyleDepsDecl(dependencies, {assets, wrap, js}) {
	if (!dependencies || needLoadStylesAsJS) {
		return '';
	}

	let
		decl = '';

	for (const dep of dependencies) {
		decl += getStyleDeclByName(dep, {assets, js});
		decl += '\n';
	}

	if (wrap && (js || !needInline())) {
		decl = getScriptDecl(decl);
	}

	return decl;
}

exports.getScriptDeclByName = getScriptDeclByName;

/**
 * Returns code to load a script by the specified name.
 * The names are equal with entry points from "src/entries".
 *
 * The function returns JS code to load the library by using JS.
 * You need to put this declaration within a script tag or use the "wrap" option.
 *
 * @param {string} name
 * @param {!Object<string>} assets - map with static page assets
 * @param {boolean=} [optional] - if true, the missing of this script won't throw an error
 * @param {boolean=} [defer=true] - if true, the script is loaded with the "defer" attribute
 * @param {boolean=} [inline] - if true, the script is placed as a text
 * @param {boolean=} [wrap] - if true, the final code is wrapped by a script tag
 * @returns {string}
 */
function getScriptDeclByName(name, {
	assets,
	optional,
	defer = true,
	inline,
	wrap
}) {
	let
		decl;

	if (needInline(inline)) {
		if (assets[name]) {
			const
				filePath = src.clientOutput(assets[name].path);

			if (fs.existsSync(filePath)) {
				decl = `include('${filePath}');`;
			}

		} else {
			if (!optional) {
				throw new ReferenceError(`A script by the name "${name}" is not defined`);
			}

			return '';
		}

	} else {
		decl = getScriptDecl({
			...defAttrs,
			defer,
			js: true,
			src: addPublicPath([`PATH['${name}']`])
		});

		if (optional) {
			decl = `if ('${name}' in PATH) {
	${decl}
}`;
		}
	}

	return wrap ? getScriptDecl(decl) : decl;
}

exports.getStyleDeclByName = getStyleDeclByName;

/**
 * Returns code to load a style by the specified name.
 * The names are equal with entry points from "src/entries".
 *
 * The function can return JS code to load the style by using JS or pure CSS to inline.
 * You may use the "wrap" option to wrap the final code with a tag to load.
 *
 * @param {string} name
 * @param {!Object<string>} assets - map with static page assets
 * @param {boolean=} [optional] - if true, the missing of this style won't throw an error
 * @param {boolean=} [defer] - if true, the style is loaded only after loading of the whole page
 * @param {boolean=} [inline] - if true, the style is placed as a text
 * @param {boolean=} [wrap] - if true, the final code is wrapped by a tag to load
 * @param {boolean=} [js] - if true, the function will always return JS code to load the dependency
 * @returns {string}
 */
function getStyleDeclByName(name, {
	assets,
	optional,
	defer = canLoadStylesDeferred,
	inline,
	wrap,
	js
}) {
	const
		rname = `${name}_style`;

	if (needLoadStylesAsJS) {
		return getScriptDeclByName(rname, {assets, optional, defer, inline, wrap});
	}

	let
		decl;

	if (needInline(inline)) {
		if (assets[rname]) {
			const
				filePath = src.clientOutput(assets[rname].path);

			if (fs.existsSync(filePath)) {
				decl = getStyleDecl({...defAttrs, js}, `include('${filePath}');`);
			}

		} else if (!optional) {
			throw new ReferenceError(`A style by the name "${name}" is not defined`);
		}

	} else {
		decl = getStyleDecl({
			...defAttrs,
			defer,
			js: true,
			rel: 'stylesheet',
			src: addPublicPath([`PATH['${rname}']`])
		});

		if (optional) {
			decl = `if ('${rname}' in PATH) {
	${decl}
}`;
		}
	}

	if (!decl) {
		return '';
	}

	return wrap ? getScriptDecl(decl) : decl;
}

exports.generateInitJS = generateInitJS;

/**
 * Generates js script to initialize the specified page
 *
 * @param pageName
 *
 * @param deps - map of external libraries to load
 * @param ownDeps - own dependencies of the page
 *
 * @param assets - map with static page assets
 * @param assetsRequest - should or not do a request for assets.js
 *
 * @param rootTag - type of the root tag (div, span, etc.)
 * @param rootAttrs - attributes for the root tag
 *
 * @returns {!Promise<void>}
 */
async function generateInitJS(pageName, {
	deps,
	ownDeps,

	assets,
	assetsRequest,

	rootTag,
	rootAttrs
}) {
	if (needInline()) {
		return;
	}

	const
		head = [],
		body = [];

	// - block varsDecl
	head.push(getVarsDecl());

	// - block assets
	head.push(getAssetsDecl({inline: !assetsRequest, js: true}));

	// - block links
	head.push(await loadLinks(deps.links, {assets, js: true}));

	// - block headStyles
	head.push(await getStyleDeclByName('std', {assets, optional: true, js: true}));

	// - block headScripts
	head.push(await loadLibs(deps.headScripts, {assets, js: true}));

	body.push(`
(function () {
	var el = document.createElement('${rootTag || 'div'}');
	${normalizeAttrs(rootAttrs, true)}
	el.setAttribute('class', 'i-static-page ${pageName}');
	document.body.appendChild(el);
})();
`);

	// - block styles
	body.push(
		await loadStyles(deps.styles, {assets, js: true}),
		getPageStyleDepsDecl(ownDeps, {assets, js: true})
	);

	// - block scripts
	body.push(
		await getScriptDeclByName('std', {assets, optional: true}),
		await loadLibs(deps.scripts, {assets, js: true}),

		getScriptDeclByName('index-core', {assets, optional: true}),
		getScriptDeclByName('vendor', {assets, optional: true}),

		getPageScriptDepsDecl(ownDeps, {assets})
	);

	const bodyInitializer = `
function $__RENDER_ROOT() {
	${body.join('\n')}
}
`;

	const
		initPath = src.clientOutput(`${webpack.output({name: pageName})}.init.js`),
		content = head.join('\n') + bodyInitializer;

	fs.writeFileSync(initPath, content);

	let {result} = await monic.compile(initPath, {
		content,
		saveFiles: false,
		replacers: [include('build/monic/include')]
	});

	if (/ES[35]$/.test(config.es())) {
		result = buble.transform(result).code;
	}

	fs.writeFileSync(initPath, result);
}
