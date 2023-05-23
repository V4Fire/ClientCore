/*!
 * V4Fire Client Core
 * https://github.com/V4Fire/Client
 *
 * Released under the MIT license
 * https://github.com/V4Fire/Client/blob/master/LICENSE
 */

import test from 'tests/config/unit/test';

import { renderDummy } from 'components/super/i-block/event/test/helpers';

import type bDummy from 'components/dummies/b-dummy/b-dummy';

test.describe('<i-block> events - API', () => {
	const componentName = 'b-dummy';

	test.beforeEach(async ({demoPage, page}) => {
		await demoPage.goto();
		await page.evaluate((componentName) => {
			globalThis.componentName = componentName;
		}, componentName);
	});

	test('should normalize an event name', async ({page}) => {
		const target = await renderDummy(page);

		const scan = await target.evaluate((ctx) => {
			const res: any[] = [];

			ctx.on('onFoo_bar', (...args) => {
				res.push(...args);
			});

			ctx.on('onFoo-bar', (...args) => {
				res.push(...args);
			});

			ctx.on('onFooBar', (...args) => {
				res.push(...args);
			});

			ctx.emit('foo bar', 1);

			return res;
		});

		test.expect(scan).toEqual([1, 1, 1]);
	});

	test('should emit double events', async ({page}) => {
		const target = await renderDummy(page);

		const scan = await target.evaluate((ctx) => {
			const res: any[] = [];

			ctx.on('foo', (ctx, ...args) => {
				res.push((<bDummy>ctx).componentName, ...args);
			});

			ctx.on('onFoo', (...args) => {
				res.push(...args);
			});

			ctx.emit('foo', 1, {a: 1});

			return res;
		});

		test.expect(scan).toEqual([componentName, 1, {a: 1}, 1, {a: 1}]);
	});

	test.skip('removing listeners', async ({page}) => {
		const target = await renderDummy(page);

		const scan = await target.evaluate((ctx) => {
			const res: any[] = [];

			ctx.on('foo', (ctx, ...args) => {
				res.push((<bDummy>ctx).componentName, ...args);
			});

			ctx.on('onFoo', (...args) => {
				res.push(...args);
			});

			// FIXME: iBlockEvent.off signature mismatch with EventEmitterWrapper.off
			// FIXME: selfEmitter.off call is forwarded too the ComponentInterface.$off
			// which is forwarded to the EventEmitter2.off, which requires handler as the 2nd argument
			ctx.off('onFoo');

			ctx.off('foo', () => {
				// Loopback
			});

			ctx.emit('foo', 1, {a: 1});

			return res;
		});

		test.expect(scan).toEqual([componentName, 1, {a: 1}]);
	});

	test('removing listeners via `async`', async ({page}) => {
		const target = await renderDummy(page);

		const scan = await target.evaluate((ctx) => {
			const res: any[] = [];

			ctx.on('foo', (ctx, ...args) => {
				res.push((<bDummy>ctx).componentName, ...args);
			});

			ctx.on('onFoo', (...args) => {
				res.push(...args);
			}, {group: 'bar'});

			ctx.unsafe.async.off({group: 'bar'});
			ctx.emit('foo', 1, {a: 1});

			return res;
		});

		test.expect(scan).toEqual([componentName, 1, {a: 1}]);
	});

	test('`once`', async ({page}) => {
		const target = await renderDummy(page);

		const scan = await target.evaluate((ctx) => {
			const res: any[] = [];

			ctx.on('foo', (ctx, ...args) => {
				res.push((<bDummy>ctx).componentName, ...args);
			});

			ctx.once('onFoo', (...args) => {
				res.push(...args);
			});

			ctx.emit('foo', 1, {a: 1});
			ctx.emit('foo', 2, {a: 2});

			return res;
		});

		test.expect(scan).toEqual([
			componentName,
			1,
			{a: 1},

			1,
			{a: 1},

			componentName,
			2,
			{a: 2}
		]);
	});

	test('`promisifyOnce`', async ({page}) => {
		const target = await renderDummy(page);

		const scan = await target.evaluate((ctx) => {
			const res = ctx.promisifyOnce('onFoo');
			ctx.emit('foo', 1, {a: 1});

			return res;
		});

		test.expect(scan).toEqual(1);
	});

	test.describe('dispatching of events', () => {
		// FIXME: broken test
		test.skip('simple usage', async ({page}) => {
			const target = await renderDummy(page, {
				dispatching: true
			});

			const scan = await target.evaluate((ctx) => {
				const res: any[] = [];

				ctx.on('onFoo', (...args) => {
					res.push(...args);
				});

				ctx.unsafe.rootEmitter.on(`${componentName}::foo`, (ctx, ...args) => {
					res.push((<bDummy>ctx).componentName, ...args);
				});

				ctx.unsafe.rootEmitter.on(`${componentName}::onFoo`, (...args) => {
					res.push(...args);
				});

				ctx.emit('foo', 1, {a: 1});

				return res;
			});

			test.expect(scan).toEqual([1, {a: 1}, componentName, 1, {a: 1}, 1, {a: 1}]);
		});

		// FIXME: broken test
		test.skip('providing `globalName`', async ({page}) => {
			const target = await renderDummy(page, {
				dispatching: true,
				globalName: 'baz'
			});

			const scan = await target.evaluate((ctx) => {
				const res: any[] = [];

				ctx.on('onFoo', (...args) => {
					res.push(...args);
				});

				ctx.unsafe.rootEmitter.on(`${componentName}::foo`, (ctx, ...args) => {
					res.push((<bDummy>ctx).componentName, ...args);
				});

				ctx.unsafe.rootEmitter.on(`${componentName}::onFoo`, (...args) => {
					res.push(...args);
				});

				ctx.unsafe.rootEmitter.on('baz::foo', (ctx, ...args) => {
					res.push((<bDummy>ctx).componentName, ...args);
				});

				ctx.unsafe.rootEmitter.on('baz::onFoo', (...args) => {
					res.push(...args);
				});

				ctx.emit('foo', 1, {a: 1});

				return res;
			});

			test.expect(scan).toEqual([
				1,
				{a: 1},

				componentName,
				1,
				{a: 1},

				1,
				{a: 1},

				componentName,
				1,
				{a: 1},

				1,
				{a: 1}
			]);
		});

		// FIXME: this test tries to change immutable component props
		test.skip('providing `selfDispatching`', async ({page}) => {
			const target = await renderDummy(page, {
				dispatching: true
			});

			const scan = await target.evaluate((ctx) => {
				const res: any[] = [];

				Object.set(ctx.r, 'selfDispatching', true);

				ctx.on('onFoo', (...args) => {
					res.push(...args);
				});

				ctx.unsafe.rootEmitter.on('foo', (ctx, ...args) => {
					res.push((<bDummy>ctx).componentName, ...args);
				});

				ctx.unsafe.rootEmitter.on('onFoo', (...args) => {
					res.push(...args);
				});

				ctx.emit('foo', 1, {a: 1});
				Object.set(ctx.r, 'selfDispatching', false);

				return res;
			});

			test.expect(scan).toEqual([1, {a: 1}, componentName, 1, {a: 1}, 1, {a: 1}]);
		});

		// FIXME: same issues as above
		test.skip('shouldn\'t self dispatch hook events', async ({page}) => {
			const target = await renderDummy(page, {
				dispatching: true
			});

			const scan = await target.evaluate((ctx) => {
				const res: any[] = [];

				Object.set(ctx.r, 'selfDispatching', true);

				ctx.on('onHook:beforeDestroy', (...args) => {
					res.push(...args);
				});

				ctx.on('onComponentStatus:destroyed', (...args) => {
					res.push(...args);
				});

				ctx.unsafe.rootEmitter.on('onHook:beforeDestroy', (ctx, ...args) => {
					res.push((<bDummy>ctx).componentName, ...args);
				});

				ctx.unsafe.rootEmitter.on('onComponentStatus:destroyed', (ctx, ...args) => {
					res.push((<bDummy>ctx).componentName, ...args);
				});

				ctx.unsafe.$destroy();
				Object.set(ctx.r, 'selfDispatching', false);

				return res;
			});

			test.expect(scan).toEqual(['beforeDestroy', 'mounted', 'destroyed', 'ready']);
		});
	});
});
