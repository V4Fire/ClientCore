/*!
 * V4Fire Client Core
 * https://github.com/V4Fire/Client
 *
 * Released under the MIT license
 * https://github.com/V4Fire/Client/blob/master/LICENSE
 */

'use strict';

const ts = require('typescript');

const {
	addNamedImport,
	isComponentClass,

	getPartialName,
	getLayerName
} = include('build/ts-transformers/register-component-parts/helpers');

/**
 * @typedef {import('typescript').Transformer} Transformer
 * @typedef {import('typescript').TransformationContext} TransformationContext
 * @typedef {import('typescript').Node} Node
 * @typedef {import('typescript').ClassDeclaration} ClassDeclaration
 */

module.exports = resisterComponentDefaultValues;

/**
 * Registers parts of a class as parts of the associated component.
 * For example, all methods and accessors of the class are registered as methods and accessors of the component.
 *
 * @param {TransformationContext} context
 * @returns {Transformer}
 *
 * @example
 *
 * ```typescript
 * import iBlock, { component, prop } from 'components/super/i-block/i-block';
 *
 * @component()
 * class bExample extends iBlock {
 *   @prop(Array)
 *   prop = [];
 *
 *   get answer() {
 *     return 42;
 *   }
 *
 *   just() {
 *     return 'do it';
 *   }
 * }
 * ```
 *
 * Will transform to
 *
 * ```typescript
 * import { defaultValue } from 'core/component/decorators/default-value';
 * import { method } from 'core/component/decorators/method';
 * import { registeredComponent } from 'core/component/decorators/const';
 *
 * import iBlock, { component, prop } from 'components/super/i-block/i-block';
 *
 * registeredComponent.name = 'bExample';
 * registeredComponent.layer = '@v4fire/client';
 * registeredComponent.event = 'constructor.b-example.@v4fire/client';
 *
 * @component()
 * class bExample extends iBlock {
 *   @defaultValue(() => [])
 *   @prop(Array)
 *   prop = [];
 *
 *   @method('accessor')
 *   get answer() {
 *     return 42;
 *   }
 *
 *   @method('method')
 *   just() {
 *     return 'do it';
 *   }
 * }
 * ```
 */
function resisterComponentDefaultValues(context) {
	const {factory} = context;

	let
		componentName,
		originalComponentName;

	let
		needImportDefaultValueDecorator = false,
		needImportMethodDecorator = false;

	return (node) => {
		node = ts.visitNode(node, visitor);

		if (componentName) {
			node = registeredComponentParams(
				context,
				node,
				componentName,
				originalComponentName,
				getLayerName(node.path)
			);

			node = addNamedImport('registeredComponent', 'core/component/decorators/const', context, node);
		}

		if (needImportDefaultValueDecorator) {
			node = addNamedImport('defaultValue', 'core/component/decorators/default-value', context, node);
		}

		if (needImportMethodDecorator) {
			node = addNamedImport('method', 'core/component/decorators/method', context, node);
		}

		return node;
	};

	/**
	 * A visitor for the AST node
	 *
	 * @param {Node} node
	 * @returns {Node|ClassDeclaration}
	 */
	function visitor(node) {
		if (isComponentClass(node, 'component')) {
			originalComponentName = node.name.text;
			componentName = getPartialName(node) ?? originalComponentName;

			if (node.members != null) {
				const newMembers = node.members.flatMap((node) => {
					if (
						ts.isPropertyDeclaration(node) &&
						ts.hasInitializer(node) &&
						!node.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.StaticKeyword)
					) {
						needImportDefaultValueDecorator = true;
						return addDefaultValueDecorator(context, node);
					}

					const
						isGetter = ts.isGetAccessorDeclaration(node),
						isSetter = !isGetter && ts.isSetAccessorDeclaration(node);

					if (isGetter || isSetter || ts.isMethodDeclaration(node)) {
						needImportMethodDecorator = true;
						node = addMethodDecorator(context, node);
					}

					if (isGetter || isSetter) {
						const
							postfix = isGetter ? 'Getter' : 'Setter',
							methodName = context.factory.createStringLiteral(node.name.text + postfix);

						const method = factory.createMethodDeclaration(
							undefined,
							undefined,
							undefined,
							methodName,
							undefined,
							undefined,
							node.parameters,
							undefined,
							node.body
						);

						return [node, method];
					}

					return node;
				});

				return factory.updateClassDeclaration(
					node,
					node.decorators,
					node.modifiers,
					node.name,
					node.typeParameters,
					node.heritageClauses,
					newMembers
				);
			}
		}

		return ts.visitEachChild(node, visitor, context);
	}
}

