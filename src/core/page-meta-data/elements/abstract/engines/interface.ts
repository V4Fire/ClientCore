/*!
 * V4Fire Client Core
 * https://github.com/V4Fire/Client
 *
 * Released under the MIT license
 * https://github.com/V4Fire/Client/blob/master/LICENSE
 */

import type { AbstractElement } from 'core/page-meta-data/elements';

export interface Engine {
	/**
	 * Renders the element as HTMLElement or string
	 *
	 * @param element
	 * @param tag
	 * @param attrs
	 */
	render(element: HTMLElement | AbstractElement, tag: string, attrs: Dictionary<string>): HTMLElement | string;

	/**
	 * Creates the element
	 *
	 * @param tag
	 * @param attrs
	 */
	create?(tag: string, attrs: Dictionary<string>): HTMLElement;

	/**
	 * Removes the element
	 * @param element
	 */
	remove?(element: HTMLElement | AbstractElement): HTMLElement | AbstractElement;
}