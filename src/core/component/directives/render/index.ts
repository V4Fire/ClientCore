/*!
 * V4Fire Client Core
 * https://github.com/V4Fire/Client
 *
 * Released under the MIT license
 * https://github.com/V4Fire/Client/blob/master/LICENSE
 */

/**
 * [[include:core/component/directives/render/README.md]]
 * @packageDocumentation
 */

import { setVNodePatchFlags } from 'core/component/render';
import { ComponentEngine, VNode } from 'core/component/engines';

import { getDirectiveContext } from 'core/component/directives/helpers';
import type { DirectiveParams } from 'core/component/directives/render/interface';

export * from 'core/component/directives/render/interface';

ComponentEngine.directive('render', {
	beforeCreate(params: DirectiveParams, vnode: VNode): CanUndef<VNode> {
		const
			ctx = getDirectiveContext(params, vnode);

		const
			newVNode = params.value,
			originalChildren = vnode.children;

		if (newVNode != null) {
			const canReplaceVNode =
				vnode.type === 'template' &&
				!Object.isArray(newVNode) &&
				Object.size(vnode.props) === 0;

			if (canReplaceVNode) {
				return SSR ? renderSSRFragment(newVNode) : newVNode;
			}

			if (Object.isString(vnode.type)) {
				const
					children = Array.concat([], newVNode);

				if (SSR) {
					vnode.props = {
						...vnode.props,
						innerHTML: getSSRInnerHTML(children)
					};

				} else {
					vnode.children = children;
					vnode.dynamicChildren = Object.cast(children.slice());
					setVNodePatchFlags(vnode, 'children');
				}

			} else {
				const slots = Object.isPlainObject(originalChildren) ?
					Object.reject(originalChildren, /^_/) :
					{};

				vnode.children = slots;
				setVNodePatchFlags(vnode, 'slots');

				if (SSR) {
					slots.default = () => renderSSRFragment(newVNode);

				} else {
					if (Object.isArray(newVNode)) {
						if (isSlot(newVNode[0])) {
							newVNode.forEach((vnode) => {
								const
									slot = vnode.props?.slot;

								if (slot != null) {
									slots[slot] = () => vnode.children ?? getDefSlotFromChildren(slot);
								}
							});

							return;
						}

					} else if (isSlot(newVNode)) {
						const {slot} = newVNode.props!;
						slots[slot] = () => newVNode.children ?? getDefSlotFromChildren(slot);
						return;
					}

					slots.default = () => newVNode;
				}
			}
		}

		function getSSRInnerHTML(content: CanArray<CanPromise<VNode>>) {
			return Promise.all(Array.concat([], content)).then((content) => content.join(''));
		}

		function renderSSRFragment(content: CanArray<CanPromise<VNode>>) {
			if (ctx == null) {
				return;
			}

			const
				{r} = ctx.$renderEngine;

			return r.createVNode.call(ctx, 'ssr-fragment', {
				innerHTML: getSSRInnerHTML(content)
			});
		}

		function isSlot(vnode: CanUndef<VNode>): boolean {
			return vnode?.type === 'template' && vnode.props?.slot != null;
		}

		function getDefSlotFromChildren(slotName: string): unknown {
			if (Object.isPlainObject(originalChildren)) {
				const
					slot = originalChildren[slotName];

				if (Object.isFunction(slot)) {
					return slot();
				}

				return slot;
			}

			return originalChildren;
		}
	}
});
