/*!
 * V4Fire Client Core
 * https://github.com/V4Fire/Client
 *
 * Released under the MIT license
 * https://github.com/V4Fire/Client/blob/master/LICENSE
 */

'use strict';

const {getLayerName} = require('./layer-name');

/**
 * The function returns a layer name of the root package.
 *
 * @param {string} filePath
 * @returns {string}
 */
function getOriginLayerFromPath(filePath) {
	const
		pathToOriginPackage = filePath.match(/(?<path>.+)[/\\]node_modules[/\\]/)?.groups?.path;

	if (pathToOriginPackage == null) {
		return getLayerName(filePath);
	}

	return require(`${pathToOriginPackage}/package.json`).name;
}

exports.getOriginLayerFromPath = getOriginLayerFromPath;
