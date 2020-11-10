/*!
 * V4Fire Client Core
 * https://github.com/V4Fire/Client
 *
 * Released under the MIT license
 * https://github.com/V4Fire/Client/blob/master/LICENSE
 */

import { RequestError } from 'core/request';

import bForm from 'form/b-form/b-form';
import iInput, { ValidationError as InputValidationError } from 'super/i-input/i-input';
import { RequestQuery, RequestBody } from 'super/i-data/i-data';

export interface ValidationError<V = unknown> {
	component: iInput;
	error: InputValidationError<V>;
}

export interface ValidateOptions {
	focusOnError?: boolean;
}

export type SubmitBody =
	RequestQuery |
	RequestBody;

export interface SubmitCtx {
	elements: iInput[];
	form: bForm;
}

export type SubmitStatus = 'success' | 'fail' | 'empty';

export interface SubmitResult<T = unknown> {
	status: SubmitStatus;
	response: T | Error | RequestError;
}

export interface ActionFn {
	(body: SubmitBody, ctx: SubmitCtx): void;
}
