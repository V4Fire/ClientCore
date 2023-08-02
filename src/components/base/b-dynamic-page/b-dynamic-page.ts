/*!
 * V4Fire Client Core
 * https://github.com/V4Fire/Client
 *
 * Released under the MIT license
 * https://github.com/V4Fire/Client/blob/master/LICENSE
 */

/**
 * [[include:components/base/b-dynamic-page/README.md]]
 * @packageDocumentation
 */

import symbolGenerator from 'core/symbol';

import addEmitter from 'core/cache/decorators/helpers/add-emitter';
import { Cache, RestrictedCache, AbstractCache } from 'core/cache';

import SyncPromise from 'core/promise/sync';
import type { EventEmitterLike } from 'core/async';

import Block, { element } from 'components/friends/block';
import AsyncRender, { iterate } from 'components/friends/async-render';

import iBlock from 'components/super/i-block/i-block';

import iDynamicPage, {

	component,

	prop,
	system,
	computed,
	watch,

	UnsafeGetter,
	ComponentStatus,
	InitLoadOptions

} from 'components/super/i-dynamic-page/i-dynamic-page';

import type {

	PageGetter,

	Include,
	Exclude,

	iDynamicPageEl,
	KeepAliveStrategy,
	UnsafeBDynamicPage

} from 'components/base/b-dynamic-page/interface';

export * from 'components/super/i-data/i-data';
export * from 'components/base/b-dynamic-page/interface';

Block.addToPrototype({element});
AsyncRender.addToPrototype({iterate});

const
	$$ = symbolGenerator();

@component({
	inheritMods: false,
	defaultProps: false
})

export default class bDynamicPage extends iDynamicPage {
	@prop({forceDefault: true})
	override readonly selfDispatching: boolean = true;

	/**
	 * The initial name of the page to load
	 */
	@prop({type: String, required: false})
	readonly pageProp?: string;

	/**
	 * The name of the active page to load
	 * {@link bDynamicPage.pageProp}
	 */
	@system<bDynamicPage>((o) => o.sync.link((val) => val ?? o.pageGetter(o.route, Object.cast(o))))
	page?: string;

	/**
	 * A function that takes a route object and returns the name of the page component to load
	 */
	@prop({
		type: Function,
		default: (e: bDynamicPage['route']) => e?.meta.component ?? e?.name,
		forceDefault: true
	})

	readonly pageGetter!: PageGetter;

	/**
	 * If true, then when moving from one page to another, the old page is saved in the cache under its own name.
	 * When you return to this page, it will be restored. This helps to optimize switching between pages, but increases
	 * memory consumption.
	 *
	 * Note that when a page is switched, it will be deactivated by calling `deactivate`.
	 * When the page is restored, it will be activated by calling `activate`.
	 */
	@prop(Boolean)
	readonly keepAlive: boolean = false;

	/**
	 * The maximum number of pages in the `keepAlive` global cache
	 */
	@prop(Number)
	readonly keepAliveSize: number = 10;

	/**
	 * A dictionary of `keepAlive` caches.
	 * The keys represent cache groups (the default is `global`).
	 */
	@system<bDynamicPage>((o) => o.sync.link('keepAliveSize', (size: number) => ({
		...o.keepAliveCache,
		global: o.addClearListenersToCache(
			size > 0 ?
				new RestrictedCache<iDynamicPageEl>(size) :
				new Cache<iDynamicPageEl>()
		)
	})))

	keepAliveCache!: Dictionary<AbstractCache<iDynamicPageEl>>;

	/**
	 * A predicate to include pages in `keepAlive` caching: if not specified, all loaded pages will be cached.
	 * It can be defined as:
	 *
	 * 1. a component name (or a list of names);
	 * 2. a regular expression;
	 * 3. a function that takes a component name and returns:
	 *    * `true` (include), `false` (does not include);
	 *    * a string key for caching (used instead of the component name);
	 *    * or a special object with information about the caching strategy being used.
	 */
	@prop({
		type: [String, Array, RegExp, Function],
		required: false
	})

	readonly include?: Include;

	/**
	 * A predicate to exclude some pages from `keepAlive` caching.
	 * It can be defined as a component name (or a list of names), regular expression,
	 * or a function that takes a component name and returns `true` (exclude) or `false` (does not exclude).
	 */
	@prop({
		type: [String, Array, RegExp, Function],
		required: false
	})

	readonly exclude?: Exclude;

	/**
	 * A link to an event emitter to listen for page switch events
	 */
	@prop({type: Object, required: false})
	readonly emitter?: EventEmitterLike;

	/**
	 * Page switching event name
	 */
	@prop({
		type: String,
		required: false,
		forceDefault: true
	})

	readonly event?: string = 'setRoute';

