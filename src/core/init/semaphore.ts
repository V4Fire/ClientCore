/*!
 * V4Fire Client Core
 * https://github.com/V4Fire/Client
 *
 * Released under the MIT license
 * https://github.com/V4Fire/Client/blob/master/LICENSE
 */

import { createsAsyncSemaphore } from 'core/event';
import Component, { app, rootComponents, ComponentElement } from 'core/component';

import flags from 'core/init/flags';

export default createsAsyncSemaphore(async () => {
	if (SSR) {
		return (name: string) => rootComponents[name]!.then((component) => {
			// eslint-disable-next-line @typescript-eslint/no-var-requires
			const {renderToString} = require('vue/server-renderer');

			return {
				render: (params?: Dictionary) => renderToString(new Component({
					...component,

					data() {
						return Object.assign(component.data?.call(this), params);
					}
				}))
			};
		});
	}

	const
		el = document.querySelector<HTMLElement>('[data-root-component]');

	if (el == null) {
		throw new ReferenceError('The root node is not found');
	}

	const
		name = el.getAttribute('data-root-component') ?? '',
		component = await rootComponents[name];

	if (component == null) {
		throw new ReferenceError('The root component is not found');
	}

	const
		getData = component.data,
		params = JSON.parse(el.getAttribute('data-root-component-params') ?? '{}');

	component.data = function data(this: unknown): Dictionary {
		return Object.assign(Object.isFunction(getData) ? getData.call(this) : {}, params.data);
	};

	app.context = new Component({
		...params,
		...component,
		el
	});

	Object.defineProperty(app, 'component', {
		configurable: true,
		enumerable: true,
		get: () => document.querySelector<ComponentElement>('#root-component')?.component ?? null
	});

	return () => el;
}, ...flags);
