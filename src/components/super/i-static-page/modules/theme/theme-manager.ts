/*!
 * V4Fire Client Core
 * https://github.com/V4Fire/Client
 *
 * Released under the MIT license
 * https://github.com/V4Fire/Client/blob/master/LICENSE
 */

import symbolGenerator from 'core/symbol';

import { factory, SyncStorage, StorageEngine } from 'core/kv-storage';

import type iBlock from 'components/super/i-block/i-block';
import type iStaticPage from 'components/super/i-static-page/i-static-page';

import Friend from 'components/friends/friend';
import type { Theme, ThemeSetterArg } from 'components/super/i-static-page/modules/theme/interface';
import type { SystemThemeExtractor } from 'core/system-theme-extractor';

import { prefersColorSchemeEnabled, darkThemeName, lightThemeName } from 'components/super/i-static-page/modules/theme/const';

const
	$$ = symbolGenerator();

export * from 'components/super/i-static-page/modules/theme/interface';
export * from 'components/super/i-static-page/modules/theme/const';

export default class ThemeManager extends Friend {
	override readonly C!: iStaticPage;

	/**
	 * A set of available app themes
	 */
	availableThemes!: Set<string>;

	/**
	 * Current theme value
	 */
	protected currentStore!: Theme;

	/**
	 * A promise that resolves when the ThemeManager is initialized.
	 */
	protected readonly initPromise!: Promise<ThemeManager>;

	/**
	 * An API for obtaining and observing system appearance.
	 */
	protected systemThemeExtractor!: SystemThemeExtractor;

	/**
	 * Initial theme value
	 */
	protected initialValue!: Theme;

	/**
	 * An API for persistent theme storage
	 */
	protected themeStorage!: SyncStorage;

	/**
	 * An attribute to set the theme value to the root element
	 */
	protected readonly themeAttribute: CanUndef<string> = THEME_ATTRIBUTE;

	/**
	 * Default theme from config
	 */
	protected readonly defaultTheme: string;

	/**
	 * @param component
	 * @param themeStorageEngine - engine for persistent theme storage
	 * @param systemThemeExtractor
	 */
	constructor(
		component: iBlock,
		themeStorageEngine: CanPromise<StorageEngine>,
		systemThemeExtractor: CanPromise<SystemThemeExtractor>
	) {
		super(component);

		if (!Object.isString(this.themeAttribute)) {
			throw new ReferenceError('An attribute name to set themes is not specified');
		}

		if (!Object.isString(THEME)) {
			throw new ReferenceError('A theme to initialize is not specified');
		}

		this.defaultTheme = THEME;
		this.availableThemes = new Set(AVAILABLE_THEMES ?? []);

		this.initPromise = this.async.promise(
			Promise.all([themeStorageEngine, systemThemeExtractor])
				.then(async ([storageEngine, systemThemeExtractor]) => {
					this.themeStorage = factory(storageEngine);
					this.systemThemeExtractor = systemThemeExtractor;

					let
						theme: ThemeSetterArg = {value: this.defaultTheme, isSystem: false};

					if (POST_PROCESS_THEME) {
						const themeFromStore = this.themeStorage.get<Theme>('colorTheme');

						if (themeFromStore != null) {
							theme = themeFromStore;
						}
					} else if (prefersColorSchemeEnabled) {
						return this.initSystemTheme();
					}

					if (theme.isSystem) {
						return this.initSystemTheme();
					}

					return this.changeTheme(theme.value);
				})
				.then(() => {
					this.initialValue = {...this.currentStore};
					return this;
				}),
			{label: $$.themeManagerInit}
		);
	}

	/**
	 * Returns current theme
	 */
	async getTheme(): Promise<Theme> {
		await this.initPromise;
		return this.currentStore;
	}

	/**
	 * Sets a new value to the current theme
	 * @param value
	 */
	async setTheme(value: string): Promise<void> {
		await this.initPromise;
		return this.changeTheme(value);
	}

	/**
	 * Sets actual system theme and activates system theme change listener
	 */
	async useSystemTheme(): Promise<void> {
		await this.initPromise;
		return this.initSystemTheme();
	}

	/**
	 * Initializes system theme and theme change listener
	 */
	protected async initSystemTheme(): Promise<void> {
		let
			value = await this.systemThemeExtractor.getSystemTheme();

		this.systemThemeExtractor.terminateThemeChangeListener();
		this.systemThemeExtractor.initThemeChangeListener(
			(value: string) => {
				value = this.getThemeAlias(value);
				void this.changeTheme(value, true);
			}
		);

		value = this.getThemeAlias(value);
		return this.changeTheme(value, true);
	}

	/**
	 * Changes current theme value
	 *
	 * @param value
	 * @param isSystem
	 * @throws ReferenceError
	 * @emits `theme:change(value: string, oldValue: CanUndef<string>)`
	 */
	protected changeTheme(value: string, isSystem: boolean = false): void {
		if (
			SSR ||
			!Object.isString(this.themeAttribute) ||
			Object.fastCompare(this.currentStore, {value, isSystem})
		) {
			return;
		}

		if (!this.availableThemes.has(value)) {
			if (!isSystem) {
				throw new ReferenceError(`A theme with the name "${value}" is not defined`);
			}

			value = this.defaultTheme;
		}

		if (!isSystem) {
			this.systemThemeExtractor.terminateThemeChangeListener();
		}

		const oldValue = this.currentStore;

		this.currentStore = {value, isSystem};
		this.themeStorage.set('colorTheme', this.currentStore);
		document.documentElement.setAttribute(this.themeAttribute, value);

		void this.component.lfc.execCbAtTheRightTime(() => {
			this.component.emit('theme:change', this.currentStore, oldValue);
		});
	}

	/**
	 * Returns actual theme name for provided value
	 * @param value
	 */
	protected getThemeAlias(value: string): string {
		if (prefersColorSchemeEnabled) {
			return value === 'dark' ? darkThemeName : lightThemeName;
		}

		return value;
	}
}
