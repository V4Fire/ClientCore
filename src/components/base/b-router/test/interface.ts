/*!
 * V4Fire Client Core
 * https://github.com/V4Fire/Client
 *
 * Released under the MIT license
 * https://github.com/V4Fire/Client/blob/master/LICENSE
 */

import type { JSHandle, Page } from 'playwright';

import type iStaticPage from 'components/super/i-static-page/i-static-page';

export type EngineName = 'history' | 'in-memory';

export type InitRouter = (page: Page, initOptions?: InitRouterOptions) => Promise<JSHandle<iStaticPage>>;

export interface InitRouterOptions {
	initialRoute?: Nullable<string>;
}

export interface RouterTestResult {
	routeChanges?: unknown[];
	queryChanges?: unknown[];
	contentChanges?: unknown[];
	onSoftChange?: unknown[];
	onHardChange?: unknown[];
	onChange?: unknown[];
	onTransition?: unknown[];
	onRootTransition?: unknown[];
	initialQuery?: string;
	initialContent?: unknown;
	initialRouteLink?: unknown;
	routeLink?: unknown;
}