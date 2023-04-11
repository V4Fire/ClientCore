/*!
 * V4Fire Client Core
 * https://github.com/V4Fire/Client
 *
 * Released under the MIT license
 * https://github.com/V4Fire/Client/blob/master/LICENSE
 */

import type { Page, JSHandle } from 'playwright';

import test from 'tests/config/unit/test';

import DOM from 'tests/helpers/dom';
import Component from 'tests/helpers/component';

import type bList from 'components/base/b-list/b-list';

test.describe('<b-list> slots', () => {
	test.beforeEach(async ({demoPage}) => {
		await demoPage.goto();
	});

	test('default slot', async ({page}) => {
		await renderList(page, {
			children: {
				default: ({item}) => `Label: ${item.label}`
			}
		});

		const selector = DOM.elNameSelectorGenerator('b-list', 'link-value');

		test.expect(await page.locator(selector).allTextContents())
			.toEqual(['Label: Foo', 'Label: Bla']);
	});

	test('icon slots', async ({page}) => {
		await renderList(page, {
			children: {
				icon: ({icon}) => icon,
				preIcon: ({icon}) => icon,
				progressIcon: ({icon}) => icon
			},

			attrs: {
				items: [
					{
						label: 'Foo',
						icon: 'foo',
						preIcon: 'foo2',
						progressIcon: 'foo3'
					},

					{
						label: 'Bla',
						icon: 'bla',
						preIcon: 'bla2',
						progressIcon: 'bla3'
					}
				]
			}
		});

		const
			postIconSelector = DOM.elNameSelectorGenerator('b-list', 'link-post-icon'),
			preIconSelector = DOM.elNameSelectorGenerator('b-list', 'link-pre-icon'),
			progressSelector = DOM.elNameSelectorGenerator('b-list', 'link-progress');

		test.expect(await page.locator(postIconSelector).allTextContents())
			.toEqual(['foo', 'bla']);

		test.expect(await page.locator(preIconSelector).allTextContents())
			.toEqual(['foo2', 'bla2']);

		test.expect(await page.locator(progressSelector).allTextContents())
			.toEqual(['foo3', 'bla3']);
	});

	/**
	 * Returns a JSHandle to the rendered b-list component
	 *
	 * @param page
	 * @param attrs
	 */
	async function renderList(page: Page, params: RenderComponentsVnodeParams = {}): Promise<JSHandle<bList>> {
		await Component.createComponent(page, 'b-list', [
			{
				attrs: {
					id: 'target',
					items: [
						{
							label: 'Foo',
							value: 0,
							attrs: {
								title: 'Custom attr'
							}
						},

						{
							label: 'Bla',
							value: 1
						}
					],
					...params.attrs
				},
				children: params.children
			}
		]);

		return Component.waitForComponentByQuery(page, '#target');
	}
});
