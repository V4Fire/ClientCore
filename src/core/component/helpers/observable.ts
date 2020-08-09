/*!
 * V4Fire Client Core
 * https://github.com/V4Fire/Client
 *
 * Released under the MIT license
 * https://github.com/V4Fire/Client/blob/master/LICENSE
 */

/**
 * @deprecated
 * @packageDocumentation
 */

import { deprecate } from 'core/functools/deprecation';

export type ObservableSet<V> = Set<V> | WeakSet<object>;
export type ObservableMap<K, V> = Map<K, V> | WeakMap<object, V>;
export type ObservableInstance<K = unknown, V = unknown> = ObservableSet<V> | ObservableMap<K, V>;

export interface ObservableParams {
	/**
	 * If true, then will be provided additional parameters to the callback, such as which method called the callback
	 */
	info?: boolean;

	/**
	 * Black list of methods to ignore
	 */
	ignore?: string[];

	/**
	 * If true, then the callback is invoked immediately after any mutation
	 */
	immediate?: boolean;
}

export const shimTable = {
	weakMap: {is: Object.isWeakMap, methods: ['set', 'delete']},
	weakSet: {is: Object.isWeakSet, methods: ['add', 'delete']},
	map: {is: Object.isMap, methods: ['set', 'delete', 'clear']},
	set: {is: Object.isSet, methods: ['add', 'delete', 'clear']}
};

/**
 * Wraps the specified Map object with mutation hooks
 *
 * @param obj
 * @param cb - callback that is invoked on every mutation hook
 * @param [params]
 *
 * @example
 * const s = observeMap(new Map(), () => console.log(123));
 * s.set(1); // 123
 */
export function observeMap<T extends ObservableMap<unknown, unknown> = ObservableMap<unknown, unknown>>(
	obj: T,
	cb: Function,
	params?: ObservableParams
): T {
	return bindMutationHooks(obj, cb, params);
}

/**
 * Wraps the specified Set object with mutation hooks
 *
 * @param obj
 * @param cb - callback that is invoked on every mutation hook
 * @param [params]
 *
 * @example
 * const s = observeSet(new Set(), () => console.log(123));
 * s.add(1); // 123
 */
export function observeSet<T extends ObservableSet<unknown> = ObservableSet<unknown>>(
	obj: T,
	cb: Function,
	params?: ObservableParams
): T {
	return bindMutationHooks(obj, cb, params);
}

/**
 * Wraps the specified object with mutation hooks
 *
 * @param obj
 * @param cb - callback that is invoked on every mutation hook
 * @param [params]
 * @private
 */
function bindMutationHooks<T extends ObservableInstance = ObservableInstance>(
	obj: T,
	cb: Function,
	params: ObservableParams = {}
): T {
	deprecate({
		type: 'function',
		name: 'bindMutationHooks',
		alternative: {
			name: 'watch',
			source: 'core/object/watch'
		}
	});

	const {
		ignore,
		info,
		immediate
	} = {immediate: false, ...params};

	let
		timerId;

	const wrappedCb = (...args) => {
		if (timerId == null && !immediate) {
			timerId = setImmediate(() => {
				cb(...args);
				timerId = undefined;
			});

		} else if (immediate) {
			cb(...args);
		}
	};

	const shim = (ctx, method, name, ...args) => {
		const
			a = info ? args.concat(name, obj) : [],
			res = method.call(ctx, ...args);

		wrappedCb(...a);
		return res;
	};

	for (let i = 0, keys = Object.keys(shimTable); i < keys.length; i++) {
		const
			k = keys[i],
			{is, methods} = shimTable[k];

		if (!Object.isTruly(is(obj))) {
			continue;
		}

		for (let j = 0; j < methods.length; j++) {
			const
				method = methods[j],
				fn = obj[method];

			if (ignore?.includes(method)) {
				continue;
			}

			obj[method] = function wrapper(this: unknown, ...args: unknown[]): unknown {
				return shim(this, fn, method, ...args);
			};
		}

		break;
	}

	return obj;
}
