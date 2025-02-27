import Element from '../Element';
import * as pcuiClass from '../class';

const CLASS_TEXT_INPUT = 'pcui-text-input';

/**
 * @name TextInput
 * @class
 * @classdesc The TextInput is an input element of type text.
 * @augments Element
 * @mixes IBindable
 * @mixes IFocusable
 * @property {string} placeholder Gets / sets the placeholder label that appears on the right of the input.
 * @property {HTMLElement} input Gets the HTML input element.
 * @property {boolean} renderChanges If true then the TextInput will flash when its text changes.
 * @property {boolean} blurOnEnter=true Gets / sets whether pressing Enter will blur (unfocus) the field. Defaults to true.
 * @property {boolean} blurOnEscape=true Gets / sets whether pressing Escape will blur (unfocus) the field. Defaults to true.
 * @property {boolean} keyChange Gets / sets whether any key up event will cause a change event to be fired.} args
 * @property {Function} onValidate A function that validates the value that is entered into the input and returns true if it is valid or false otherwise.
 * If false then the input will be set in an error state and the value will not propagate to the binding.
 */
class TextInput extends Element {
    /**
     * Creates a new TextInput.
     *
     * @param {object} args - The arguments. Extends the pcui.Element constructor arguments. All settable properties can also be set through the constructor.
     */
    constructor(args) {
        if (!args) args = {};
        super(args.dom ? args.dom : document.createElement('div'), args);

        this.class.add(CLASS_TEXT_INPUT);

        let input = args.input;
        if (!input) {
            input = document.createElement('input');
            input.type = 'text';
        }

        input.ui = this;
        input.tabIndex = 0;
        input.autocomplete = "off";
        this._domInput = input;

        this._domEvtChange = this._onInputChange.bind(this);
        this._domEvtFocus = this._onInputFocus.bind(this);
        this._domEvtBlur = this._onInputBlur.bind(this);
        this._domEvtKeyDown = this._onInputKeyDown.bind(this);
        this._domEvtKeyUp = this._onInputKeyUp.bind(this);
        this._domEvtCtxMenu = this._onInputCtxMenu.bind(this);

        this._domInput.addEventListener('change', this._domEvtChange);
        this._domInput.addEventListener('focus', this._domEvtFocus);
        this._domInput.addEventListener('blur', this._domEvtBlur);
        this._domInput.addEventListener('keydown', this._domEvtKeyDown);
        this._domInput.addEventListener('contextmenu', this._domEvtCtxMenu, false);
        this.dom.appendChild(this._domInput);

        this._suspendInputChangeEvt = false;

        if (args.value !== undefined) {
            this.value = args.value;
        }
        this.placeholder = args.placeholder || null;
        this.renderChanges = args.renderChanges || false;
        this.blurOnEnter = (args.blurOnEnter !== undefined ? args.blurOnEnter : true);
        this.blurOnEscape = (args.blurOnEscape !== undefined ? args.blurOnEscape : true);
        this.keyChange = args.keyChange || false;
        this._prevValue = null;

        if (args.onValidate) {
            this.onValidate = args.onValidate;
        }

        this.on('change', () => {
            if (this.renderChanges) {
                this.flash();
            }
        });

        this.on('disable', this._updateInputReadOnly.bind(this));
        this.on('enable', this._updateInputReadOnly.bind(this));
        this.on('readOnly', this._updateInputReadOnly.bind(this));
        this._updateInputReadOnly();
    }

    _onInputChange(evt) {
        if (this._suspendInputChangeEvt) return;

        if (this._onValidate) {
            const error = !this._onValidate(this.value);
            this.error = error;
            if (error) {
                return;
            }
        } else {
            this.error = false;
        }

        this.emit('change', this.value);

        if (this._binding) {
            this._binding.setValue(this.value);
        }
    }

    _onInputFocus(evt) {
        this.class.add(pcuiClass.FOCUS);
        this.emit('focus', evt);
        this._prevValue = this.value;
    }

    _onInputBlur(evt) {
        this.class.remove(pcuiClass.FOCUS);
        this.emit('blur', evt);
    }

