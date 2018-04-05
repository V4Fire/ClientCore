/*!
 * V4Fire Client Core
 * https://github.com/V4Fire/Client
 *
 * Released under the MIT license
 * https://github.com/V4Fire/Client/blob/master/LICENSE
 */

// tslint:disable:max-file-line-count

import $C = require('collection.js');
import Then from 'core/then';
import StatusCodes from 'core/statusCodes';
import symbolGenerator from 'core/symbol';

import { Socket } from 'core/socket';
import { AsyncOpts, AsyncCbOpts, AsyncCbOptsSingle, ClearOptsId } from 'core/async';

import iMessage, { component, prop, field, system, watch, wait } from 'super/i-message/i-message';
import Provider, {

	providers,
	RequestQuery,
	RequestBody,
	RequestResponse,
	RequestError,
	CreateRequestOptions as BaseCreateRequestOptions

} from 'core/data';

export * from 'super/i-message/i-message';
export {

	RequestQuery,
	RequestBody,
	RequestResponse,
	RequestError

} from 'core/data';

export interface DataEvent {
	on(events: string | string[], handler: Function, ...args: any[]): object | undefined;
	on(
		events: string | string[],
		handler: Function,
		params: AsyncCbOptsSingle & {options?: AddEventListenerOptions},
		...args: any[]
	): object | undefined;

	once(events: string | string[], handler: Function, ...args: any[]): object | undefined;
	once(
		events: string | string[],
		handler: Function,
		params: AsyncCbOpts & {options?: AddEventListenerOptions},
		...args: any[]
	): object | undefined;

	off(id?: object): void;
	off(params: ClearOptsId<object>): void;
}

export interface SocketEvent extends DataEvent {
	connection: Promise<Socket | void>;
}

export interface CreateRequestOptions<T = any> extends BaseCreateRequestOptions<T>, AsyncOpts {
	showProgress?: boolean;
	hideProgress?: boolean;
}

export interface BlockConverter<T = any> {
	(value: any): T;
}

export type ModelMethods = 'get' | 'post' | 'add' | 'upd' | 'del';

export const
	$$ = symbolGenerator();

@component()
export default class iData<T extends Dictionary = Dictionary> extends iMessage {
	/**
	 * Data provider name
	 */
	@prop({type: String, watch: 'initLoad', required: false})
	readonly dataProvider?: string;

	/**
	 * Parameters for a data provider instance
	 */
	@prop(Object)
	readonly dataProviderParams: Dictionary = {};

	/**
	 * Data initialization advanced path
	 */
	@prop({type: String, watch: 'initLoad', required: false})
	readonly initAdvPath?: string;

	/**
	 * Initial request filter or if false,
	 * then won't be request for an empty request
	 */
	@prop({type: [Function, Boolean], watch: 'initLoad'})
	readonly requestFilter: Function | boolean = true;

	/**
	 * Remote data converter
	 */
	@prop({type: Function, watch: 'initLoad', required: false})
	readonly dbConverter?: Function;

	/**
	 * Converter from .db to the block format
	 */
	@prop({type: Function, watch: 'initRemoteData', required: false})
	readonly blockConverter?: BlockConverter;

	/**
	 * Event emitter object for working with a data provider
	 */
	get dataEvent(): DataEvent {
		const
			{async: $a, $dataProvider: $d} = this;

		return {
			on: (event, fn, params, ...args) => {
				if (!$d) {
					return;
				}

				return $a.on($d.event, event, fn, params, ...args);
			},

			once: (event, fn, params, ...args) => {
				if (!$d) {
					return;
				}

				return $a.once($d.event, event, fn, params, ...args);
			},

			off: (...args) => {
				if (!$d) {
					return;
				}

				$a.off(...args);
			}
		};
	}

	/**
	 * Request parameters
	 */
	@field({watch: {fn: 'initLoad', deep: true}})
	protected readonly requestParams: Dictionary<Dictionary> = {get: {}};

	/**
	 * Block data
	 */
	@field({watch: 'initRemoteData'})
	protected db?: T | null = null;

	/**
	 * Provider instance
	 */
	@system()
	protected $dataProvider?: Provider;

	/** @override */
	@wait('loading', {label: $$.initLoad, defer: true})
	async initLoad(): Promise<void> {
		const {$dataProvider: $d} = this;
		this.block.status = this.block.statuses.loading;

		if ($d && $d.baseURL) {
			const
				p = this.getParams('get');

			if (p) {
				Object.assign(p[1], {label: $$.initLoad, join: 'replace'});

				if (this.initAdvPath) {
					this.url(this.initAdvPath);
				}

				try {
					const db = await this.get(<RequestQuery>p[0], p[1]);
					await new Promise((resolve) => {
						this.async.requestIdleCallback(() => {
							this.db = this.getObservableData(this.dbConverter ? this.dbConverter(db && db.valueOf()) : db);
							resolve();

						}, {
							join: true,
							label: $$.initLoad
						});
					});

				} catch (_) {}

			} else {
				this.db = null;
			}
		}

		return super.initLoad();
	}

