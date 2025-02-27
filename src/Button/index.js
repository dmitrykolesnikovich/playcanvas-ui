import Element from '../Element';

const CLASS_BUTTON = 'pcui-button';

/**
 * @name Button
 * @class
 * @classdesc Represents a button.
 * @augments Element
 * @property {string} [text=Click Me] Gets / sets the text of the button
 * @property {string} size Gets / sets the 'size' type of the button. Can be null or 'small'.
 * @property {string} [icon=E401] The CSS code for an icon for the button. e.g. E401 (notice we omit the '\' character).
 * @mixes IFocusable
 */
class Button extends Element {
    /**
     * Creates a new Button.
     *
     * @param {object} args - The arguments. Extends the pcui.Element constructor arguments. All settable properties can also be set through the constructor.
     * @param {boolean} [args.unsafe] - If true then the innerHTML property will be used to set the text. Otherwise textContent will be used instead.
     */
    constructor(args) {
        if (!args) args = {};

        super(args.dom ? args.dom : document.createElement('button'), args);

        this.class.add(CLASS_BUTTON);

        this._unsafe = args.unsafe || false;

        this.text = args.text || '';
        this.size = args.size || null;
        this.icon = args.icon || '';

        this._domEventKeyDown = this._onKeyDown.bind(this);
        this.dom.addEventListener('keydown', this._onKeyDown.bind(this));
    }

    // click on enter
    // blur on escape
    _onKeyDown(evt) {
        if (evt.keyCode === 27) {
            this.blur();
        } else if (evt.keyCode === 13) {
            this._onClick(evt);
        }
    }

    _onClick(evt) {
        this.blur();
        if (this.readOnly) return;

        super._onClick(evt);
    }

    focus() {
        this.dom.focus();
    }

    blur() {
        this.dom.blur();
    }

    destroy() {
        if (this._destroyed) return;

        this.dom.removeEventListener('keydown', this._domEventKeyDown);
        super.destroy();
    }

    set text(value) {
        if (this._text === value) return;
        this._text = value;
        if (this._unsafe) {
            this.dom.innerHTML = value;
        } else {
            this.dom.textContent = value;
        }
    }

    get text() {
        return this._text;
    }

    set icon(value) {
        if (this._icon === value || !value.match(/^E[0-9]{0,4}$/)) return;
        this._icon = value;
        if (value) {
            // set data-icon attribute but first convert the value to a code point
            this.dom.setAttribute('data-icon', String.fromCodePoint(parseInt(value, 16)));
        } else {
            this.dom.removeAttribute('data-icon');
        }
    }

    get icon() {
        return this._icon;
    }

    set size(value) {
        if (this._size === value) return;
        if (this._size) {
            this.class.remove('pcui-' + this._size);
            this._size = null;
        }

        this._size = value;

        if (this._size) {
            this.class.add('pcui-' + this._size);
        }
    }

    get size() {
        return this._size;
    }
}

Element.register('button', Button);

export default Button;
