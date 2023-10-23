/*!
 * V4Fire Client Core
 * https://github.com/V4Fire/Client
 *
 * Released under the MIT license
 * https://github.com/V4Fire/Client/blob/master/LICENSE
 */

import type { BrowserContext, Page, Request, Route } from 'playwright';
import delay from 'delay';
import { ModuleMocker } from 'jest-mock';

import type { ResponseHandler, ResponseOptions, ResponsePayload } from 'tests/helpers/providers/interceptor/interface';

/**
 * API that provides a simple way to intercept and respond to any request.
 */
export class RequestInterceptor {
	/**
	 * The route context.
	 */
	readonly routeCtx: Page | BrowserContext;

	/**
	 * The route pattern.
	 */
	readonly routePattern: string | RegExp;

	/**
	 * The route listener.
	 */
	readonly routeListener: ResponseHandler;

	/**
	 * An instance of jest-mock that handles the implementation logic of responses.
	 */
	readonly mock: ReturnType<ModuleMocker['fn']>;

	/**
	 * Short-hand for {@link RequestInterceptor.prototype.mock.mock.calls}
	 */
	get calls(): any[] {
		return this.mock.mock.calls;
	}

	/**
	 * Creates a new instance of RequestInterceptor.
	 *
	 * @param ctx - the page or browser context.
	 * @param pattern - the route pattern to match against requests.
	 */
	constructor(ctx: Page | BrowserContext, pattern: string | RegExp) {
		this.routeCtx = ctx;
		this.routePattern = pattern;

		this.routeListener = async (route: Route, request: Request) => {
			await this.mock(route, request);
		};

		const mocker = new ModuleMocker(globalThis);
		this.mock = mocker.fn();
	}

	/**
	 * Returns the intercepted request
	 * @param at - the index of the request (starting from 0)
	 */
	request(at: number): CanUndef<Request> {
		return this.calls[at][0].request();
	}

	/**
	 * Sets a response for one request.
	 *
	 * @example
	 * ```typescript
	 * const interceptor = new RequestInterceptor(page, /api/);
	 *
	 * interceptor
	 *   .responseOnce((r: Route) => r.fulfill({status: 200}))
	 *   .responseOnce((r: Route) => r.fulfill({status: 500}));
	 * ```
	 *
	 * @param handler - the response handler function.
	 * @param opts - the response options.
	 * @returns The current instance of RequestInterceptor.
	 */
	responseOnce(handler: ResponseHandler, opts?: ResponseOptions): this;

	/**
	 * Sets a response for one request.
	 *
	 * @example
	 * ```typescript
	 * const interceptor = new RequestInterceptor(page, /api/);
	 *
	 * interceptor
	 *   .responseOnce(200, {content: 1})
	 *   .responseOnce(500);
	 * ```
	 *
	 * Sets the response that will occur with a delay to simulate network latency.
	 *
	 * @example
	 * ```typescript
	 * const interceptor = new RequestInterceptor(page, /api/);
	 *
	 * interceptor
	 *   .responseOnce(200, {content: 1}, {delay: 200})
	 *   .responseOnce(500, {}, {delay: 300});
	 * ```
	 *
	 * @param status - the response status.
	 * @param payload - the response payload.
	 * @param opts - the response options.
	 * @returns The current instance of RequestInterceptor.
	 */
	responseOnce(status: number, payload: ResponsePayload | ResponseHandler, opts?: ResponseOptions): this;

	responseOnce(
		handlerOrStatus: number | ResponseHandler,
		payload?: ResponsePayload | ResponseHandler,
		opts?: ResponseOptions
	): this {
		this.mock.mockImplementationOnce(this.createMockFn(handlerOrStatus, payload, opts));
		return this;
	}

	/**
	 * Sets a response for every request.
	 * If there are no responses set via {@link RequestInterceptor.responseOnce}, that response will be used.
	 *
	 * @example
	 * ```typescript
	 * const interceptor = new RequestInterceptor(page, /api/);
	 * interceptor.response((r: Route) => r.fulfill({status: 200}));
	 * ```
	 *
	 * @param handler - the response handler function.
	 * @returns The current instance of RequestInterceptor.
	 */
	response(handler: ResponseHandler): this;

	/**
	 * Sets a response for every request.
	 * If there are no responses set via {@link RequestInterceptor.responseOnce}, that response will be used.
	 *
	 * @example
	 * ```typescript
	 * const interceptor = new RequestInterceptor(page, /api/);
	 * interceptor.response(200, {});
	 * ```
	 *
	 * @param status - the response status.
	 * @param payload - the response payload.
	 * @param opts - the response options.
	 * @returns The current instance of RequestInterceptor.
	 */
	response(status: number, payload: ResponsePayload | ResponseHandler, opts?: ResponseOptions): this;

	response(
		handlerOrStatus: number | ResponseHandler,
		payload?: ResponsePayload | ResponseHandler,
		opts?: ResponseOptions
	): this {
		this.mock.mockImplementation(this.createMockFn(handlerOrStatus, payload, opts));
		return this;
	}

	/**
	 * Clears the responses that were created via {@link RequestInterceptor.responseOnce} or
	 * {@link RequestInterceptor.response}.
	 *
	 * @returns The current instance of RequestInterceptor.
	 */
	removeHandlers(): this {
		this.mock.mockReset();
		return this;
	}

	/**
	 * Stops the request interception.
	 *
	 * @returns A promise that resolves with the current instance of RequestInterceptor.
	 */
	async stop(): Promise<this> {
		await this.routeCtx.unroute(this.routePattern, this.routeListener);
		return this;
	}

	/**
	 * Starts the request interception.
	 *
	 * @returns A promise that resolves with the current instance of RequestInterceptor.
	 */
	async start(): Promise<this> {
		await this.routeCtx.route(this.routePattern, this.routeListener);
		return this;
	}

	/**
	 * Creates a mock response function.
	 *
	 * @param handlerOrStatus
	 * @param payload
	 * @param opts
	 */
	protected createMockFn(
		handlerOrStatus: number | ResponseHandler,
		payload?: ResponsePayload | ResponseHandler,
		opts?: ResponseOptions
	): ResponseHandler {
		let fn;

		if (Object.isFunction(handlerOrStatus)) {
			fn = handlerOrStatus;

		} else {
			const status = handlerOrStatus;
			fn = this.cookResponseFn(status, payload, opts);
		}

		return fn;
	}

	/**
	 * Cooks a response handler.
	 *
	 * @param status - the response status.
	 * @param payload - the response payload.
	 * @param opts - the response options.
	 * @returns The response handler function.
	 */
	protected cookResponseFn(
		status: number,
		payload?: ResponsePayload | ResponseHandler,
		opts?: ResponseOptions
	): ResponseHandler {
		return async (route, request) => {
			if (opts?.delay != null) {
				await delay(opts.delay);
			}

			const
				fulfillOpts = Object.reject(opts, 'delay'),
				body = Object.isFunction(payload) ? await payload(route, request) : payload,
				contentType = fulfillOpts.contentType ?? 'application/json';

			return route.fulfill({
				status,
				body: contentType === 'application/json' && !Object.isString(body) ? JSON.stringify(body) : body,
				contentType,
				...fulfillOpts
			});
		};
	}
}
