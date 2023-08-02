/*!
 * V4Fire Client Core
 * https://github.com/V4Fire/Client
 *
 * Released under the MIT license
 * https://github.com/V4Fire/Client/blob/master/LICENSE
 */

import type iBlock from 'components/super/i-block/i-block';
import type iStaticPage from 'components/super/i-static-page/i-static-page';

import Friend from 'components/friends/friend';

export default class ThemeManager extends Friend {
	override readonly C!: iStaticPage;

	/**
	 * A set of available app themes
	 */
	availableThemes!: Set<string>;

	/**
	 * Current theme value
	 */
	protected currentStore!: string;

	/**
	 * Initial theme value
	 */
	protected readonly initialValue!: string;

	/**
	 * An attribute to set the theme value to the root element
	 */
	protected readonly themeAttribute: CanUndef<string> = THEME_ATTRIBUTE;

	constructor(component: iBlock) {
		super(component);

		if (!Object.isString(THEME)) {
			throw new ReferenceError('A theme to initialize is not specified');
		}

		this.availableThemes = new Set(AVAILABLE_THEMES ?? []);

		this.current = THEME;
		this.initialValue = THEME;

		if (!Object.isString(this.themeAttribute)) {
			throw new ReferenceError('An attribute name to set themes is not specified');
		}
	}

	/**
	 * Current theme value
	 */
	get current(): string {
		return this.currentStore;
	}

	/**
	 * Sets a new value to the current theme
	 *
	 * @param value
	 * @emits `theme:change(value: string, oldValue: CanUndef<string>)`
	 */
	set current(value: string) {
		if (!this.availableThemes.has(value)) {
			throw new ReferenceError(`A theme with the name "${value}" is not defined`);
		}

		if (!Object.isString(this.themeAttribute)) {
			return;
		}

		const oldValue = this.currentStore;

		this.currentStore = value;
		document.documentElement.setAttribute(this.themeAttribute, value);

		void this.component.lfc.execCbAtTheRightTime(() => {
			this.component.emit('theme:change', value, oldValue);
		});
	}
}