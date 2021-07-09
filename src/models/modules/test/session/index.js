/*!
 * V4Fire Client Core
 * https://github.com/V4Fire/Client
 *
 * Released under the MIT license
 * https://github.com/V4Fire/Client/blob/master/LICENSE
 */

// @ts-check

const
	h = include('tests/helpers');

/**
 * Starts a test
 *
 * @param {Playwright.Page} page
 * @param {object} params
 * @returns {void}
 */
module.exports = (page, {browser, contextOpts}) => {
	const initialUrl = page.url();

	let
		dummyComponent,
		session,
		context;

	describe('`models/modules/session`', () => {
		beforeEach(async () => {
			context = await browser.newContext(contextOpts);

			page = await context.newPage();
			page.goto(initialUrl);

			dummyComponent = await h.component.waitForComponent(page, '.b-dummy');
			session = await dummyComponent.evaluateHandle(({modules: {session}}) => session);
		});

		// afterEach(() => context.close());

		it('provides auth headers if a session exists', async () => {
			/** @type {object} */
			let headers;

			await session.evaluate((ctx) => ctx.set('token'));

			const pr = createRouteHandler({
				handler: (resolver, route) => (headers = route.request().headers(), resolver()),
				status: 200,
				withNewToken: false
			});

			await init();
			await pr;

			expect(headers.authorization).toBe('Bearer token');
		});

		it('does not provide an auth header if a session does not exist', async () => {
			/** @type {object} */
			let headers;

			const pr = createRouteHandler({
				handler: (resolver, route) => (headers = route.request().headers(), resolver()),
				status: 200,
				withNewToken: false
			});

			await init();
			await pr;

			expect(headers.authorization).toBeUndefined();
		});

		it('retries request if the response has a 401 status code', async () => {
			let
				reqCount = 0;

			await session.evaluate((ctx) => ctx.set('token'));

			const pr = createRouteHandler({
				handler: (resolver) => resolver(),
				status: () => reqCount === 1 ? 401 : 200,
				withNewToken: false
			});

			await init();
			await expectAsync(pr).toBeResolved();
		});

		it('clears a session if the response has a 401 status code without a new token', async () => {
			let
				reqCount = 0;

			await session.evaluate((ctx) => ctx.set('token'));

			const pr = createRouteHandler({
				handler: (resolver) => {
					reqCount++;
	
					if (reqCount === 2) {
						resolver();
					}
				},
				status: () => reqCount === 1 ? 401 : 200,
				withNewToken: false
			});

			await init();
			await pr;
			await h.bom.waitForIdleCallback(page);

			const
				testVal = await session.evaluate((ctx) => ctx.get());

			expect(testVal).toEqual({auth: undefined, params: undefined});
		});

		it('sets a new session if the response has a 200 status code with a new token', async () => {
			await session.evaluate((ctx) => ctx.set('token'));

			const pr = createRouteHandler({
				handler: (resolver) => resolver(),
				status: 200,
				withNewToken: true
			});

			await init();
			await pr;
			await h.bom.waitForIdleCallback(page);

			const
				testVal = await session.evaluate((ctx) => ctx.get());

			expect(testVal).toEqual({auth: 'newToken', params: {}});
		});

		it('sets a new session if the response has a 401 status code with a new token', async () => {
			let
				reqCount = 0;

			await session.evaluate((ctx) => ctx.set('token'));

			const pr = createRouteHandler({
				handler: (resolver) => {
					reqCount++;
	
					if (reqCount === 2) {
						resolver();
					}
				},
				status: () => reqCount === 1 ? 401 : 200,
				withNewToken: true
			});

			await init();
			await pr;
			await h.bom.waitForIdleCallback(page);

			const
				testVal = await session.evaluate((ctx) => ctx.get());

			expect(testVal).toEqual({auth: 'newToken', params: {}});
		});

		async function init() {
			await page.evaluate(() => {
				globalThis.renderComponents('b-dummy', [{
					attrs: {
						dataProvider: 'demo.Pagination'
					}
				}])
			})
		}

		async function createRouteHandler(opts = {}) {
			return new Promise(async (resolver) => {
				const {handler, status, withNewToken} = opts;

				await page.route('**/pagination', async (route) => {
					await handler(resolver, route);
	
					return route.fulfill({
						status: Object.isFunction(status) ? status() : status,
						headers: {
							'Access-Control-Allow-Origin': '*',
							'Access-Control-Allow-Headers': '*',
							...withNewToken ? {
								'Access-Control-Expose-Headers': '*',
								'X-JWT-TOKEN': 'newToken',
							} : {}
						}
					})
				});
			});

		}
	});
};