/*!
 * V4Fire Client Core
 * https://github.com/V4Fire/Client
 *
 * Released under the MIT license
 * https://github.com/V4Fire/Client/blob/master/LICENSE
 */

import type { JSHandle } from 'playwright';

import test from 'tests/config/unit/test';

import { Component } from 'tests/helpers';

import type bFriendsSyncDummy from 'components/friends/sync/test/b-friends-sync-dummy/b-friends-sync-dummy';

test.describe('friends/sync', () => {

	let target: JSHandle<bFriendsSyncDummy>;

	const componentName = 'b-friends-sync-dummy';

	test.beforeEach(async ({demoPage, page}) => {
		await demoPage.goto();
		await Component.waitForComponentTemplate(page, componentName);
		target = await Component.createComponent(page, componentName);
	});

	test('checking the initial values', async () => {
		test.expect(
			await target.evaluate((ctx) => ({
				dict: Object.fastClone(ctx.dict),
				linkToNestedFieldWithInitializer: ctx.linkToNestedFieldWithInitializer,
				watchableObject: Object.fastClone(ctx.watchableObject)
			}))
		).toEqual({
			dict: {a: {b: 2, c: 3}},
			linkToNestedFieldWithInitializer: 3,
			watchableObject: {
				dict: {a: {b: 2, c: 3}},
				linkToNestedFieldWithInitializer: 6,
				linkToPath: 2,
				linkToPathWithInitializer: 6
			}
		});
	});

	test('changing some values', async () => {
		test.expect(
			await target.evaluate(async (ctx) => {
				ctx.dict.a!.b!++;
				ctx.dict.a!.c!++;
				await ctx.nextTick();

				return {
					dict: Object.fastClone(ctx.dict),
					linkToNestedFieldWithInitializer: ctx.linkToNestedFieldWithInitializer,
					watchableObject: Object.fastClone(ctx.watchableObject)
				};
			})
		).toEqual({
			dict: {a: {b: 3, c: 4}},
			linkToNestedFieldWithInitializer: 4,
			watchableObject: {
				dict: {a: {b: 3, c: 4}},
				linkToNestedFieldWithInitializer: 8,
				linkToPath: 3,
				linkToPathWithInitializer: 8
			}
		});
	});
});
