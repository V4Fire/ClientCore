- namespace [%fileName%]

/*!
 * V4Fire Client Core
 * https://github.com/V4Fire/Client
 *
 * Released under the MIT license
 * https://github.com/V4Fire/Client/blob/master/LICENSE
 */

- include 'components/super/i-data'|b as placeholder

- template index() extends ['i-data'].index
	- block body
		< template v-if = testComponent
			< component &
				ref = testComponent |
				:is = testComponent |
				:v-attrs = testComponentAttrs |
				v-render = testComponentSlots
			.

		< template v-else
			+= self.slot()