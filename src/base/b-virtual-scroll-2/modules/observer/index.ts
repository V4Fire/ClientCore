/*!
 * V4Fire Client Core
 * https://github.com/V4Fire/Client
 *
 * Released under the MIT license
 * https://github.com/V4Fire/Client/blob/master/LICENSE
 */

import Friend from 'super/i-block/modules/friend';

import type bVirtualScroll2 from 'base/b-virtual-scroll-2/b-virtual-scroll-2';
import type { MountedChild } from 'base/b-virtual-scroll-2/interface';

import IoObserver from 'base/b-virtual-scroll-2/modules/observer/engines/intersection-observer';

export { default as IoObserver } from 'base/b-virtual-scroll-2/modules/observer/engines/intersection-observer';

/**
 * Observer class for `bVirtualScroll` component.
 * It provides observation capabilities using different engines such as IoObserver and ScrollObserver.
 */
export class Observer extends Friend {
	override readonly C!: bVirtualScroll2;

	/**
	 * The observation engine used by the Observer.
	 */
	protected engine: IoObserver;

	/**
	 * @param ctx - the `bVirtualScroll` component instance.
	 */
	constructor(ctx: bVirtualScroll2) {
		super(ctx);

		this.engine = new IoObserver(ctx);
	}

	/**
	 * Starts observing the specified mounted elements
	 * @param mounted - an array of elements to be observed.
	 */
	observe(mounted: MountedChild[]): void {
		const
			{ctx} = this;

		if (ctx.disableObserver) {
			return;
		}

		this.engine.watchForIntersection(mounted);
	}

	/**
	 * Resets the module state
	 */
	reset(): void {
		this.engine.reset();
	}
}
