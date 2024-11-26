'use strict';

/*!
 * V4Fire Client Core
 * https://github.com/V4Fire/Client
 *
 * Released under the MIT license
 * https://github.com/V4Fire/Client/blob/master/LICENSE
 */

const fs = require('fs');
const path = require('path');
const RuntimeModule = require('webpack/lib/RuntimeModule');
const RuntimeGlobals = require('webpack/lib/RuntimeGlobals');

const {webpack} = require('@config/config');

class AsyncPlugRuntimeModule extends RuntimeModule {
	constructor() {
		super('async chunk loader for fat-html', RuntimeModule.STAGE_ATTACH);
	}

	generate() {
		return `var loadScript = ${RuntimeGlobals.loadScript};
function loadScriptReplacement(path, cb, chunk, id) {
	var tpl = document.getElementById(id);
	if (tpl && tpl.content) {
		document.body.appendChild(tpl.content.cloneNode(true));
		cb();
	} else {
		loadScript(path, cb, chunk, id);
	}
}
${RuntimeGlobals.loadScript} = loadScriptReplacement`;
	}
}

class Index {
	apply(compiler) {
		compiler.hooks.thisCompilation.tap(
			'AsyncChunksPlugin',
			(compilation) => {
				const onceForChunkSet = new WeakSet();

				compilation.hooks.runtimeRequirementInTree
					.for(RuntimeGlobals.ensureChunkHandlers)
					.tap('AsyncChunksPlugin', (chunk, set) => {
						if (onceForChunkSet.has(chunk)) {
							return;
						}

						onceForChunkSet.add(chunk);

						const runtimeModule = new AsyncPlugRuntimeModule();
						set.add(RuntimeGlobals.loadScript);
						compilation.addRuntimeModule(chunk, runtimeModule);
				});
			}
		);

		compiler.hooks.emit.tapAsync('AsyncChunksPlugin', (compilation, callback) => {
			const asyncChunks = [];
			if (compilation.name !== 'runtime') {
				callback();
				return;
			}

			compilation.chunks.forEach((chunk) => {
				if (chunk.canBeInitial()) {
					return;
				}

				asyncChunks.push({
					id: chunk.id,
					files: chunk.files.map((filename) => filename)
				});
			});

			const outputPath = path.join(compiler.options.output.path, webpack.asyncAssetsJSON());

			fs.writeFile(outputPath, JSON.stringify(asyncChunks, null, 2), (err) => {
				if (err) {
					compilation.errors.push(new Error(`Error write async chunks list to ${outputPath}`));
				}

				callback();
			});
		});

		compiler.hooks.done.tapAsync('AsyncChunksPlugin', (stat, callback) => {
			if (stat.compilation.name === 'html') {
				const
					filePath = path.join(compiler.options.output.path, webpack.asyncAssetsJSON()),
					fileContent = fs.readFileSync(filePath, 'utf-8'),
					asyncChunks = JSON.parse(fileContent);

				asyncChunks.forEach((chunk) => {
					chunk.files.forEach((file) => {
						fs.rmSync(path.join(compiler.options.output.path, file));
					});
				});
			}

			callback();
		});
	}
}

module.exports = Index;
