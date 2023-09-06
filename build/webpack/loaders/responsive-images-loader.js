/*!
 * V4Fire Client Core
 * https://github.com/V4Fire/Client
 *
 * Released under the MIT license
 * https://github.com/V4Fire/Client/blob/master/LICENSE
 */

'use strict';

const
	json5 = require('json5'),
	responsiveLoader = require('responsive-loader'),
	path = require('node:path'),
	vm = require('node:vm');

const
	{urlLoaderOpts, isProd} = include('build/webpack/module/const');

/**
 * Wepback loader for converting and scaling images to different formats and sizes.
 * The loader is essentially a wrapper for `responsive-loader` that it's called for each format conversion.
 * It also adds support for the provided scaling of the original image size (1x, 2x, etc)
 *
 * @param {string} imageBuffer - contents of the image
 * @returns {string}
 *
 * @example
 * ```javascript
 * const image = require('path/to/image.png?responsive');
 *
 * {
 *   // 4e3edf6d108c0701 - hash
 *   // 346 - 2x size of the original image
 *   // png - format of the original image
 *   src: '4e3edf6d108c0701-346.png',
 *   sources: [
 *     {
 *       type: 'png',
 *       srcset: {
 *         '1x': 'f6506a0261a44c16-173.png'
 *         '2x': '4e3edf6d108c0701-346.png'
 *         '3x': '19b08609ec6e1165-521.png'
 *       }
 *     },
 *     {
 *       type: 'webp',
 *       srcset: {
 *         '1x': '4e62cb10bc2b3029-173.webp'
 *         '2x': 'f49d341fedd8bdc5-346.webp'
 *         '3x': '4ca48b9469e44566-521.webp'
 *       }
 *     },
 *     {
 *       type: 'avif',
 *       srcset: {
 *         '1x': '71842fd826667798-173.avif'
 *         '2x': '8da0057becea6b31-346.avif'
 *         '3x': 'b6d75fb5bdf3121b-521.avif'
 *       }
 *     }
 *   ]
 * }
 * ```
 */
module.exports = async function responsiveImagesLoader(imageBuffer) {
	const
		originalImageFormat = undefined,
		options = {...this.getOptions(), ...parseResourceQuery(this.resourceQuery)};

	if (!isProd) {
		const
			loaderResponses = await collectLoaderResponses.call(this, imageBuffer, options, [originalImageFormat]),
			[[imageName]] = getImageNames(loaderResponses);

		return `module.exports = {src: '${imageName}'}`;
	}

	const
		formats = [originalImageFormat, ...(options.formats ?? [])],
		loaderResponses = await collectLoaderResponses.call(this, imageBuffer, options, formats),
		sources = getSources(getImageNames(loaderResponses)),
		[resolution, ext] = options.defaultSrcPath.split('.'),
		source = sources.find(({type}) => type === ext);

	const result = {
		src: source?.srcset[resolution] ?? sources[0]['2x'],
		sources
	};

	return `module.exports = ${JSON.stringify(result)}`;
};

/**
 * Parses the specified resourceQuery. Supports only json5 notation
 *
 * @param {string} query
 * @returns {object}
 */
function parseResourceQuery(query) {
	if (query[1] !== '{' || query[query.length - 1] !== '}') {
		return {};
	}

	const
		options = json5.parse(query.slice(1)),
		loaderResourceQuery = 'responsive';

	return Object.reject(options, loaderResourceQuery);
}

/**
 * Converts image names to an object with 'srcset' for each resolution
 *
 * @param {string[]} imageNames
 * @returns {object}
 */
function getSources(imageNames) {
	return imageNames.map((names) => {
		const
			[x1, x2, x3] = names,
			type = path.extname(x1).replace('.', '');

		return {
			type,
			srcset: {'1x': x1, '2x': x2, '3x': x3}
		};
	});
}

/**
 * Extracts only image names without the rest of the path
 *
 * @param {string[]} loaderResponses - original response returned by the responsiveLoader
 * @returns {string[]}
 */
function getImageNames(loaderResponses) {
	return loaderResponses.map((code) => {
		const {images} = compileCodeToModule(code);
		return images.map(({path}) => path.replace(`${urlLoaderOpts.outputPath}/`, ''));
	});
}

/**
 * Compiles the code returned by the responsiveLoader to the NodeJS module
 *
 * @param {string} code
 * @returns {module}
 */
function compileCodeToModule(code) {
	const context = vm.createContext({
		// eslint-disable-next-line camelcase
		__webpack_public_path__: '',
		module
	});

	vm.runInContext(code, context);

	return context.module.exports;
}

/**
 * Calls the responsiveLoader multiple times for each image format and collects responses
 *
 * @param {string} imageBuffer
 * @param {object} options
 * @param {string[]} formats
 * @returns {Promise<string[]>}
 */
function collectLoaderResponses(imageBuffer, options, formats) {
	let
		convertationTime = 0;

	const
		loaderResponses = [];

	const createContext = (resolve, reject, format) => ({
		...this,

		async: () => (err, data) => {
			if (err != null) {
				reject('Failed to process the image', err);
				return;
			}

			loaderResponses.push(data);

			if (++convertationTime >= formats.length) {
				resolve(loaderResponses);
			}
		},

		getOptions: () => ({
			format,
			...options
		})
	});

	return new Promise((resolve, reject) => {
		formats.forEach(
			(format) => responsiveLoader.call(createContext(resolve, reject, format), imageBuffer)
		);
	});
}
