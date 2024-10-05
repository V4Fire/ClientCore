/* eslint-disable no-var,camelcase */

/*!
 * V4Fire Client Core
 * https://github.com/V4Fire/Client
 *
 * Released under the MIT license
 * https://github.com/V4Fire/Client/blob/master/LICENSE
 */

/// <reference types="@v4fire/core"/>
/// <reference types="./build/stylus/ds"/>
/// <reference path="./ts-definitions/playwright.d.ts"/>

declare const MODULE: string;
declare const CSP_NONCE_STORE: string;
declare const LANG_PACKS: string;

declare var PATH: Dictionary<CanUndef<string>>;
declare var PUBLIC_PATH: CanUndef<string>;

declare const COMPONENTS: Dictionary<{parent: string; dependencies: string[]}>;
declare const TPLS: Dictionary<Dictionary<Function>>;

declare const DS: CanUndef<DesignSystem>;
declare const BLOCK_NAMES: CanUndef<string[]>;

declare const BUILD_MODE: CanUndef<string>;

declare const DS_COMPONENTS_MODS: CanUndef<{
	[name: string]: Nullable<Array<string | boolean | number>>;
}>;

interface RenderOptions {
	/** @default `'rootSelector'` */
	selectorToInject?: string;

	/** @default `'#root-component'` */
	rootSelector?: string;
}

interface HTMLImageElement {
	readonly init: Promise<this>;
	onInit(onSuccess: () => void, onFail?: (err?: Error) => void): void;
}

/**
 * Default app theme to use
 * @see config/default.js
 */
declare const THEME: CanUndef<string>;

/**
 * Attribute name to set a value of the theme to the root element
 * @see config/default.js
 */
declare const THEME_ATTRIBUTE: CanUndef<string>;

/**
 * Array of available themes in the runtime
 * @see config/default.js
 */
declare const AVAILABLE_THEMES: CanUndef<string[]>;

declare const DETECT_USER_PREFERENCES: CanUndef<
	Dictionary<Dictionary<{
		enabled: boolean;
		aliases?: Dictionary<string>;
	}>>
>;

interface Event {
	delegateTarget?: Element;
}

interface BoxSize {
	readonly blockSize: number;
	readonly inlineSize: number;
}

interface ResizeObserverObserveOptions {
	box: 'content-box' | 'border-box';
}

declare let ModuleDependencies: {
	cache: Dictionary;
	event: {on: Function; once: Function; off: Function};
	add(moduleName: string, dependencies: string[]): void;
	get(module: string): Promise<string[]>;
};

interface ElementPosition {
	top: number;
	left: number;
}

interface Element {
	getPosition(): ElementPosition;
	getIndex(): number | null;
}

interface Node {
	getOffset(parent?: Element | string): ElementPosition;
}

interface IntersectionObserverInit {
	delay?: number;
	trackVisibility?: boolean;
}

interface IntersectionObserver {
	delay?: number;
	trackVisibility?: boolean;
}

interface Document {
	fonts: {
		ready: Promise<void>;
	};
}

interface RenderContentFn {
	(props: Dictionary): string;
}

interface RenderParams<A extends object = Dictionary> {
	/**
	 * Component attrs
	 */
	attrs?: A;

	/** @see [[RenderContent]] */
	content?: Dictionary<RenderContent | RenderContentFn | string>;

	/**
	 * List of component events to listen to
	 */
	events?: string[];
}

/**
 * Content to render into an element
 *
 * @example
 *
 * ```typescript
 * globalThis.renderComponents('b-button', {
 *   attrs: {
 *      testProp: 1
 *   },
 *
 *   content: {
 *     default: {
 *       tag: 'b-button',
 *       content: {
 *         default: 'Test'
 *       }
 *     }
 *   }
 * });
 * ```
 *
 * This schema is the equivalent of such a template:
 *
 * ```ss
 * < b-button :testProp = 1
 *   < b-button
 *     Test
 * ```
 */
interface RenderContent {
	/**
	 * Component name or tagName
	 */
	tag: string;

	/**
	 * Component attrs
	 */
	attrs: Dictionary;

	/** @see [[RenderContent]] */
	content?: Dictionary<RenderContent | RenderContentFn | string>;
}

// eslint-disable-next-line no-var,vars-on-top
declare var
	/**
	 * Renders the specified components
	 *
	 * @param componentName
	 * @param scheme
	 * @param [opts]
	 */
	renderComponents: (componentName: string, scheme: RenderParams[] | string, opts?: RenderOptions) => void,

	/**
	 * Removes all components created via `globalThis.renderComponents`
	 */
	removeCreatedComponents: () => void,

	/**
	 * Requires a module by the specified path
	 */
	importModule: (path: string) => any,

	/**
	 * Jest mock API for test environment.
	 */
	jestMock: {
		/**
		 * Wrapper for jest `spyOn` function.
		 * @see https://jestjs.io/docs/mock-functions
		 */
		spy: import('jest-mock').ModuleMocker['spyOn'];

		/**
		 * Wrapper for jest `fn` function.
		 * @see https://jestjs.io/docs/mock-functions
		 */
		mock: import('jest-mock').ModuleMocker['fn'];
	};


type RenderComponentsScheme = RenderComponentsVnodeParams[] | string;

interface RenderComponentsVnodeDescriptor extends RenderComponentsVnodeParams {
	/**
	 * A simple tag name or component name
	 */
	type: string;
}

interface RenderComponentsVnodeParams<A extends object = Dictionary> {
	/**
	 * A dictionary with attributes to pass to the created VNode
	 */
	attrs?: A;

	/**
	 * An array of children VNode descriptors or dictionary with slot functions
	 */
	children?: VNodeChildren;
}

type VNodeChild = string | RenderComponentsVnodeDescriptor;

type VNodeChildren =
	VNodeChild[] |
	Dictionary<CanArray<VNodeChild> | ((...args: any[]) => CanArray<VNodeChild>)>;

/**
 * The results returned by a mock or spy function from `jestMock`.
 */
interface JestMockResult<VAL = any> {
	type: 'throw' | 'return';
	value: VAL;
}

interface TouchGesturesCreateOptions {
	/**
	 * Element to dispatch an event
	 */
	dispatchEl: Element | string;

	/**
	 * Element that will be provided as a target in the dispatched event
	 */
	targetEl: Element | string;

	/**
	 * Delay between steps
	 * @default `5`
	 */
	pause?: number;
}

interface TouchGesturePoint extends Partial<TouchGesturesCreateOptions> {
	x: number;
	y: number;
}
