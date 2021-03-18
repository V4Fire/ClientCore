/*!
 * V4Fire Client Core
 * https://github.com/V4Fire/Client
 *
 * Released under the MIT license
 * https://github.com/V4Fire/Client/blob/master/LICENSE
 */

import { Friend } from 'super/i-block/i-block';
import type iStaticPage from 'super/i-static-page/i-static-page';

/**
 * Class to manage interface themes
 */
export default class ThemeManager extends Friend {
	/** @override */
	readonly C!: iStaticPage;

	/**
	 * Initial interface theme value
	 */
	protected readonly initialValue!: string;

	/**
	 * Attribute to set a theme value to the root element
	 */
	protected readonly themeAttribute: CanUndef<string> = THEME_ATTRIBUTE;

	/**
	 * Current theme value
	 */
	protected currentStore!: string;

	/** @override */
	constructor(component: any) {
		super(component);

		if (!Object.isString(THEME)) {
			throw new ReferenceError('A theme to initialize is not specified');
		}

		this.current = THEME;
		this.initialValue = THEME;

		if (!Object.isString(this.themeAttribute)) {
			throw new ReferenceError('An attribute name to set themes is not specified');
		}
	}

	/**
	 * List of available themes of the app
	 */
	get availableThemes(): CanUndef<Set<string>> {
		return Object.isArray(AVAILABLE_THEMES) ? new Set(AVAILABLE_THEMES) : undefined;
	}

	/**
	 * Sets a new value to the current theme
	 *
	 * @emits `theme:change(value: string, oldValue: CanUndef<string>)`
	 * @param value
	 */
	set current(value: string) {
		if (this.availableThemes?.has(value) === false) {
			throw new ReferenceError(`A theme with the name "${value}" is not defined`);
		}

		if (!Object.isString(this.themeAttribute)) {
			return;
		}

		const
			oldValue = this.currentStore;

		this.currentStore = value;

		document.documentElement.setAttribute(this.themeAttribute, value);

		void this.component.lfc.execCbAtTheRightTime(() => {
			this.component.emit('theme:change', value, oldValue);
		});
	}

	/** @see [[Theme.currentStore]] */
	get current(): string {
		return this.currentStore;
	}
}
