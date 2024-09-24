/*!
 * V4Fire Client Core
 * https://github.com/V4Fire/Client
 *
 * Released under the MIT license
 * https://github.com/V4Fire/Client/blob/master/LICENSE
 */

import { isProxy } from 'core/object/watch';
import { getPropertyInfo, isBinding, isCustomWatcher, PropertyInfo } from 'core/component';

import type iBlock from 'components/super/i-block/i-block';
import type Sync from 'components/friends/sync/class';

import { compareNewAndOldValue } from 'components/friends/sync/helpers';
import type { LinkDecl, LinkGetter, AsyncWatchOptions } from 'components/friends/sync/interface';

/**
 * Sets a reference to a property that is logically connected to the current field.
 *
 * For example, if field A refers to field B,
 * then it will have the same value and will automatically update when B changes.
 * If the link is set to an event, every time this event fires,
 * the value of A will change to the value of the event object.
 *
 * You can refer to a value as a whole or to a part of it.
 * Pass a special getter function that will take parameters from the link and return the value to the original field.
 *
 * Logical connection is based on a naming convention: properties that match the patterns
 * "${property} → ${property}Prop" or "${property}Store → ${property}Prop" are connected with each other.
 *
 * Mind, this function can be used only within a property decorator.
 *
 * @param [optsOrGetter] - additional options or a getter function
 *
 * @example
 * ```typescript
 * import iBlock, { component, prop, field } from 'components/super/i-block/i-block';
 *
 * @component()
 * class bExample extends iBlock {
 *   @prop()
 *   fooProp: number = 0;
 *
 *   @field((ctx) => ctx.sync.link())
 *   foo!: number;
 *
 *   @field()
 *   blaStore: Dictionary = {a: {b: {c: 1}}};
 *
 *   @field((ctx) => ctx.sync.link((val, oldVal?) => val.a.b.c))
 *   bla!: number;
 * }
 * ```
 */
export function link<D = unknown, R = D>(
	this: Sync,
	optsOrGetter?: AsyncWatchOptions | LinkGetter<Sync['C'], D, R>
): CanUndef<R>;

/**
 * Sets a link to a property that is logically connected to the current field.
 *
 * For example, if field A refers to field B,
 * then it will have the same value and will automatically update when B changes.
 * If the link is set to an event, every time this event fires,
 * the value of A will change to the value of the event object.
 *
 * You can refer to a value as a whole or to a part of it.
 * Pass a special getter function that will take parameters from the link and return the value to the original field.
 *
 * Logical connection is based on a naming convention: properties that match the patterns
 * "${property} → ${property}Prop" or "${property}Store → ${property}Prop" are connected with each other.
 *
 * Mind, this method can be used only within a property decorator.
 *
 * @param opts - additional options
 * @param [getter]
 *
 * @example
 * ```typescript
 * import iBlock, { component, prop, field } from 'components/super/i-block/i-block';
 *
 * @component()
 * class bExample extends iBlock {
 *   @prop()
 *   fooProp: Dictionary = {a: {b: {c: 1}}};
 *
 *   @field((ctx) => ctx.sync.link({deep: true}, (val) => val + 1))
 *   foo!: number;
 * }
 * ```
 */
export function link<D = unknown, R = D>(
	this: Sync,
	opts: AsyncWatchOptions,
	getter?: LinkGetter<Sync['C'], D, R>
): CanUndef<R>;

