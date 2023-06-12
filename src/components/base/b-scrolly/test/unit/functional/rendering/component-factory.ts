/*!
 * V4Fire Client Core
 * https://github.com/V4Fire/Client
 *
 * Released under the MIT license
 * https://github.com/V4Fire/Client/blob/master/LICENSE
 */

/**
 * @file Test cases of the component lifecycle
 */

import test from 'tests/config/unit/test';

import { createTestHelpers } from 'components/base/b-scrolly/test/api/helpers';
import type { ComponentItemFactory } from 'components/base/b-scrolly/b-scrolly';
import type { ComponentItem } from 'components/base/b-scrolly/interface';

test.describe('<b-scrolly> rendering via component factory', () => {
	let
		component: Awaited<ReturnType<typeof createTestHelpers>>['component'],
		provider:Awaited<ReturnType<typeof createTestHelpers>>['provider'],
		state: Awaited<ReturnType<typeof createTestHelpers>>['state'];

	test.beforeEach(async ({demoPage, page}) => {
		await demoPage.goto();

		({component, provider, state} = await createTestHelpers(page));
		await provider.start();
	});

	test('Returned items with type `item` is equal to the provided data', async () => {
		const
			chunkSize = 12;

		provider
			.responseOnce(200, {data: state.data.addData(chunkSize)})
			.response(200, {data: state.data.addData(0)});

		const itemsFactory = await component.mockFn<ComponentItemFactory<{i: number}>>((state) => {
			const data = state.lastLoadedData;

			return data.map((item) => ({
				item: 'section',
				key: '',
				type: 'item',
				children: [],
				props: {
					'data-index': item.i
				}
			}));
		});

		await component.setProps({
			itemsFactory,
			shouldPerformDataRender: () => true,
			chunkSize
		});

		await component.withDefaultPaginationProviderProps({chunkSize});
		await component.build();
		await component.waitForContainerChildCountEqualsTo(chunkSize);

		await test.expect(component.childList).toHaveCount(chunkSize);
	});

	test('In additional `item`, `separator` was also returned', async () => {
		const
			chunkSize = 12;

		provider
			.responseOnce(200, {data: state.data.addData(chunkSize)})
			.response(200, {data: state.data.addData(0)});

		const itemsFactory = await component.mockFn<ComponentItemFactory<{i: number}>>((state) => {
			const
				data = state.lastLoadedData;

			const items = data.map<ComponentItem>((item) => ({
				item: 'section',
				key: '',
				type: 'item',
				children: [],
				props: {
					'data-index': item.i
				}
			}));

			items.push({
				item: 'b-button',
				key: '',
				children: {
					default: 'ima button'
				},
				props: {
					id: 'button'
				},
				type: 'separator'
			});

			return items;
		});

		await component.setProps({
			itemsFactory,
			shouldPerformDataRender: () => true,
			chunkSize
		});

		await component.withDefaultPaginationProviderProps({chunkSize});
		await component.build();
		await component.waitForContainerChildCountEqualsTo(chunkSize + 1);

		await test.expect(component.container.locator('#button')).toBeVisible();
		await test.expect(component.childList).toHaveCount(chunkSize + 1);
	});

	test('Returned items with type `item` is less than the provided data', async () => {
		const
			chunkSize = 12,
			renderedChunkSize = chunkSize - 2;

		provider
			.responseOnce(200, {data: state.data.addData(chunkSize)})
			.response(200, {data: state.data.addData(0)});

		const itemsFactory = await component.mockFn<ComponentItemFactory<{i: number}>>((state) => {
			const data = state.lastLoadedData;

			const items = data.map<ComponentItem>((item) => ({
				item: 'section',
				key: '',
				type: 'item',
				children: [],
				props: {
					'data-index': item.i
				}
			}));

			items.length -= 2;
			return items;
		});

		await component.setProps({
			itemsFactory,
			shouldPerformDataRender: () => true,
			chunkSize
		});

		await component.withDefaultPaginationProviderProps({chunkSize});
		await component.build();
		await component.waitForContainerChildCountEqualsTo(renderedChunkSize);

		await test.expect(component.childList).toHaveCount(renderedChunkSize);
	});

	test('Returned item with type `item` is more than the provided data', async () => {
		const
			chunkSize = 12,
			renderedChunkSize = chunkSize * 2;

		provider
			.responseOnce(200, {data: state.data.addData(chunkSize)})
			.response(200, {data: state.data.addData(0)});

		const itemsFactory = await component.mockFn<ComponentItemFactory<{i: number}>>((state) => {
			const data = state.lastLoadedData;

			const items = data.map<ComponentItem>((item) => ({
				item: 'section',
				key: '',
				type: 'item',
				children: [],
				props: {
					'data-index': item.i
				}
			}));

			return [...items, ...items];
		});

		await component.setProps({
			itemsFactory,
			shouldPerformDataRender: () => true,
			chunkSize
		});

		await component.withDefaultPaginationProviderProps({chunkSize});
		await component.build();
		await component.waitForContainerChildCountEqualsTo(renderedChunkSize);

		await test.expect(component.childList).toHaveCount(renderedChunkSize);
	});

	test('`item` was not returned, but equal to the number of data, the number of `separator` was returned', async () => {
		const
			chunkSize = 12;

		provider
			.responseOnce(200, {data: state.data.addData(chunkSize)})
			.response(200, {data: state.data.addData(0)});

		const itemsFactory = await component.mockFn<ComponentItemFactory<{i: number}>>((state) => {
			const data = state.lastLoadedData;

			return data.map((item) => ({
				item: 'section',
				key: '',
				type: 'separator',
				children: [],
				props: {
					'data-index': item.i
				}
			}));
		});

		await component.setProps({
			itemsFactory,
			shouldPerformDataRender: () => true,
			chunkSize
		});

		await component.withDefaultPaginationProviderProps({chunkSize});
		await component.build();
		await component.waitForContainerChildCountEqualsTo(chunkSize);

		await test.expect(component.childList).toHaveCount(chunkSize);
	});
});
