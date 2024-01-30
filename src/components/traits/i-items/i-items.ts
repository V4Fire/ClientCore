/*!
 * V4Fire Client Core
 * https://github.com/V4Fire/Client
 *
 * Released under the MIT license
 * https://github.com/V4Fire/Client/blob/master/LICENSE
 */

/**
 * [[include:components/traits/i-items/README.md]]
 * @packageDocumentation
 */

import type iBlock from 'components/super/i-block/i-block';
import type { IterationKey, ItemPropsFn, CreateFromItemFn } from 'components/traits/i-items/interface';

export * from 'components/traits/i-items/interface';

export default abstract class iItems {
	/**
	 * The function returns the unique key of the specified item, which is used to optimize re-rendering
	 *
	 * @param component
	 * @param item
	 * @param i - the iteration index
	 */
	static getItemKey<T extends iBlock>(
		component: T & iItems,
		item: object,
		i: number
	): CanUndef<IterationKey> {
		const
			{itemKey} = component;

		let
			id: unknown;

		if (Object.isFunction(itemKey)) {
			id = itemKey.call(component, item, i);

		} else if (Object.isString(itemKey)) {
			id = item[itemKey];
		}

		if (Object.isPrimitive(id) && !Object.isSymbol(id)) {
			return id ?? undefined;
		}

		return id != null ? String(id) : undefined;
	}

	/**
	 * Type: the component item
	 */
	abstract readonly Item: object;

	/**
	 * Type: a list of component items
	 */
	abstract readonly Items: Array<this['Item']>;

	/**
	 * This prop is used to provide a list of items to render by the component
	 * @prop
	 */
	abstract items?: this['Items'];

	/**
	 * By design, the specified items are rendered by using other components.
	 * This prop allows specifying the name of a component that is used for rendering.
	 * The prop can be provided as a function. In that case, the value is taken from the call result.
	 *
	 * @prop
	 */
	abstract item?: string | CreateFromItemFn<this['Item'], string>;

	/**
	 * This prop allows specifying props that are passed to a component to render items.
	 * The prop can be provided as a function. In that case, the value is taken from the call result.
	 *
	 * @prop
	 */
	abstract itemProps?: Dictionary | ItemPropsFn<this['Item']>;

	/**
	 * To optimize the re-rendering of items, we can specify a unique identifier for each item.
	 *
	 * The prop value can be provided as a string or a function.
	 * In the case of a string, you are providing the property name that stores the identifier.
	 * If the case of a function, you must return the identifier value from the function.
	 *
	 * @prop
	 */
	abstract itemKey?: string | CreateFromItemFn<this['Item'], IterationKey>;
}