/*!
 * V4Fire Client Core
 * https://github.com/V4Fire/Client
 *
 * Released under the MIT license
 * https://github.com/V4Fire/Client/blob/master/LICENSE
 */

/**
 * [[include:super/i-block/modules/debug-mode/README.md]]
 * @packageDocumentation
 */

import Friend from 'super/i-block/modules/friend';
import composeDataEngine from 'super/i-block/modules/debug-mode/compose-data';

import type { GatheringStrategy, RenderStrategy } from 'super/i-block/modules/debug-mode/interface';

export * from 'super/i-block/modules/debug-mode/interface';

/**
 * Class provides methods for working with debug data
 */
export default class DebugMode extends Friend {
	/**
	 * Strategies for collecting debug data
	 */
	protected dataGatheringStrategies!: GatheringStrategy[];

	/**
	 * Strategies for rendering debug data
	 */
	protected dataRenderStrategies!: RenderStrategy[];

	/**
	 * Sets strategies for collecting debug data
	 */
	setDataGatheringStrategies(strategies: GatheringStrategy[]): void {
		this.dataGatheringStrategies = strategies;
	}

	/**
	 * Sets strategies for rendering debug data
	 */
	setDataRenderStrategies(strategies: RenderStrategy[]): void {
		this.dataRenderStrategies = strategies;
	}
	/**
	 * Starts debugging data collection
	 */
	initDebugDataGathering(): void {
		if (Object.isNullable(this.dataGatheringStrategies)) {
			return;
		}

		Promise.allSettled(
			this.dataGatheringStrategies.map((strategy) => strategy(this.component))
		).then((results) => composeDataEngine(results))
			.then((data) => this.initDebugDataRendering(data))
			.catch(stderr);
	}

	/**
	 * Starts rendering debug data
	 * @param data
	 */
	protected initDebugDataRendering(data: Dictionary): CanUndef<Promise<void>> {
		if (Object.isNullable(this.dataRenderStrategies)) {
			return;
		}

		Promise.allSettled(
			this.dataRenderStrategies.map((strategy) => strategy(this.component, this.ctx, data))
		).then((results) => {
			const
				isSomeRenderSuccessful = results.some((result) => result.status === 'fulfilled');

			if (!isSomeRenderSuccessful) {
				return Promise.reject('Debug data was not rendered');
			}

			return Promise.resolve();
		})
		.catch(stderr);
	}
}
