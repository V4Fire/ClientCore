import Range from 'core/range';

import bVirtualScroll from 'base/b-virtual-scroll/b-virtual-scroll';

export type OptionProps = (el: unknown, i: number) => Dictionary;

export type RequestQuery<T extends unknown = unknown> = (params: RequestMoreParams<T>) => Dictionary;
export type RequestCheckFn<T extends unknown = unknown> = (params: RequestMoreParams<T>) => boolean;

export type RenderFn = (params: RenderParams) => HTMLElement;

export interface RenderParams<T extends unknown = unknown, CTX extends unknown = unknown> {
	node: HTMLElement;
	data: T;
	i: number;
	ctx: bVirtualScroll;
	optionCtx?: CTX;
}

export interface SchemeRenderNode {
	node?: Nullable<string | HTMLElement>;
	val?: string;
	if?: boolean;
	style?: Dictionary;
	method?: 'replace' | 'innerHTML';
}

export interface RequestMoreParams<T extends unknown = unknown> {
	currentSlice: RenderItem<T>[];
	currentPage: number;
	currentRange: Range<number>;

	nextPage: number;
	itemsToRichBottom: number;
	items: RenderItem<T>[];

	isLastEmpty: boolean;
	lastLoaded: Array<T>;
}

export interface RemoteData {
	data: unknown[];
	total?: number;
}

export interface RecycleComponent<T extends unknown = unknown> {
	node: HTMLElement;
	id: string;
	data: T;
}

export interface RenderItem<T extends unknown = unknown> {
	data: T;
	node: CanUndef<HTMLElement>;
	width: number;
	height: number;
	top: number;
}

export interface RenderedNode {
	width: number;
	height: number;
	node: HTMLElement;
}

export interface AnchoredItem {
	index: number;
	offset: number;
}

export interface ElementPosition {
	x: number;
	y: number;
}

export interface Size {
	width: number;
	height: number;
}
