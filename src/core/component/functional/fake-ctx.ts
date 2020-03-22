/*!
 * V4Fire Client Core
 * https://github.com/V4Fire/Client
 *
 * Released under the MIT license
 * https://github.com/V4Fire/Client/blob/master/LICENSE
 */

import Async from 'core/async';

import { asyncLabel } from 'core/component/const';
import { EventEmitter2 as EventEmitter } from 'eventemitter2';

import { $$, componentOpts, destroyHooks, destroyCheckHooks } from 'core/component/functional/const';
import { forkMeta, addMethodsFromMeta } from 'core/component/meta';

import { runHook } from 'core/component/hook';
import { getNormalParent } from 'core/component/traverse';
import { initProps } from 'core/component/prop';
import { initFields } from 'core/component/field';
import { bindRemoteWatchers } from 'core/component/watch';
import { addEventAPI } from 'core/component/event';

import {

	CreateElement,
	WatchOptions,
	WatchOptionsWithHandler

} from 'core/component/engines';

import { RenderContext } from 'core/component/render';
import { ComponentInterface, FunctionalCtx, WatchPath, RawWatchHandler } from 'core/component/interface';

import { CreateFakeCtxOptions } from 'core/component/functional/interface';
export * from 'core/component/functional/interface';

/**
 * Creates a fake context for a functional component that is based on the specified parameters
 *
 * @param createElement - function to create VNode element
 * @param renderCtx - render context from VNode
 * @param baseCtx - component context that provided core functional
 * @param [opts] - additional options
 */
