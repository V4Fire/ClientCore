/*!
 * V4Fire Client Core
 * https://github.com/V4Fire/Client
 *
 * Released under the MIT license
 * https://github.com/V4Fire/Client/blob/master/LICENSE
 */

import type { VNodeDescriptor } from 'components/friends/vdom';
import type bVirtualScroll from 'components/base/b-virtual-scroll/b-virtual-scroll';

/**
 * Renders the provided `VNodes` to the `HTMLElements` via `vdom.render` API.
 *
 * @param ctx
 * @param items
 */
export function render(ctx: bVirtualScroll, items: VNodeDescriptor[]): HTMLElement[] {
	const
		vnodes = ctx.vdom.create(...items),
		// https://github.com/vuejs/core/issues/6061
		nodes = ctx.vdom.render(vnodes).filter((node) => node.nodeType !== node.TEXT_NODE);

	return <HTMLElement[]>nodes;
}