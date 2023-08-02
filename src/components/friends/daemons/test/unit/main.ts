/*!
 * V4Fire Client Core
 * https://github.com/V4Fire/Client
 *
 * Released under the MIT license
 * https://github.com/V4Fire/Client/blob/master/LICENSE
 */

import type { Page, JSHandle } from 'playwright';

import test from 'tests/config/unit/test';

import { BOM, Component } from 'tests/helpers';

import type bFriendsDaemonsDummy from 'components/friends/daemons/test/b-friends-daemons-dummy/b-friends-daemons-dummy';

test.describe('friends/daemons', () => {
	let target: JSHandle<bFriendsDaemonsDummy>;

	test.beforeEach(async ({demoPage, page}) => {
		await demoPage.goto();
		await Component.waitForComponentTemplate(page, 'b-friends-daemons-dummy');
		target = await Component.createComponent(page, 'b-friends-daemons-dummy');
	});

	test.describe('should be executed on hooks', () => {
		test('`created`', async ({page}) => {
			await assertDaemonFlagValue(page, 'created', true);
		});

		test('`mounted`', async ({page}) => {
			await assertDaemonFlagValue(page, 'mounted', true);
		});
	});

	test('should be executed on field change', async ({page}) => {
		await assertDaemonFlagValue(page, 'fieldUpdate', undefined);

		await target.evaluate((ctx) => {
			ctx.testField = 2;
		});

		await BOM.waitForIdleCallback(page);

		await assertDaemonFlagValue(page, 'fieldUpdate', true);
	});

	test('should be executed when `run` is invoked', async ({page}) => {
		await target.evaluate((ctx) => {
			ctx.unsafe.daemons.run('executable');
		});

		await assertDaemonFlagValue(page, 'executable', true);
	});

	test.describe('`immediate`', () => {
		test('should be executed immediately when the field changes with `immediate = true`', async () => {
			const scan = logChanges(3);

			await target.evaluate((ctx) => {
				ctx.testFieldImmediate = 2;
				(<number>ctx.testFieldImmediate)++;
				(<number>ctx.testFieldImmediate)++;
			});

			await test.expect(scan).resolves.toEqual([
				[2, undefined],
				[3, 2],
				[4, 3]
			]);
		});

		test('should be executed on the next tick when the field changes with `immediate = false`', async () => {
			const scan = logChanges(2);

			await target.evaluate(async (ctx) => {
				ctx.testField = 2;
				(<number>ctx.testField)++;
				await ctx.nextTick();

				(<number>ctx.testField)++;
			});

			await test.expect(scan).resolves.toEqual([
				[3, 2],
				[4, 3]
			]);
		});
	});

	test.describe('async', () => {
		test('should cancel pending daemon execution when `async.clearAll` is invoked', async () => {
			const scan = logChanges(1);

			await target.evaluate(async (ctx) => {
				ctx.testFieldWithGroup = 2;
				(<number>ctx.testFieldWithGroup)++;
				await ctx.unsafe.async.clearAll({group: 'exec'});

				(<number>ctx.testFieldWithGroup)++;
			});

			await test.expect(scan).resolves.toEqual([[4, 3]]);
		});

		test('should execute the daemon only on the last change of the field when a `label` is provided', async () => {
			const scan = logChanges(1);

			await target.evaluate((ctx) => {
				ctx.testFieldWithLabel = 2;
				(<number>ctx.testFieldWithLabel)++;
				(<number>ctx.testFieldWithLabel)++;
			});

			await test.expect(scan).resolves.toEqual([[4, 3]]);
		});

		test('should execute the daemon only on the first change of the field with `join = true`', async () => {
			const scan = logChanges(1);

			await target.evaluate((ctx) => {
				ctx.testFieldWithJoin = 2;
				(<number>ctx.testFieldWithJoin)++;
				(<number>ctx.testFieldWithJoin)++;
			});

			await test.expect(scan).resolves.toEqual([[2, undefined]]);
		});
	});

	/**
	 * Asserts that a specific daemon has set the specified value
	 *
	 * @param page
	 * @param flag
	 * @param value
	 */
	async function assertDaemonFlagValue(page: Page, flag: string, value: unknown) {
		await test.expect(page.evaluate((flag) => globalThis.daemonsTest[flag], flag))
			.resolves.toBe(value);
	}

	/**
	 * Returns log of the component's fields changes
	 * @param expectedCount
	 */
	function logChanges(expectedCount: number): Promise<any[]> {
		return target.evaluate((ctx, expectedCount) => new Promise((resolve) => {
			const log: any[] = [];
			ctx.unsafe.localEmitter.on('change', (data) => {
				log.push(data);

				if (log.length >= expectedCount) {
					resolve(log);
				}
			});
		}), expectedCount);
	}
});