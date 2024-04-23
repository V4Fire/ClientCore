/*!
 * V4Fire Client Core
 * https://github.com/V4Fire/Client
 *
 * Released under the MIT license
 * https://github.com/V4Fire/Client/blob/master/LICENSE
 */

import Async from 'core/async';
import watch from 'core/object/watch';

import CookieStorage from 'core/kv-storage/engines/cookie';

import PageMetaData from 'core/page-meta-data';
import ThemeManager, { SystemThemeExtractorStub } from 'core/theme-manager';
import HydrationStore from 'core/hydration-store';

import * as net from 'core/net';
import * as cookies from 'core/cookies';

import type { State } from 'core/component';
import { HydrationStore } from 'core/hydration-store';
import type { InitAppOptions, CreateAppOptions } from 'core/init/interface';

/**
 * Returns the application state object and parameters for creating an application instance based on
 * the passed initialization parameters
 *
 * @param opts - initialization options
 */
export function getAppParams(opts: InitAppOptions): {
	state: State;
	createAppOpts: Pick<InitAppOptions, keyof CreateAppOptions>;
} {
	let {route} = opts;

	if (route == null && SSR) {
		route = opts.location.pathname + opts.location.search;
	}

	const resolvedState = {
		...opts,
		appProcessId: opts.appProcessId ?? Object.fastHash(Math.random()),

		route,
		cookies: cookies.from(opts.cookies),

		net: opts.net ?? net,
		async: new Async(),

		theme: opts.theme ?? new ThemeManager(
			{
				themeStorageEngine: new CookieStorage('v4ls', {
					cookies: cookies.from(opts.cookies),
					maxAge: 2 ** 31 - 1
				}),

				systemThemeExtractor: new SystemThemeExtractorStub()
			}
		),

		pageMetaData: opts.pageMetaData ?? new PageMetaData(opts.location),

		hydrationStore: opts.hydrationStore ?? new HydrationStore()
	};

	resolvedState.async.worker(() => {
		try {
			setTimeout(() => {
				Object.keys(resolvedState).forEach((key) => {
					delete resolvedState[key];
				});
			}, 0);
		} catch {}
	});

	return {
		// Make the state observable
		state: SSR ? resolvedState : watch(resolvedState).proxy,

		createAppOpts: {
			targetToMount: opts.targetToMount,

			// eslint-disable-next-line @v4fire/unbound-method
			setup: opts.setup
		}
	};
}
