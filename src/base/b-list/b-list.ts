/*!
 * V4Fire Client Core
 * https://github.com/V4Fire/Client
 *
 * Released under the MIT license
 * https://github.com/V4Fire/Client/blob/master/LICENSE
 */

/**
 * [[include:base/b-list/README.md]]
 * @packageDocumentation
 */

//#if demo
import 'models/demo/list';
//#endif

import symbolGenerator from 'core/symbol';
import SyncPromise from 'core/promise/sync';

import { isAbsURL } from 'core/url';
import { derive } from 'core/functools/trait';

import iVisible from 'traits/i-visible/i-visible';
import iWidth from 'traits/i-width/i-width';

import iItems, { IterationKey } from 'traits/i-items/i-items';
import iActiveItems, { Active } from 'traits/i-active-items/i-active-items';

import iData, { component, prop, field, system, computed, watch, hook, ModsDecl } from 'super/i-data/i-data';
import type { Item, Items } from 'base/b-list/interface';

export * from 'super/i-data/i-data';
export * from 'base/b-list/interface';

export const
	$$ = symbolGenerator();

interface bList extends Trait<typeof iActiveItems> {}

/**
 * Component to create a list of tabs/links
 */
@component({
	functional: {
		dataProvider: undefined
	},

	model: {
		prop: 'activeProp',
		event: 'onChange'
	}
})

@derive(iActiveItems)
class bList extends iData implements iVisible, iWidth, iActiveItems {
	/** @see [[iVisible.hideIfOffline]] */
	@prop(Boolean)
	readonly hideIfOffline: boolean = false;

	/** @see [[iActiveItems.Active]] */
	readonly Active!: Active;

	/** @see [[iItems.Item]] */
	readonly Item!: Item;

	/** @see [[iItems.Items]] */
	readonly Items!: Array<this['Item']>;

	/** @see [[iItems.items]] */
	@prop(Array)
	readonly itemsProp: this['Items'] = [];

	/** @see [[iItems.item]] */
	@prop({type: [String, Function], required: false})
	readonly item?: iItems['item'];

	/** @see [[iItems.itemKey]] */
	@prop({type: [String, Function], required: false})
	readonly itemKey?: iItems['itemKey'];

	/** @see [[iItems.itemProps]] */
	@prop({type: Function, required: false})
	readonly itemProps?: iItems['itemProps'];

	/**
	 * Type of the list' root tag
	 */
	@prop(String)
	readonly listTag: string = 'ul';

	/**
	 * Type of list' element tags
	 */
	@prop(String)
	readonly listElTag: string = 'li';

	/**
	 * An initial component active item/s.
	 * If the component is switched to the `multiple` mode, you can pass an array or Set to define several active items.
	 */
	@prop({required: false})
	readonly activeProp?: unknown[] | this['Active'];

	/**
	 * If true, then all items without the `href` option will automatically generate a link by using `value`
	 * and other props
	 */
	@prop(Boolean)
	readonly autoHref: boolean = false;

	/**
	 * If true, the component supports a feature of multiple active items
	 */
	@prop(Boolean)
	readonly multiple: boolean = false;

	/**
	 * If true, the active item can be unset by using another click to it.
	 * By default, if the component is switched to the `multiple` mode, this value is set to `true`,
	 * otherwise to `false`.
	 */
	@prop({type: Boolean, required: false})
	readonly cancelable?: boolean;

	/**
	 * Initial additional attributes are provided to an "internal" (native) list tag
	 */
	@prop({type: Object, required: false})
	readonly attrsProp?: Dictionary;

	/**
	 * A map of the item indexes and their values
	 */
	@system()
	indexes!: Dictionary;

	/**
	 * A map of the item values and their indexes
	 */
	@system()
	values!: Map<unknown, number>;

	/**
	 * A map of the item values and their descriptors
	 */
	@system()
	valueItems!: Map<unknown, this['Item']>;

	/** @see [[iActiveItems.activeStore]] */
	@system<bList>((o) => iActiveItems.linkActiveStore(o))
	activeStore!: this['Active'];

	/**
	 * Additional attributes are provided to an "internal" (native) list tag
	 * @see [[bList.attrsProp]]
	 */
	get attrs(): Dictionary {
		const
			attrs = {...this.attrsProp};

		if (this.items.some((el) => el.href === undefined)) {
			attrs.role = 'tablist';
			attrs['aria-multiselectable'] = this.multiple;
		}

		return attrs;
	}

