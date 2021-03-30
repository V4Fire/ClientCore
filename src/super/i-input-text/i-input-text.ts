/*!
 * V4Fire Client Core
 * https://github.com/V4Fire/Client
 *
 * Released under the MIT license
 * https://github.com/V4Fire/Client/blob/master/LICENSE
 */

/**
 * [[include:super/i-input-text/README.md]]
 * @packageDocumentation
 */

import symbolGenerator from 'core/symbol';

import iWidth from 'traits/i-width/i-width';
import iSize from 'traits/i-size/i-size';

import iInput, {

	component,
	prop,
	system,
	computed,
	wait,

	ModsDecl,
	UnsafeGetter

} from 'super/i-input/i-input';

//#if runtime has iInputText/mask
import * as mask from 'super/i-input-text/modules/mask';
//#endif

import type { CompiledMask, SyncMaskWithTextOptions, UnsafeIInputText } from 'super/i-input-text/interface';

export * from 'super/i-input/i-input';
export * from 'super/i-input-text/interface';

export const
	$$ = symbolGenerator();

/**
 * Superclass to create text inputs
 */
@component({
	functional: {
		dataProvider: undefined
	}
})

export default class iInputText extends iInput implements iWidth, iSize {
	/**
	 * Initial text value of the input
	 */
	@prop(String)
	readonly textProp: string = '';

	/**
	 * UI type of the input
	 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/Input
	 */
	@prop(String)
	readonly type: string = 'text';

	/**
	 * Autocomplete mode of the input
	 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/Input#htmlattrdefautocomplete
	 */
	@prop(String)
	readonly autocomplete: string = 'off';

	/**
	 * Placeholder text of the input
	 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/Input#htmlattrdefplaceholder
	 */
	@prop({type: String, required: false})
	readonly placeholder?: string;

	/**
	 * Readonly flag
	 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/readonly
	 */
	@prop({type: Boolean, required: false})
	readonly readonly?: boolean;

	/**
	 * Maximum text value length of the input
	 * https://developer.mozilla.org/en-US/docs/Web/HTML/Element/Input#htmlattrdefmaxlength
	 */
	@prop({type: Number, required: false})
	readonly maxlength?: number;

	/**
	 * Value of the input's mask.
	 *
	 * The mask is used when you need to "decorate" some input value,
	 * like a phone number or credit card number. The mask can contain terminal and non-terminal symbols.
	 * The terminal symbols will be shown as they are written.
	 * The non-terminal symbols should start with `%` and one more symbol. For instance, `%d` means that it can be
	 * replaced by a numeric character (0-9).
	 *
	 * Supported non-terminal symbols:
	 *
	 * `%d` - is equivalent RegExp' `\d`
	 * `%w` - is equivalent RegExp' `\w`
	 * `%s` - is equivalent RegExp' `\s`
	 *
	 * @example
	 * ```
	 * < b-input :mask = '+%d% (%d%d%d) %d%d%d-%d%d-%d%d'
	 * ```
	 */
	@prop({type: String, required: false})
	readonly mask?: string;

	/**
	 * Value of the mask placeholder.
	 * All non-terminal symbols from the mask without the specified value will have this placeholder.
	 *
	 * @example
	 * ```
	 * /// A user will see an input element with a value:
	 * /// +_ (___) ___-__-__
	 * /// When it starts typing, the value will automatically change, like,
	 * /// +7 (49_) ___-__-__
	 * < b-input :mask = '+%d% (%d%d%d) %d%d%d-%d%d-%d%d' | :maskPlaceholder = '_'
	 * ```
	 */
	@prop({
		type: String,
		validator: (val: string) => [...val.letters()].length === 1,
		watch: {
			handler: 'initMask',
			immediate: true,
			provideArgs: false
		}
	})

	readonly maskPlaceholder: string = '_';

	/**
	 * A number of mask repetitions.
	 * This parameter allows you to specify how many times the mask pattern needs to apply to the input value.
	 * The `true` value means that the pattern can be repeated infinitely.
	 *
	 * @example
	 * ```
	 * /// A user will see an input element with a value:
	 * /// _-_ _-_
	 * < b-input :mask = '%d-%d' | :maskRepetitions = 2
	 * ```
	 */
	@prop({type: [Number, Boolean], required: false})
	readonly maskRepetitionsProp?: number | boolean;

	/**
	 * Delimiter for a mask value. This parameter is used when you are using the `maskRepetitions` prop.
	 * Every next chunk of the mask will have the delimiter as a prefix.
	 *
	 * @example
	 * ```
	 * /// A user will see an input element with a value:
	 * /// _-_@_-_
	 * < b-input :mask = '%d-%d' | :maskRepetitions = 2 | :maskDelimiter = '@'
	 * ```
	 */
	@prop(String)
	readonly maskDelimiter: string = ' ';

	/**
	 * Dictionary with RegExp-s as values.
	 * Keys of the dictionary are interpreted as non-terminal symbols for the component mask, i.e.,
	 * you can add new non-terminal symbols.
	 *
	 * @example
	 * ```
	 * < b-input :mask = '%l%l%l' | :regExps = {l: /[a-z]/i}
	 * ```
	 */
	@prop({type: Object, required: false})
	readonly regExps?: Dictionary<RegExp>;