/**
 * Registers the component parameters for initializing the DSL
 *
 * @param {TransformationContext} context - the transformation context
 * @param {Node} node - the node representing the component class
 * @param {string} componentName - the name of the component being targeted for registration
 * @param {string} originalComponentName - the original name of the component for registration
 * @param {string} layerName - the name of the layer in which the component is registered
 * @returns {Node}
 */
function registeredComponentParams(
	context,
	node,
	componentName,
	originalComponentName,
	layerName
) {
	const statements = [];

	const {factory} = ts;

	node.statements.forEach((node) => {
		if (isComponentClass(node, 'component') && node.name.text === originalComponentName) {
			statements.push(
				register('name', componentName),
				register('layer', layerName),
				register('event', `constructor.${componentName.dasherize()}.${layerName}`),
				node
			);

		} else {
			statements.push(node);
		}
	});

	return factory.updateSourceFile(node, factory.createNodeArray(statements));

	function register(name, value) {
		return factory.createExpressionStatement(
			factory.createBinaryExpression(
				factory.createPropertyAccessExpression(
					factory.createIdentifier('registeredComponent'),
					factory.createIdentifier(name)
				),

				factory.createToken(ts.SyntaxKind.EqualsToken),
				factory.createStringLiteral(value)
			)
		);
	}
}

/**
 * Adds the @defaultValue decorator for the specified class property
 *
 * @param {TransformationContext} context - the transformation context
 * @param {Node} node - the property node in the AST
 * @returns {Node}
 */
function addDefaultValueDecorator(context, node) {
	const {factory} = context;

	const defaultValue = ts.getEffectiveInitializer(node);

	let getter;

	if (
		ts.isNumericLiteral(defaultValue) ||
		ts.isBigIntLiteral(defaultValue) ||
		ts.isStringLiteral(defaultValue) ||
		defaultValue.kind === ts.SyntaxKind.UndefinedKeyword ||
		defaultValue.kind === ts.SyntaxKind.NullKeyword ||
		defaultValue.kind === ts.SyntaxKind.TrueKeyword ||
		defaultValue.kind === ts.SyntaxKind.FalseKeyword
	) {
		getter = defaultValue;

	} else {
		const getterValue = factory.createBlock(
			[factory.createReturnStatement(defaultValue)],
			true
		);

		getter = factory.createFunctionExpression(
			undefined,
			undefined,
			'getter',
			undefined,
			[],
			undefined,
			getterValue
		);
	}

	const decoratorExpr = factory.createCallExpression(
		factory.createIdentifier('defaultValue'),
		undefined,
		[getter]
	);

	const decorator = factory.createDecorator(decoratorExpr);

	const decorators = factory.createNodeArray([decorator, ...(node.decorators || [])]);

	return factory.updatePropertyDeclaration(
		node,
		decorators,
		node.modifiers,
		node.name,
		node.questionToken,
		node.type,
		node.initializer
	);
}

/**
 * Adds the `@method` decorator for the specified class method or accessor
 *
 * @param {TransformationContext} context - the transformation context
 * @param {Node} node - the method/accessor node in the AST
 * @returns {Node}
 */
function addMethodDecorator(context, node) {
	const {factory} = context;

	let type;

	if (ts.isMethodDeclaration(node)) {
		type = 'method';

	} else {
		type = 'accessor';
	}

	const decoratorExpr = factory.createCallExpression(
		factory.createIdentifier('method'),
		undefined,
		[factory.createStringLiteral(type)]
	);

	const decorator = factory.createDecorator(decoratorExpr);

	const decorators = factory.createNodeArray([decorator, ...(node.decorators || [])]);

	if (ts.isMethodDeclaration(node)) {
		return factory.updateMethodDeclaration(
			node,
			decorators,
			node.modifiers,
			node.asteriskToken,
			node.name,
			node.questionToken,
			node.typeParameters,
			node.parameters,
			node.type,
			node.body
		);
	}

	if (ts.isGetAccessorDeclaration(node)) {
		return factory.updateGetAccessorDeclaration(
			node,
			decorators,
			node.modifiers,
			node.name,
			node.parameters,
			node.type,
			node.body
		);
	}

	return factory.updateSetAccessorDeclaration(
		node,
		decorators,
		node.modifiers,
		node.name,
		node.parameters,
		node.body
	);
}