/*!
 * V4Fire Client Core
 * https://github.com/V4Fire/Client
 *
 * Released under the MIT license
 * https://github.com/V4Fire/Client/blob/master/LICENSE
 */

import type { ComponentField, ComponentFieldInitializers } from 'core/component/meta';

/**
 * Returns the weight of a specified field from a given scope.
 * This weight describes when a field should initialize relative to other fields within the same scope:
 *
 *   1. When initializing component fields, fields with a weight of zero are initialized first.
 *   2. After all zero-weight fields are initialized, fields with a minimum non-zero weight are initialized, and so on.
 *
 * @param field - the field to calculate the weight
 * @param scope - the scope where is stored the field, like `$fields` or `$systemFields`
 */
export function getFieldWeight(field: CanUndef<ComponentField>, scope: Dictionary<ComponentField>): number {
	if (field == null) {
		return 0;
	}

	let weight = 0;

	const {after} = field;

	if (after != null) {
		weight += after.size;

		for (const name of after) {
			const dep = scope[name];

			if (dep == null) {
				throw new ReferenceError(`The specified dependency ${dep} could not be found in the given scope`);
			}

			weight += getFieldWeight(dep, scope);
		}
	}

	if (!field.atom) {
		weight += 1e3;
	}

	return weight;
}

/**
 * Sorts the specified fields and returns an array that is ordered and ready for initialization
 * @param fields
 */
export function sortFields(fields: Dictionary<ComponentField>): ComponentFieldInitializers {
	const list: Array<[string, ComponentField]> = [];

	// eslint-disable-next-line guard-for-in
	for (const name in fields) {
		const field = fields[name];

		if (field == null) {
			continue;
		}

		list.push([name, field]);
	}

	// The for-in loop first iterates over the object's own properties, and then over those from the prototypes,
	// which means the initialization order will be reversed.
	// To fix this, we need to reverse the list of fields before sorting.
	return list.reverse().sort(([aName], [bName]) => {
		const
			aWeight = getFieldWeight(fields[aName], fields),
			bWeight = getFieldWeight(fields[bName], fields);

		return aWeight - bWeight;
	});
}