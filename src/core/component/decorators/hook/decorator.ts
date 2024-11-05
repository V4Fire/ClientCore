/*!
 * V4Fire Client Core
 * https://github.com/V4Fire/Client
 *
 * Released under the MIT license
 * https://github.com/V4Fire/Client/blob/master/LICENSE
 */

import { createComponentDecorator3, normalizeFunctionalParams } from 'core/component/decorators/helpers';

import type { ComponentMethod } from 'core/component/interface';

import type { PartDecorator } from 'core/component/decorators/interface';

import type { DecoratorHook } from 'core/component/decorators/hook/interface';

/**
 * Attaches a hook listener to a component method.
 * This means that when the component switches to the specified hook(s), the method will be called.
 *
 * @decorator
 * @param [hook] - the hook name, an array of hooks, or an object with hook parameters
 *
 * @example
 * ```typescript
 * import iBlock, { component, hook } from 'components/super/i-block/i-block';
 *
 * @component()
 * class bExample extends iBlock {
 *   @hook('mounted')
 *   onMounted() {
 *
 *   }
 * }
 * ```
 */
export function hook(hook: DecoratorHook): PartDecorator {
	return createComponentDecorator3(({meta}, methodName) => {
		const methodHooks = Array.toArray(hook);

		let method: ComponentMethod;

		const alreadyDefined = meta.methods.hasOwnProperty(methodName);

		if (alreadyDefined) {
			method = meta.methods[methodName]!;

		} else {
			const parent = meta.methods[methodName];

			if (parent != null) {
				method = {
					...parent,
					src: meta.componentName
				};

				Object.assign(method, parent);

				if (parent.hooks != null) {
					method.hooks = Object.create(parent.hooks);
				}

			} else {
				method = {
					src: meta.componentName,
					fn: Object.throw
				};
			}
		}

		const {hooks = {}} = method;

		for (const hook of methodHooks) {
			if (Object.isSimpleObject(hook)) {
				const
					hookName = Object.keys(hook)[0],
					hookParams = hook[hookName];

				hooks[hookName] = normalizeFunctionalParams({
					...hookParams,
					name: methodName,
					hook: hookName,
					after: hookParams.after != null ? new Set(Array.toArray(hookParams.after)) : undefined
				}, meta);

			} else {
				hooks[hook] = normalizeFunctionalParams({name: methodName, hook}, meta);
			}
		}

		if (alreadyDefined) {
			method.hooks = hooks;

		} else {
			meta.methods[methodName] = normalizeFunctionalParams({...method, hooks}, meta);
		}
	});
}