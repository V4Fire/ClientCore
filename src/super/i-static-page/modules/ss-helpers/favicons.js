/*!
 * V4Fire Client Core
 * https://github.com/V4Fire/Client
 *
 * Released under the MIT license
 * https://github.com/V4Fire/Client/blob/master/LICENSE
 */

const
	{src, webpack, favicons} = require('config');

const
	glob = require('glob'),
	fs = require('fs-extra');

const
	{resolveAsLib} = include('src/super/i-static-page/modules/ss-helpers/libs'),
	{getScriptDecl, getLinkDecl} = include('src/super/i-static-page/modules/ss-helpers/tags');

exports.getFaviconsDecl = getFaviconsDecl;

/**
 * Returns declaration of project favicons
 * @returns {string}
 */
function getFaviconsDecl() {
	const
		faviconsHTML = glob.sync(src.assets('favicons', favicons().html))[0];

	if (!faviconsHTML) {
		return '';
	}

	const
		dest = resolveAsLib({name: 'favicons', dest: 'assets'}, src.rel('assets'), 'favicons/');

	glob.sync(src.clientOutput(dest, '*.@(json|xml|webapp)')).forEach((file) => {
		fs.writeFileSync(file, resolveFaviconPath(fs.readFileSync(file).toString()));
	});

	let
		faviconsDecl = resolveFaviconPath(fs.readFileSync(faviconsHTML).toString());

	const
		manifestRgxp = /<link (.*?) href="(.*?\/manifest.json)">/,
		manifest = manifestRgxp.exec(faviconsDecl);

	faviconsDecl = faviconsDecl.replace(manifestRgxp, '');

	const manifestDecl = getLinkDecl({
		js: true,
		staticAttrs: manifest[1],
		attrs: {
			href: [`'${manifest[2]}?from=' + location.pathname + location.search`]
		}
	});

	return faviconsDecl + getScriptDecl(manifestDecl);

	function resolveFaviconPath(str) {
		return str.replace(/\$faviconPublicPath\//g, `${webpack.publicPath(dest)}/`.replace(/\/+$/, '/'));
	}
}
