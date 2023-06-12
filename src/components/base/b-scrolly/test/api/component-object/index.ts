/*!
 * V4Fire Client Core
 * https://github.com/V4Fire/Client
 *
 * Released under the MIT license
 * https://github.com/V4Fire/Client/blob/master/LICENSE
 */

import type { JSHandle, Locator, Page } from 'playwright';

import { ComponentObject, Scroll } from 'tests/helpers';

import type bScrolly from 'components/base/b-scrolly/b-scrolly';
import type { ComponentRefs, ComponentState } from 'components/base/b-scrolly/b-scrolly';
import type { SlotsStateObj } from 'components/base/b-scrolly/modules/slots';
import { testStyles } from 'components/base/b-scrolly/test/api/component-object/styles';

export class ScrollyComponentObject extends ComponentObject<bScrolly> {

	/**
	 * Container ref
	 */
	readonly container: Locator;

	readonly childList: Locator;

	/**
	 * @param page
	 */
	constructor(page: Page) {
		super(page, 'b-scrolly');
		this.container = this.node.locator(this.elSelector('container'));
		this.childList = this.container.locator('> *');
	}

	override async build(...args: Parameters<ComponentObject<bScrolly>['build']>): Promise<JSHandle<bScrolly>> {
		await this.page.addStyleTag({content: testStyles});
		return super.build(...args);
	}

	/**
	 * Calls a reload method of the component
	 */
	reload(): Promise<void> {
		return this.component.evaluate((ctx) => ctx.reload());
	}

	/**
	 * Returns an internal component state
	 */
	getComponentState(): Promise<ComponentState> {
		return this.component.evaluate((ctx) => ctx.getComponentState());
	}

	/**
	 * Returns a container child count
	 */
	async getContainerChildCount(): Promise<number> {
		return this.childList.count();
	}

	/**
	 * Waits for container child count equals to N
	 */
	async waitForContainerChildCountEqualsTo(n: number): Promise<void> {
		await this.childList.nth(n - 1).waitFor({state: 'attached'});

		if (await this.childList.count() > n) {
			throw new Error('More than expected items');
		}
	}

	async waitForLifecycleDone(): Promise<void> {
		await this.component.evaluate((ctx) => {
			const
				state = ctx.getComponentState();

			if (state.isLifecycleDone) {
				return;
			}

			return ctx.componentEmitter.promisifyOnce('lifecycleDone');
		});
	}

	/**
	 * Returns promise that will be resolved then the provided slot will hit `isVisible` state
	 *
	 * @param slotName
	 * @param isVisible
	 * @param timeout
	 */
	async waitForSlotState(slotName: keyof ComponentRefs, isVisible: boolean, timeout?: number): Promise<void> {
		const
			slot = await this.node.locator(this.elSelector(slotName));

		await slot.waitFor({state: isVisible ? 'visible' : 'hidden', timeout});
	}

	async getSlotsState(): Promise<Required<SlotsStateObj>> {
		const
			container = await this.node.locator(this.elSelector('container')),
			loader = await this.node.locator(this.elSelector('loader')),
			tombstones = await this.node.locator(this.elSelector('tombstones')),
			empty = await this.node.locator(this.elSelector('empty')),
			retry = await this.node.locator(this.elSelector('retry')),
			done = await this.node.locator(this.elSelector('done')),
			renderNext = await this.node.locator(this.elSelector('renderNext'));

		return {
			container: await container.isVisible(),
			loader: await loader.isVisible(),
			tombstones: await tombstones.isVisible(),
			empty: await empty.isVisible(),
			retry: await retry.isVisible(),
			done: await done.isVisible(),
			renderNext: await renderNext.isVisible()
		};
	}

	/**
	 * Scrolls page to the bottom
	 */
	async scrollToBottom(): Promise<this> {
		await Scroll.scrollToBottom(this.page);
		return this;
	}

	/**
	 * Adds default `iItems` props
	 */
	withPaginationItemProps(): this {
		this.setProps({
			item: 'section',
			itemProps: (item) => ({'data-index': item.i})
		});

		return this;
	}

	/**
	 * Adds a `requestProp`
	 * @param requestParams
	 */
	withRequestProp(requestParams: Dictionary = {}): this {
		this.setProps({
			request: {
				get: {
					chunkSize: 10,
					id: Math.random(),
					...requestParams
				}
			}
		});

		return this;
	}

	/**
	 * Adds a `Provider` into provider prop
	 */
	withPaginationProvider(): this {
		this.setProps({dataProvider: 'Provider'});
		return this;
	}

	/**
	 * Calls every `pagination-like` default props setters:
	 *
	 * - `withPaginationProvider`
	 * - `withPaginationItemProps`
	 * - `withRequestProp`
	 *
	 * @param requestParams
	 */
	withDefaultPaginationProviderProps(requestParams: Dictionary = {}): this {
		return this
			.withPaginationProvider()
			.withPaginationItemProps()
			.withRequestProp(requestParams);
	}
}
