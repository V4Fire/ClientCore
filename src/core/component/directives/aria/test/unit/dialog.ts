// @ts-check

/*!
 * V4Fire Client Core
 * https://github.com/V4Fire/Client
 *
 * Released under the MIT license
 * https://github.com/V4Fire/Client/blob/master/LICENSE
 */
import type { JSHandle, Page } from 'playwright';
import type iBlock from 'super/i-block/i-block';

import test from 'tests/config/unit/test';
import Component from 'tests/helpers/component';

test.describe('v-aria:dialog', () => {
	test.beforeEach(async ({demoPage}) => {
		await demoPage.goto();
	});

	test('role is set', async ({page}) => {
		const target = await init(page);

		test.expect(
			await target.evaluate((ctx) => {
				const el = ctx.unsafe.block?.element('window');

				return el?.getAttribute('role');
			})
		).toBe('dialog');
	});

	test('aria-modal is set', async ({page}) => {
		const target = await init(page);

		test.expect(
			await target.evaluate((ctx) => {
				const el = ctx.unsafe.block?.element('window');

				return el?.getAttribute('aria-modal');
			})
		).toBe('true');
	});

	/**
	 * @param page
	 */
	async function init(page: Page): Promise<JSHandle<iBlock>> {
		return Component.createComponent(page, 'b-window');
	}
});
