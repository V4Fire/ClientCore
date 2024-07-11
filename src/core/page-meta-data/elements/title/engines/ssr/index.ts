/*!
 * V4Fire Client Core
 * https://github.com/V4Fire/Client
 *
 * Released under the MIT license
 * https://github.com/V4Fire/Client/blob/master/LICENSE
 */

import xss from 'xss';

import type { AbstractElement } from 'core/page-meta-data/elements';
import { SSREngine } from 'core/page-meta-data/elements/abstract/engines';

export class SSRTitleEngine extends SSREngine {
	override render(_element: AbstractElement, tag: string, attrs: Dictionary<string>): string {
		return xss(`<${tag}>${attrs.text ?? ''}</${tag}>`, {whiteList: {[tag]: []}});
	}
}

export const ssrTitleEngine = new SSRTitleEngine();
