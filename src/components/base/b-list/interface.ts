/*!
 * V4Fire Client Core
 * https://github.com/V4Fire/Client
 *
 * Released under the MIT license
 * https://github.com/V4Fire/Client/blob/master/LICENSE
 */

import type { HintPosition } from 'components/global/g-hint/interface';
import type { ModsDict } from 'components/super/i-data/i-data';

export interface Item extends Dictionary {
	/**
	 * Item label text
	 */
	label?: string;

	/**
	 * Item value
	 */
	value?: unknown;

	/**
	 * If this option is provided, the component will generate a link for this item
	 */
	href?: string;

	/**
	 * True if the item is active
	 */
	active?: boolean;

	/**
	 * True if the item is hidden
	 */
	hidden?: boolean;

	/**
	 * True if the item is in-progress
	 */
	progress?: boolean;

	/**
	 * Exterior modifier of the item
	 */
	exterior?: string;

	/**
	 * Tooltip text of the item
	 */
	hint?: string;

	/**
	 * Tooltip position to show
	 */
	hintPos?: HintPosition;

	/**
	 * Icon to show before a label
	 */
	preIcon?: string;

	/**
	 * Name of the used component to show `preIcon`
	 * @default `'b-icon'`
	 */
	preIconComponent?: string;

	/**
	 * Icon to show after a label
	 */
	icon?: string;

	/**
	 * Name of the used component to show `icon`
	 * @default `'b-icon'`
	 */
	iconComponent?: string;

	/**
	 * Component to show "in-progress" state of the item or
	 * Boolean, if needed to show progress by slot or `b-progress-icon`
	 */
	progressIcon?: string | boolean;

	/**
	 * Map of additional modifiers of the item
	 */
	mods?: ModsDict;

	/**
	 * List of additional classes of the item
	 */
	classes?: string[];

	/**
	 * Map of additional attributes of the item
	 */
	attrs?: Dictionary;
}

export type Items = Item[];

export type Active = unknown | Set<unknown>;
