/*!
 * V4Fire Client Core
 * https://github.com/V4Fire/Client
 *
 * Released under the MIT license
 * https://github.com/V4Fire/Client/blob/master/LICENSE
 */

/**
 * [[include:components/super/i-static-page/modules/page-meta-data/README.md]]
 * @packageDocumentation
 */

import type { MetaAttributes, LinkAttributes } from 'components/super/i-static-page/modules/page-meta-data/interface';

export * from 'components/super/i-static-page/modules/page-meta-data/interface';

export default class PageMetaData {
	/**
	 * Current page title
	 */
	get title(): string {
		return document.title;
	}

	/**
	 * Sets a new title for the current page
	 * @param value - the new title value
	 */
	set title(value: string) {
		const
			div = Object.assign(document.createElement('div'), {innerHTML: value}),
			title = div.textContent ?? '';

		// Fix for a strange Chrome bug
		document.title = `${title} `;
		document.title = title;
	}

	/**
	 * Current page description
	 */
	get description(): string {
		const
			descriptionMeta = this.findElementsWithAttrs<HTMLMetaElement>('meta', {name: 'description'});

		if (descriptionMeta.length > 0) {
			return descriptionMeta[0].content;
		}

		return '';
	}

	/**
	 * Sets a new description for the current page
	 * @param value - the new description value
	 */
	set description(value: string) {
		const
			metaAttrs = {name: 'description'},
			metaDescriptionElements = this.findElementsWithAttrs<HTMLMetaElement>('meta', metaAttrs);

		let
			metaDescriptionElement: HTMLMetaElement | undefined;

		if (metaDescriptionElements.length > 0) {
			metaDescriptionElement = metaDescriptionElements[0];

		} else {
			metaDescriptionElement = this.createElement<HTMLMetaElement>('meta', metaAttrs);
		}

		metaDescriptionElement.content = value;
	}

	/**
	 * Adds a new link tag with the given attributes to the current page
	 * @param attrs - attributes for the created tag
	 */
	addLink(attrs: LinkAttributes): HTMLLinkElement {
		return this.createElement<HTMLLinkElement>('link', attrs);
	}

	/**
	 * Searches for link elements with the given attributes and returns them
	 * @param [attrs] - additional attributes of the searched elements
	 */
	findLinks(attrs?: LinkAttributes): NodeListOf<HTMLLinkElement> {
		return this.findElementsWithAttrs('link', attrs);
	}

	/**
	 * Adds a new meta element on a page
	 * @param attrs - attributes for the created tag
	 */
	addMeta(attrs: MetaAttributes): HTMLMetaElement {
		return this.createElement<HTMLMetaElement>('meta', attrs);
	}

	/**
	 * Searches for meta elements with the given attributes and returns them
	 * @param [attrs] - additional attributes of the searched elements
	 */
	findMetas(attrs?: MetaAttributes): NodeListOf<HTMLMetaElement> {
		return this.findElementsWithAttrs<HTMLMetaElement>('meta', attrs);
	}

	/**
	 * Searches for elements in the document with the given name and attributes and returns them
	 *
	 * @param tag - the tag name of the searched elements
	 * @param [attrs] - additional attributes of the searched elements
	 */
	protected findElementsWithAttrs<T extends Element = Element>(tag: string, attrs?: Dictionary<string>): NodeListOf<T> {
		const
			selector: string[] = [];

		if (attrs != null) {
			Object.entries(attrs).forEach(([attr, value]) => {
				selector.push(`[${attr}=${value}]`);
			});
		}

		return document.querySelectorAll<T>(tag + selector.join(''));
	}

	/**
	 * Creates a new element and inserts it into the page `<head>`
	 *
	 * @param tag - the element tag name to create
	 * @param [attrs] - additional attributes of the created element
	 */
	protected createElement<T extends HTMLElement>(tag: string, attrs?: Dictionary<string>): T {
		const el = Object.assign(<T>document.createElement(tag), attrs);
		return document.head.appendChild(el);
	}
}
