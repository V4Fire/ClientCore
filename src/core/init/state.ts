/*!
 * V4Fire Client Core
 * https://github.com/V4Fire/Client
 *
 * Released under the MIT license
 * https://github.com/V4Fire/Client/blob/master/LICENSE
 */

import { initGlobalEnv } from 'core/env';

import * as net from 'core/net';
import * as session from 'core/session';

import semaphore from 'core/init/semaphore';

import type { InitAppOptions } from 'core/init/interface';

/**
 * Initializes the global state of the application (user session initialization, online status loading, etc.)
 * @param params - additional initialization parameters
 */
export default async function initState(params: InitAppOptions): Promise<void> {
	initGlobalEnv(params);
	params.isOnline = true;

	net.isOnline()
		.then((v) => {
			params.isOnline = v.status;
			params.lastOnlineDate = v.lastOnline;
		})

		.catch(stderr);

	try {
		await session.isExists().then((v) => params.isAuth = v);

	} catch (err) {
		stderr(err);
	}

	void semaphore('stateReady');
}
