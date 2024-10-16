/*!
 * V4Fire Client Core
 * https://github.com/V4Fire/Client
 *
 * Released under the MIT license
 * https://github.com/V4Fire/Client/blob/master/LICENSE
 */

'use strict';

const
	{typescript, webpack, webpack: {ssr}} = require('@config/config'),
	{commentModuleExpr: commentExpr} = include('build/const');

const {
	invokeByRegisterEvent,
	getLayerName
} = include('build/helpers');

const
	graph = include('build/graph');

const importRgxp = new RegExp(
	`\\bimport${commentExpr}\\((${commentExpr})(["'])((?:.*?[\\\\/]|)([bp]-[^.\\\\/"')]+)+)\\2${commentExpr}\\)`,
	'g'
);

const
	hasImport = importRgxp.removeFlags('g'),
	isESImport = !ssr && typescript().client.compilerOptions.module === 'ES2020',
	fatHTML = webpack.fatHTML();

const path = require('upath');

/**
 * A Monic replacer is used to enable dynamic imports of components
 *
 * @param {string} str
 * @returns {string}
 *
 * @example
 * ```js
 * Promise.all([import('form/b-button')]).then((tsModule, ssModule, stylModule) => {
 *   console.log(tsModule, ssModule, stylModule);
 * });
 * ```
 */
module.exports = async function dynamicComponentImportReplacer(str, filePath) {
	const {
		entryDeps,
		components
	} = await graph;

	const
		ext = path.extname(filePath),
		component = components.get(path.basename(filePath, ext));

	return str.replace(importRgxp, (str, magicComments, q, resourcePath, resourceName) => {
		const
			chunks = resourcePath.split(/[/\\]/);

		if (chunks.length > 1 && chunks[chunks.length - 1] === chunks[chunks.length - 2]) {
			return str;
		}

		const
			fullPath = `${resourcePath}/${resourceName}`,
			imports = [];

		{
			let
				decl;

			if (ssr) {
				decl = invokeByRegisterEvent(`require('${fullPath}')`, getLayerName(filePath), component?.name);

			} else {
				if (isESImport) {
					const importExpr = `import(${magicComments} '${fullPath}')`;
					decl = `new Promise(function (r) {${invokeByRegisterEvent(`r(${importExpr})`, getLayerName(filePath), component?.name)}})`;

				} else {
					decl = `new Promise(function (r) { ${invokeByRegisterEvent(`r(require('${fullPath}'));`, getLayerName(filePath), component?.name)} })`;
				}

				decl += '.catch(function (err) { stderr(err) })';
			}

			imports.push(decl);
		}

		{
			const
				tplPath = `${fullPath}.ss`,
				regTpl = `function (module) { ${invokeByRegisterEvent(`TPLS['${resourceName}'] = module${isESImport ? '.default' : ''}['${resourceName}'];`, getLayerName(filePath), component?.name)} return module; }`;

			let
				decl;

			if (ssr) {
				decl = invokeByRegisterEvent(`(${regTpl})(require('${tplPath}'))`, getLayerName(filePath), resourceName);

			} else {
				if (isESImport) {
					const
						importExpr = `import(${magicComments} '${tplPath}')`,
						promise = `new Promise(function (r) {${invokeByRegisterEvent(`r(${importExpr})`, getLayerName(filePath), component?.name)}})`;
					decl = `${promise}.then(${regTpl})`;

				} else {
					decl = `new Promise(function (r) { ${invokeByRegisterEvent(`r(require('${tplPath}'));`, getLayerName(filePath), component?.name)} }).then(${regTpl})`;
				}

				decl += '.catch(function (err) { stderr(err) })';
			}

			imports.push(decl);
		}

		// In FatHTML, we do not include dynamically loaded CSS because it leads to duplication
		// of the CSS and its associated assets
		if (!fatHTML) {
			const
				stylPath = `${fullPath}.styl`;

			let
				decl;

			if (ssr || isESImport) {
				decl = `import(${magicComments} '${stylPath}')`;

			} else {
				decl = `new Promise(function (r) { return r(require('${stylPath}')); })`;
			}

			if (ssr) {
				if (!entryDeps.has(resourceName)) {
					imports.unshift(`require('core/hydration-store').styles.set('${resourceName}', (${decl})).get('${resourceName}')`);
				}

				return `[${imports.join(',')}]`;
			}

			decl = `function () { return ${decl}; }`;
			imports[0] = `TPLS['${resourceName}'] ? ${(imports[0])} : ${imports[0]}.then(${decl}, function (err) { stderr(err); return ${decl}(); })`;
		}

		return `Promise.all([${imports.join(',')}])`;
	});
};

Object.assign(module.exports, {
	importRgxp,
	hasImport
});
