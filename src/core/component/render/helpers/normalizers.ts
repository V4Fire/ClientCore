/*!
 * V4Fire Client Core
 * https://github.com/V4Fire/Client
 *
 * Released under the MIT license
 * https://github.com/V4Fire/Client/blob/master/LICENSE
 */

import { propGetterRgxp } from 'core/component/reflect';
import type { ComponentMeta } from 'core/component/meta';

/**
 * Normalizes the provided CSS classes and returns the resulting output
 * @param classes
 */
export function normalizeClass(classes: CanArray<string | Dictionary>): string {
	let classesStr = '';

	if (Object.isString(classes)) {
		classesStr = classes;

	} else if (Object.isArray(classes)) {
		classes.forEach((className) => {
			const
				normalizedClass = normalizeClass(className);

			if (normalizedClass !== '') {
				classesStr += `${normalizedClass} `;
			}
		});

	} else if (Object.isDictionary(classes)) {
		Object.entries(classes).forEach(([className, has]) => {
			if (Object.isTruly(has)) {
				classesStr += `${className} `;
			}
		});
	}

	return classesStr.trim();
}

/**
 * Normalizes the provided CSS styles and returns the resulting output
 * @param styles
 */
export function normalizeStyle(styles: CanArray<string | Dictionary<string>>): string | Dictionary<string> {
	if (Object.isArray(styles)) {
		const normalizedStyles = {};

		styles.forEach((style) => {
			const normalizedStyle = Object.isString(style) ?
				parseStringStyle(style) :
				normalizeStyle(style);

			if (Object.size(normalizedStyle) > 0) {
				Object.entries(normalizedStyle).forEach(([name, style]) => normalizedStyles[name] = style);
			}
		});

		return normalizedStyles;
	}

	if (Object.isString(styles)) {
		return styles.trim();
	}

	if (Object.isDictionary(styles)) {
		return styles;
	}

	return '';
}

const
	listDelimiterRgxp = /;(?![^(]*\))/g,
	propertyDelimiterRgxp = /:(.+)/;

/**
 * Analyzes the given CSS style string and returns a dictionary containing the parsed rules
 * @param style
 */
export function parseStringStyle(style: string): Dictionary<string> {
	const styles = {};

	style.split(listDelimiterRgxp).forEach((singleStyle) => {
		singleStyle = singleStyle.trim();

		if (singleStyle !== '') {
			const
				chunks = singleStyle.split(propertyDelimiterRgxp);

			if (chunks.length > 1) {
				styles[chunks[0].trim()] = chunks[1].trim();
			}
		}
	});

	return styles;
}

/**
 * Normalizes the passed VNode's attributes using the specified component metaobject and returns a new object
 *
 * @param attrs
 * @param dynamicProps
 * @param component
 */
export function normalizeComponentAttrs(
	attrs: Nullable<Dictionary>,
	dynamicProps: Nullable<string[]>,
	component: ComponentMeta
): CanNull<Dictionary> {
	const {
		props,
		// eslint-disable-next-line deprecation/deprecation
		params: {deprecatedProps, functional}
	} = component;

	if (attrs == null) {
		return null;
	}

	const
		dynamicPropsPatches = {},
		normalizedAttrs = {...attrs};

	if (Object.isDictionary(normalizedAttrs['v-attrs'])) {
		normalizedAttrs['v-attrs'] = normalizeComponentAttrs(normalizedAttrs['v-attrs'], dynamicProps, component);
	}

	Object.entries(normalizedAttrs).forEach(normalizeAttr);
	modifyDynamicPath();

	return normalizedAttrs;

	function normalizeAttr([attrName, value]: [string, unknown]) {
		let propName = `${attrName}Prop`.camelize(false);

		if (attrName === 'ref' || attrName === 'ref_for') {
			return;
		}

		if (deprecatedProps != null) {
			const alternativeName =
				deprecatedProps[attrName] ??
				deprecatedProps[propName];

			if (alternativeName != null) {
				changeAttrName(attrName, alternativeName);
				attrName = alternativeName;
				propName = `${alternativeName}Prop`;
			}
		}

		const needSetAdditionalProp =
			functional === true && dynamicProps != null &&
			propGetterRgxp.test(attrName) && Object.isFunction(value);

		// For correct operation in functional components, we need to additionally duplicate such props
		if (needSetAdditionalProp) {
			const
				tiedPropName = attrName.replace(propGetterRgxp, ''),
				tiedPropValue = value()[0];

			normalizedAttrs[tiedPropName] = tiedPropValue;
			normalizeAttr([tiedPropName, tiedPropValue]);
			dynamicProps.push(tiedPropName);
		}

		if (propName in props || propName.replace(propGetterRgxp, '') in props) {
			changeAttrName(attrName, propName);

		} else {
			patchDynamicProps(attrName);
		}
	}

	function changeAttrName(name: string, newName: string) {
		normalizedAttrs[newName] = normalizedAttrs[name];
		delete normalizedAttrs[name];

		if (dynamicProps == null) {
			return;
		}

		dynamicPropsPatches[name] = newName;
		patchDynamicProps(newName);
	}

	function patchDynamicProps(propName: string) {
		if (functional !== true && component.props[propName]?.forceUpdate === false) {
			dynamicPropsPatches[propName] = '';
		}
	}

	function modifyDynamicPath() {
		if (dynamicProps == null || Object.keys(dynamicPropsPatches).length === 0) {
			return;
		}

		for (let i = 0; i < dynamicProps.length; i++) {
			const
				prop = dynamicProps[i],
				path = dynamicPropsPatches[prop];

			if (path == null) {
				continue;
			}

			if (path !== '' && dynamicPropsPatches[path] !== '') {
				dynamicProps[i] = path;

			} else {
				dynamicProps.splice(i, 1);
				i--;
			}
		}
	}
}
