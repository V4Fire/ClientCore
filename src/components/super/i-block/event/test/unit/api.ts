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
import { BOM, Component } from 'tests/helpers';

test.describe('<i-block> event API', () => {
	const componentName = 'b-dummy';

	test.beforeEach(async ({demoPage, page}) => {
		await demoPage.goto();
		await page.evaluate((componentName) => {
			globalThis.componentName = componentName;
		}, componentName);
	});

	test('the event handler should be removed by using off and providing cb', async ({page}) => {
		const dummy = await Component.createComponent<bDummy>(page, 'b-dummy');

		await dummy.evaluate((ctx) => {
			ctx.testComponent = 'b-button-functional';
		});

		const childComponent = await Component.waitForComponentByQuery(page, '.b-button');

		await childComponent.evaluate((ctx) => {
			const dummy = ctx.$normalParent;

			const handler = () => {
				globalThis.testResult = true;
			};

			dummy?.once('hook:deactivated', handler);

			ctx.unsafe.async.worker(() => {
				dummy?.off('hook:deactivated', handler);
			});
		});

		await BOM.waitForIdleCallback(page);
		await childComponent.evaluate((ctx) => ctx.unsafe.$destroy());
		await BOM.waitForIdleCallback(page);
		await dummy.evaluate((ctx) => ctx.deactivate());
		await BOM.waitForIdleCallback(page);

		await test.expect(page.evaluate(() => globalThis.testResult)).resolves.toBeUndefined();
	});

	test('the event passed to `emit` should be normalized to camelCase', async ({page}) => {
		const target = await renderDummy(page);

		const scan = await target.evaluate((ctx) => {
			const res: any[] = [];

			ctx.on('onFoo_bar', (...args: any[]) => {
				res.push(...args);
			});

			ctx.on('onFoo-bar', (...args: any[]) => {
				res.push(...args);
			});

			ctx.on('onFooBar', (...args: any[]) => {
				res.push(...args);
			});

			ctx.emit('foo bar', 1);

			return res;
		});

		test.expect(scan).toEqual([1, 1, 1]);
	});

	test('the `emit` method should fire 3 events', async ({page}) => {
		const target = await renderDummy(page);

		const scan = await target.evaluate((ctx) => {
			const res: Array<Dictionary<any[]>> = [];

			ctx.on('foo', (ctx: bDummy, ...args: any[]) => {
				res.push({foo: [ctx.componentName, ...args]});
			});

			ctx.on('foo:component', (ctx: bDummy, ...args: any[]) => {
				res.push({'foo:component': [ctx.componentName, ...args]});
			});

			ctx.on('onFoo', (...args: any[]) => {
				res.push({onFoo: args});
			});

			ctx.emit('foo', 1, {a: 1});

			return res;
		});

		test.expect(scan).toEqual([
			{foo: [componentName, 1, {a: 1}]},
			{'foo:component': [componentName, 1, {a: 1}]},
			{onFoo: [1, {a: 1}]}
		]);
	});

	test(
		'the `prepend` flag should indicate the addition of the handler before all others',

		async ({page}) => {
			const target = await renderDummy(page);

			const scan = await target.evaluate((ctx) => {
				const res: number[] = [];

				ctx.on('foo', () => {
					res.push(1);
				});

				ctx.on('foo', () => {
					res.push(2);
				}, {prepend: true});

				ctx.on('foo', () => {
					res.push(3);
				}, {prepend: true});

				ctx.emit('foo');

				return res;
			});

			test.expect(scan).toEqual([3, 2, 1]);
		}
	);

	test('should remove all event listeners when `off` is invoked without a handler', async ({page}) => {
		const target = await renderDummy(page);

		const scan = await target.evaluate((ctx) => {
			const res: any[] = [];

			ctx.on('foo', (ctx: bDummy, ...args: any[]) => {
				res.push(ctx.componentName, ...args);
			});

			ctx.on('onFoo', (...args: any[]) => {
				res.push(...args);
			});

			ctx.off('onFoo');

			ctx.off('foo', () => {
				// Loopback
			});

			ctx.emit('foo', 1, {a: 1});

			return res;
		});

		test.expect(scan).toEqual([componentName, 1, {a: 1}]);
	});

	test(
		'when passing a group to the off method, only the handlers that are in the specified group should be removed',

		async ({page}) => {
			const target = await renderDummy(page);

			const scan = await target.evaluate((ctx) => {
				const res: any[] = [];

				ctx.on('foo', (ctx: bDummy, ...args: any[]) => {
					res.push(ctx.componentName, ...args);
				});

				ctx.on('onFoo', (...args: any[]) => {
					res.push(...args);
				}, {group: 'bar'});

				ctx.off({group: 'bar'});
				ctx.emit('foo', 1, {a: 1});

				return res;
			});

			test.expect(scan).toEqual([componentName, 1, {a: 1}]);
		}
	);

	test('the listener should be called once when it was set using `once` method', async ({page}) => {
		const target = await renderDummy(page);

		const scan = await target.evaluate((ctx) => {
			const res: Array<Dictionary<any[]>> = [];

			ctx.on('onFoo', (...args: any[]) => {
				res.push({on: args});
			});

			ctx.once('onFoo', (...args: any[]) => {
				res.push({once: args});
			});

			ctx.emit('foo', 1, {a: 1});
			ctx.emit('foo', 2, {a: 2});

			return res;
		});

		test.expect(scan).toEqual([
			{on: [1, {a: 1}]},
			{once: [1, {a: 1}]},
			{on: [2, {a: 2}]}
		]);
	});

	test('`promisifyOnce` should return a promise which resolves when the event is emitted', async ({page}) => {
		const target = await renderDummy(page);

		const scan = await target.evaluate((ctx) => {
			const res = ctx.promisifyOnce('onFoo');
			ctx.emit('foo', 1, {a: 1});
			return res;
		});

		test.expect(scan).toEqual(1);
	});

	test.describe('if the dispatching prop is set to true, then events start to bubble up to the parent component', () => {
		test(
			'the emitted events by the parent component should have a special prefix `$componentName::`',

			async ({page}) => {
				const target = await renderDummy(page, {
					dispatching: true
				});

				const scan = await target.evaluate((ctx) => {
					const res: Array<Dictionary<any[]>> = [];

					ctx.unsafe.parentEmitter.on(`${componentName}::foo`, (ctx: bDummy, ...args: any[]) => {
						res.push({[`${componentName}::foo`]: [ctx.componentName, ...args]});
					});

					ctx.unsafe.parentEmitter.on(`${componentName}::onFoo`, (...args: any[]) => {
						res.push({[`${componentName}::onFoo`]: args});
					});

					ctx.emit('foo', 1, {a: 1});

					return res;
				});

				test.expect(scan).toEqual([
					{[`${componentName}::foo`]: [componentName, 1, {a: 1}]},
					{[`${componentName}::onFoo`]: [1, {a: 1}]}
				]);
			}
		);

		test(
			[
				'if the `globalName` prop is specified, ',
				'the parent component should additionally emit events with the prefix `$globalName::`'
			].join(''),

			async ({page}) => {
				const globalName = 'baz';

				const target = await renderDummy(page, {
					dispatching: true,
					globalName
				});

				const scan = await target.evaluate((ctx, globalName) => {
					const res: Array<Dictionary<any[]>> = [];

					ctx.unsafe.parentEmitter.on(`${componentName}::foo`, (ctx: bDummy, ...args: any[]) => {
						res.push({[`${componentName}::foo`]: [ctx.componentName, ...args]});
					});

					ctx.unsafe.parentEmitter.on(`${componentName}::onFoo`, (...args: any[]) => {
						res.push({[`${componentName}::onFoo`]: args});
					});

					ctx.unsafe.parentEmitter.on(`${globalName}::foo`, (ctx: bDummy, ...args: any[]) => {
						res.push({[`${globalName}::foo`]: [ctx.componentName, ...args]});
					});

					ctx.unsafe.parentEmitter.on(`${globalName}::onFoo`, (...args: any[]) => {
						res.push({[`${globalName}::onFoo`]: args});
					});

					ctx.emit('foo', 1, {a: 1});

					return res;
				}, globalName);

				test.expect(scan).toEqual([
					{[`${componentName}::foo`]: [componentName, 1, {a: 1}]},
					{[`${componentName}::onFoo`]: [1, {a: 1}]},
					{[`${globalName}::foo`]: [componentName, 1, {a: 1}]},
					{[`${globalName}::onFoo`]: [1, {a: 1}]}
				]);
			}
		);

		test(
			[
				'if the `selfDispatching` prop of the parent component is set to true, ',
				'it should emit events without any prefixes'
			].join(''),

			async ({page}) => {
				const target = await renderDummy(page, {
					dispatching: true
				});

				const scan = await target.evaluate((ctx) => {
					const res: Array<Dictionary<any[]>> = [];

					Object.set(ctx.$parent, 'selfDispatching', true);

					ctx.unsafe.parentEmitter.on('foo', (ctx: bDummy, ...args: any[]) => {
						res.push({foo: [ctx.componentName, ...args]});
					});

					ctx.unsafe.parentEmitter.on('onFoo', (...args: any[]) => {
						res.push({onFoo: args});
					});

					ctx.emit('foo', 1, {a: 1});
					Object.set(ctx.$parent, 'selfDispatching', false);

					return res;
				});

				test.expect(scan).toEqual([
					{foo: [componentName, 1, {a: 1}]},
					{onFoo: [1, {a: 1}]}
				]);
			}
		);

		test(
			'lifecycle events should not bubble up to components with the `selfDispatching` prop set to true',

			async ({page}) => {
				const target = await renderDummy(page, {
					dispatching: true
				});

				const scan = await target.evaluate((ctx) => {
					const res: any[] = [];

					Object.set(ctx.$parent, 'selfDispatching', true);

					ctx.unsafe.parentEmitter.on('onHook:beforeDestroy', (ctx: bDummy, ...args: any[]) => {
						res.push(ctx.componentName, ...args);
					});

					ctx.unsafe.parentEmitter.on('onComponentStatus:destroyed', (ctx: bDummy, ...args: any[]) => {
						res.push(ctx.componentName, ...args);
					});

					ctx.unsafe.$destroy();
					Object.set(ctx.$parent, 'selfDispatching', false);

					return res;
				});

				test.expect(scan).toEqual([]);
			}
		);
	});
});
