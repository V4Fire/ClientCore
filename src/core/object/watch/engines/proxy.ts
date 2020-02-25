/*!
 * V4Fire Core
 * https://github.com/V4Fire/Core
 *
 * Released under the MIT license
 * https://github.com/V4Fire/Core/blob/master/LICENSE
 */

import { bindMutationHooks } from 'core/object/watch/wrap';
import { WatchHandler, WatchOptions, Watcher } from 'core/object/watch/interface';

const
	watchHandlers = Symbol('Watch handlers'),
	watchLabel = Symbol('Watch label');

/**
 * Watches for changes of the specified object by using Proxy objects
 *
 * @param obj
 * @param path - base path to object properties: it is provided to a watch handler with parameters
 * @param cb - callback that is invoked on every mutation hook
 * @param [opts] - additional options
 * @param [top] - link a top property of watching
 * @param [destructors] - list of destructors to cancel of watching
 */
export default function watch<T>(
	obj: T,
	path: CanUndef<unknown[]>,
	cb: WatchHandler,
	opts?: WatchOptions,
	top?: object,
	destructors: Function[] = []
): Watcher<T> | T {
	const returnProxy = (obj, proxy?) => {
		const
			handlers = proxy && obj[watchHandlers];

		if (handlers) {
			handlers.add(cb);

			destructors.push(() => {
				handlers.delete(cb);
			});
		}

		if (!top) {
			return {
				proxy: proxy || obj,
				unwatch(): void {
					destructors.forEach((fn) => fn());
				}
			};
		}

		return proxy || obj;
	};

	if (!obj || typeof obj !== 'object' || Object.isFrozen(obj)) {
		return returnProxy(obj);
	}

	const
		proxy = obj[watchLabel];

	if (proxy) {
		return returnProxy(obj, proxy);
	}

	const
		isPlainObject = Object.isPlainObject(obj),
		isArray = !isPlainObject && Object.isArray(obj);

	if (
		!isPlainObject &&
		!isArray &&
		!Object.isMap(obj) &&
		!Object.isSet(obj) &&
		!Object.isWeakMap(obj) &&
		!Object.isWeakSet(obj)
	) {
		return returnProxy(obj);
	}

	const
		handlers = obj[watchHandlers] = new Set(<Array<typeof cb>>[]),
		isRoot = !path;

	if (!isPlainObject && !isArray) {
		bindMutationHooks(<any>obj, {path, isRoot: Boolean(path)}, handlers);
	}

	return returnProxy(obj, obj[watchLabel] = new Proxy(<any>obj, {
		get: (target, key, receiver) => {
			const
				val = Reflect.get(target, key, receiver);

			if (opts?.deep) {
				return watch(val, (<unknown[]>[]).concat(path ?? [], key), cb, opts, top || val, destructors);
			}

			if (Object.isPlainObject(target) || Object.isArray(target)) {
				return val;
			}

			return Object.isFunction(val) ? val.bind(target) : val;
		},

		set: (target, key, val, receiver) => {
			if (Object.isArray(target) && String(Number(key)) === key) {
				key = Number(key);
			}

			const
				oldVal = Reflect.get(target, key, receiver);

			if (oldVal !== val && Reflect.set(target, key, val, receiver)) {
				for (let o = handlers.values(), val = o.next(); !val.done; val = o.next()) {
					val.value(val, oldVal, {
						obj: <any>obj,
						top,
						isRoot,
						path: (<unknown[]>[]).concat(path ?? [], key)
					});
				}
			}

			return true;
		}
	}));
}
