/*!
 * V4Fire Client Core
 * https://github.com/V4Fire/Client
 *
 * Released under the MIT license
 * https://github.com/V4Fire/Client/blob/master/LICENSE
 */

import { defProp } from 'core/const/props';
import { initEmitter, metaPointers } from 'core/component/const';
import { ComponentMeta } from 'core/component/interface';

const inverseFieldMap = Object.createDict({
	props: ['fields', 'systemFields'],
	fields: ['props', 'systemFields'],
	systemFields: ['props', 'fields']
});

/**
 * Factory for creating component property decorators
 *
 * @param cluster - property cluster
 * @param [transformer] - transformer for parameters
 */
export function paramsFactory<T = unknown>(
	cluster: Nullable<string>,
	transformer?: (params: any, cluster: string) => Dictionary<any>
): (params?: T) => Function {
	return (params: Dictionary<any> = {}) => (target, key, desc) => {
		initEmitter.once('bindConstructor', (componentName) => {
			const
				link = metaPointers[componentName] = metaPointers[componentName] || Object.createDict();

			link[key] = true;
			initEmitter.once(`constructor.${componentName}`, reg);
		});

		function reg({meta}: {meta: ComponentMeta}): void {
			const wrapOpts = (opts) => {
				const
					p = meta.params;

				if (opts.replace === undefined && p.flyweight) {
					opts.replace = false;
				}

				if (opts.functional === undefined && p.functional === null) {
					opts.functional = false;
				}

				return opts;
			};

			let
				p = params;

			if (desc) {
				delete meta.props[key];
				delete meta.fields[key];
				delete meta.systemFields[key];

				const metaKey = cluster || (
					'value' in desc ? 'methods' : key in meta.computed && p.cache !== false ? 'computed' : 'accessors'
				);

				if (transformer) {
					p = transformer(p, metaKey);
				}

				const
					obj = meta[metaKey],
					el = obj[key] || {src: meta.componentName};

				if (metaKey === 'methods') {
					const
						name = key;

					let
						watchers = el.watchers,
						hooks = el.hooks;

					if (p.watch) {
						watchers = watchers || {};

						for (let o = <any[]>[].concat(p.watch), i = 0; i < o.length; i++) {
							const
								el = o[i];

							if (Object.isPlainObject(el)) {
								watchers[String((<Dictionary>el).field)] = wrapOpts({...p.watchParams, ...el});

							} else {
								watchers[el] = wrapOpts({field: el, ...p.watchParams});
							}
						}
					}

					if (p.hook) {
						hooks = hooks || {};

						for (let o = <any[]>[].concat(p.hook), i = 0; i < o.length; i++) {
							const
								el = o[i];

							if (Object.isSimpleObject(el)) {
								const
									key = Object.keys(el)[0],
									val = el[key];

								hooks[key] = wrapOpts({
									...val,
									name,
									hook: key,
									after: val.after ? new Set([].concat(val.after)) : undefined
								});

							} else {
								hooks[el] = wrapOpts({name, hook: el});
							}
						}
					}

					obj[key] = wrapOpts({...el, ...p, watchers, hooks});
					return;
				}

				const hasCache = 'cache' in p;
				delete p.cache;

				if (metaKey === 'accessors' ? key in meta.computed : !hasCache && key in meta.accessors) {
					obj[key] = wrapOpts({...meta.computed[key], ...p});
					delete meta.computed[key];

				} else {
					obj[key] = wrapOpts({...el, ...p});
				}

				return;
			}

			delete meta.methods[key];
			delete meta.accessors[key];
			delete meta.computed[key];

			const
				accessors = meta.accessors[key] ? meta.accessors : meta.computed;

			if (accessors[key]) {
				Object.defineProperty(meta.constructor.prototype, key, defProp);
				delete accessors[key];
			}

			const
				metaKey = cluster || (key in meta.props ? 'props' : 'fields'),
				inverse = inverseFieldMap[metaKey],
				obj = meta[metaKey];

			if (inverse) {
				for (let i = 0; i < inverse.length; i++) {
					const
						tmp = meta[inverse[i]];

					if (key in tmp) {
						obj[key] = tmp[key];
						delete tmp[key];
						break;
					}
				}
			}

			if (transformer) {
				p = transformer(p, metaKey);
			}

			const
				el = obj[key] || {src: meta.componentName};

			let
				watchers = el.watchers,
				after = el.after;

			if (p.after) {
				after = new Set([].concat(p.after));
			}

			if (p.watch) {
				for (let o = <any[]>[].concat(p.watch), i = 0; i < o.length; i++) {
					watchers = watchers || new Map();

					const
						val = o[i];

					if (Object.isPlainObject(val)) {
						watchers.set((<Dictionary>val).fn, wrapOpts({...val}));

					} else {
						watchers.set(val, wrapOpts({fn: val}));
					}
				}
			}

			obj[key] = wrapOpts({
				...el,
				...p,

				after,
				watchers,

				meta: {
					...el.meta,
					...p.meta
				}
			});
		}
	};
}
