/*!
 * V4Fire Client Core
 * https://github.com/V4Fire/Client
 *
 * Released under the MIT license
 * https://github.com/V4Fire/Client/blob/master/LICENSE
 */

// @ts-check

/**
 * @typedef {import('playwright').Page} Page
 */

const
	h = include('tests/helpers');

// eslint-disable-next-line no-inline-comments
module.exports = (/** @type Page */ page) => {

	let
		component,
		node,
		container;

	const
		getArray = (offset = 0, length = 12) => ({data: Array.from(Array(length), (v, i) => ({i: i + offset}))}),
		firstChunkExpected = getArray(),
		secondChunkExpected = getArray(12);

	const setProps = (requestProps = {}) => component.evaluate((ctx, requestProps) => {
		ctx.dataProvider = 'demo.Pagination';
		ctx.chunkSize = 10;
		ctx.request = {get: {chunkSize: 12, id: 'uniq', ...requestProps}};
	}, requestProps);

	const subscribe = (eventName) => component.evaluate((ctx, eventName) => new Promise((res) => ctx.watch(`:${eventName}`, res)), eventName);

	beforeEach(async () => {
		await h.utils.reloadAndWaitForIdle(page);

		component = await h.component.waitForComponent(page, '#target');
		node = await h.dom.waitForEl(page, '#target');
		container = await h.dom.waitForRef(node, 'container');
	});

	describe('b-virtual-scroll dataChange event', () => {
		describe('вызывается', () => {
			it('при загрузке первого чанка', async () => {
				const subscribePromise = subscribe('onDataChange');

				await setProps();
				await expectAsync(subscribePromise).toBeResolved();
			});

			it('при загрузки второго чанке', async () => {
				await setProps();
				await h.dom.waitForEl(container, 'section');

				const subscribePromise = subscribe('onDataChange');

				await h.scroll.scrollToBottom(page);
				await expectAsync(subscribePromise).toBeResolved();
			});

			it('после загрузки первой части чанка и остановки запросов с помощью `shouldStopRequest`', async () => {
				const subscribePromise = subscribe('onDataChange');

				await component.evaluate((ctx) => {
					ctx.dataProvider = 'demo.Pagination';
					ctx.request = {get: {chunkSize: 4, id: 'uniq'}};
					ctx.shouldStopRequest = () => true;
				});

				await expectAsync(subscribePromise).toBeResolvedTo(getArray(0, 4));
			});

			it('после загрузки второй части первого чанка и остановки запроса с помощью `shouldStopRequest`', async () => {
				const subscribePromise = subscribe('onDataChange');

				await component.evaluate((ctx) => {
					ctx.dataProvider = 'demo.Pagination';
					ctx.request = {get: {chunkSize: 4, id: 'uniq'}};
					ctx.shouldStopRequest = (v) => v.pendingData.length === 8;
				});

				await expectAsync(subscribePromise).toBeResolvedTo(getArray(0, 8));
			 });

			 it('после загрузки первой части второго чанка и остановки запроса с помощью `shouldStopRequest`', async () => {
				await component.evaluate((ctx) => {
					ctx.dataProvider = 'demo.Pagination';
					ctx.request = {get: {chunkSize: 4, id: 'uniq'}};
					ctx.shouldStopRequest = (v) => {
						const {lastLoadedChunk: {normalized}} = v;
						return normalized[normalized.length - 1].i === 15;
					};
				});

				await h.dom.waitForEl(container, 'section');

				const subscribePromise = subscribe('onDataChange');
				await h.scroll.scrollToBottom(page);

				await expectAsync(subscribePromise).toBeResolvedTo(getArray(12, 4));
			 });

		});

		describe('не вызывается', () => {
			it('если произошла ошибка загрузки', async () => {
				await component.evaluate((ctx) => ctx.watch(':onDataChange', () => ctx.tmp.change = true));

				await setProps({failOn: 0});
				await h.bom.waitForIdleCallback(page, {sleepAfterIdles: 1000});

				expect(await component.evaluate((ctx) => ctx.tmp.change)).toBeUndefined();
			});

			it('если произошла ошибка загрузки на втором чанке', async () => {
				await setProps({failOn: 1});
				await h.dom.waitForEl(container, 'section');

				await component.evaluate((ctx) => ctx.watch(':onDataChange', () => ctx.tmp.change = true));

				await h.scroll.scrollToBottom(page);
				await h.bom.waitForIdleCallback(page, {sleepAfterIdles: 1000});

				expect(await component.evaluate((ctx) => ctx.tmp.change)).toBeUndefined();
			});
		});

		describe('имеет корректный payload', () => {
			it('если ничего не было загружено', async () => {
				const subscribePromise = subscribe('onDataChange');

				await setProps({total: 0, chunkSize: 0});
				await expectAsync(subscribePromise).toBeResolvedTo({data: []});
			});

			describe('после загрузки', () => {
				it('первого чанка', async () => {
					const subscribePromise = subscribe('onDataChange');

					await setProps({chunkSize: 12});
					await expectAsync(subscribePromise).toBeResolvedTo(firstChunkExpected);
				});

				it('второго чанка', async () => {
					await setProps({chunkSize: 12});
					await h.dom.waitForEl(container, 'section');

					const subscribePromise = subscribe('onDataChange');

					await h.scroll.scrollToBottom(page);
					await expectAsync(subscribePromise).toBeResolvedTo(secondChunkExpected);
				});
			});

			describe('после переинциализации', () => {
				it('и загрузки первого чанка с помощью 2 запросов', async () => {
					await setProps({id: undefined});
					await h.dom.waitForEl(container, 'section');

					const subscribePromise = subscribe('onDataChange');

					await component.evaluate((ctx) => ctx.request = {get: {chunkSize: 6, id: 'uniq'}});

					await expectAsync(subscribePromise).toBeResolvedTo(firstChunkExpected);
				});

				it('и загрузки второго чанка с помощью 2 запросов', async () => {
					await setProps({id: undefined});
					await h.dom.waitForEl(container, 'section');

					await component.evaluate((ctx) => ctx.watch(':onDataChange', (val) => {
						ctx.tmp.currentCall = ctx.tmp.currentCall ?? 0;
						ctx.tmp[ctx.tmp.currentCall] = val;
						ctx.tmp.currentCall++;
					}));

					await component.evaluate((ctx) => ctx.request = {get: {chunkSize: 6, id: 'uniq'}});
					await h.bom.waitForIdleCallback(page, {sleepAfterIdles: 1000});

					expect(await component.evaluate((ctx) => ctx.tmp[0])).toEqual(firstChunkExpected);

					await h.scroll.scrollToBottom(page);
					await h.bom.waitForIdleCallback(page, {sleepAfterIdles: 1000});

					expect(await component.evaluate((ctx) => ctx.tmp[1])).toEqual(secondChunkExpected);
				});
			});
		});
	});
};
