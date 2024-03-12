/*!
 * V4Fire Client Core
 * https://github.com/V4Fire/Client
 *
 * Released under the MIT license
 * https://github.com/V4Fire/Client/blob/master/LICENSE
 */

/**
 * Represents a constant for a dark theme string.
 */
export const DARK = 'dark';

/**
 * Represents a constant for a light theme string.
 */
export const LIGHT = 'light';

/**
 * Indicates whether the detection of the user's preferred color scheme is enabled.
 * Defaults to `false` if not specified in `DETECT_USER_PREFERENCES`.
 */
export const prefersColorSchemeEnabled =
	Object.get<boolean>(DETECT_USER_PREFERENCES, 'prefersColorScheme.enabled') ?? false;

/**
 * The name associated with the dark color scheme.
 * Defaults to 'dark' if not specified in `DETECT_USER_PREFERENCES`.
 */
export const darkThemeName =
	Object.get<string>(DETECT_USER_PREFERENCES, 'prefersColorScheme.aliases.dark') ?? DARK;

/**
 * The name associated with the light color scheme.
 * Defaults to 'light' if not specified in `DETECT_USER_PREFERENCES`.
 */
export const lightThemeName =
	Object.get<string>(DETECT_USER_PREFERENCES, 'prefersColorScheme.aliases.light') ?? LIGHT;

/**
 * Represents a mapping between theme codes and their associated names.
 */
export const themeMapping = {
	[DARK]: darkThemeName,
	[LIGHT]: lightThemeName
};