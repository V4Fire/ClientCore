/*!
 * V4Fire Client Core
 * https://github.com/V4Fire/Client
 *
 * Released under the MIT license
 * https://github.com/V4Fire/Client/blob/master/LICENSE
 */

import routes from 'routes';
import { getRoute, compileStaticRoutes } from 'core/router';

import { set } from 'core/component/state';
import semaphore from 'core/init/semaphore';

/**
 * Initializes the initial route of the application
 */
export default async function init(): Promise<void> {
	try {
		if (HYDRATION) {
			const route = getRoute(
				location.pathname + location.search,
				compileStaticRoutes(routes)
			);

			await route?.meta.load?.();
			set('route', route);
		}

	} finally {
		void semaphore('hydratedRoute');
	}
}
