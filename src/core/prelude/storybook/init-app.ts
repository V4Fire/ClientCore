/*!
 * V4Fire Client Core
 * https://github.com/V4Fire/Client
 *
 * Released under the MIT license
 * https://github.com/V4Fire/Client/blob/master/LICENSE
 */

import Component, { app, rootComponents, ComponentElement, App } from 'core/component';

/**
 * Inits the app for the storybook canvas
 *
 * @param canvasElement - storybook canvas element
 * @param [rootComponent] - name of the root component
 */
export default async function initApp(canvasElement: HTMLElement, rootComponent?: string): Promise<App> {
	const component = await rootComponents[rootComponent ?? 'p-v4-components-demo'];

	if (component == null) {
		throw new ReferenceError('The root component is not found');
	}

	const getData = component.data;

	component.data = function data(this: unknown): Dictionary {
		return (Object.isFunction(getData) ? getData.call(this) : null) ?? {};
	};

	app.context = new Component({
		...component,
		el: canvasElement
	});

	Object.defineProperty(app, 'component', {
		configurable: true,
		enumerable: true,
		get: () => document.querySelector<ComponentElement>('#root-component')?.component ?? null
	});

	return app;
}