	/**
	 * Returns full request URL
	 */
	url(): string | undefined;

	/**
	 * Sets advanced URL for requests
	 * @param [value]
	 */
	url(value: string): this;
	url(value?: string): this | string | undefined {
		const
			{$dataProvider: $d} = this;

		if (!$d) {
			return value != null ? this : undefined;
		}

		if (value == null) {
			return $d.url();
		}

		$d.url(value);
		return this;
	}

	/**
	 * Sets base temporary URL for requests
	 * @param value
	 */
	base(value: string): this {
		const
			{$dataProvider: $d} = this;

		if ($d) {
			$d.base(value);
		}

		return this;
	}

	/**
	 * Returns an event emitter object for working with a socket connection
	 * @param [params] - advanced parameters
	 */
	connect(params?: Dictionary): SocketEvent {
		const
			{async: $a, $dataProvider: $d} = this,
			connection = (async () => $d && $d.connect(params))();

		return {
			connection,
			on: async (event, fnOrParams, ...args) => {
				if (!$d) {
					return;
				}

				return $a.on(<Socket>(await connection), event, fnOrParams, ...args);
			},

			once: async (event, fnOrParams, ...args) => {
				if (!$d) {
					return;
				}

				return $a.once(<Socket>(await connection), event, fnOrParams, ...args);
			},

			off: (...args) => {
				if (!$d) {
					return;
				}

				return $a.off(...args);
			}
		};
	}

	/**
	 * Gets data
	 *
	 * @param [data]
	 * @param [params]
	 */
	get(data?: RequestQuery, params?: CreateRequestOptions<T>): Then<T | null> {
		return this.createRequest('get', ...arguments);
	}

	/**
	 * Post data
	 *
	 * @param data
	 * @param [params]
	 */
	post<T>(data?: RequestBody, params?: CreateRequestOptions<T>): Then<T | null> {
		return this.createRequest('post', ...arguments);
	}

	/**
	 * Adds data
	 *
	 * @param data
	 * @param [params]
	 */
	add<T>(data?: RequestBody, params?: CreateRequestOptions<T>): Then<T | null> {
		return this.createRequest('add', ...arguments);
	}

	/**
	 * Updates data
	 *
	 * @param [data]
	 * @param [params]
	 */
	upd<T>(data?: RequestBody, params?: CreateRequestOptions<T>): Then<T | null> {
		return this.createRequest('upd', ...arguments);
	}

	/**
	 * Deletes data
	 *
	 * @param [data]
	 * @param [params]
	 */
	del<T>(data?: RequestBody, params?: CreateRequestOptions<T>): Then<T | null> {
		return this.createRequest('del', ...arguments);
	}

	/**
	 * Drops a request cache
	 */
	dropCache(): void {
		const
			{$dataProvider: $d} = this;

		if (!$d) {
			return;
		}

		$d.dropCache();
	}

	/**
	 * Executes the specified function with a socket connection
	 *
	 * @see {Provider.attachToSocket}
	 * @param fn
	 * @param [params]
	 */
	protected attachToSocket(fn: (socket: Socket) => void, params?: AsyncCbOpts): void {
		const
			{$dataProvider: $d} = this;

		if (!$d) {
			return;
		}

		$d.attachToSocket(fn, params);
	}

	/**
	 * Returns an object to observe by the specified
	 * @param base
	 */
	protected getObservableData<O>(base: T): O | T {
		return base;
	}

	/**
	 * Initializes remote data
	 */
	protected initRemoteData(): any | undefined {
		return undefined;
	}

	/**
	 * Initializes data event listeners
	 */
	@wait('ready')
	protected async initDataListeners(): Promise<void> {
		const
			{dataEvent: $e} = this,
			group = 'dataProviderSync';

		$e.off({
			group
		});

		$e.on('add', (data) => {
			if (this.getParams('get')) {
				this.onAddData(Object.isFunction(data) ? data() : data);
			}
		}, {group});

		$e.on('upd', (data) => {
			if (this.getParams('get')) {
				this.onUpdData(Object.isFunction(data) ? data() : data);
			}
		}, {group});

		$e.on('del', (data) => {
			if (this.getParams('get')) {
				this.onDelData(Object.isFunction(data) ? data() : data);
			}
		}, {group});

		$e.on('refresh', (data) => this.onRefreshData(Object.isFunction(data) ? data() : data), {group});
	}

