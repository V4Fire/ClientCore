/*!
 * V4Fire Client Core
 * https://github.com/V4Fire/Client
 *
 * Released under the MIT license
 * https://github.com/V4Fire/Client/blob/master/LICENSE
 */

/**
 * [[include:components/form/b-radio-button/README.md]]
 * @packageDocumentation
 */

import SyncPromise from 'core/promise/sync';
import bCheckbox, { component } from 'components/form/b-checkbox/b-checkbox';

export * from 'components/form/b-checkbox/b-checkbox';

@component()
export default class bRadioButton extends bCheckbox {
	override readonly changeable: boolean = false;

	// eslint-disable-next-line @typescript-eslint/no-unused-vars-experimental
	protected override onClick(e: Event): Promise<void> {
		void this.focus();

		const
			that = this;

		const uncheckOthers = () => SyncPromise.resolve(this.groupElements).then<undefined>((els) => {
			for (let i = 0; i < els.length; i++) {
				const
					el = els[i];

				if (el !== that && this.isComponent(el, bRadioButton)) {
					void el.uncheck();
				}
			}

			this.emit('actionChange', this.value);
		});

		if (this.changeable) {
			return this.toggle().then(() => uncheckOthers());
		}

		return this.check().then((res) => {
			if (res) {
				return uncheckOthers();
			}
		});
	}
}
