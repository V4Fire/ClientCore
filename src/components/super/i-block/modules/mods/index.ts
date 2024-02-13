/*!
 * V4Fire Client Core
 * https://github.com/V4Fire/Client
 *
 * Released under the MIT license
 * https://github.com/V4Fire/Client/blob/master/LICENSE
 */

/**
 * [[include:components/super/i-block/modules/mods/README.md]]
 * @packageDocumentation
 */

import type iBlock from 'components/super/i-block/i-block';
import type { ComponentInterface, ModsProp, ModsDict } from 'core/component';

export * from 'components/super/i-block/modules/mods/interface';

/**
 * Initializes the component modifiers
 * @param component
 */
export function initMods(component: iBlock): ModsDict {
	const
		ctx = component.unsafe,
		declMods = ctx.meta.component.mods;

	const
		attrMods: string[][] = [],
		modVal = (val) => val != null ? String(val) : undefined;

	Object.entries(ctx.$attrs).forEach(([key, val]) => {
		const
			modName = key.camelize(false);

		if (modName in declMods) {
			let
				el;

			ctx.watch(`$attrs.${key}`, (attrs: Dictionary = {}) => {
				el ??= ctx.$el;
				el?.removeAttribute(key);
				void ctx.setMod(modName, modVal(attrs[key]));
			});

			ctx.meta.hooks['before:mounted'].push({
				fn: () => {
					el = ctx.$el;
					el?.removeAttribute(key);
				}
			});

			if (val == null) {
				return;
			}

			attrMods.push([modName, String(val)]);
		}
	});

	function link(propMods: CanUndef<ModsProp>): ModsDict {
		const
			mods = Object.isDictionary(ctx.mods) ? ctx.mods : {...declMods};

		if (propMods != null) {
			Object.entries(propMods).forEach(([key, val]) => {
				if (val != null || mods[key] == null) {
					mods[key] = modVal(val);
				}
			});
		}

		attrMods.forEach(([key, val]) => {
			mods[key] = val;
		});

		const
			{experiments} = ctx.r.remoteState;

		if (Object.isArray(experiments)) {
			experiments.forEach((exp) => {
				const
					experimentMods = exp.meta?.mods;

				if (Object.isDictionary(experimentMods)) {
					Object.entries(experimentMods).forEach(([name, val]) => {
						if (val != null || mods[name] == null) {
							mods[name] = modVal(val);
						}
					});
				}
			});
		}

		Object.entries(mods).forEach(([key, val]) => {
			val = modVal(mods[key]);
			mods[key] = val;

			if (ctx.hook !== 'beforeDataCreate') {
				void ctx.setMod(key, val);
			}
		});

		return mods;
	}

	return Object.cast(ctx.sync.link(link));
}

/**
 * Merges old component modifiers with new modifiers
 * (for functional components)
 *
 * @param component
 * @param oldComponent
 * @param key
 * @param link
 */
export function mergeMods(
	component: iBlock,
	oldComponent: iBlock,
	key: string,
	link?: string
): void {
	if (link == null) {
		return;
	}

	const
		ctx = component.unsafe,
		cache = ctx.$syncLinkCache.get(link);

	if (cache == null) {
		return;
	}

	const
		l = cache[key];

	if (l == null) {
		return;
	}

	const
		modsProp = getExpandedModsProp(ctx),
		mods = {...oldComponent.mods};

	for (let keys = Object.keys(mods), i = 0; i < keys.length; i++) {
		const
			key = keys[i];

		if (ctx.sync.syncModCache[key]) {
			delete mods[key];
		}
	}

	if (Object.fastCompare(modsProp, getExpandedModsProp(oldComponent))) {
		l.sync(mods);

	} else {
		l.sync(Object.assign(mods, modsProp));
	}

	function getExpandedModsProp(component: ComponentInterface): ModsDict {
		const
			{unsafe} = component;

		if (link == null) {
			return {};
		}

		const
			modsProp = unsafe.$props[link];

		if (!Object.isDictionary(modsProp)) {
			return {};
		}

		const
			declMods = unsafe.meta.component.mods,
			res = <ModsDict>{...modsProp};

		Object.entries(unsafe.$attrs).forEach(([name, attr]) => {
			if (name in declMods) {
				if (attr != null) {
					res[key] = attr;
				}
			}
		});

		return res;
	}
}

/**
 * Returns a dictionary with modifiers that reactively affect the component template
 * @param component
 */
export function getReactiveMods(component: iBlock): Readonly<ModsDict> {
	const
		watchMods = {},
		watchers = component.field.get<ModsDict>('reactiveModsStore')!;

	const
		systemMods = component.mods;

	Object.entries(systemMods).forEach(([name, val]) => {
		if (name in watchers) {
			watchMods[name] = val;

		} else {
			Object.defineProperty(watchMods, name, {
				configurable: true,
				enumerable: true,
				get: () => {
					if (!(name in watchers)) {
						Object.getPrototypeOf(watchers)[name] = val;
					}

					return watchers[name];
				}
			});
		}
	});

	return Object.freeze(watchMods);
}