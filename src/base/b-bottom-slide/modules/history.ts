/*!
 * V4Fire Client Core
 * https://github.com/V4Fire/Client
 *
 * Released under the MIT license
 * https://github.com/V4Fire/Client/blob/master/LICENSE
 */

import iBlock, { ModsDecl } from 'super/i-block/i-block';

export interface HistoryItem {
	stage: string;
	options: CanUndef<Dictionary>;
	title?: {
		el: Element | null;
		initBoundingRect: DOMRect;
	}
}

export default class History<T extends iBlock> {
	/**
	 * History modifiers
	 */
	static readonly mods: ModsDecl = {
		turning: [
			'in',
			'out'
		],
		history: [
			'true'
		]
	};

	/**
	 * Context for functions
	 */
	protected readonly component: T;

	/**
	 * Transitions stack
	 */
	protected stackStore: HistoryItem[] = [];

	/**
	 * @param component
	 * @param [stage] - initial page stage
	 * @param [options]
	 */
	constructor(component: T, stage: string = 'index', options?: Dictionary) {
		this.component = component;
		this.stackStore.push({stage, options});

		// @ts-ignore (access)
		this.component.meta.hooks.mounted.push({
			fn: () => {
				const
					{stage} = this.current,
					el = this.component.$el.querySelector(`[data-page=${stage}] [data-title]`);

				if (el) {
					this.current.title = {
						el,
						initBoundingRect: el.getBoundingClientRect()
					};
				}
			}
		});
	}

	/**
	 * Current stack position
	 */
	get current(): HistoryItem {
		return this.stackStore[this.stackStore.length - 1];
	}

	/**
	 * Pages stack
	 */
	get stack(): ReadonlyArray<HistoryItem> {
		return Object.freeze(this.stackStore);
	}

	/**
	 * Page count at the history
	 */
	get length(): number {
		return this.stackStore.length;
	}

	/**
	 * Adds the component stage to the pages stack
	 *
	 * @param stage
	 * @param [options]
	 */
	push(stage: string, options?: Dictionary): void {
		const
			currentPage = this.component.$el.querySelector(`[data-page=${this.current.stage}]`),
			page = this.component.$el.querySelector(`[data-page=${stage}]`);

		if (page) {
			// @ts-ignore (access)
			this.component.block.setElMod(page, 'page', 'turning', 'in');

			// @ts-ignore (access)
			this.component.block.setElMod(currentPage, 'page', 'below', true);
			this.component.setMod('history', true);

			const
				el = this.component.$el.querySelector(`[data-page=${this.current.stage}] [data-title]`);

			let title;

			if (el) {
				title = {
					el,
					initBoundingRect: el.getBoundingClientRect()
				};
			}

			this.stackStore.push({stage, options, title});
		}
	}

	/**
	 * Navigates back through history
	 */
	back(): CanUndef<HistoryItem> {
		if (this.stackStore.length === 1) {
			return;
		}

		const
			current = this.stackStore.pop();

		if (current) {
			if (this.stackStore.length === 1) {
				this.component.removeMod('history');
			}

			const
				{$el} = this.component,
				page = $el.querySelector(`[data-page=${current.stage}]`);

			if (page) {
				// @ts-ignore (access)
				this.component.block.removeElMod(page, 'page', 'turning');

				const
					pageBelow = this.stackStore[this.stackStore.length - 1],
					pageBelowEl = $el.querySelector(`[data-page=${pageBelow.stage}]`);

				// @ts-ignore (access)
				this.component.block.removeElMod(pageBelowEl, 'page', 'below');
			}
		}

		return current;
	}
}
