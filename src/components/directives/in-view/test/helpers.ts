/*!
 * V4Fire Client Core
 * https://github.com/V4Fire/Client
 *
 * Released under the MIT license
 * https://github.com/V4Fire/Client/blob/master/LICENSE
 */

import type { Locator, Page } from 'playwright';

import { Scroll } from 'tests/helpers';

/**
 * The top margin of the observed element, in pixels
 */
export const TEST_DIV_MARGIN_TOP_PX = 1000;

/**
 * Initializes the viewport and ensures that the test element is not within the viewport when the test is started
 * @param page
 */
export async function initViewport(page: Page): Promise<void> {
	await page.setViewportSize({width: 500, height: TEST_DIV_MARGIN_TOP_PX / 2});

	await page.waitForFunction(
		(targetHeight) => globalThis.innerHeight < targetHeight,
		TEST_DIV_MARGIN_TOP_PX
	);
}

/**
 * Makes the element pointed by locator enter the viewport
 *
 * @param locator
 * @see https://playwright.dev/docs/api/class-locator#locator-click
 */
export async function makeEnterViewport(locator: Locator): Promise<void> {
	await locator.click();
}

/**
 * Restores the viewport scroll position to default
 * @param page
 */
export async function restoreViewport(page: Page): Promise<void> {
	await Scroll.scrollToTop(page);
}