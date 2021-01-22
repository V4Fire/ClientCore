/*!
 * V4Fire Client Core
 * https://github.com/V4Fire/Client
 *
 * Released under the MIT license
 * https://github.com/V4Fire/Client/blob/master/LICENSE
 */

import { VNode } from 'core/component/engines';
import { ComponentInterface } from 'core/component/interface';

export interface CreateFakeCtxOptions {
	/**
	 * If true, then component prop values will be forced to initialize
	 */
	initProps?: boolean;

	/**
	 * If true, then the function uses safe access to object properties
	 * by using Object.getOwnPropertyDescriptor/defineProperty
	 *
	 * @default `false`
	 */
	safe?: boolean;
}

export interface FlyweightVNode extends VNode {
	fakeInstance: ComponentInterface;
}