/**
 * Sets a link to a component/object property or event by the specified path.
 *
 * For example, if field A refers to field B,
 * then it will have the same value and will automatically update when B changes.
 * If the link is set to an event, every time this event fires,
 * the value of A will change to the value of the event object.
 *
 * You can refer to a value as a whole or to a part of it.
 * Pass a special getter function that will take parameters from the link and return the value to the original field.
 *
 * To listen to an event, you need to use the special delimiter ":" within a path.
 * Additionally, you can specify an event emitter to listen to by writing a link before the ":" delimiter.
 *
 * {@link iBlock.watch}
 *
 * @param path - a path to the property/event we are referring to, or
 * [a path to the property containing the reference, a path to the property/event we are referring to]
 *
 * @param [optsOrGetter] - additional options or a getter function
 *
 * @example
 * ```typescript
 * import watch from 'core/object/watch';
 * import iBlock, { component, prop, field } from 'components/super/i-block/i-block';
 *
 * @component()
 * class bExample extends iBlock {
 *   @prop()
 *   foo: Dictionary = {a: {b: {c: 1}}};
 *
 *   @field((ctx) => ctx.sync.link('foo.a.b.c'))
 *   bla!: number;
 *
 *   @field((ctx) => ctx.sync.link({ctx: watch({bla: 1}).proxy, path: 'bla'}))
 *   bar!: number;
 *
 *   @field((ctx) => ctx.sync.link('document:click', (e) => e.pageY))
 *   baz?: number;
 * }
 * ```
 *
 * ```typescript
 * import watch from 'core/object/watch';
 * import iBlock, { component, prop, field } from 'components/super/i-block/i-block';
 *
 * @component()
 * class bExample extends iBlock {
 *   @prop()
 *   foo: Dictionary = {a: {b: {c: 1}}};
 *
 *   @field()
 *   bla!: number;
 *
 *   @field()
 *   bar!: number;
 *
 *   @field()
 *   baz?: number;
 *
 *   created() {
 *     this.bla = this.sync.link(['bla', 'foo.a.b.c']);
 *     this.bar = this.sync.link(['bar', {ctx: watch({bla: 1}).proxy, path: 'bla'}]);
 *     this.baz = this.sync.link(['baz', 'document:click'], (e) => e.pageY);
 *   }
 * }
 * ```
 */
export function link<D = unknown, R = D>(
	this: Sync,
	path: LinkDecl,
	optsOrGetter?: AsyncWatchOptions | LinkGetter<Sync['C'], D, R>
): CanUndef<R>;

/**
 * Sets a link to a component/object property or event at the specified path.
 *
 * For example, if field A refers to field B,
 * then it will have the same value and will automatically update when B changes.
 * If the link is set to an event, every time this event fires,
 * the value of A will change to the value of the event object.
 *
 * You can refer to a value as a whole or to a part of it.
 * Pass a special getter function that will take parameters from the link and return the value to the original field.
 *
 * To listen to an event, you need to use the special delimiter ":" within a path.
 * Additionally, you can specify an event emitter to listen to by writing a link before the ":" delimiter.
 *
 * {@link iBlock.watch}
 *
 * @param path - a path to the property/event we are referring to, or
 * [a path to the property containing the reference, a path to the property/event we are referring to]
 *
 * @param opts - additional options
 * @param [getter]
 *
 * @example
 * ```typescript
 * import watch from 'core/object/watch';
 * import iBlock, { component, prop, field } from 'components/super/i-block/i-block';
 *
 * @component()
 * class bExample extends iBlock {
 *   @prop()
 *   foo: Dictionary = {a: {b: 1}};
 *
 *   @field((ctx) => ctx.sync.link('foo', {deep: true}, (value, oldValue?) => value.a.b + 1))
 *   bla!: number;
 *
 *   @field((ctx) => ctx.sync.link({ctx: remoteObject, path: 'bla'}, {deep: true}, (value) => value + 1))
 *   bar!: number;
 *
 *   @field((ctx) => ctx.sync.link('document:click', (e) => e.pageY))
 *   baz?: number;
 * }
 * ```
 *
 * ```typescript
 * import watch from 'core/object/watch';
 * import iBlock, { component, prop, field } from 'components/super/i-block/i-block';
 *
 * @component()
 * class bExample extends iBlock {
 *   @prop()
 *   foo: Dictionary = {a: {b: 1}};
 *
 *   @field()
 *   bla!: number;
 *
 *   @field()
 *   bar!: number;
 *
 *   @field()
 *   baz?: number;
 *
 *   created() {
 *     this.bla = this.sync.link(['bla', 'foo'], {deep: true}, (value, oldValue?) => value.a.b + 1);
 *     this.bar = this.sync.link(['bar', watch({bla: 1}).proxy], {deep: true}, (value, oldValue?) => value.bla + 1);
 *     this.baz = this.sync.link(['baz', 'document:click'], (e) => e.pageY);
 *   }
 * }
 * ```
 */
