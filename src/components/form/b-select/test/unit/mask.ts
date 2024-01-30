/*!
 * V4Fire Client Core
 * https://github.com/V4Fire/Client
 *
 * Released under the MIT license
 * https://github.com/V4Fire/Client/blob/master/LICENSE
 */

import test from 'tests/config/unit/test';

import { createSelector, renderSelect } from 'components/form/b-select/test/helpers';

test.describe('<b-select> masked input', () => {
	const inputSelector = createSelector('input');

	test.beforeEach(async ({demoPage}) => {
		await demoPage.goto();
	});

	test('should not apply the mask to an empty `text`', async ({page}) => {
		await renderSelect(page, {
			mask: '+%d (%d%d%d) %d%d%d-%d%d-%d%d'
		});

		await test.expect(page.locator(inputSelector)).toHaveValue('');
	});

	test('should apply the mask to the `text`', async ({page}) => {
		await renderSelect(page, {
			text: '79851234567',
			mask: '+%d (%d%d%d) %d%d%d-%d%d-%d%d'
		});

		await test.expect(page.locator(inputSelector)).toHaveValue('+7 (985) 123-45-67');
	});

	test([
		'should partially apply the mask to the `text`',
		'when text is smaller than the mask'
	].join(' '), async ({page}) => {
		await renderSelect(page, {
			text: '798512',
			mask: '+%d (%d%d%d) %d%d%d-%d%d-%d%d'
		});

		await test.expect(page.locator(inputSelector)).toHaveValue('+7 (985) 12_-__-__');
	});

	test('should apply the mask to the non-normalized `text`', async ({page}) => {
		await renderSelect(page, {
			text: '798_586xsd35473178x',
			mask: '+%d (%d%d%d) %d%d%d-%d%d-%d%d'
		});

		await test.expect(page.locator(inputSelector)).toHaveValue('+7 (985) 863-54-73');
	});

	test('should apply the mask using a custom `maskPlaceholder` symbol', async ({page}) => {
		await renderSelect(page, {
			text: '798586',
			mask: '+%d (%d%d%d) %d%d%d-%d%d-%d%d',
			maskPlaceholder: '*'
		});

		await test.expect(page.locator(inputSelector)).toHaveValue('+7 (985) 86*-**-**');
	});

	test('should apply the mask and delete the text that exceeds the specified number of `maskRepetitions`', async ({page}) => {
		const target = await renderSelect(page, {
			text: '12357984',
			mask: '%d-%d',
			maskRepetitions: 2
		});

		await test.expect(page.locator(inputSelector)).toHaveValue('1-2 3-5');
		await test.expect(target.evaluate((ctx) => ctx.isMaskInfinite)).resolves.toBeFalsy();
	});

	test([
		'should apply the mask using a custom `maskDelimiter`',
		'and delete the text that exceeds the specified number of `maskRepetitions`'
	].join(' '), async ({page}) => {
		await renderSelect(page, {
			text: '12357984',
			mask: '%d-%d',
			maskRepetitions: 2,
			maskDelimiter: '//'
		});

		await test.expect(page.locator(inputSelector)).toHaveValue('1-2//3-5');
	});

	test('should update <input> value when text is changed with finite `maskRepetitions`', async ({page}) => {
		const target = await renderSelect(page, {
			text: '1',
			mask: '%d-%d',
			maskRepetitions: 2
		});

		const setText = (text: string) => target.evaluate((ctx, text) => {
			ctx.text = text;
		}, text);

		const input = page.locator(inputSelector);

		await test.expect(input).toHaveValue('1-_');

		await setText('12');

		await test.expect(input).toHaveValue('1-2');

		await setText('123');

		await test.expect(input).toHaveValue('1-2 3-_');
	});

	test('should apply the mask with infinite repetitions', async ({page}) => {
		const target = await renderSelect(page, {
			text: '12357984',
			mask: '%d-%d',
			maskRepetitions: true
		});

		await test.expect(page.locator(inputSelector)).toHaveValue('1-2 3-5 7-9 8-4');
		await test.expect(target.evaluate((ctx) => ctx.isMaskInfinite)).resolves.toBeTruthy();
	});

	test('should partially apply the mask with infinite repetitions', async ({page}) => {
		await renderSelect(page, {
			text: '1235798',
			mask: '%d-%d',
			maskRepetitions: true
		});

		await test.expect(page.locator(inputSelector)).toHaveValue('1-2 3-5 7-9 8-_');
	});

	test('should apply the mask to the text using the custom non-terminals', async ({page}) => {
		await renderSelect(page, {
			text: '1235798',
			mask: '%l-%l',
			maskRepetitions: true,
			regExps: {l: /[1-4]/i}
		});

		await test.expect(page.locator(inputSelector)).toHaveValue('1-2 3-_');
	});

	test('the component\'s `text` should be empty when `value` is not provided', async ({page}) => {
		const target = await renderSelect(page);
		await test.expect(target.evaluate((ctx) => ctx.text)).toBeResolvedTo('');
	});

	test('the component\'s `text` should be empty when `value` is not provided and `mask` is provided', async ({page}) => {
		const target = await renderSelect(page, {
			mask: '%d-%d'
		});

		await test.expect(target.evaluate((ctx) => ctx.text)).toBeResolvedTo('');
	});

	test('the component\'s `text` should be set via the prop', async ({page}) => {
		const target = await renderSelect(page, {
			text: '123'
		});

		await test.expect(target.evaluate((ctx) => ctx.text)).toBeResolvedTo('123');
	});

	test('the component\'s `text` should be changeable', async ({page}) => {
		const target = await renderSelect(page, {
			text: '123'
		});

		await test.expect(target.evaluate((ctx) => {
			ctx.text = '34567';
			return ctx.text;
		})).toBeResolvedTo('34567');
	});

	test('should apply the mask to the provided `text`', async ({page}) => {
		const target = await renderSelect(page, {
			text: '123',
			mask: '%d-%d'
		});

		await test.expect(target.evaluate((ctx) => ctx.text)).toBeResolvedTo('1-2');
	});

	test('should apply the mask to the text updated via accessor', async ({page}) => {
		const target = await renderSelect(page, {
			text: '123',
			mask: '%d-%d'
		});

		await test.expect(target.evaluate((ctx) => {
			ctx.text = '34567';
			return ctx.text;
		})).toBeResolvedTo('3-4');

		await test.expect(target.evaluate((ctx) => {
			ctx.text = '67';
			return ctx.text;
		})).toBeResolvedTo('6-7');
	});
});