export function createFakeCtx<T extends object = FunctionalCtx>(
	createElement: CreateElement,
	renderCtx: RenderContext,
	baseCtx: FunctionalCtx,
	opts: CreateFakeCtxOptions
): T {
	// Create a new context object that is based on baseCtx

	const
		fakeCtx = Object.create(baseCtx),
		meta = forkMeta(fakeCtx.meta);

	const
		{methods, component} = meta;

	const
		p = <ComponentInterface>Any(renderCtx.parent),
		data = {};

	const
		$w = new EventEmitter({maxListeners: 1e6, newListener: false}),
		$a = new Async(this);

	const
		{children, data: dataOpts} = renderCtx;

	let
		$options;

	if (p && p.$options) {
		const
			{filters = {}, directives = {}, components = {}} = p.$options;

		$options = {
			filters: Object.create(filters),
			directives: Object.create(directives),
			components: Object.create(components)
		};

	} else {
		$options = {filters: {}, directives: {}, components: {}};
	}

	if (component) {
		Object.assign($options, Object.reject(component, componentOpts));
		Object.assign($options.filters, component.filters);
		Object.assign($options.directives, component.directives);
		Object.assign($options.components, component.components);
	}

	if (renderCtx.$options) {
		const o = renderCtx.$options;
		Object.assign($options, Object.reject(o, componentOpts));
		Object.assign($options.filters, o.filters);
		Object.assign($options.directives, o.directives);
		Object.assign($options.components, o.components);
	}

	// Add base methods and properties
	Object.assign(fakeCtx, renderCtx.props, {
		_self: fakeCtx,
		_renderProxy: fakeCtx,
		_staticTrees: [],

		meta,
		children: children || [],

		$parent: p,
		$root: renderCtx.$root || p && p.$root,
		$options,

		$async: $a,
		$asyncLabel: asyncLabel,
		$createElement: createElement.bind(fakeCtx),

		$data: data,
		$fields: data,
		$dataCache: Object.createDict(),

		$props: renderCtx.props || {},
		$attrs: dataOpts && dataOpts.attrs || {},

		$listeners: renderCtx.listeners || dataOpts && dataOpts.on || {},
		$refs: {},
		$destroyedHooks: {},

		$slots: {
			default: children && children.length ? children : undefined,
			...renderCtx.slots && renderCtx.slots()
		},

		$scopedSlots: {
			...Object.isFunction(renderCtx.scopedSlots) ? renderCtx.scopedSlots() : renderCtx.scopedSlots
		},

		$destroy(): void {
			if (fakeCtx.componentStatus === 'destroyed') {
				return;
			}

			$a.clearAll().locked = true;

			// We need to clear all handlers that we bound to a parent component of the current

			const
				parent = this.$normalParent;

			if (parent) {
				const
					{hooks} = parent.meta,
					{$destroyedHooks} = this;

				for (let o = destroyCheckHooks, i = 0; i < o.length; i++) {
					const
						hook = o[i];

					if ($destroyedHooks[hook]) {
						continue;
					}

					const
						filteredHooks = <unknown[]>[];

					let
						hasChanges = false;

					for (let list = hooks[hook], j = 0; j < list.length; j++) {
						const
							el = list[j];

						if (el.fn[$$.self] !== fakeCtx) {
							filteredHooks.push(el);

						} else {
							hasChanges = true;
						}
					}

					if (hasChanges) {
						hooks[hook] = filteredHooks;
					}

					$destroyedHooks[hook] = true;
				}
			}

			for (let o = destroyHooks, i = 0; i < o.length; i++) {
				const
					key = o[i];

				runHook(key, fakeCtx).then(() => {
					const
						m = methods[key];

					if (m) {
						return m.fn.call(fakeCtx);
					}
				}, stderr);
			}
		},

		$nextTick(cb?: () => void): Promise<void> | void {
			if (cb) {
				$a.setImmediate(cb);
				return;
			}

			return $a.nextTick();
		},

		$forceUpdate(): void {
			if (!Object.isFunction(p.$forceUpdate)) {
				return;
			}

			$a.setImmediate(() => p.$forceUpdate(), {
				label: $$.forceUpdate
			});
		},

		$watch(
			exprOrFn: WatchPath<typeof fakeCtx>,
			cbOrOpts: RawWatchHandler<typeof fakeCtx, T> | WatchOptionsWithHandler<any>,
			opts?: WatchOptions
		): (() => void) {
			let
				cb;

			if (Object.isPlainObject(cbOrOpts)) {
				cb = cbOrOpts.handler;
				opts = cbOrOpts;

			} else {
				cb = cbOrOpts;
			}

			if (Object.isFunction(exprOrFn)) {
				return () => { /* */ };
			}

			cb = cb.bind(this);
			$w.on(exprOrFn, cb);

			if (opts && opts.immediate) {
				$w.emit(exprOrFn, Object.get(this, exprOrFn));
			}

			return () => $w.off(exprOrFn, cb);
		},

		$set(obj: object, key: string, value: any): any {
			obj[key] = value;
			return value;
		},

		$delete(obj: object, key: string): void {
			delete obj[key];
		}
	});

	fakeCtx.$normalParent = getNormalParent(fakeCtx);
	addEventAPI(fakeCtx);

	if (!fakeCtx.$root) {
		fakeCtx.$root = fakeCtx;
	}

	addMethodsFromMeta(meta, fakeCtx, opts?.safe);
	runHook('beforeRuntime', fakeCtx).catch(stderr);

	initProps(fakeCtx, {store: fakeCtx, saveToStore: opts?.initProps});
	initFields(meta.systemFields, fakeCtx, fakeCtx);

	runHook('beforeCreate', fakeCtx).then(() => {
		if (methods.beforeCreate) {
			return methods.beforeCreate.fn.call(fakeCtx);
		}
	}, stderr);

	initFields(meta.fields, fakeCtx, data);
	runHook('beforeDataCreate', fakeCtx).catch(stderr);
	bindRemoteWatchers(fakeCtx);

	// Organize support of watching for fields
	for (let keys = Object.keys(data), i = 0; i < keys.length; i++) {
		const
			key = keys[i];

		Object.defineProperty(fakeCtx, key, {
			enumerable: true,
			configurable: true,

			get(): any {
				return data[key];
			},

			set(val: any): void {
				fakeCtx.$dataCache[key] = true;

				const
					old = data[key];

				if (val !== old) {
					data[key] = val;
					$w.emit(key, val, old);
				}
			}
		});
	}

	fakeCtx.$fields = fakeCtx;
	return fakeCtx;
}