    _onInputKeyDown(evt) {
        if (evt.keyCode === 13 && this.blurOnEnter) {
            // do not fire input change event on blur
            // if keyChange is true (because a change event)
            // will have already been fired before for the current
            // value
            this._suspendInputChangeEvt = this.keyChange;
            this._domInput.blur();
            this._suspendInputChangeEvt = false;
        } else if (evt.keyCode === 27) {
            this._suspendInputChangeEvt = true;
            const prev = this._domInput.value;
            this._domInput.value = this._prevValue;
            this._suspendInputChangeEvt = false;

            // manually fire change event
            if (this.keyChange && prev !== this._prevValue) {
                this._onInputChange(evt);
            }

            if (this.blurOnEscape) {
                this._domInput.blur();
            }
        }

        this.emit('keydown', evt);
    }

    _onInputKeyUp(evt) {
        if (evt.keyCode !== 27) {
            this._onInputChange(evt);
        }

        this.emit('keyup', evt);
    }

    _onInputCtxMenu(evt) {
        this._domInput.select();
    }

    _updateInputReadOnly() {
        const readOnly = !this.enabled || this.readOnly;
        if (readOnly) {
            this._domInput.setAttribute('readonly', true);
        } else {
            this._domInput.removeAttribute('readonly');
        }
    }

    _updateValue(value) {
        this.class.remove(pcuiClass.MULTIPLE_VALUES);

        if (value && typeof (value) === 'object') {
            if (Array.isArray(value)) {
                let isObject = false;
                for (let i = 0; i < value.length; i++) {
                    if (value[i] && typeof value[i] === 'object') {
                        isObject = true;
                        break;
                    }
                }

                value = isObject ? '[Not available]' : value.map((val) => {
                    return val === null ? 'null' : val;
                }).join(',');
            } else {
                value = '[Not available]';
            }
        }

        if (value === this.value) return false;

        this._suspendInputChangeEvt = true;
        this._domInput.value = (value === null || value === undefined) ? '' : value;
        this._suspendInputChangeEvt = false;

        this.emit('change', value);

        return true;
    }

    /**
     * @name TextInput#focus
     * @description Focuses the Element.
     * @param {boolean} select - If true then this will also select the text after focusing.
     */
    focus(select) {
        this._domInput.focus();
        if (select) {
            this._domInput.select();
        }
    }

    /**
     * @name TextInput#blur
     * @description Blurs (unfocuses) the Element.
     */
    blur() {
        this._domInput.blur();
    }

    destroy() {
        if (this._destroyed) return;
        this._domInput.removeEventListener('change', this._domEvtChange);
        this._domInput.removeEventListener('focus', this._domEvtFocus);
        this._domInput.removeEventListener('blur', this._domEvtBlur);
        this._domInput.removeEventListener('keydown', this._domEvtKeyDown);
        this._domInput.removeEventListener('keyup', this._domEvtKeyUp);
        this._domInput.removeEventListener('contextmenu', this._domEvtCtxMenu);
        this._domInput = null;

        super.destroy();
    }

    set value(value) {
        const changed = this._updateValue(value);

        if (changed) {
            // reset error
            this.error = false;
        }

        if (changed && this._binding) {
            this._binding.setValue(value);
        }
    }

    get value() {
        return this._domInput.value;
    }

    /* eslint accessor-pairs: 0 */
    set values(values) {
        let different = false;
        const value = values[0];
        for (let i = 1; i < values.length; i++) {
            if (values[i] !== value) {
                different = true;
                break;
            }
        }

        if (different) {
            this._updateValue(null);
            this.class.add(pcuiClass.MULTIPLE_VALUES);
        } else {
            this._updateValue(values[0]);
        }
    }

    set placeholder(value) {
        if (value) {
            this.dom.setAttribute('placeholder', value);
        } else {
            this.dom.removeAttribute('placeholder');
        }
    }

    get placeholder() {
        return this.dom.getAttribute('placeholder');
    }

    set keyChange(value) {
        if (this._keyChange === value) return;

        this._keyChange = value;
        if (value) {
            this._domInput.addEventListener('keyup', this._domEvtKeyUp);
        } else {
            this._domInput.removeEventListener('keyup', this._domEvtKeyUp);
        }
    }

    get keyChange() {
        return this._keyChange;
    }

    get input() {
        return this._domInput;
    }

    set onValidate(value) {
        this._onValidate = value;
    }

    get onValidate() {
        return this._onValidate;
    }
}

Element.register('string', TextInput, { renderChanges: true });

export default TextInput;