	/** @override */
	get unsafe(): UnsafeGetter<UnsafeIInputText<this>> {
		return <any>this;
	}

	/**
	 * Text value of the input
	 * @see [[iInputText.text]]
	 */
	@computed({cache: false})
	get text(): string {
		const
			v = this.field.get<string>('textStore') ?? '';

		// If the input is empty, don't provide the mask
		if (this.compiledMask?.placeholder === v) {
			return '';
		}

		return v;
	}

	/**
	 * Sets a new text value of the input
	 * @param value
	 */
	set text(value: string) {
		if (this.mask != null) {
			void this.syncMaskWithText(value);
			return;
		}

		this.updateTextStore(value);
	}

	/**
	 * True, if the mask is repeated infinitely
	 */
	get isMaskInfinite(): boolean {
		return this.maskRepetitionsProp === true;
	}

	/** @inheritDoc */
	static readonly mods: ModsDecl = {
		...iWidth.mods,
		...iSize.mods,

		empty: [
			'true',
			'false'
		]
	};

	/**
	 * Text value store of the input
	 * @see [[iInputText.textProp]]
	 */
	@system((o) => o.sync.link())
	protected textStore!: string;

	/**
	 * Object of the compiled mask
	 * @see [[iInputText.mask]]
	 */
	@system()
	protected compiledMask?: CompiledMask;

	/**
	 * A number of mask repetitions
	 * @see [[iInputText.maskRepetitionsProp]]
	 */
	@system((o) => o.sync.link((v) => v === true ? 1 : v ?? 1))
	protected maskRepetitions!: number;

	/** @override */
	protected readonly $refs!: {input: HTMLInputElement};

	/**
	 * Selects all content of the input
	 * @emits `selectText()`
	 */
	@wait('ready', {label: $$.selectAll})
	selectText(): CanPromise<boolean> {
		const
			{input} = this.$refs;

		if (input.selectionStart !== 0 || input.selectionEnd !== input.value.length) {
			input.select();
			this.emit('selectText');
			return true;
		}

		return false;
	}

	/**
	 * Clears content of the input
	 * @emits `clearText()`
	 */
	@wait('ready', {label: $$.clearText})
	clearText(): CanPromise<boolean> {
		if (this.text === '') {
			return false;
		}

		if (this.mask != null) {
			void this.syncMaskWithText('');

		} else {
			this.text = '';
		}

		this.emit('selectText');
		return true;
	}

	/**
	 * Initializes the component mask
	 */
	@wait('ready', {label: $$.initMask})
	protected initMask(): CanPromise<void> {
		return mask.init(this);
	}

	/**
	 * Compiles the component mask.
	 * The method saves the compiled mask object and other properties within the component.
	 */
	protected compileMask(): CanUndef<CompiledMask> {
		if (this.mask == null) {
			return;
		}

		this.compiledMask = mask.compile(this, this.mask);
		return this.compiledMask;
	}

	/**
	 * Synchronizes the component mask with the specified text value
	 *
	 * @param [text]
	 * @param [opts] - additional options
	 */
	@wait('ready', {label: $$.syncComponentMaskWithText})
	protected syncMaskWithText(
		text: string = this.text,
		opts?: SyncMaskWithTextOptions
	): CanPromise<void> {
		mask.syncWithText(this, text, opts);
	}

	/**
	 * Updates the component text store with the provided value
	 * @param value
	 */
	protected updateTextStore(value: string): void {
		this.field.set('textStore', value);

		const
			{input} = this.$refs;

		// Force to set a value to the input
		if (Object.isTruly(input)) {
			input.value = value;
		}
	}

	/** @override */
	protected normalizeAttrs(attrs: Dictionary = {}): Dictionary {
		attrs.type = this.type;
		attrs.autocomplete = this.autocomplete;
		attrs.placeholder = this.placeholder;
		attrs.readonly = this.readonly;
		attrs.maxlength = this.maxlength;
		return attrs;
	}

	/** @override */
	protected initModEvents(): void {
		super.initModEvents();
		this.sync.mod('empty', 'text', (v) => v === '');
		this.sync.mod('readonly', 'readonly');
	}

	protected mounted(): void {
		this.$refs.input.value = this.text;
	}

	/**
	 * Handler: the input with a mask has lost the focus
	 */
	protected onMaskBlur(): void {
		mask.syncInputWithField(this);
	}

	/**
	 * Handler: value of the masked input has been changed and can be saved
	 */
	protected onMaskValueReady(): void {
		mask.saveSnapshot(this);
	}

	/**
	 * Handler: there is occur an input action on the masked input
	 */
	protected onMaskInput(): void {
		mask.syncFieldWithInput(this);
	}

	/**
	 * Handler: removing characters from the mask via "backspace/delete" buttons
	 * @param e
	 */
	protected onMaskDelete(e: KeyboardEvent): void {
		void mask.onDelete(this, e);
	}

	/**
	 * Handler: "navigation" over the mask via "arrow" buttons or click events
	 * @param e
	 */
	protected onMaskNavigate(e: KeyboardEvent | MouseEvent): void {
		mask.onNavigate(this, e);
	}

	/**
	 * Handler: there is occur a keypress action on the masked input
	 * @param e
	 */
	protected onMaskKeyPress(e: KeyboardEvent): void {
		mask.onKeyPress(this, e);
	}
}
