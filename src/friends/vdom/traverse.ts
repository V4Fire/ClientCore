/*!
 * V4Fire Client Core
 * https://github.com/V4Fire/Client
 *
 * Released under the MIT license
 * https://github.com/V4Fire/Client/blob/master/LICENSE
 */

import type VDOM from 'friends/vdom/class';
import { normalizeClass } from 'core/component';

import type iBlock from 'super/i-block';
import type { VNode } from 'super/i-block';

/**
 * Returns a link to the closest parent component from the current
 *
 * @param component - the component name to search or a link to the component constructor
 * @example
 * ```js
 * // Returns a link to the closes `b-wrapper` component or undefined
 * console.log(this.vdom.closest('b-wrapper'));
 *
 * // By a constructor
 * console.log(this.vdom.closest('bWrapper'));
 * ```
 */
export function closest<T extends iBlock = iBlock>(
	this: VDOM,
	component: string | ClassConstructor<any[], T> | Function
): CanUndef<T> {
	const
		nm = Object.isString(component) ? component.dasherize() : undefined;

	let
		el = this.ctx.$parent;

	while (el != null) {
		if ((Object.isFunction(component) && el.instance instanceof component) || el.componentName === nm) {
			return Object.cast(el);
		}

		el = el.$parent;
	}

	return undefined;
}

/**
 * Searches a VNode element by the specified element name from another VNode and context.
 * The function returns the found VNode or undefined.
 *
 * @param elName
 * @param vnode
 * @param [ctx] - a component context to resolve the passed element name
 *
 * @example
 * ```js
 * const vnode = this.vdom.create('div', {
 *   children: [
 *     {
 *       type: 'div',
 *       attrs: {class: this.block.getFullElName('elem')}
 *     }
 *   ]
 * });
 *
 * console.log(this.vdom.findElFromVNode('elem', vnode));
 * ```
 */
export function findElFromVNode(
	this: VDOM,
	elName: string,
	vnode: VNode,
	ctx: iBlock = this.component
): CanUndef<VNode> {
	const selector = ctx.provide.fullElName(elName);
	return search(vnode);

	function search(vnode: VNode) {
		const
			props = vnode.props ?? {};

		if (props.class != null) {
			const
				classes = normalizeClass(props.class).split(' ');

			if (classes.includes(selector)) {
				return vnode;
			}
		}

		if (vnode.children != null) {
			for (let i = 0; i < vnode.children.length; i++) {
				const
					res = search(vnode.children[i]);

				if (res != null) {
					return res;
				}
			}
		}

		return undefined;
	}
}