export function link<D = unknown, R = D>(
	this: Sync,
	path: LinkDecl,
	opts: AsyncWatchOptions,
	getter?: LinkGetter<Sync['C'], D, R>
): CanUndef<R>;

// eslint-disable-next-line complexity
export function link<D = unknown, R = D>(
	this: Sync,
	path?: LinkDecl | AsyncWatchOptions | LinkGetter<Sync['C'], D>,
	opts?: AsyncWatchOptions | LinkGetter<Sync['C'], D>,
	getter?: LinkGetter<Sync['C'], D>
): CanUndef<R> {
	let
		destPath: CanUndef<string>,
		resolvedPath: CanUndef<LinkDecl>;

	if (Object.isArray(path)) {
		destPath = path[0];
		path = path[1];

	} else {
		destPath = this.activeField;

		if (Object.isFunction(path)) {
			getter = path;
			path = undefined;
		}
	}

	if (Object.isFunction(opts)) {
		getter = opts;
	}

	if (destPath == null) {
		throw new ReferenceError('The path to the property containing the reference is not defined');
	}

	const {
		ctx,
		meta,
		linksCache,
		syncLinkCache
	} = this;

	if (linksCache[destPath] != null) {
		return;
	}

	let resolvedOpts: AsyncWatchOptions = {};

	if (path == null) {
		resolvedPath = `${isBinding.test(destPath) ? isBinding.replace(destPath) : destPath}Prop`;

	} else if (Object.isString(path) || isProxy(path) || 'ctx' in path) {
		resolvedPath = path;

	} else if (Object.isDictionary(path)) {
		resolvedOpts = path;
	}

	if (Object.isDictionary(opts)) {
		resolvedOpts = opts;
	}

	if (resolvedPath == null) {
		throw new ReferenceError('The path or object to watch is not specified');
	}

	let
		srcInfo,
		normalizedPath: CanUndef<ObjectPropertyPath>,
		topPathIndex = 1;

	let
		mountedWatcher = false,
		customWatcher = false;

	if (Object.isString(resolvedPath)) {
		normalizedPath = resolvedPath;

		if (isCustomWatcher.test(normalizedPath)) {
			customWatcher = true;

		} else {
			srcInfo = getPropertyInfo(normalizedPath, this.component);

			if (srcInfo.type === 'mounted') {
				mountedWatcher = true;
				normalizedPath = srcInfo.path;
				topPathIndex = Object.size(srcInfo.path) > 0 ? 0 : 1;
			}
		}

	} else {
		mountedWatcher = true;

		if (isProxy(resolvedPath)) {
			srcInfo = {ctx: resolvedPath};
			normalizedPath = undefined;

		} else {
			srcInfo = resolvedPath;
			normalizedPath = srcInfo.path;
			topPathIndex = 0;
		}
	}

	const isAccessor = srcInfo != null ?
		Boolean(srcInfo.type === 'accessor' || srcInfo.type === 'computed' || srcInfo.accessor) :
		false;

	if (isAccessor) {
		resolvedOpts.immediate = resolvedOpts.immediate !== false;
	}

	if (!customWatcher) {
		if (
			normalizedPath != null && (
				Object.isArray(normalizedPath) && normalizedPath.length > topPathIndex ||
				Object.isString(normalizedPath) && normalizedPath.split('.', 2).length > topPathIndex
			)
		) {
			if (!resolvedOpts.deep && !resolvedOpts.collapse) {
				resolvedOpts.collapse = false;
			}

		} else if (resolvedOpts.deep !== false && resolvedOpts.collapse !== false) {
			resolvedOpts.deep = true;
			resolvedOpts.collapse = true;
		}
	}

	linksCache[destPath] = {};

	let destInfo: CanUndef<PropertyInfo>;

	const sync = (val?: unknown, oldVal?: unknown) => {
		const resolveVal = getter ? getter.call(this.component, val, oldVal) : val;

		if (destPath == null) {
			return resolveVal;
		}

		destInfo ??= getPropertyInfo(destPath, this.component);
		this.field.set(destInfo, resolveVal);

		return resolveVal;
	};

	let canSkipWatching = !resolvedOpts.immediate;

	// We cannot observe props and attributes on a component if it is a root component, a functional component,
	// or if it does not accept such parameters in the template.
	// Also, prop watching does not work during SSR.
	if (canSkipWatching && (srcInfo.type === 'prop' || srcInfo.type === 'attr')) {
		const {ctx, ctx: {unsafe: {meta: {params}}}} = srcInfo;

		canSkipWatching =
			SSR ||
			params.root === true || params.functional === true ||
			ctx.getPassedProps?.().has(srcInfo.name) === false;
	}

	if (!canSkipWatching) {
		if (getter != null && (getter.length > 1 || getter['originalLength'] > 1)) {
			ctx.watch(srcInfo ?? normalizedPath, resolvedOpts, (val: unknown, oldVal: unknown, ...args: unknown[]) => {
				if (customWatcher) {
					oldVal = undefined;

				} else {
					if (args.length === 0 && Object.isArray(val) && val.length > 0) {
						const mutation = <[unknown, unknown]>val[val.length - 1];

						val = mutation[0];
						oldVal = mutation[1];
					}

					if (Object.isTruly(compareNewAndOldValue.call(this, val, oldVal, destPath, resolvedOpts))) {
						return;
					}
				}

				sync(val, oldVal);
			});

		} else {
			ctx.watch(srcInfo ?? normalizedPath, resolvedOpts, (val: unknown, ...args: unknown[]) => {
				let
					oldVal: unknown = undefined;

				if (!customWatcher) {
					if (args.length === 0 && Object.isArray(val) && val.length > 0) {
						const
							mutation = <[unknown, unknown]>val[val.length - 1];

						val = mutation[0];
						oldVal = mutation[1];

					} else {
						oldVal ??= args[0];
					}

					if (Object.isTruly(compareNewAndOldValue.call(this, val, oldVal, destPath, resolvedOpts))) {
						return;
					}
				}

				sync(val, oldVal);
			});
		}
	}

	{
		let key: Nullable<string | object>;

		if (mountedWatcher) {
			const o = srcInfo?.originalPath;
			key = Object.isString(o) ? o : srcInfo?.ctx ?? normalizedPath;

		} else {
			key = normalizedPath;
		}

		if (key != null) {
			syncLinkCache.set(key, Object.assign(syncLinkCache.get(key) ?? {}, {
				[destPath]: {
					path: destPath,
					sync
				}
			}));
		}
	}

	if (customWatcher) {
		return sync();
	}

	const needCollapse = resolvedOpts.collapse !== false;

	if (mountedWatcher) {
		const obj = srcInfo?.ctx;

		if (needCollapse || normalizedPath == null || normalizedPath.length === 0) {
			return sync(obj);
		}

		return sync(Object.get(obj, normalizedPath));
	}

	const initSync = () => {
		const {path} = srcInfo;

		// eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
		if (path.includes('.')) {
			return sync(this.field.get(needCollapse ? srcInfo.originalTopPath : srcInfo.originalPath));
		}

		return sync(srcInfo.type === 'field' ? this.field.getFieldsStore(srcInfo.ctx)[path] : srcInfo.ctx[path]);
	};

	if (this.lfc.isBeforeCreate('beforeDataCreate')) {
		meta.hooks.beforeDataCreate.splice(this.lastSyncIndex++, 0, {fn: initSync});
		return;
	}

	return initSync();
}