	/**
	 * Synchronization for the dataProvider property
	 * @param value
	 */
	@watch({field: 'dataProvider', immediate: true})
	protected async syncDataProviderWatcher(value: string | undefined): Promise<void> {
		if (value) {
			this.$dataProvider = new providers[value](this.dataProviderParams);
			await this.initDataListeners();

		} else {
			this.$dataProvider = undefined;
			this.dataEvent.off({group: 'dataProviderSync'});
		}
	}

	/**
	 * Synchronization for the p property
	 *
	 * @param value
	 * @param [oldValue]
	 */
	@watch('p')
	protected syncAdvParamsWatcher(value: Dictionary, oldValue: Dictionary): void {
		if (!Object.fastCompare(value, oldValue)) {
			this.initRemoteData();
		}
	}

	/**
	 * Synchronization for the dataProviderParams property
	 *
	 * @param value
	 * @param [oldValue]
	 */
	@watch('p')
	protected async syncDataProviderParamsWatcher(value: Dictionary, oldValue: Dictionary): Promise<void> {
		if (this.dataProvider) {
			this.$dataProvider = new providers[this.dataProvider](value);
			await this.initDataListeners();
		}
	}

	/**
	 * Returns request parameters for the specified method or false
	 * (for /^get(:|$)/ empty requests if .requestFilter -> true)
	 *
	 * @param method
	 */
	protected getParams(method: string): [RequestQuery | RequestBody, CreateRequestOptions] | false {
		const
			p = this.requestParams && this.requestParams[method];

		let res;
		if (Object.isArray(p)) {
			p[1] = p[1] || {};
			res = p;

		} else {
			res = [p, {}];
		}

		if (/^get(:|$)/.test(method)) {
			res[0] = $C(res[0]).filter((el) => el != null).map();
		}

		const
			f = this.requestFilter,
			isEmpty = !$C(res[0]).length();

		if (method === 'get' && (f ? Object.isFunction(f) && !f.call(this, res[0], isEmpty) : isEmpty)) {
			return false;
		}

		return res;
	}

	/**
	 * Returns default texts for server errors
	 * @param err
	 */
	protected getDefaultErrorText(err: Error | RequestError): string {
		const
			defMsg = t`Unknown server error`;

		if (!(err instanceof RequestError)) {
			return defMsg;
		}

		if (err.type === 'abort') {
			return defMsg;
		}

		let msg;
		switch (err.type) {
			case 'timeout':
				msg = t`The server doesn't respond, try again later`;
				break;

			case 'invalidStatus':
				switch (err.details.response.status) {
					case StatusCodes.FORBIDDEN:
						msg = t`You don't have permission for this operation`;
						break;

					case StatusCodes.NOT_FOUND:
						msg = t`The requested resource wasn't found`;
						break;

					default:
						msg = defMsg;
				}

				break;

			default:
				msg = defMsg;
		}

		return msg;
	}

	/**
	 * Create a new request to the data provider
	 *
	 * @param method - request method
	 * @param [data]
	 * @param [params]
	 */
	protected createRequest<T>(
		method: ModelMethods,
		data?: RequestBody,
		params?: CreateRequestOptions<T>
	): Then<T | null> {
		if (!this.$dataProvider) {
			return <any>Then.resolve(null);
		}

		const
			p = <CreateRequestOptions<T>>(params || {}),
			asyncFields = ['join', 'label', 'group'],
			reqParams = <CreateRequestOptions<T>>(Object.reject(p, asyncFields)),
			asyncParams = <AsyncOpts>(Object.select(p, asyncFields));

		const
			req = <RequestResponse>this.async.request((<Function>this.$dataProvider[method])(data, reqParams), asyncParams),
			is = (v) => v !== false;

		if (this.mods.progress !== 'true') {
			if (is(p.showProgress)) {
				this.setMod('progress', true);
			}

			const then = () => {
				if (is(p.hideProgress)) {
					this.setMod('progress', false);
				}
			};

			req.then(then, (err) => {
				then();
				throw err;
			});
		}

		return req.then((res) => res.data);
	}

	/**
	 * Handler: $dataProvider.add
	 * @param data
	 */
	protected onAddData(data: T): void {
		this.db = this.getObservableData(data);
	}

	/**
	 * Handler: $dataProvider.upd
	 * @param data
	 */
	protected onUpdData(data: T): void {
		this.db = this.getObservableData(data);
	}

	/**
	 * Handler: $dataProvider.del
	 * @param data
	 */
	protected onDelData(data: T): void {
		this.db = undefined;
	}

	/**
	 * Handler: $dataProvider.refresh
	 * @param data
	 */
	protected async onRefreshData(data: T): Promise<void> {
		await this.initLoad();
	}
}
