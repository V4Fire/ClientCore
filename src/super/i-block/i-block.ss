- namespace [%fileName%]

/*!
 * V4Fire Client Core
 * https://github.com/V4Fire/Client
 *
 * Released under the MIT license
 * https://github.com/V4Fire/Client/blob/master/LICENSE
 */

- include 'super/i-block/modules/**/*.ss'|b
- import $C from 'collection.js'

/**
 * Base component template
 */
- template index()
	/** Hardcoded component name */
	- componentName = ''

	/** Type of the root tag (if not specified, it will be taken from the component `rootTag` prop) */
	- rootTag = null

	/** Should or not generate additional wrapper within the root tag */
	- rootWrapper = false

	/** Should or not generate a layout for overlap */
	- overWrapper = false

	/** Should or not the component have a skeleton */
	- skeletonMarker = false

	/**
	 * Returns the component name
	 * @param {string=} [name] - custom template name
	 */
	- block name(name)
		? name = name || componentName || TPL_NAME
		: nmsRgxp = /\['(.*?)'\]\.index/

		- if nmsRgxp.test(name)
			? name = nmsRgxp.exec(name)[1]

		- return name.split('.').slice(-1)[0].dasherize()

	/**
	 * Loads modules by the specified paths and dynamically inserted the provided content when it loaded
	 *
	 * @param {(string|!Array<string>)} path - path or an array of paths
	 * @param {{renderKey: string, wait: string}=} [opts] - additional options
	 * @param {string=} [content]
	 *
	 * @example
	 * ```
	 * += self.loadModules('form/b-button')
	 *   < b-button
	 *     Hello world
	 *
	 * += self.loadModules(['form/b-button', 'form/b-input'], {renderKey: 'controls', wait: 'promisifyOnce.bind(null, "needLoad")'})
	 *   < b-button
	 *     Hello world
	 *
	 *   < b-input
	 * ```
	 */
	- block loadModules(path, opts = {}, content)
		- if arguments.length < 3
			? content = opts
			? opts = {}

		: buble = require('buble')

		: &
			ids = [],
			paths = [].concat(path || [])
		.

		: &
			waitFor = opts.wait || 'undefined',
			interpolatedWaitFor = (opts.wait ? buble.transform("`" + opts.wait + "`").code : 'undefined')
				.replace(/^\(?['"]/, '')
				.replace(/['"]\)?$/, '')
				.replace(/\\(['"])/g, '$1')
		.

		- forEach paths => path
			: &
				id = [path, waitFor].concat(opts.wait ? '${componentId}' : []).join(':'),
				interpolatedId = buble.transform("`" + id + "`").code
			.

			? ids.push(interpolatedId)
			{{ void(moduleLoader.add({id: ${interpolatedId}, load: () => import('${path}'), wait: ${interpolatedWaitFor}})) }}

		: &
			source,
			filter
		.

		- if ids.length
			? source = 'moduleLoader.values(...[' + ids.join(',') + '])'
			? filter = 'undefined'

		- else
			? source = '1'
			? filter = interpolatedWaitFor

		- if content != null
			- if opts.renderKey
				: renderKey = buble.transform("`" + opts.renderKey + "`").code

				< template v-if = !field.get('ifOnceStore.' + ${renderKey})
					{{ void(field.set('ifOnceStore.' + ${renderKey}, true)) }}

					< template v-for = _ in asyncRender.iterate(${source}, 1, { &
						useRaf: true,
						group: 'module:' + ${renderKey},
						filter: ${filter}
					}) .
						+= content

			- else
				< template v-for = _ in asyncRender.iterate(${source}, 1, {useRaf: true, filter: ${filter}})
					+= content

	/**
	 * Render the specified content by using passed options
	 *
	 * @param {{renderKey: string, wait: string}} opts - options to render
	 * @param {string} content
	 *
	 * @example
	 * ```
	 * += self.render({renderKey: 'controls', wait: 'promisifyOnce.bind(null, "needLoad")'})
	 *   < b-button
	 *     Hello world
	 *
	 *   < b-input
	 * ```
	 */
	- block render(opts, content)
		+= self.loadModules([], opts)
			+= content

	/**
	 * Returns a link to a template by the specified path
	 * @param {string} path
	 */
	- block getTpl(path)
		? path = path.replace(/\/$/, '.index')
		- return $C(exports).get(path)

	/**
	 * Applies Typograf to the specified content
	 * @param {string} content
	 */
	- block typograf(content)
		+= content|typograf

	/**
	 * Appends the specified value to root component classes
	 * @param {string} value
	 */
	- block appendToRootClasses(value)
		- if rootAttrs[':class']
			? rootAttrs[':class'] = '[].concat((' + value + ') || [], ' + rootAttrs[':class'] + ')'

		- else
			rootAttrs[':class'] = value

	- rootAttrs = { &
		':class': '[...provide.componentClasses("' + self.name() + '", mods), "i-block-helper", componentId]',

		':-render-group': 'renderGroup',
		':-render-counter': 'renderCounter',

		'v-hook': "!isVirtualTpl && (isFunctional || isFlyweight) ?" +
			"{" +
				"bind: createInternalHookListener('bind')," +
				"inserted: createInternalHookListener('inserted')," +
				"update: createInternalHookListener('update')," +
				"unbind: createInternalHookListener('unbind')" +
			"} :" +

			"null"
	} .

	- if skeletonMarker
		? rootAttrs['data-skeleton-marker'] = 'true'

	- block rootAttrs

	- attrs = {}
	- block attrs

	- slotAttrs = {':stage': 'stage', ':ctx': 'self'}
	- block slotAttrs

	- block root
		< ?.${self.name()}
			< _ :v-attrs = rootAttrs | ${rootAttrs|!html}

				/**
				 * Generates an icon layout
				 *
				 * @param {(string|!Array<gIcon>)} iconId
				 * @param {Object=} [classes]
				 * @param {Object=} [attrs]
				 */
				- block gIcon(iconId, classes = {}, attrs = {})
					< svg[.g-icon] :class = provide.elClasses(${classes|json}) | ${attrs}
						- if Object.isArray(iconId)
							< use v-if = value | v-update-on = { &
								emitter: getIconLink(${iconId}),
								handler: (...args) => updateIconHref(${iconId}, ...args),
								errorHandler: (...args) => handleIconError(${iconId}, ...args)
							} .

						- else
							< use v-if = value | v-update-on = { &
								emitter: getIconLink('${iconId}'),
								handler: (...args) => updateIconHref('${iconId}', ...args),
								errorHandler: (...args) => handleIconError('${iconId}', ...args)
							} .

				/**
				 * Generates a slot declaration (scoped and plain)
				 *
				 * @param {string=} [name] - slot name
				 * @param {Object=} [attrs] - scoped slot attributes
				 * @param {string=} [content] - slot content
				 */
				- block slot(name = 'default', attrs, content)
					- switch arguments.length
						> 1
							- if name instanceof Unsafe
								? content = name
								? name = 'default'

						> 2
							- if attrs instanceof Unsafe
								? content = attrs
								? attrs = {}

					< template v-if = $scopedSlots['${name}']
						< slot name = ${name} | ${Object.assign({}, slotAttrs, attrs)|!html}

					< template v-else
						< slot name = ${name}
							+= content

				- block headHelpers

				- block innerRoot
					- block bodyHeader

					< ${rootWrapper ? '_' : '?'}.&__root-wrapper
						< ${overWrapper ? '_' : '?'}.&__over-wrapper
							- block overWrapper

						- block body

					- block bodyFooter

					- block helpers
					- block providers
