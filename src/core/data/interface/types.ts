/*!
 * V4Fire Client Core
 * https://github.com/V4Fire/Client
 *
 * Released under the MIT license
 * https://github.com/V4Fire/Client/blob/master/LICENSE
 */

import {

	Encoders,
	Decoders,

	CreateRequestOptions,
	RequestMethod,
	RequestQuery,
	RequestBody,
	MiddlewareParams,

	ResponseType,
	ResponseTypeValue, GlobalOptions

} from 'core/request/interface';

export type MockResponseType =
	ResponseType |
	object;

export interface MockCustomResponse {
	status?: number;
	responseType?: ResponseTypeValue;
	decoders?: Decoders;
}

export interface MockResponseFunction {
	(params: MiddlewareParams, response: MockCustomResponse): CanPromise<MockResponseType>;
}

export type MockResponse =
	CanPromise<MockResponseType> |
	MockResponseFunction;

export interface Mock {
	status?: number;
	query?: RequestQuery;
	body?: RequestBody;
	headers?: Dictionary<CanArray<unknown>>;
	decoders?: boolean;
	response: MockResponse;
}

export type Mocks = CanPromise<
	{[key in RequestMethod]?: Mock[]} |
	{default: {[key in RequestMethod]?: Mock[]}}
>;

export type ModelMethod =
	'peek' |
	'get' |
	'post' |
	'add' |
	'upd' |
	'del';

export interface DataEvent {
	event: string;
	data: EventData;
}

export interface EventDataObject<T = unknown> extends Dictionary {
	data: Dictionary<T>;
}

export type EventData<T = unknown> =
	(() => Dictionary<T>) |
	EventDataObject<T>;

export interface ProviderOptions {
	extraProviders?: FunctionalExtraProviders;
	externalRequest?: boolean;
	socket?: boolean;
}

export interface ExtraProviderParams<T = unknown> {
	opts: CreateRequestOptions<T>;
	globalOpts: GlobalOptions;
}

export interface ExtraProvider {
	provider?: string;
	providerParams?: ProviderOptions;
	query?: RequestQuery;
	request?: CreateRequestOptions;
	as?: string;
}

export type ExtraProviders = Dictionary<Nullable<ExtraProvider>>;
export type FunctionalExtraProviders = ExtraProviders | ((params: ExtraProviderParams) => CanUndef<ExtraProviders>);

export type EncodersMap = Record<ModelMethod | 'def', Encoders> | {};
export type DecodersMap = Record<ModelMethod | 'def', Decoders> | {};
