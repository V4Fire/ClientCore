/*!
 * V4Fire Core
 * https://github.com/V4Fire/Core
 *
 * Released under the MIT license
 * https://github.com/V4Fire/Core/blob/master/LICENSE
 */

/**
 * [[include:core/component/traverse/README.md]]
 * @packageDocumentation
 */

import { ComponentInterface } from 'core/component/interface';

/**
 * Returns a link to a "normal" (non-functional and non-flyweight) parent component for the specified component
 * @param component
 */
export function getNormalParent(component: ComponentInterface): CanUndef<ComponentInterface> {
	let
		normalParent: CanUndef<ComponentInterface> = component.$parent;

	while (
		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
		normalParent?.unsafe?.meta &&
		(normalParent.isFlyweight || normalParent.unsafe.meta.params.functional === true)
	) {
		normalParent = normalParent.$parent;
	}

	return normalParent;
}
