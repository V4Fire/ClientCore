/*!
 * V4Fire Client Core
 * https://github.com/V4Fire/Client
 *
 * Released under the MIT license
 * https://github.com/V4Fire/Client/blob/master/LICENSE
 */

import { ElementRect } from 'core/component/directives/in-view/modules/meta';
import { GLOBAL } from 'core/env';

export const hasMutationObserver = 'MutationObserver' in GLOBAL;

/**
 * Returns offset top relative to root
 *
 * @param root
 * @param el
 */
export function getOffsetTop({scrollTop}: RootRect, {top}: DOMRect | ClientRect): number {
	return top + scrollTop;
}

/**
 * Returns offset left relative to the root
 *
 * @param root
 * @param el
 */
export function getOffsetLeft({scrollLeft}: RootRect, {left}: DOMRect | ClientRect): number {
	return left + scrollLeft;
}

/**
 * Returns true if an element is visible
 * @param rect
 */
export function isElementVisible(rect: {width: number; height: number}): boolean {
	return rect.width > 0 && rect.height > 0;
}

/**
 * Returns an element rect position relative to the root
 *
 * @param root
 * @param el
 */
export function getElementRect(root: RootRect, el: Element): ElementRect {
	const
		rect = el.getBoundingClientRect(),
		width = rect.width,
		height = rect.height,
		top = getOffsetTop(root, rect),
		left = getOffsetLeft(root, rect);

	return {
		bottom: top + height,
		right: left + width,
		top,
		left,
		width,
		height
	};
}

/**
 * Returns a page root
 */
export function getRoot(): Element {
	return document.documentElement || document.scrollingElement || document.body;
}

/**
 * Returns a root element rect
 */
export function getRootRect(): RootRect {
	const
		r = getRoot(),
		s = <Element>document.scrollingElement;

	return {
		width: r.clientWidth,
		height: r.clientHeight,
		scrollLeft: s.scrollLeft,
		scrollTop: s.scrollTop
	};
}

interface RootRect {
	width: number;
	height: number;
	scrollTop: number;
	scrollLeft: number;
}

/**
 * Returns true if an element is in view
 *
 * @param elRect
 * @param rootRect
 * @param threshold
 */
export function isElementInView(elRect: ElementRect, rootRect: RootRect, threshold: number): boolean {
	const
		isBoxInRootY = rootRect.scrollTop + rootRect.height >= elRect.top + elRect.height * threshold,
		isBoxInRootX = rootRect.scrollLeft + rootRect.width >= elRect.left + elRect.width * threshold,
		isVisibleYTop = elRect.top + elRect.height * threshold >= rootRect.scrollTop,
		isVisibleYBottom = elRect.bottom - elRect.height * threshold < rootRect.scrollTop,
		isVisibleX = elRect.left > 0 ?
			elRect.left - elRect.width * threshold <= rootRect.scrollLeft + rootRect.width :
			elRect.left + elRect.width * threshold >= rootRect.scrollLeft;

	return isBoxInRootY && isBoxInRootX && isVisibleYTop && isVisibleX && !isVisibleYBottom;
}
