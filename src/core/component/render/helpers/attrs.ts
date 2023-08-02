/*!
 * V4Fire Client Core
 * https://github.com/V4Fire/Client
 *
 * Released under the MIT license
 * https://github.com/V4Fire/Client/blob/master/LICENSE
 */

import { evalWith } from 'core/json';

import type { VNode } from 'core/component/engines';

import { isHandler, mergeProps } from 'core/component/render/helpers/props';
import { setVNodePatchFlags } from 'core/component/render/helpers/flags';

import type { ComponentInterface } from 'core/component/interface';

/**
 * Resolves values from special attributes of the given VNode.
 * Note: for the value of the `data-cached-dynamic-class` attribute,
 * you should use the JSON `core/json#evalWith` reviver format.
 *
 * @param vnode
 *
 * @example
 * ```js
 * // `.componentId = 'id-1'`
 * // `.componentName = 'b-example'`
 * // `.classes = {'elem-name': 'alias'}`
 * const ctx = this;
 *
 * // {props: {class: 'id-1 b-example alias'}}
 * resolveAttrs.call(ctx, {
 *   props: {
 *     'data-cached-class-component-id': '',
 *     'data-cached-class-provided-classes-styles': 'elem-name',
 *     'data-cached-dynamic-class': '["get", "componentName"]'
 *   }
 * })
 * ```
 */
export function resolveAttrs<T extends VNode>(this: ComponentInterface, vnode: T): T {
	const {
		ref,
		props,
		children,
		dynamicChildren
	} = vnode;

	const {
		meta: {params},
		$renderEngine: {r}
	} = this;

	if (ref != null) {
		ref['i'] ??= r.getCurrentInstance();
	}

	if (Object.isArray(children)) {
		children.forEach((child) => resolveAttrs.call(this, Object.cast(child)));
	}

	if (Object.isArray(dynamicChildren) && dynamicChildren.length > 0) {
		vnode.dynamicChildren = dynamicChildren.filter((el) => !el.ignore);
	}

	if (props == null) {
		return vnode;
	}

	{
		const
			key = 'v-attrs';

		if (props[key] != null) {
			const
				dir = r.resolveDirective.call(this, 'attrs');

			dir.beforeCreate({
				dir,

				modifiers: {},
				arg: undefined,

				value: props[key],
				oldValue: undefined,

				instance: this
			}, vnode);

			delete props[key];
		}
	}

	{
		const
			key = 'data-has-v-on-directives';

		if (props[key] != null) {
			setVNodePatchFlags(vnode, 'props');

			const dynamicProps = vnode.dynamicProps ?? [];
			vnode.dynamicProps = dynamicProps;

			Object.keys(props).forEach((prop) => {
				if (isHandler.test(prop)) {
					dynamicProps.push(prop);
				}
			});

			delete props[key];
		}
	}

	{
		const
			key = 'data-cached-class-component-id';

		if (props[key] != null) {
			if (props[key] === 'true' && params.functional !== true) {
				Object.assign(props, mergeProps({class: props.class}, {class: this.componentId}));
			}

			delete props[key];
		}
	}

	{
		const
			key = 'data-cached-class-provided-classes-styles',
			names = props[key];

		if (names != null) {
			names.split(' ').forEach((name) => {
				if ('classes' in this && this.classes?.[name] != null) {
					Object.assign(props, mergeProps({class: props.class}, {class: this.classes[name]}));
				}

				if ('styles' in this && this.styles?.[name] != null) {
					Object.assign(props, mergeProps({style: props.style}, {style: this.styles[name]}));
				}
			});

			delete props[key];
		}
	}

	{
		const
			key = 'data-cached-dynamic-class',
			rawValue = props[key];

		if (Object.isString(rawValue)) {
			const classValue = Object.parse(rawValue, evalWith(this));

			Object.assign(props, mergeProps({class: props.class}, {class: classValue}));
			delete props[key];
		}
	}

	return vnode;
}