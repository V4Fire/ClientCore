/*!
 * V4Fire Client Core
 * https://github.com/V4Fire/Client
 *
 * Released under the MIT license
 * https://github.com/V4Fire/Client/blob/master/LICENSE
 */

export const
	fnAlias = 'FN__',
	regExpAlias = 'REGEX__';

/**
 * Stringifies the passed object to a JSON string and returns it.
 * The function also supports serialization of functions and regular expressions.
 *
 * @param obj
 */
export function expandedStringify(obj: object): string {
	return JSON.stringify(obj, (_, val) => {
		if (Object.isFunction(val)) {
			return `${fnAlias}${val.toString()}`;
		}

		if (Object.isRegExp(val)) {
			return `${regExpAlias}${JSON.stringify({source: val.source, flags: val.flags})}`;
		}

		return val;
	});
}

/**
 * Parses the specified JSON string into a JS value and returns it.
 * The function also supports parsing of functions and regular expressions.
 *
 * @param str
 */
export function expandedParse<T = JSONLikeValue>(str: string): T {
	return JSON.parse(str, (_, val) => {
		if (Object.isString(val)) {
			if (val.startsWith(fnAlias)) {
				// eslint-disable-next-line no-new-func
				return Function(`return ${val.replace(fnAlias, '')}`)();
			}

			if (val.startsWith(regExpAlias)) {
				const obj = JSON.parse(val.replace(regExpAlias, ''));
				return new RegExp(obj.source, obj.flags);
			}
		}

		return val;
	});
}
