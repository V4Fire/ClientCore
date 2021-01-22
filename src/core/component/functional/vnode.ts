/*!
 * V4Fire Client Core
 * https://github.com/V4Fire/Client
 *
 * Released under the MIT license
 * https://github.com/V4Fire/Client/blob/master/LICENSE
 */

import * as init from 'core/component/construct';

import { RenderContext } from 'core/component/render';
import { patchVNode, VNode } from 'core/component/engines';

import { $$ } from 'core/component/functional/const';

import { ComponentField, ComponentInterface } from 'core/component/interface';
import { FlyweightVNode } from 'core/component/functional/interface';

/**
 * Initializes a component from the specified VNode.
 * This function provides life-cycle hooks, adds classes and event listeners, etc.
 *
 * @param vnode
 * @param ctx - component context
 * @param renderCtx - render context
 */
export function initComponentVNode(vnode: VNode, ctx: ComponentInterface, renderCtx: RenderContext): FlyweightVNode {
	const
		{unsafe} = ctx,
		{data} = renderCtx;

	const flyweightVNode = Object.assign(vnode, {fakeInstance: ctx});
	patchVNode(flyweightVNode, ctx, renderCtx);

	// Attach component event listeners
	if (data.on != null) {
		for (let o = data.on, keys = Object.keys(o), i = 0; i < keys.length; i++) {
			const
				key = keys[i],
				fns = Array.concat([], o[key]);

			for (let i = 0; i < fns.length; i++) {
				const
					fn = fns[i];

				if (Object.isFunction(fn)) {
					unsafe.$on(key, fn);
				}
			}
		}
	}

	unsafe.onInsertedHook = onInsertedHook;
	init.createdState(ctx);

	return flyweightVNode;

	function onInsertedHook(): void {
		const
			el = ctx.$el;

		if (el == null) {
			unsafe.$destroy();
			return;
		}

		let
			oldCtx = el[$$.component];

		// The situation when we have an old context of the same component on the same node:
		// we need to merge the old state with a new
		if (oldCtx != null) {
			if (oldCtx === ctx) {
				return;
			}

			if (ctx.componentName !== oldCtx.componentName) {
				oldCtx = undefined;
				delete el[$$.component];
			}
		}

		if (oldCtx != null) {
			oldCtx.$componentId = ctx.componentId;

			// Destroy the old component
			oldCtx.$destroy();

			const
				props = ctx.$props,
				oldProps = oldCtx.$props,
				linkedFields = <Dictionary<string>>{};

			// Merge prop values
			for (let keys = Object.keys(oldProps), i = 0; i < keys.length; i++) {
				const
					key = keys[i],
					linked = oldCtx.$syncLinkCache.get(key);

				if (linked != null) {
					for (let keys = Object.keys(linked), i = 0; i < keys.length; i++) {
						const
							link = linked[keys[i]];

						if (link != null) {
							linkedFields[link.path] = key;
						}
					}
				}
			}

			// Merge field/system field values

			{
				const list = [
					oldCtx.meta.systemFields,
					oldCtx.meta.fields
				];

				for (let i = 0; i < list.length; i++) {
					const
						obj = list[i],
						keys = Object.keys(obj);

					for (let j = 0; j < keys.length; j++) {
						const
							key = keys[j],
							field = <CanUndef<ComponentField>>obj[key];

						if (field == null) {
							continue;
						}

						const
							link = linkedFields[key];

						const
							val = ctx[key],
							oldVal = oldCtx[key];

						const needMerge =
							unsafe.$modifiedFields[key] !== true &&

							(
								Object.isFunction(field.unique) ?
									!Object.isTruly(field.unique(ctx.unsafe, oldCtx)) :
									!field.unique
							) &&

							!Object.fastCompare(val, oldVal) &&

							(
								link == null ||
								Object.fastCompare(props[link], oldProps[link])
							);

						if (needMerge) {
							if (Object.isTruly(field.merge)) {
								if (field.merge === true) {
									let
										newVal = oldVal;

									if (Object.isPlainObject(val) || Object.isPlainObject(oldVal)) {
										newVal = {...val, ...oldVal};

									} else if (Object.isArray(val) || Object.isArray(oldVal)) {
										newVal = Object.assign([], val, oldVal);
									}

									ctx[key] = newVal;

								} else if (Object.isFunction(field.merge)) {
									field.merge(ctx.unsafe, oldCtx, key, link);
								}

							} else {
								ctx[key] = oldCtx[key];
							}
						}
					}
				}
			}
		}

		el[$$.component] = unsafe;
		init.mountedState(ctx);
	}
}
