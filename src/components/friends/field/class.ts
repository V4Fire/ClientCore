/*!
 * V4Fire Client Core
 * https://github.com/V4Fire/Client
 *
 * Released under the MIT license
 * https://github.com/V4Fire/Client/blob/master/LICENSE
 */

import { getFieldsStore, ComponentInterface, PropertyInfo } from 'core/component';

import Friend, { fakeMethods } from 'components/friends/friend';

import { getField } from 'components/friends/field/get';
import { setField } from 'components/friends/field/set';

import type { KeyGetter, ValueGetter } from 'components/friends/field/interface';

//#if runtime has dummyComponents
import('components/friends/field/test/b-friends-field-dummy');
//#endif

interface Field {
	get<T = unknown>(path: string | PropertyInfo, getter: ValueGetter): CanUndef<T>;
	get<T = unknown>(path: string | PropertyInfo, obj?: Nullable<object>, getter?: ValueGetter): CanUndef<T>;

	set<T = unknown>(path: string | PropertyInfo, value: T, keyGetter: KeyGetter): T;
	set<T = unknown>(path: string | PropertyInfo, value: T, obj?: Nullable<object>, keyGetter?: KeyGetter): T;

	delete(path: string | PropertyInfo, keyGetter?: KeyGetter): boolean;
	delete(path: string | PropertyInfo, obj?: Nullable<object>, keyGetter?: KeyGetter): boolean;
}

@fakeMethods('delete')
class Field extends Friend {
	/**
	 * Returns a reference to the storage object for the fields of the passed component
	 * @param [component]
	 */
	getFieldsStore<T extends this['C']>(component?: T): T;
	getFieldsStore<T extends this['CTX']>(component?: T): T;
	getFieldsStore<T extends ComponentInterface>(component?: T): T;
	getFieldsStore<T extends ComponentInterface['unsafe']>(component?: T): T;
	getFieldsStore(component: typeof this.ctx = this.ctx): object {
		return getFieldsStore(component);
	}
}

Field.addToPrototype({
	get: getField,
	set: setField
});

export default Field;
