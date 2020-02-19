/*!
 * V4Fire Client Core
 * https://github.com/V4Fire/Client
 *
 * Released under the MIT license
 * https://github.com/V4Fire/Client/blob/master/LICENSE
 */

import log from 'core/log';

// @ts-ignore
import * as defTpls from 'core/block.ss';
import * as c from 'core/component/const';

import { createComponentMeta, inherit } from 'core/component/meta';
import { getInfoFromConstructor } from 'core/component/reflection';

import { ComponentDriver } from 'core/component/engines';
import { getComponent, getBaseComponent } from 'core/component/create';
import { registerParentComponents } from 'core/component/create/register';

import { ComponentParams, ComponentMethod } from 'core/component/interface';

/**
 * Creates a new component
 *
 * @decorator
 * @param [declParams] - additional parameters:
 *   *) [name] - component name
 *   *) [root] - if true, then the component will be registered as root
 *   *) [tpl] - if false, then will be used the default template
 *   *) [functional] - functional status:
 *        *) if true, then the component will be created as functional
 *        *) if a table with parameters, then the component will be created as smart component
 *
 *   *) [flyweight] - if true, then the component can be used as flyweight (within a composite virtual tree)
 *   *) [parent] - link to a parent component
 *
 *   // Component driver options (by default Vue):
 *
 *   *) [model] - parameters for a model option
 *   *) [inheritAttrs] - parameters for an inheritAttrs option
 */
export function component(declParams?: ComponentParams): Function {
	return (target) => {
		const componentInfo = getInfoFromConstructor(target, declParams);
		c.initEmitter.emit('bindConstructor', componentInfo.name);

		if (!componentInfo.name || componentInfo.params.root || componentInfo.isAbstract) {
			regComponent();

		} else {
			const initList = c.componentInitializers[componentInfo.name] = c.componentInitializers[componentInfo.name] || [];
			initList.push(regComponent);
		}

		// If we have a smart component,
		// we need to compile 2 components in the runtime
		if (Object.isPlainObject(componentInfo.params.functional)) {
			component({
				...declParams,
				name: `${componentInfo.name}-functional`,
				functional: true
			})(target);
		}

		function regComponent(): void {
			// Lazy initializing of parent components
			registerParentComponents(componentInfo);

			const
				parentMeta = componentInfo.parentMeta,
				meta = createComponentMeta(componentInfo);

			if (!componentInfo.params.name || !componentInfo.isSmart) {
				c.components.set(target, meta);
			}

			c.components.set(componentInfo.name, meta);
			c.initEmitter.emit(`constructor.${componentInfo.name}`, {meta, parentMeta});

			if (componentInfo.isAbstract) {
				getBaseComponent(target, meta);
				return;
			}

			const loadTemplate = (component) => (resolve) => {
				const success = () => {
					log(`component:load:${componentInfo.name}`, component);
					resolve(component);
				};

				const
					{methods, methods: {render: r}} = meta;

				const addRenderAndResolve = (tpls) => {
					const
						fns = c.componentTemplates[componentInfo.name] = c.componentTemplates[componentInfo.name] || tpls.index(),
						renderObj = <ComponentMethod>{wrapper: true, watchers: {}, hooks: {}};

					renderObj.fn = fns.render;
					component.staticRenderFns = meta.component.staticRenderFns = fns.staticRenderFns || [];

					methods.render = renderObj;
					success();
				};

				if (componentInfo.params.tpl === false) {
					if (r && !r.wrapper) {
						success();

					} else {
						addRenderAndResolve(defTpls.block);
					}

				} else {
					let
						i = 0;

					const f = () => {
						const
							fns = TPLS[meta.componentName];

						if (fns) {
							if (r && !r.wrapper) {
								success();

							} else {
								addRenderAndResolve(fns);
							}

						} else {
							if (i < 15) {
								i++;

								// tslint:disable-next-line:no-string-literal
								globalThis['setImmediate'](f);

							} else {
								setTimeout(f, 100);
							}
						}
					};

					f();
				}
			};

			const
				obj = loadTemplate(getComponent(target, meta));

			if (componentInfo.params.root) {
				c.rootComponents[componentInfo.name] = new Promise(obj);

			} else {
				const
					c = ComponentDriver.component(componentInfo.name, obj);

				if (Object.isPromise(c)) {
					c.catch(stderr);
				}
			}
		}
	};
}
