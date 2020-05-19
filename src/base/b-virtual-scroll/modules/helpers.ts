/*!
 * V4Fire Client Core
 * https://github.com/V4Fire/Client
 *
 * Released under the MIT license
 * https://github.com/V4Fire/Client/blob/master/LICENSE
 */

import ChunkRender from 'base/b-virtual-scroll/modules/chunk-render';
import ChunkRequest from 'base/b-virtual-scroll/modules/chunk-request';

import { RequestMoreParams } from 'base/b-virtual-scroll/modules/interface';

/**
 * Returns a request params
 *
 * @param [chunkRequestCtx]
 * @param [chunkRenderCtx]
 * @param [merge]
 */
export function getRequestParams(
	chunkRequestCtx?: ChunkRequest,
	chunkRenderCtx?: ChunkRender,
	merge?: Dictionary
): RequestMoreParams {
	const
		component = chunkRenderCtx?.component || chunkRequestCtx?.component,
		pendingData = chunkRequestCtx?.unsafe.pendingData || [];

	const lastLoadedData = chunkRequestCtx?.lastLoadedChunk.normalized.length ?
		chunkRequestCtx.lastLoadedChunk.normalized :
		component?.options;

	const base: RequestMoreParams = {
		currentPage: 0,
		nextPage: 1,
		items: [],
		isLastEmpty: false,
		itemsTillBottom: 0,

		pendingData,
		lastLoadedData: lastLoadedData || [],
		lastLoadedChunk: {
			raw: undefined,
			normalized: lastLoadedData || []
		}
	};

	const params = chunkRequestCtx && chunkRenderCtx ? {
		items: chunkRenderCtx.items,
		currentPage: chunkRequestCtx.page,
		isLastEmpty: chunkRequestCtx.isLastEmpty,
		itemsTillBottom: chunkRenderCtx.items.length - chunkRenderCtx.lastIntersectsItem,
		total: component && component.total,

		pendingData,
		lastLoadedData: lastLoadedData || [],
		lastLoadedChunk: {
			raw: chunkRequestCtx.lastLoadedChunk.raw,
			normalized: lastLoadedData || []
		}

	} : base;

	const merged = {
		...params,
		...merge
	};

	// tslint:disable-next-line: prefer-object-spread
	return Object.assign(merged, {
		nextPage: merged.currentPage + 1
	});
}
