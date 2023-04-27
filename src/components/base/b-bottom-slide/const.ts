/*!
 * V4Fire Client Core
 * https://github.com/V4Fire/Client
 *
 * Released under the MIT license
 * https://github.com/V4Fire/Client/blob/master/LICENSE
 */

import symbolGenerator from 'core/symbol';

import type { HeightMode } from 'components/base/b-bottom-slide/interface';

export const
	$$ = symbolGenerator();

export const heightMode = <Record<HeightMode, boolean>>Object.createDict({
	full: true,
	content: true
});
