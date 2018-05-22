/*!
 * V4Fire Client Core
 * https://github.com/V4Fire/Client
 *
 * Released under the MIT license
 * https://github.com/V4Fire/Client/blob/master/LICENSE
 */

/// <reference types="@v4fire/core"/>

declare let READY_STATE: number;
declare const IS_PROD: boolean;
declare const API_URL: string | undefined;
declare const APP_NAME: string | undefined;
declare const PATH: Dictionary<string | undefined>;
declare const TPLS: Dictionary;

interface HTMLImageElement {
	readonly init: Promise<this>;
	onInit(onSuccess: () => void, onFail?: (err?: Error) => void): void;
}

interface Event {
	delegateTarget?: Element;
}

declare let ModuleDependencies: {
	cache: Dictionary;
	event: {on: Function; once: Function; off: Function};
	add(moduleName: string, dependencies: string[]): void;
	get(module: string): Promise<string[]>;
};

interface Element {
	getPosition(): {top: number; left: number};
	getIndex(): number | null;
}

interface Node {
	getOffset(parent?: Element | string): {top: number; left: number};
}

interface Number {
	em: string;
	ex: string;
	px: string;
	per: string;
	rem: string;
	vh: string;
	vw: string;
	vmin: string;
	vmax: string;
}
