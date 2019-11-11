/*!
 * V4Fire Client Core
 * https://github.com/V4Fire/Client
 *
 * Released under the MIT license
 * https://github.com/V4Fire/Client/blob/master/LICENSE
 */

import flags from 'core/init/flags';
import Component, { rootComponents } from 'core/component';
import { onEverythingReady } from 'core/event';

export default onEverythingReady(async () => {
	const
		node = document.querySelector<HTMLElement>('[data-root-component]');

	if (!node) {
		throw new Error('Root node is not defined');
	}

	const
		name = <string>node.getAttribute('data-root-component'),
		component = await rootComponents[name];

	if (!component) {
		throw new Error('Root component is not defined');
	}

	const
		data = <Function>component.data,
		params = JSON.parse(<string>node.getAttribute('data-root-component-params'));

	component.data = function (): Dictionary {
		return Object.assign(data.call(this), params.data);
	};

	// tslint:disable-next-line:no-unused-expression
	new Component({
		...params,
		...component,
		el: node
	});

	READY_STATE++;
}, ...flags);