	/**
	 * A link to the loaded page component
	 */
	@computed({cache: false, dependencies: ['page']})
	get component(): CanPromise<iDynamicPage> {
		const
			c = this.$refs.component;

		const getComponent = () => {
			const
				c = this.$refs.component!;

			if (Object.isArray(c)) {
				return c[0];
			}

			return c;
		};

		return c != null && (!Object.isArray(c) || c.length > 0) ?
			getComponent() :
			this.waitRef('component').then(getComponent);
	}

	override get unsafe(): UnsafeGetter<UnsafeBDynamicPage<this>> {
		return Object.cast(this);
	}

	protected override readonly componentStatusStore: ComponentStatus = 'ready';

	protected override readonly $refs!: iDynamicPage['$refs'] & {
		component?: iDynamicPage[];
	};

	/**
	 * True if the current page is taken from the cache
	 */
	@system()
	protected pageTakenFromCache: boolean = false;

	/**
	 * Handler: the page has been changed
	 */
	@system()
	protected onPageChange?: Function;

	/**
	 * The page rendering counter.
	 * Updated every time the component template is updated.
	 */
	@system()
	protected renderCounter: number = 0;

	/**
	 * Registered groups of asynchronous render tasks
	 */
	@system()
	protected renderingGroups: Set<string> = new Set();

	/**
	 * Render loop iterator (used with `asyncRender`)
	 */
	protected get renderIterator(): CanPromise<number> {
		if (SSR) {
			return 1;
		}

		return SyncPromise.resolve(Infinity);
	}

	override initLoad(): Promise<void> {
		if (SSR && this.page == null && this.event != null) {
			this.syncEmitterWatcher();
			this.$initializer = this.async.promisifyOnce(this.emitter ?? this.$root, this.event);
		}

		return Promise.resolve();
	}

	/**
	 * Reloads the loaded page component
	 * @param [params]
	 */
	override async reload(params?: InitLoadOptions): Promise<void> {
		const component = await this.component;
		return component.reload(params);
	}

	override canSelfDispatchEvent(_: string): boolean {
		return true;
	}

	/**
	 * Registers a new group for asynchronous rendering and returns it
	 */
	protected registerRenderingGroup(): string {
		const group = `pageRendering-${this.renderCounter++}`;
		this.renderingGroups.add(group);
		return group;
	}

	/**
	 * Render loop filter (used with `asyncRender`)
	 */
	protected renderFilter(): CanPromise<boolean> {
		if (SSR || this.lfc.isBeforeCreate()) {
			return true;
		}

		const
			{unsafe, route} = this;

		return new SyncPromise((resolve) => {
			[...this.renderingGroups].slice(0, -2).forEach((group) => {
				this.async.clearAll({group: new RegExp(RegExp.escape(group))});
				this.renderingGroups.delete(group);
			});

			this.onPageChange = onPageChange(resolve, this.route);
		});

		function onPageChange(
			resolve: Function,
			currentRoute: typeof route
		): AnyFunction {
			return (newPage: CanUndef<string>, currentPage: CanUndef<string>) => {
				unsafe.pageTakenFromCache = false;

				const componentRef = unsafe.$refs[unsafe.$resolveRef('component')];
				componentRef?.pop();

				const
					currentPageEl = unsafe.block?.element<iDynamicPageEl>('component'),
					currentPageComponent = currentPageEl?.component?.unsafe;

				if (currentPageEl != null) {
					if (currentPageComponent != null) {
						const
							currentPageStrategy = unsafe.getKeepAliveStrategy(currentPage, currentRoute);

						if (currentPageStrategy.isLoopback) {
							currentPageComponent.$destroy();

						} else {
							currentPageStrategy.add(currentPageEl);
							currentPageComponent.deactivate();
						}
					}

					currentPageEl.remove();
				}

				const
					newPageStrategy = unsafe.getKeepAliveStrategy(newPage),
					pageElFromCache = newPageStrategy.get();

				if (pageElFromCache == null) {
					const handler = () => {
						if (!newPageStrategy.isLoopback) {
							return SyncPromise.resolve(unsafe.component).then((c) => c.activate(true));
						}
					};

					unsafe.localEmitter.once('asyncRenderChunkComplete', handler, {
						label: $$.renderFilter
					});

				} else {
					const
						pageComponentFromCache = pageElFromCache.component;

					if (pageComponentFromCache != null) {
						pageComponentFromCache.activate();

						unsafe.$el?.append(pageElFromCache);
						pageComponentFromCache.emit('mounted', pageElFromCache);

						componentRef?.push(pageComponentFromCache);
						unsafe.pageTakenFromCache = true;

					} else {
						newPageStrategy.remove();
					}
				}

				resolve(true);
			};
		}
	}

