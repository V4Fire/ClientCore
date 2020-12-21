/*!
 * V4Fire Client Core
 * https://github.com/V4Fire/Client
 *
 * Released under the MIT license
 * https://github.com/V4Fire/Client/blob/master/LICENSE
 */

/**
 * [[include:traits/i-icon/README.md]]
 * @packageDocumentation
 */

import { icons, iconsMap } from 'traits/i-icon/modules/icons';

export default abstract class iIcon {
	/**
	 * Returns a link for the specified icon
	 * @param iconId
	 */
	static async getIconLink(iconId: string): Promise<string> {
		if (!(iconId in iconsMap)) {
			throw new ReferenceError(`The specified icon "${iconId}" is not defined`);
		}

		let
			q = '';

		if (location.search !== '') {
			q = location.search;

		} else {
			q = location.href.endsWith('?') ? '?' : '';
		}

		const icon = await icons(iconsMap[iconId]);
		return `${location.pathname + q}#${icon.id}`;
	}

	/**
	 * Updates `href` of the specified `use` element
	 *
	 * @param el
	 * @param href
	 */
	static updateIconHref(el: SVGUseElement, href: string): void {
		const
			parent = el.parentNode;

		if (!parent) {
			return;
		}

		const newEl = document.createElementNS('http://www.w3.org/2000/svg', 'use');
		newEl.setAttributeNS('http://www.w3.org/1999/xlink', 'href', href);

		parent.nextSibling?.remove();
		parent.appendChild(newEl);
	}

	/**
	 * Link to iIcon.getIconLink
	 */
	abstract getIconLink: typeof iIcon.getIconLink;

	/**
	 * Link to iIcon.updateIconHref
	 */
	abstract updateIconHref: typeof iIcon.updateIconHref;
}
