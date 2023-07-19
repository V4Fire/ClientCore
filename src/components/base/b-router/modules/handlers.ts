/*!
 * V4Fire Client Core
 * https://github.com/V4Fire/Client
 *
 * Released under the MIT license
 * https://github.com/V4Fire/Client/blob/master/LICENSE
 */

import { urlsToIgnore } from 'components/base/b-router/modules/const';
import { HrefTransitionEvent } from 'components/base/b-router/modules/transition/event';

import type bRouter from 'components/base/b-router/b-router';

/**
 * Handler: there was a click on an element with the `href` attribute
 *
 * @param e
 * @emits `hrefTransition(event:` [[HrefTransitionEvent]]`)` - contains the `HTMLElement` onto which the event
 * was dispatched and its `href` attribute value
 */
export async function link(this: bRouter, e: MouseEvent): Promise<void> {
	const
		a = <HTMLElement>e.delegateTarget,
		href = a.getAttribute('href')?.trim();

	const cantIntercept =
		!this.interceptLinks ||
		href == null ||
		urlsToIgnore.some((scheme) => scheme.test(href));

	if (cantIntercept) {
		return;
	}

	const hrefTransitionEvent = new HrefTransitionEvent(a);
	this.emit('hrefTransition', hrefTransitionEvent);

	if (hrefTransitionEvent.transitionPrevented) {
		return;
	}

	e.preventDefault();

	if (hrefTransitionEvent.defaultPrevented || Object.parse(a.getAttribute('data-router-prevent-transition'))) {
		return;
	}

	const
		l = Object.assign(document.createElement('a'), {href});

	if (a.getAttribute('target') === '_blank' || e.ctrlKey || e.metaKey) {
		// eslint-disable-next-line no-restricted-globals
		window.open(l.href, '_blank');
		return;
	}

	const
		method = a.getAttribute('data-router-method');

	switch (method) {
		case 'back':
			this.back().catch(stderr);
			break;

		case 'forward':
			this.back().catch(stderr);
			break;

		case 'go': {
			const go = Object.parse(a.getAttribute('data-router-go'));
			this.go(Object.isNumber(go) ? go : -1).catch(stderr);
			break;
		}

		default: {
			const
				params = Object.parse(a.getAttribute('data-router-params')),
				query = Object.parse(a.getAttribute('data-router-query')),
				meta = Object.parse(a.getAttribute('data-router-meta'));

			await this[method === 'replace' ? 'replace' : 'push'](href, {
				params: Object.isDictionary(params) ? params : {},
				query: Object.isDictionary(query) ? query : {},
				meta: Object.isDictionary(meta) ? meta : {}
			});
		}
	}
}
