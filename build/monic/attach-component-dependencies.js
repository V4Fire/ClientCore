/* eslint-disable require-atomic-updates */

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
	path = require('upath'),
	graph = include('build/graph');

const
	decls = Object.create(null);

/**
 * Monic replacer to attach component dependencies into the TS/JS file
 *
 * @param {string} str
 * @param {string} filePath
 * @returns {!Promise<string>}
 */
module.exports = async function attachComponentDependencies(str, filePath) {
	const
		{components} = await graph;

	const
		ext = path.extname(filePath),
		component = components.get(path.basename(filePath, ext));

	if (component == null) {
		return str;
	}

	const
		deps = new Set(),
		libs = new Set();

	attachComponentDeps(component);

	let
		imports = '';

	$C([...libs].reverse()).forEach((lib) => {
		imports += `require('${lib}');`;
	});

	await $C([...deps].reverse()).async.forEach(forEach);
	return imports + str;

	async function forEach(dep) {
		if (dep.startsWith('g-')) {
			return;
		}

		const
			declFromCache = decls[dep];

		if (declFromCache != null) {
			imports += declFromCache;
			return;
		}

		const
			component = components.get(dep);

		if (component == null) {
			return;
		}

		let
			decl = '';

		try {
			const
				styles = await component.styles;

			decl += `
(() => {
	if (TPLS['${dep}']) {
		return;
	}

	requestAnimationFrame(async () => {
		try {
			const el = document.createElement('i');
			el.className = '${dep}-is-style-loaded';
			document.body.appendChild(el);

			const isStylesLoaded = getComputedStyle(el).color === 'rgba(0, 250, 154, 0)';
			document.body.removeChild(el);

			if (isStylesLoaded) {
				return;
			}
		} catch (err) { stderr(err); }

		try {
			${
					styles
						.map((src) => {
							if (src == null) {
								return '';
							}

							src = path.normalize(src);
							return `await import('${src}');`;
						})

						.join('')
				}
		} catch (err) { stderr(err); }
	});
})();`;

		} catch {}

		const depChunks = [
			'logic',
			'tpl'
		];

		for (const chunk of depChunks) {
			try {
				let
					src = await component[chunk];

				if (src != null) {
					src = path.normalize(src);

					let
						expr;

					if (chunk === 'tpl') {
						expr = `TPLS['${dep}'] = require('${src}')['${dep}'];`;

					} else {
						expr = `require('${src}');`;
					}

					decl += `try { ${expr} } catch (err) { stderr(err); }`;
				}

			} catch {}
		}

		if (decls[dep] == null) {
			decls[dep] = decl;
		}

		imports += decl;
	}

	function attachComponentDeps(component) {
		if (component == null) {
			return;
		}

		$C(component.dependencies).forEach((dep) => {
			deps.add(dep);
			attachComponentDeps(components.get(dep));
		});

		$C(component.libs).forEach((lib) => {
			libs.add(lib);
		});
	}
};

