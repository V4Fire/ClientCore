'use strict';

/*!
 * V4Fire Client Core
 * https://github.com/V4Fire/Client
 *
 * Released under the MIT license
 * https://github.com/V4Fire/Client/blob/master/LICENSE
 */

const
	{typescript} = require('@config/config'),
	{commentModuleExpr: commentExpr} = include('build/const');

const importRgxp = new RegExp(
	`\\bimport${commentExpr}\\((${commentExpr})(["'])((?:.*?[\\\\/]|)([bp]-[^.\\\\/"')]+)+)\\2${commentExpr}\\)`,
	'g'
);

const
	hasImport = importRgxp.removeFlags('g'),
	isESImport = typescript().client.compilerOptions.module === 'ES2020';

/**
 * Monic replacer to enable dynamic imports of components
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
module.exports = function dynamicComponentImportReplacer(str) {
	return str.replace(importRgxp, (str, magicComments, q, path, nm) => {
		const
			chunks = path.split(/[\\/]/);

		if (chunks.length > 1 && chunks[chunks.length - 1] === chunks[chunks.length - 2]) {
			return str;
		}

		const
			fullPath = `${path}/${nm}`,
			imports = [];

		{
			let
				decl;

			if (isESImport) {
				decl = `import(${magicComments} '${fullPath}')`;

			} else {
				decl = `new Promise(function (r) { return r(require('${fullPath}')); })`;
			}

			decl += '.catch(function (err) { stderr(err) })';
			imports.push(decl);
		}

		{
			let
				decl;

			if (isESImport) {
				decl = `import(${magicComments} '${fullPath}.styl')`;

			} else {
				decl = `new Promise(function (r) { return r(require('${fullPath}.styl')); })`;
			}

			decl = `function () { return ${decl}; }`;
			imports[0] = `TPLS['${nm}'] ? ${imports[0]} : ${imports[0]}.then(${decl}, function (err) { stderr(err); return ${decl}(); })`;
		}

		{
			const
				regTpl = `function (module) { TPLS['${nm}'] = module${isESImport ? '.default' : ''}['${nm}']; return module; }`;

			let
				decl;

			if (isESImport) {
				decl = `import(${magicComments} '${fullPath}.ss').then(${regTpl})`;

			} else {
				decl = `new Promise(function (r) { return r(require('${fullPath}.ss')); }).then(${regTpl})`;
			}

			decl += '.catch(function (err) { stderr(err) })';
			imports.push(decl);
		}

		return `Promise.all([${imports.join(',')}])`;
	});
};

Object.assign(module.exports, {
	importRgxp,
	hasImport
});
