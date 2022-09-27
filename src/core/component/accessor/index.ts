/*!
 * V4Fire Client Core
 * https://github.com/V4Fire/Client
 *
 * Released under the MIT license
 * https://github.com/V4Fire/Client/blob/master/LICENSE
 */

/**
 * [[include:core/component/accessor/README.md]]
 * @packageDocumentation
 */

import { deprecate } from 'core/functools/deprecation';
import { cacheStatus } from 'core/component/watch';

import type { ComponentInterface } from 'core/component/interface';

/**
 * Attaches accessors and computed fields to the specified component instance from its tied meta object.
 * The function creates cacheable wrappers for computed fields.
 * Also, it creates accessors for deprecated component props.
 *
 * @param component
 *
 * @example
 * ```typescript
 * import iBlock, { component, prop, computed } from 'super/i-block/i-block';
 *
 * @component({
 *   // Will create an accessor for `name` that refers to `fName` and emits a warning
 *   deprecatedProps: {name: 'fName'}
 * })
 *
 * export default class bUser extends iBlock {
 *   @prop()
 *   readonly fName: string;
 *
 *   @prop()
 *   readonly lName: string;
 *
 *   // This is a cacheable computed field with feature of watching and cache invalidation
 *   @computed({cache: true, dependencies: ['fName', 'lName']})
 *   get fullName() {
 *     return `${this.fName} ${this.lName}`;
 *   }
 *
 *   // This is a cacheable computed field without cache invalidation
 *   @computed({cache: true})
 *   get id() {
 *     return Math.random();
 *   }
 *
 *   // This is a simple accessor (a getter)
 *   get element() {
 *     return this.$el;
 *   }
 * }
 * ```
 */
export function attachAccessorsFromMeta(component: ComponentInterface): void {
	const {
		meta,
		meta: {params: {deprecatedProps}}
	} = component.unsafe;

	const
		ssrMode = component.$renderEngine.supports.ssr,
		isFunctional = meta.params.functional === true;

	Object.entries(meta.computedFields).forEach(([name, computed]) => {
		const canSkip =
			computed == null ||
			computed.cache === 'auto' ||
			component[name] != null ||
			!ssrMode && isFunctional && computed.functional === false;

		if (canSkip) {
			return;
		}

		// eslint-disable-next-line func-style
		const get = function get(this: typeof component): unknown {
			if (ssrMode) {
				return computed.get!.call(this);
			}

			if (cacheStatus in get) {
				return get[cacheStatus];
			}

			return get[cacheStatus] = computed.get!.call(this);
		};

		Object.defineProperty(component, name, {
			configurable: true,
			enumerable: true,
			get: computed.get != null ? get : undefined,
			set: computed.set
		});
	});

	Object.entries(meta.accessors).forEach(([name, accessor]) => {
		const canSkip =
			accessor == null ||
			component[name] != null ||
			!ssrMode && isFunctional && accessor.functional === false;

		if (canSkip) {
			return;
		}

		Object.defineProperty(component, name, {
			configurable: true,
			enumerable: true,
			get: accessor.get,
			set: accessor.set
		});
	});

	if (deprecatedProps != null) {
		Object.entries(deprecatedProps).forEach(([name, renamedTo]) => {
			if (renamedTo == null) {
				return;
			}

			Object.defineProperty(component, name, {
				configurable: true,
				enumerable: true,
				get: () => {
					deprecate({type: 'property', name, renamedTo});
					return component[renamedTo];
				},

				set: (val) => {
					deprecate({type: 'property', name, renamedTo});
					component[renamedTo] = val;
				}
			});
		});
	}
}
