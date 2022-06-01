/*!
 * V4Fire Client Core
 * https://github.com/V4Fire/Client
 *
 * Released under the MIT license
 * https://github.com/V4Fire/Client/blob/master/LICENSE
 */

import { restart, deferRestart } from 'core/component/render/daemon';

import type AsyncRender from 'super/i-block/modules/async-render/class';

/**
 * Restarts the `asyncRender` daemon to force rendering of async chunks
 */
export function forceRender(this: AsyncRender): void {
	restart();
	this.localEmitter.emit('forceRender');
}

/**
 * Creates a task to restart the `asyncRender` daemon on the next tick
 * @see forceRender
 */
export function deferForceRender(this: AsyncRender): void {
	deferRestart();
	this.localEmitter.emit('forceRender');
}

/**
 * A factory to create filters for `AsyncRender`, it returns a new function.
 * The new function can return a boolean or promise. If the function returns a promise,
 * it will be resolved after firing a `forceRender` event.
 *
 * The main function can take an element name as the first parameter.
 * This element will be dropped before resolving the resulting promise.
 *
 * Notice, the initial component rendering is mean the same as `forceRender`.
 * This function is useful to re-render a functional component without touching the parent state.
 *
 * @param elementToDrop - an element to drop before resolving the promise
 *   (if the element is passed as a function, it would be invoked)
 *
 * @example
 * ```
 * < button @click = asyncRender.forceRender()
 *   Re-render the component
 *
 * < .&__wrapper v-async-target
 *   < template v-for = el in asyncRender.iterate(true, {filter: asyncRender.waitForceRender('content')})
 *     < .&__content
 *       {{ Math.random() }}
 * ```
 */
export function waitForceRender(
	this: AsyncRender,
	elementToDrop?: string | ((ctx: AsyncRender['component']) => CanPromise<CanUndef<string | Element>>)
): () => CanPromise<boolean> {
	return () => {
		const
			canImmediateRender = this.lfc.isBeforeCreate() || this.hook === 'beforeMount';

		if (canImmediateRender) {
			return true;
		}

		return this.localEmitter.promisifyOnce('forceRender').then(async () => {
			if (elementToDrop != null) {
				let
					el;

				if (Object.isFunction(elementToDrop)) {
					el = await elementToDrop(this.ctx);

				} else {
					el = elementToDrop;
				}

				if (Object.isString(el)) {
					this.block?.element(el)?.remove();

				} else {
					el?.remove();
				}
			}

			return true;
		});
	};
}
