/*!
 * V4Fire Client Core
 * https://github.com/V4Fire/Client
 *
 * Released under the MIT license
 * https://github.com/V4Fire/Client/blob/master/LICENSE
 */

/**
 * @file This file contains test cases that verify the correctness of the internal component state module.
 */

import test from 'tests/config/unit/test';

import type bVirtualScroll from 'components/base/b-virtual-scroll/b-virtual-scroll';
import { defaultShouldProps } from 'components/base/b-virtual-scroll/const';
import type { ComponentItem, ShouldPerform } from 'components/base/b-virtual-scroll/interface';

import { createTestHelpers } from 'components/base/b-virtual-scroll/test/api/helpers';
import type { VirtualScrollTestHelpers } from 'components/base/b-virtual-scroll/test/api/helpers/interface';

test.describe('<b-virtual-scroll>', () => {
	let
		component: VirtualScrollTestHelpers['component'],
		provider: VirtualScrollTestHelpers['provider'],
		state: VirtualScrollTestHelpers['state'];

	test.beforeEach(async ({demoPage, page}) => {
		await demoPage.goto();

		({component, provider, state} = await createTestHelpers(page));
		await provider.start();
	});

	test('Initial state', async () => {
		const
			chunkSize = 12,
			mockFn = await component.mockFn((ctx: bVirtualScroll) => ctx.getComponentState());

		provider.response(200, {data: []}, {delay: (10).seconds()});

		const expectedState = state.compile({
			lastLoadedRawData: undefined,
			itemsTillEnd: undefined,
			childTillEnd: undefined,
			maxViewedItem: undefined,
			maxViewedChild: undefined,
			isRequestsStopped: false,
			isLoadingInProgress: true,
			lastLoadedData: [],
			loadPage: 0
		});

		await component
			.withDefaultPaginationProviderProps({chunkSize})
			.withProps({
				'@hook:created': mockFn
			})
			.build();

		await test.expect(mockFn.results).resolves.toEqual([{type: 'return', value: expectedState}]);
	});

	test('State after loading first and second data chunks', async () => {
		const
			chunkSize = 12,
			providerChunkSize = chunkSize / 2;

		const
			shouldStopRequestingData = <ShouldPerform>(defaultShouldProps.shouldStopRequestingData),
			shouldPerformDataRequest = <ShouldPerform>(({isInitialLoading, itemsTillEnd, isLastEmpty}) =>
				isInitialLoading || (itemsTillEnd === 0 && !isLastEmpty)),
			shouldPerformDataRender = <ShouldPerform>(({isInitialRender, itemsTillEnd}) =>
				isInitialRender || itemsTillEnd === 0);

		await test.step('After rendering first data chunk', async () => {
			provider
				.responseOnce(200, {data: state.data.addData(providerChunkSize)})
				.responseOnce(200, {data: state.data.addData(providerChunkSize)});

			state.data.addItems(chunkSize);

			await component
				.withDefaultPaginationProviderProps({chunkSize: providerChunkSize})
				.withProps({
					chunkSize,
					shouldStopRequestingData,
					shouldPerformDataRequest,
					shouldPerformDataRender
				})
				.build();

			await component.waitForContainerChildCountEqualsTo(chunkSize);

			const
				currentState = await component.getComponentState();

			test.expect(currentState).toEqual(state.compile({
				isInitialLoading: false,
				isInitialRender: false,
				isRequestsStopped: false,
				isLoadingInProgress: false,
				loadPage: 2,
				renderPage: 1
			}));
		});

		await test.step('After rendering second data chunk', async () => {
			provider
				.responseOnce(200, {data: state.data.addData(providerChunkSize)})
				.responseOnce(200, {data: state.data.addData(providerChunkSize)})
				.response(200, {data: state.data.addData(0)});

			state.data.addItems(chunkSize);

			await component.scrollToBottom();
			await component.waitForContainerChildCountEqualsTo(chunkSize * 2);
			await component.scrollToBottom();
			await component.waitForLifecycleDone();

			const
				currentState = await component.getComponentState();

			test.expect(currentState).toEqual(state.compile({
				isInitialLoading: false,
				isInitialRender: false,
				isRequestsStopped: true,
				isLoadingInProgress: false,
				isLastEmpty: true,
				isLifecycleDone: true,
				loadPage: 5,
				renderPage: 2
			}));
		});
	});

	test.describe('State after rendering via `itemsFactory`', () => {
		test('`itemsFactory` returns items with `item` and `separator` type', async () => {
			const chunkSize = 12;

			const separator: ComponentItem = {
				item: 'b-button',
				key: Object.cast(undefined),
				children: {
					default: 'ima button'
				},
				props: {
					id: 'button'
				},
				type: 'separator'
			};

			const itemsFactory = await component.mockFn((state, ctx, separator) => {
				const
					data = state.lastLoadedData;

				const items = data.map((item) => ({
					item: 'section',
					key: Object.cast(undefined),
					type: 'item',
					props: {
						'data-index': item.i
					}
				}));

				if (data.length > 0) {
					items.push(separator);
				}

				return items;
			}, separator);

			provider
				.responseOnce(200, {data: state.data.addData(chunkSize)})
				.response(200, {data: state.data.addData(0)});

			state.data.addItems(chunkSize);
			state.data.addChild([separator]);

			await component
				.withDefaultPaginationProviderProps({chunkSize})
				.withProps({
					itemsFactory,
					shouldPerformDataRender: () => true,
					chunkSize
				})
				.build();

			await component.waitForContainerChildCountEqualsTo(chunkSize + 1);
			await component.waitForLifecycleDone();

			const
				currentState = await component.getComponentState();

			test.expect(currentState).toEqual(state.compile({
				isInitialLoading: false,
				isInitialRender: false,
				isRequestsStopped: true,
				isLoadingInProgress: false,
				isLastEmpty: true,
				isLifecycleDone: true,
				loadPage: 2,
				renderPage: 1
			}));
		});

		test('`itemsFactory` does not returns items with `item` type', async () => {
			const chunkSize = 12;

			const itemsFactory = await component.mockFn((state) => {
				const
					data = state.lastLoadedData;

				const items = data.map((item) => ({
					item: 'section',
					key: Object.cast(undefined),
					type: 'separator',
					props: {
						'data-index': item.i
					}
				}));

				return items;
			});

			provider
				.responseOnce(200, {data: state.data.addData(chunkSize)})
				.response(200, {data: state.data.addData(0)});

			state.data.addSeparators(chunkSize);

			await component
				.withDefaultPaginationProviderProps({chunkSize})
				.withProps({
					itemsFactory,
					shouldPerformDataRender: () => true,
					chunkSize
				})
				.build();

			await component.waitForContainerChildCountEqualsTo(chunkSize);
			await component.waitForLifecycleDone();

			const
				currentState = await component.getComponentState();

			test.expect(currentState).toEqual(state.compile({
				isInitialLoading: false,
				isInitialRender: false,
				isRequestsStopped: true,
				isLoadingInProgress: false,
				isLastEmpty: true,
				isLifecycleDone: true,
				maxViewedItem: undefined,
				loadPage: 2,
				renderPage: 1
			}));
		});
	});
});