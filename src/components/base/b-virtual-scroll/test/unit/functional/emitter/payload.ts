/*!
 * V4Fire Client Core
 * https://github.com/V4Fire/Client
 *
 * Released under the MIT license
 * https://github.com/V4Fire/Client/blob/master/LICENSE
 */

/**
 * @file This file contains test cases to verify the functionality of events emitted by the component.
 */

import test from 'tests/config/unit/test';

import { createTestHelpers, filterEmitterCalls } from 'components/base/b-virtual-scroll/test/api/helpers';
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

	test('All data has been loaded after the initial load', async () => {
		const chunkSize = 12;

		provider
			.responseOnce(200, {data: state.data.addData(chunkSize)})
			.response(200, {data: []});

		await component
			.withDefaultPaginationProviderProps({chunkSize})
			.withProps({
				chunkSize,
				shouldStopRequestingData: () => true,
				'@hook:beforeDataCreate': (ctx) => jestMock.spy(ctx, 'emit')
			})
			.build();

		await component.waitForLifecycleDone();

		const
			spy = await component.getSpy((ctx) => ctx.emit),
			calls = filterEmitterCalls(await spy.calls);

		test.expect(calls).toEqual([
			['dataLoadStart', true],
			['convertDataToDB', {data: state.data.data}],
			['dataLoadSuccess', state.data.data, true],
			['renderStart'],
			['renderEngineStart'],
			['renderEngineDone'],
			['domInsertStart'],
			['domInsertDone'],
			['renderDone'],
			['lifecycleDone']
		]);
	});

	test('All data has been loaded after the second load', async () => {
		const
			chunkSize = 12,
			providerChunkSize = chunkSize / 2;

		const
			firstDataChunk = state.data.addData(providerChunkSize),
			secondDataChunk = state.data.addData(providerChunkSize);

		provider
			.responseOnce(200, {data: firstDataChunk})
			.responseOnce(200, {data: secondDataChunk})
			.response(200, {data: []});

		await component
			.withDefaultPaginationProviderProps({chunkSize: providerChunkSize})
			.withProps({
				chunkSize,
				shouldPerformDataRequest: () => true,
				shouldStopRequestingData: ({lastLoadedData}) => lastLoadedData.length === 0,
				'@hook:beforeDataCreate': (ctx) => jestMock.spy(ctx, 'emit')
			})
			.build();

		await component.waitForContainerChildCountEqualsTo(chunkSize);

		const
			spy = await component.getSpy((ctx) => ctx.emit),
			calls = filterEmitterCalls(await spy.calls);

		test.expect(calls).toEqual([
			['dataLoadStart', true],
			['convertDataToDB', {data: firstDataChunk}],
			['dataLoadSuccess', firstDataChunk, true],
			['dataLoadStart', false],
			['convertDataToDB', {data: secondDataChunk}],
			['dataLoadSuccess', secondDataChunk, false],
			['renderStart'],
			['renderEngineStart'],
			['renderEngineDone'],
			['domInsertStart'],
			['domInsertDone'],
			['renderDone'],
			['dataLoadStart', false],
			['convertDataToDB', {data: []}],
			['dataLoadSuccess', [], false],
			['lifecycleDone']
		]);
	});

	test('Data loading is completed but data is less than chunkSize', async () => {
		const
			chunkSize = 12,
			providerChunkSize = chunkSize / 2;

		const
			firstDataChunk = state.data.addData(providerChunkSize);

		provider
			.responseOnce(200, {data: firstDataChunk})
			.response(200, {data: []});

		await component
			.withDefaultPaginationProviderProps({chunkSize: providerChunkSize})
			.withProps({
				chunkSize,
				shouldPerformDataRequest: () => true,
				shouldStopRequestingData: ({lastLoadedData}) => lastLoadedData.length === 0,
				'@hook:beforeDataCreate': (ctx) => jestMock.spy(ctx, 'emit')
			})
			.build();

		await component.waitForContainerChildCountEqualsTo(providerChunkSize);
		await component.waitForLifecycleDone();

		const
			spy = await component.getSpy((ctx) => ctx.emit),
			calls = filterEmitterCalls(await spy.calls);

		test.expect(calls).toEqual([
			['dataLoadStart', true],
			['convertDataToDB', {data: firstDataChunk}],
			['dataLoadSuccess', firstDataChunk, true],
			['dataLoadStart', false],
			['convertDataToDB', {data: []}],
			['dataLoadSuccess', [], false],
			['renderStart'],
			['renderEngineStart'],
			['renderEngineDone'],
			['domInsertStart'],
			['lifecycleDone'],
			['domInsertDone'],
			['renderDone']
		]);
	});

	test('Reload was called after data was rendered', async () => {
		const chunkSize = 12;

		provider
			.responseOnce(200, {data: state.data.addData(chunkSize)})
			.response(200, {data: []});

		await component
			.withDefaultPaginationProviderProps({chunkSize})
			.withProps({
				chunkSize,
				shouldStopRequestingData: () => true,
				'@hook:beforeDataCreate': (ctx) => jestMock.spy(ctx, 'emit')
			})
			.build();

		await component.waitForContainerChildCountEqualsTo(chunkSize);

		state.reset();
		provider.responseOnce(200, {data: state.data.addData(chunkSize)});

		await component.reload();
		await component.waitForContainerChildCountEqualsTo(chunkSize);

		const
			spy = await component.getSpy((ctx) => ctx.emit),
			calls = filterEmitterCalls(await spy.calls);

		test.expect(calls).toEqual([
			['dataLoadStart', true],
			['convertDataToDB', {data: state.data.data}],
			['dataLoadSuccess', state.data.data, true],
			['renderStart'],
			['renderEngineStart'],
			['renderEngineDone'],
			['domInsertStart'],
			['domInsertDone'],
			['renderDone'],
			['lifecycleDone'],
			['resetState'],
			['dataLoadStart', true],
			['convertDataToDB', {data: state.data.data}],
			['dataLoadSuccess', state.data.data, true],
			['renderStart'],
			['renderEngineStart'],
			['renderEngineDone'],
			['domInsertStart'],
			['domInsertDone'],
			['renderDone'],
			['lifecycleDone']
		]);
	});
});