	/**
	 * List of component items
	 * @see [[bList.itemsProp]]
	 */
	@computed({dependencies: ['itemsStore']})
	get items(): this['Items'] {
		return <this['Items']>this.field.get('itemsStore');
	}

	/**
	 * Sets a new list of component items
	 * @see [[bList.items]]
	 */
	set items(value: this['Items']) {
		this.field.set('itemsStore', value);
	}

	/** @see [[iActiveItems.active] */
	@computed({cache: false})
	get active(): this['Active'] {
		return iActiveItems.getActive(this);
	}

	static override readonly mods: ModsDecl = {
		...iVisible.mods,
		...iWidth.mods,

		hideLabels: [
			'true',
			['false']
		]
	};

	/**
	 * Store of component items
	 * @see [[bList.items]]
	 */
	@field<bList>((o) => o.sync.link<Items>((val) => {
		if (o.dataProvider != null) {
			return <CanUndef<Items>>o.itemsStore ?? [];
		}

		return o.normalizeItems(val);
	}))

	protected itemsStore!: this['Items'];

	/** @see [[iActiveItems.prototype.activeElement] */
	@computed({
		cache: true,
		dependencies: ['active']
	})

	get activeElement(): CanPromise<CanArray<HTMLAnchorElement> | null> {
		const
			{active} = this;

		const getEl = (value) => {
			const
				id = this.values.get(value);

			if (id != null) {
				return this.block?.element<HTMLAnchorElement>('link', {id}) ?? null;
			}

			return null;
		};

		return this.waitStatus('ready')
			.then(() => this.nextTick())
			.then(() => {
				if (this.multiple) {
					return Object.isSet(active) ? [...active].flatMap((val) => getEl(val) ?? []) : [];
				}

				return getEl(active);
			});
	}

	/** @see [[iActiveItems.prototype.getItemByValue] */
	getItemByValue(value: Item['value']): CanUndef<Item> {
		return this.valueItems.get(value);
	}

	/** @see [[iActiveItems.prototype.setActive] */
	setActive(value: this['Active'], unsetPrevious: boolean = false): boolean {
		const
			res = iActiveItems.setActive(this, value);

		if (!res) {
			return res;
		}

		const
			{block: $b} = this;

		if ($b != null) {
			const
				id = this.values.get(value),
				linkEl = id != null ? $b.element('link', {id}) : null;

			if (!this.multiple || unsetPrevious) {
				const
					previousLinkEls = $b.elements('link', {active: true});

				for (let i = 0; i < previousLinkEls.length; i++) {
					const
						previousLinkEl = previousLinkEls[i];

					if (previousLinkEl !== linkEl) {
						$b.setElMod(previousLinkEl, 'link', 'active', false);

						if (previousLinkEl.hasAttribute('aria-selected')) {
							previousLinkEl.setAttribute('aria-selected', 'false');
						}
					}
				}
			}

			this.async.promise(
				SyncPromise.resolve(this.activeElement),
				{label: $$.selectActive}
			).then((selectedElement) => {
				const
					els = Array.concat([], selectedElement);

				for (let i = 0; i < els.length; i++) {
					const el = els[i];
					$b.setElMod(el, 'link', 'active', true);

					if (el.hasAttribute('aria-selected')) {
						el.setAttribute('aria-selected', 'true');
					}
				}
			}, stderr);
		}

		return res;
	}

	/** @see [[iActiveItems.prototype.unsetActive] */
	unsetActive(value: unknown): boolean {
		const
			{activeElement, block: $b} = this;

		const
			res = iActiveItems.unsetActive(this, value);

		if (!res) {
			return res;
		}

		if ($b != null) {
			SyncPromise.resolve(activeElement).then((activeElement) => {
				const
					els = Array.concat([], activeElement);

				for (let i = 0; i < els.length; i++) {
					const
						el = els[i],
						id = el.getAttribute('data-id'),
						itemValue = this.indexes[String(id)];

					if (itemValue == null) {
						continue;
					}

					const needChangeMod = this.multiple && Object.isSet(value) ?
						value.has(itemValue) :
						value === itemValue;

					if (needChangeMod) {
						$b.setElMod(el, 'link', 'active', false);

						if (el.hasAttribute('aria-selected')) {
							el.setAttribute('aria-selected', 'false');
						}
					}
				}
			}, stderr);
		}

		return res;
	}

	protected override initRemoteData(): CanUndef<CanPromise<this['Items'] | Dictionary>> {
		if (!this.db) {
			return;
		}

		const
			val = this.convertDBToComponent(this.db);

		if (Object.isDictionary(val)) {
			return Promise.all(this.state.set(val)).then(() => val);
		}

		if (Object.isArray(val)) {
			this.items = this.normalizeItems(<this['Items']>val);
		}

		return this.items;
	}

