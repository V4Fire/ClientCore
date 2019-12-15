/*!
 * V4Fire Client Core
 * https://github.com/V4Fire/Client
 *
 * Released under the MIT license
 * https://github.com/V4Fire/Client/blob/master/LICENSE
 */

import Async from 'core/async';

import symbolGenerator from 'core/symbol';
import { getSrcSet } from 'core/html';

import { DirectiveValue, ImageOptions } from 'core/component/directives/image';

export const
	$$ = symbolGenerator();

export default class ImageLoader {
	/**
	 * Async instance
	 */
	protected async: Async<this> = new Async();

	/**
	 * Store for urls that have already been downloaded
	 */
	protected cache: Map<string, string> = new Map();

	/**
	 * Nodes that are waiting for loading
	 */
	protected pending: Set<HTMLElement> = new Set();

	/**
	 * Starts loading an image
	 *
	 * @param el
	 * @param value
	 */
	load(el: HTMLElement, value: DirectiveValue): void {
		const
			{cache} = this,
			opts = this.normalizeOptions(value);

		const
			srcset = Object.isObject(opts.srcset) ? getSrcSet(opts.srcset) : opts.srcset,
			{src, load, error} = opts;

		if (!src && !srcset) {
			el instanceof HTMLImageElement ? el.src = '' : this.setBackgroundImage(el, '');
			return;
		}

		const
			key = this.getCacheKey(src, srcset);

		if (el instanceof HTMLImageElement) {
			src && (el.src = src);
			srcset && (el.srcset = srcset);

			if (cache.has(key)) {
				load && load();

			} else {
				this.attachListeners(el, key, load, error);
			}

		} else {
			const
				cached = cache.get(key);

			if (cached) {
				this.setBackgroundImage(el, cached);
				load && load();
				return;
			}

			const
				img =  new Image();

			el[$$.img] = img;
			this.load(el[$$.img], value);

			if (srcset) {
				const label = Symbol('waitCurrentSrc');
				el[$$.label] = label;

				this.async.wait(() => img.currentSrc, {label})
					.then(() => this.setBackgroundImage(img, img.currentSrc), stderr);

			} else {
				this.setBackgroundImage(img, src!);
			}
		}
	}

	/**
	 * Removes specified element from pending elements
	 * @param el
	 */
	removePending(el: HTMLElement): void {
		this.pending.delete(el[$$.img] || el);

		if (el[$$.label]) {
			this.async.clearAll({label: el[$$.label]});
		}
	}

	/**
	 * Normalizes the specified directive value
	 * @param value
	 */
	normalizeOptions(value: DirectiveValue): ImageOptions {
		if (Object.isString(value)) {
			return {
				src: value
			};
		}

		return value;
	}

	/**
	 * Returns a cache key for an image
	 *
	 * @param [src]
	 * @param [srcset]
	 */
	getCacheKey(src?: string, srcset?: string): string {
		return `${src || ''}${srcset || ''}`;
	}

	/**
	 * Sets a background image for the specified element
	 *
	 * @param el
	 * @param src
	 */
	setBackgroundImage(el: HTMLElement, src: string): void {
		const
			url = `url('${src}')`,
			{backgroundImage} = el.style;

		el.style.backgroundImage = backgroundImage ? `${backgroundImage}, ${url}` : `${url}`;
	}

	/**
	 * Attach load/error listeners for the specified el
	 *
	 * @param img
	 * @param key
	 * @param [loadCb]
	 * @param [errorCb]
	 */
	protected attachListeners(img: HTMLImageElement, key: string, loadCb?: Function, errorCb?: Function): void {
		const
			{cache, pending} = this;

		img.addEventListener('load', () => {
			cache.set(key, img.currentSrc);

			if (!pending.has(img)) {
				return;
			}

			pending.delete(img);
			loadCb && loadCb();
		});

		img.addEventListener('error', () => {
			if (!pending.has(img)) {
				return;
			}

			pending.delete(img);
			errorCb && errorCb();
		});

		pending.add(img);
	}
}
