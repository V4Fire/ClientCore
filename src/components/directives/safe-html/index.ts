/*!
 * V4Fire Client Core
 * https://github.com/V4Fire/Client
 *
 * Released under the MIT license
 * https://github.com/V4Fire/Client/blob/master/LICENSE
 */

/**
 * [[include:core/component/directives/safe-html/README.md]]
 * @packageDocumentation
 */

import config from 'config';
import DOMPurify from 'dompurify';

import { ComponentEngine, VNode } from 'core/component/engines';
import type { SafeHtmlDirectiveParams } from 'components/directives/safe-html/interface';

export * from 'components/directives/safe-html/interface';

ComponentEngine.directive('safe-html', {
	beforeCreate({value, oldValue}: SafeHtmlDirectiveParams, vnode: VNode) {
		if (value === oldValue) {
			return;
		}

		let sanitized: string;

		if (typeof value === 'string') {
			sanitized = DOMPurify.sanitize(value, config.safeHtml);

		} else {
			sanitized = DOMPurify.sanitize(
				value.value,

				{
					...config.safeHtml,
					...value.options,

					RETURN_DOM_FRAGMENT: false,
					RETURN_DOM: false
				}
			);
		}

		vnode.props = {
			...vnode.props,
			innerHTML: sanitized
		};
	}
});