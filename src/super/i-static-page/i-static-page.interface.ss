- namespace [%fileName%]

/*!
 * V4Fire Client Core
 * https://github.com/V4Fire/Client
 *
 * Released under the MIT license
 * https://github.com/V4Fire/Client/blob/master/LICENSE
 */

- include 'super/i-page'|b

- import config from '@config/config'
- import fs from 'fs-extra'

/**
 * Injects the specified file to a template
 * @param {string} src
 */
- block index->inject(src)
	- return fs.readFileSync(src).toString()

/**
 * Base page template
 */
- async template index(@params = {}) extends ['i-page'].index
	/** Helpers to generate a template */
	- h = include('src/super/i-static-page/modules/ss-helpers')

	/** Static page title */
	- title = @@appName

	/** @override */
	- rootTag = 'div'

	/** @override */
	- rootAttrs = {}

	/** Additional static page data */
	- pageData = {}

	/** Page charset */
	- charset = 'utf-8'

	/** Map of meta viewport attributes */
	- viewport = { &
		'width': 'device-width',
		'initial-scale': '1.0',
		'maximum-scale': '1.0',
		'user-scalable': 'no'
	} .

	/** Map with attributes of <html> tag */
	- htmlAttrs = { &
		lang: config.locale
	} .

	/** Should or not generate <base> tag */
	- defineBase = false

	/** Should or not attach favicons */
	- attachFavicons = true

	/** Should or not do a request for assets.js */
	- assetsRequest = false

	/** Map of external libraries to load */
	- deps = include('src/super/i-static-page/deps')

	/** Own dependencies of the page */
	- ownDeps = @@entryPoints[self.name()] || {}

	/** Map with static page assets */
	- assets = h.getAssets(@@entryPoints)

	- block root
		- block pageData
			? rootAttrs['data-root-component'] = self.name()
			? rootAttrs['data-root-component-params'] = ({data: pageData}|json)

		? await h.generateInitJS(self.name(), { &
			deps,
			ownDeps,

			assets,
			assetsRequest,

			rootTag,
			rootAttrs
		}) .

		- block doctype
			- doctype

		- block htmlAttrs

		< html ${htmlAttrs}
			< head
				- block head
					: base = @@publicPath()

					- if defineBase
						- block base
							< base href = ${base}

					- block meta

					- block charset
						< meta charset = ${charset}

					- block viewport
						: content = []

						- forEach viewport => el, key
							? content.push(key + '=' + el)

						< meta &
							name = viewport |
							content = ${content}
						.

					- block varsDecl
						+= h.getVarsDecl({wrap: true})

					- block favicons
						- if attachFavicons
							+= h.getFaviconsDecl()

					- block title
						< title
							{title}

					- block assets
						+= h.getAssetsDecl({inline: !assetsRequest, wrap: true})

					- block links
						+= await h.loadLinks(deps.links, {assets, wrap: true})

					- block headStyles
						+= h.getStyleDeclByName('std', {assets, optional: true, wrap: true, js: true})

					- block headScripts
						+= await h.loadLibs(deps.headScripts, {assets, wrap: true, js: true})

			< body
				< ${rootTag}.i-static-page.${self.name()} ${rootAttrs|!html}
					- block headHelpers

					- block innerRoot
						- if overWrapper
							< .&__over-wrapper
								- block overWrapper

							- block body

						- block helpers
						- block providers

				- block deps
					- block styles
						+= await h.loadStyles(deps.styles, {assets, wrap: true})
						+= h.getPageStyleDepsDecl(ownDeps, {assets, wrap: true})

					- block scripts
						+= h.getPageAsyncScripts()
						+= h.getScriptDeclByName('std', {assets, optional: true, wrap: true})
						+= await h.loadLibs(deps.scripts, {assets, wrap: true, js: true})

						+= h.getScriptDeclByName('vendor', {assets, optional: true, wrap: true})
						+= h.getScriptDeclByName('index-core', {assets, optional: true, wrap: true})

						+= h.getPageScriptDepsDecl(ownDeps, {assets, wrap: true})