	/**
	 * Returns the `keepAlive` caching strategy for the specified page
	 *
	 * @param page
	 * @param [route] - the application route object
	 */
	protected getKeepAliveStrategy(page: CanUndef<string>, route: this['route'] = this.route): KeepAliveStrategy {
		const loopbackStrategy = {
			isLoopback: true,
			has: () => false,
			get: () => undefined,
			add: (page) => page,
			remove: () => undefined
		};

		if (!this.keepAlive || page == null) {
			return loopbackStrategy;
		}

		const
			{exclude, include} = this;

		if (exclude != null) {
			if (Object.isFunction(exclude)) {
				if (Object.isTruly(exclude(page, route, this))) {
					return loopbackStrategy;
				}

			} else if (Object.isRegExp(exclude) ? exclude.test(page) : Array.concat([], exclude).includes(page)) {
				return loopbackStrategy;
			}
		}

		let
			cacheKey = page;

		const
			globalCache = this.keepAliveCache.global!;

		const globalStrategy = {
			isLoopback: false,
			has: () => globalCache.has(cacheKey),
			get: () => globalCache.get(cacheKey),
			add: (page) => globalCache.set(cacheKey, page),
			remove: () => globalCache.remove(cacheKey)
		};

		if (include != null) {
			if (Object.isFunction(include)) {
				const
					res = include(page, route, this);

				// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
				if (res == null || res === false) {
					return loopbackStrategy;
				}

				if (Object.isString(res) || res === true) {
					cacheKey = res === true ? page : res;
					return globalStrategy;
				}

				const cache = this.keepAliveCache[res.cacheGroup] ?? this.addClearListenersToCache(res.createCache());
				this.keepAliveCache[res.cacheGroup] = cache;

				return {
					isLoopback: false,
					has: () => cache.has(res.cacheKey),
					get: () => cache.get(res.cacheKey),
					add: (page) => cache.set(res.cacheKey, page),
					remove: () => cache.remove(res.cacheKey)
				};
			}

			if (Object.isRegExp(include) ? !include.test(page) : !Array.concat([], include).includes(page)) {
				return loopbackStrategy;
			}
		}

		return globalStrategy;
	}

	protected override initBaseAPI(): void {
		super.initBaseAPI();
		this.addClearListenersToCache = this.instance.addClearListenersToCache.bind(this);
	}

	/**
	 * Wraps the specified cache object and returns a wrapper.
	 * The method adds listeners to destroy unused pages from the cache.
	 *
	 * @param cache
	 */
	protected addClearListenersToCache<T extends AbstractCache<iDynamicPageEl>>(cache: T): T {
		const
			wrappedCache = addEmitter<AbstractCache<iDynamicPageEl>>(cache);

		let
			instanceCache: WeakMap<iDynamicPageEl, number> = new WeakMap();

		wrappedCache.subscribe('set', cache, changeCountInMap(0, 1));
		wrappedCache.subscribe('remove', cache, changeCountInMap(1, -1));

		wrappedCache.subscribe('remove', cache, ({result}) => {
			if (result == null || (instanceCache.get(result) ?? 0) > 0) {
				return;
			}

			result.component?.unsafe.$destroy();
		});

		wrappedCache.subscribe('clear', cache, ({result}) => {
			result.forEach((el) => el.component?.unsafe.$destroy());
			instanceCache = new WeakMap();
		});

		return cache;

		function changeCountInMap(def: number, delta: number): AnyFunction {
			return ({result}: {result: CanUndef<iDynamicPageEl>}) => {
				if (result == null) {
					return;
				}

				const count = instanceCache.get(result) ?? def;
				instanceCache.set(result, count + delta);
			};
		}
	}

	/**
	 * Synchronization for the `emitter` prop
	 */
	@watch('emitter')
	@watch({path: 'event', immediate: true})
	protected syncEmitterWatcher(): void {
		const
			{async: $a} = this;

		const
			group = {group: 'emitter'};

		$a
			.clearAll(group);

		if (this.event != null) {
			$a.on(this.emitter ?? this.$root, this.event, (component, e) => {
				if (component != null && !((<Dictionary>component).instance instanceof iBlock)) {
					e = component;
				}

				const
					newPage = this.pageGetter(e, this) ?? e;

				if (newPage == null || Object.isString(newPage)) {
					this.page = newPage;
				}

			}, group);
		}
	}

	/**
	 * Synchronization for the `page` field
	 *
	 * @param page
	 * @param oldPage
	 */
	@watch({path: 'page', immediate: true})
	protected syncPageWatcher(page: CanUndef<string>, oldPage: CanUndef<string>): void {
		if (this.onPageChange == null) {
			const label = {
				label: $$.syncPageWatcher
			};

			this.watch('onPageChange', {...label, immediate: true}, () => {
				if (this.onPageChange == null) {
					return;
				}

				this.onPageChange(page, oldPage);
				this.async.terminateWorker(label);
			});

		} else {
			this.onPageChange(page, oldPage);
		}
	}

	protected override initModEvents(): void {
		super.initModEvents();
		this.sync.mod('hidden', 'page', (v) => !Object.isTruly(v));
	}
}