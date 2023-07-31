/*!
 * V4Fire Client Core
 * https://github.com/V4Fire/Client
 *
 * Released under the MIT license
 * https://github.com/V4Fire/Client/blob/master/LICENSE
 */

import Friend from 'components/friends/friend';

import type bVirtualScroll from 'components/base/b-virtual-scroll/b-virtual-scroll';
import { isItem } from 'components/base/b-virtual-scroll/modules/helpers';
import { createInitialState, createPrivateInitialState } from 'components/base/b-virtual-scroll/modules/state/helpers';
import type { MountedChild, VirtualScrollState, MountedItem, PrivateComponentState } from 'components/base/b-virtual-scroll/interface';

/**
 * Friendly to the `bVirtualScroll` class that represents the internal state of a component.
 */
export class ComponentInternalState extends Friend {
	override readonly C!: bVirtualScroll;

	/**
	 * Current state of the component.
	 */
	protected state: VirtualScrollState = createInitialState();

	/**
	 * Current private state of the component.
	 */
	protected privateState: PrivateComponentState = createPrivateInitialState();

	/**
	 * Compiles and returns the current state of the component.
	 *
	 * @returns The current state of the component.
	 */
	compile(): Readonly<VirtualScrollState> {
		return this.state;
	}

	/**
	 * Resets the state of the component.
	 */
	reset(): void {
		this.state = createInitialState();
		this.privateState = createPrivateInitialState();
	}

	/**
	 * Increments the load page pointer.
	 */
	incrementLoadPage(): void {
		this.state.loadPage++;
	}

	/**
	 * Increments the render page pointer.
	 */
	incrementRenderPage(): void {
		this.state.renderPage++;
	}

	/**
	 * Updates the loaded data state.
	 *
	 * @param data - The new data to update the state.
	 * @param isInitialLoading - Indicates if it's the initial loading.
	 */
	updateData(data: object[], isInitialLoading: boolean): void {
		this.state.data = this.state.data.concat(data);
		this.state.isLastEmpty = data.length === 0;
		this.state.isInitialLoading = isInitialLoading;
		this.state.lastLoadedData = data;
	}

	/**
	 * Updates the arrays with mounted child elements of the component.
	 * @param mounted - The mounted child elements.
	 */
	updateMounted(mounted: MountedChild[]): void {
		const
			{state} = this,
			childList = <MountedChild[]>state.childList,
			itemsList = <MountedItem[]>state.items,
			newItems = <MountedItem[]>mounted.filter((child) => child.type === 'item');

		childList.push(...mounted);
		itemsList.push(...newItems);

		this.updateRemainingChild();
	}

	/**
	 * Updates the state of the last raw loaded data.
	 * @param data - The last raw loaded data.
	 */
	setRawLastLoaded(data: unknown): void {
		this.state.lastLoadedRawData = data;
	}

	/**
	 * Sets the flag indicating if it's the initial render cycle.
	 * @param value - The value of the flag.
	 */
	setIsInitialRender(value: boolean): void {
		this.state.isInitialRender = value;
	}

	/**
	 * Sets the flag indicating if requests are stopped and the component won't make any more requests
	 * until the lifecycle is refreshed.
	 *
	 * @param value - The value of the flag.
	 */
	setIsRequestsStopped(value: boolean): void {
		this.state.areRequestsStopped = value;
	}

	/**
	 * Sets the flag indicating if the component's lifecycle is done.
	 * @param value - The value of the flag.
	 */
	setIsLifecycleDone(value: boolean): void {
		this.state.isLifecycleDone = value;
	}

	/**
	 * Sets the flag indicating if the component is currently loading data.
	 * @param value - The value of the flag.
	 */
	setIsLoadingInProgress(value: boolean): void {
		this.state.isLoadingInProgress = value;
	}

	/**
	 * Sets a flag indicating whether the last load operation ended with an error.
	 * @param value - The value to set.
	 */
	setIsLastErrored(value: boolean): void {
		this.state.isLastErrored = value;
	}

	/**
	 * Sets the maximum viewed index based on the passed component's index.
	 * @param component - The component to compare and update the maximum viewed index.
	 */
	setMaxViewedIndex(component: MountedChild): void {
		const
			{state} = this,
			{childIndex} = component;

		if (isItem(component) && (state.maxViewedItem == null || state.maxViewedItem < component.itemIndex)) {
			state.maxViewedItem = component.itemIndex;
			state.remainingItems = state.items.length - 1 - state.maxViewedItem;
		}

		if (state.maxViewedChild == null || state.maxViewedChild < childIndex) {
			state.maxViewedChild = component.childIndex;
			state.remainingChildren = state.childList.length - 1 - state.maxViewedChild;
		}

		this.updateRemainingChild();
	}

	/**
	 * Returns the cursor indicating the last index of the last rendered data element.
	 */
	getDataCursor(): number {
		return this.privateState.dataOffset;
	}

	/**
	 * Updates the cursor indicating the last index of the last rendered data element.
	 */
	updateDataOffset(): void {
		const
			{ctx, state} = this,
			current = this.getDataCursor(),
			chunkSize = ctx.getChunkSize(state);

		this.privateState.dataOffset = current + chunkSize;
	}

	/**
	 * Updates the state of the tillEnd-like fields.
	 * Calculates the remaining number of child elements until the end and the remaining number of items until the end.
	 */
	updateRemainingChild(): void {
		const
			{state} = this;

		if (state.maxViewedChild == null) {
			state.remainingChildren = state.childList.length - 1;

		} else {
			state.remainingChildren = state.childList.length - 1 - state.maxViewedChild;
		}

		if (state.maxViewedItem == null) {
			state.remainingItems = state.items.length - 1;

		} else {
			state.remainingItems = state.items.length - 1 - state.maxViewedItem;
		}
	}
}

