/*!
 * V4Fire Client Core
 * https://github.com/V4Fire/Client
 *
 * Released under the MIT license
 * https://github.com/V4Fire/Client/blob/master/LICENSE
 */

import type { AsyncOptions } from 'core/async';
import type { ComponentEvents, LocalEventPayload } from 'components/base/b-virtual-scroll/interface';

/**
 * An interface representing the typed `selfEmitter` methods.
 */
export interface ComponentTypedEmitter {
	/**
	 * @param event - The event name.
	 * @param handler - The event handler function.
	 * @param [asyncOpts] - Optional async options.
	 */
	once<EVENT extends ComponentEvents>(
		event: EVENT,
		handler: (...args: LocalEventPayload<EVENT>) => void,
		asyncOpts?: AsyncOptions
	): void;

	/**
	 * @param event - The event name.
	 * @param handler - The event handler function.
	 * @param [asyncOpts] - Optional async options.
	 */
	on<EVENT extends ComponentEvents>(
		event: EVENT,
		handler: (...args: LocalEventPayload<EVENT>) => void,
		asyncOpts?: AsyncOptions
	): void;

	/**
	 * @param event - The event name.
	 * @param [asyncOpts] - Optional async options.
	 */
	promisifyOnce<EVENT extends ComponentEvents>(
		event: EVENT,
		asyncOpts?: AsyncOptions
	): Promise<LocalEventPayload<EVENT>>;

	/**
	 * @param event - The event name.
	 * @param payload - The event payload.
	 */
	emit<EVENT extends ComponentEvents>(
		event: EVENT,
		...payload: LocalEventPayload<EVENT>
	): void;
}