	protected override initBaseAPI(): void {
		super.initBaseAPI();

		const
			i = this.instance;

		this.isActive = i.isActive.bind(this);
		this.setActive = i.setActive.bind(this);
		this.normalizeItems = i.normalizeItems.bind(this);
	}

	/**
	 * Initializes component values
	 * @param itemsChanged - true, if the method is invoked after items changed
	 */
	@hook('beforeDataCreate')
	protected initComponentValues(itemsChanged: boolean = false): void {
		this.values = new Map();
		this.valueItems = new Map();
		this.indexes = {};

		const
			{active} = this;

		let
			hasActive = false,
			activeItem;

		for (let i = 0; i < this.items.length; i++) {
			const
				item = this.items[i],
				val = item.value;

			this.values.set(val, i);
			this.valueItems.set(val, item);
			this.indexes[i] = val;

			if (item.value === active) {
				hasActive = true;
			}

			if (item.active) {
				activeItem = item;
			}
		}

		if (!hasActive) {
			if (itemsChanged && active != null) {
				this.field.set('activeStore', undefined);
			}

			if (activeItem != null) {
				iActiveItems.initItem(this, activeItem);
			}
		}
	}

	/**
	 * Normalizes the specified items and returns it
	 * @param items
	 */
	protected normalizeItems(items: CanUndef<this['Items']>): this['Items'] {
		const
			normalizedItems = <this['Items']>[];

		if (items == null) {
			return normalizedItems;
		}

		for (let i = 0; i < items.length; i++) {
			const
				item = items[i];

			let
				{value, href} = item;

			if (value === undefined) {
				value = href ?? i;
			}

			const needAutoHref =
				href === undefined &&
				value !== undefined &&
				this.autoHref;

			if (needAutoHref) {
				href = String(value);

				if (!isAbsURL.test(href) && !href.startsWith('/') && !href.startsWith('#')) {
					href = `#${href}`;
				}
			}

			const
				classes = this.provide.hintClasses(item.hintPos).concat(item.classes ?? []),
				attrs = {...item.attrs};

			if (href === undefined) {
				attrs.role = 'tab';
			}

			normalizedItems.push({
				...item,

				attrs,
				classes,

				value,
				href
			});
		}

		return normalizedItems;
	}

	/**
	 * Returns a dictionary with props for the specified item
	 *
	 * @param item
	 * @param i - position index
	 */
	protected getItemProps(item: this['Item'], i: number): Dictionary {
		const
			op = this.itemProps;

		return Object.isFunction(op) ?
			op(item, i, {
				key: this.getItemKey(item, i),
				ctx: this
			}) :

			op ?? {};
	}

	/**
	 * Synchronization of items
	 *
	 * @param items
	 * @param oldItems
	 * @emits `itemsChange(value: this['Items'])`
	 */
	@watch({path: 'itemsStore', immediate: true})
	protected syncItemsWatcher(items: this['Items'], oldItems?: this['Items']): void {
		if (!Object.fastCompare(items, oldItems)) {
			this.initComponentValues(oldItems != null);
			this.emit('itemsChange', items);
		}
	}

	/** @see [[iItems.getItemKey]] */
	protected getItemKey(item: this['Item'], i: number): CanUndef<IterationKey> {
		return iItems.getItemKey(this, item, i);
	}

	/**
	 * Returns href for item. Is used at the rendering stage
	 *
	 * @param item
	 */
	protected getHref(item: Item): CanUndef<string> {
		return item.href;
	}

	protected override initModEvents(): void {
		super.initModEvents();
		iVisible.initModEvents(this);
	}

	protected override onAddData(data: unknown): void {
		Object.assign(this.db, this.convertDataToDB(data));
	}

	protected override onUpdData(data: unknown): void {
		Object.assign(this.db, this.convertDataToDB(data));
	}

	protected override onDelData(data: unknown): void {
		Object.assign(this.db, this.convertDataToDB(data));
	}

	/**
	 * Handler: click to some item element
	 *
	 * @param e
	 * @emits `actionChange(active: this['Active'])`
	 */
	@watch({
		path: '?$el:click',
		wrapper: (o, cb) => o.dom.delegateElement('link', cb)
	})

	protected onItemClick(e: Event): void {
		const
			target = <Element>e.delegateTarget,
			id = Number(target.getAttribute('data-id'));

		this.toggleActive(this.indexes[id]);
		this.emit('actionChange', this.active);
	}
}

export default bList;
