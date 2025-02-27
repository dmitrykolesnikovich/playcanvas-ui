import Element from '../Element';
import NumericInput from '../NumericInput';
import * as pcuiClass from '../class';
import utils from '../helpers/utils';

const CLASS_SLIDER = 'pcui-slider';
const CLASS_SLIDER_CONTAINER = CLASS_SLIDER + '-container';
const CLASS_SLIDER_BAR = CLASS_SLIDER + '-bar';
const CLASS_SLIDER_HANDLE = CLASS_SLIDER + '-handle';
const CLASS_SLIDER_ACTIVE = CLASS_SLIDER + '-active';

const IS_CHROME = /Chrome\//.test(navigator.userAgent);

// fields that are proxied between the slider and the numeric input
const PROXY_FIELDS = [
    'allowNull',
    'max',
    'min',
    'keyChange',
    'placeholder',
    'precision',
    'renderChanges',
    'step'
];

/**
 * @name SliderInput
 * @class
 * @classdesc The SliderInput shows a pcui.NumericInput and a slider widget next to it. It acts as a proxy
 * of the NumericInput.
 * @property {number} min=0 Gets / sets the minimum value that the numeric input field can take.
 * @property {number} max=1 Gets / sets the maximum value that the numeric input field can take.
 * @property {number} sliderMin=0 Gets / sets the minimum value that the slider field can take.
 * @property {number} sliderMax=1 Gets / sets the maximum value that the slider field can take.
 * @property {number} pre Gets / sets the maximum number of decimals a value can take.
 * @property {number} step Gets / sets the amount that the value will be increased or decreased when using the arrow keys. Holding Shift will use 10x the step.
 * @property {boolean} allowNull Gets / sets whether the value can be null. If not then it will be 0 instead of null.
 * @augments Element
 * @mixes IBindable
 * @mixes IFocusable
 */
class SliderInput extends Element {
    /**
     * Creates a new SliderInput.
     *
     * @param {object} args - The arguments. Extends the pcui.NumericInput constructor arguments.
     */
    constructor(args) {
        args = Object.assign({}, args);

        const inputArgs = {};
        PROXY_FIELDS.forEach((field) => {
            inputArgs[field] = args[field];
        });

        if (inputArgs.precision === undefined) {
            inputArgs.precision = 2;
        }

        // binding should only go to the slider
        // and the slider will propagate changes to the numeric input
        delete inputArgs.binding;

        super(args.dom ? args.dom : document.createElement('div'), args);

        if (args.pre) this.precision = args.pre;

        this.class.add(CLASS_SLIDER);

        this._historyCombine = false;
        this._historyPostfix = null;

        this._numericInput = new NumericInput({ ...inputArgs, hideSlider: true });

        // propagate change event
        this._numericInput.on('change', this._onValueChange.bind(this));
        // propagate focus / blur events
        this._numericInput.on('focus', () => {
            this.emit('focus');
        });

        this._numericInput.on('blur', () => {
            this.emit('blur');
        });

        this._sliderMin = (args.sliderMin !== undefined ? args.sliderMin : this.min || 0);
        this._sliderMax = (args.sliderMax !== undefined ? args.sliderMax : this.max || 1);

        this.dom.appendChild(this._numericInput.dom);
        this._numericInput.parent = this;

        this._domSlider = document.createElement('div');
        this._domSlider.classList.add(CLASS_SLIDER_CONTAINER);
        this.dom.appendChild(this._domSlider);

        this._domBar = document.createElement('div');
        this._domBar.classList.add(CLASS_SLIDER_BAR);
        this._domBar.ui = this;
        this._domSlider.appendChild(this._domBar);

        this._domHandle = document.createElement('div');
        this._domHandle.ui = this;
        this._domHandle.tabIndex = 0;
        this._domHandle.classList.add(CLASS_SLIDER_HANDLE);
        this._domBar.appendChild(this._domHandle);
        this._cursorHandleOffset = 0;

        this._domMouseDown = this._onMouseDown.bind(this);
        this._domMouseMove = this._onMouseMove.bind(this);
        this._domMouseUp = this._onMouseUp.bind(this);
        this._domTouchStart = this._onTouchStart.bind(this);
        this._domTouchMove = this._onTouchMove.bind(this);
        this._domTouchEnd = this._onTouchEnd.bind(this);
        this._domKeyDown = this._onKeyDown.bind(this);

        this._touchId = null;

        this._domSlider.addEventListener('mousedown', this._domMouseDown);
        this._domSlider.addEventListener('touchstart', this._domTouchStart, { passive: true });
        this._domHandle.addEventListener('keydown', this._domKeyDown);

        if (args.value !== undefined) {
            this.value = args.value;
        }

        // update the handle in case a 0 value has been
        // passed through the constructor
        if (this.value === 0) {
            this._updateHandle(0);
        }
    }

    _onMouseDown(evt) {
        if (evt.button !== 0 || !this.enabled || this.readOnly) return;
        this._onSlideStart(evt.pageX);
    }

    _onMouseMove(evt) {
        evt.stopPropagation();
        evt.preventDefault();
        this._onSlideMove(evt.pageX);
    }

    _onMouseUp(evt) {
        evt.stopPropagation();
        evt.preventDefault();
        this._onSlideEnd(evt.pageX);
    }

    _onTouchStart(evt) {
        if (!this.enabled || this.readOnly) return;

        for (let i = 0; i < evt.changedTouches.length; i++) {
            const touch = evt.changedTouches[i];
            if (!touch.target.ui || touch.target.ui !== this)
                continue;

            this._touchId = touch.identifier;
            this._onSlideStart(touch.pageX);
            break;
        }
    }

    _onTouchMove(evt) {
        for (let i = 0; i < evt.changedTouches.length; i++) {
            const touch = evt.changedTouches[i];

            if (touch.identifier !== this._touchId)
                continue;

            evt.stopPropagation();
            evt.preventDefault();

            this._onSlideMove(touch.pageX);
            break;
        }
    }

    _onTouchEnd(evt) {
        for (let i = 0; i < evt.changedTouches.length; i++) {
            const touch = evt.changedTouches[i];

            if (touch.identifier !== this._touchId)
                continue;

            evt.stopPropagation();
            evt.preventDefault();

            this._onSlideEnd(touch.pageX);
            this._touchId = null;
            break;
        }
    }

    _onKeyDown(evt) {
        if (evt.keyCode === 27) {
            this.blur();
            return;
        }

        if (!this.enabled || this.readOnly) return;

        // move slider with left / right arrow keys
        if (evt.keyCode !== 37 && evt.keyCode !== 39) return;

        evt.stopPropagation();
        evt.preventDefault();
        let x = evt.keyCode === 37 ? -1 : 1;
        if (evt.shiftKey) {
            x *= 10;
        }

        this.value += x * this.step;
    }

    _updateHandle(value) {
        const left = Math.max(0, Math.min(1, ((value || 0) - this._sliderMin) / (this._sliderMax - this._sliderMin))) * 100;
        const handleWidth = this._domHandle.getBoundingClientRect().width;
        this._domHandle.style.left = `calc(${left}% + ${handleWidth / 2}px)`;
    }

    _onValueChange(value) {
        this._updateHandle(value);
        this.emit('change', value);

        if (this._binding) {
            this._binding.setValue(value);
        }
    }

    // Calculates the distance in pixels between
    // the cursor x and the middle of the handle.
    // If the cursor is not on the handle sets the offset to 0
    _calculateCursorHandleOffset(pageX) {
        // not sure why but the left side needs a margin of a couple of pixels
        // to properly determine if the cursor is on the handle (in Chrome)
        const margin = IS_CHROME ? 2 : 0;
        const rect = this._domHandle.getBoundingClientRect();
        const left = rect.left - margin;
        const right = rect.right;
        if (pageX >= left && pageX <= right) {
            this._cursorHandleOffset = pageX - (left + (right - left) / 2);
        } else {
            this._cursorHandleOffset = 0;
        }

        return this._cursorHandleOffset;
    }

    _onSlideStart(pageX) {
        this._domHandle.focus();
        if (this._touchId === null) {
            window.addEventListener('mousemove', this._domMouseMove);
            window.addEventListener('mouseup', this._domMouseUp);
        } else {
            window.addEventListener('touchmove', this._domTouchMove);
            window.addEventListener('touchend', this._domTouchEnd);
        }

        this.class.add(CLASS_SLIDER_ACTIVE);

        // calculate the cursor - handle offset. If there is
        // an offset that means the cursor is on the handle so
        // do not move the handle until the cursor moves.
        if (!this._calculateCursorHandleOffset(pageX)) {
            this._onSlideMove(pageX);
        }

        if (this.binding) {
            this._historyCombine = this.binding.historyCombine;
            this._historyPostfix = this.binding.historyPostfix;

            this.binding.historyCombine = true;
            this.binding.historyPostfix = `(${Date.now()})`;
        }
    }

    _onSlideMove(pageX) {
        const rect = this._domBar.getBoundingClientRect();
        // reduce pageX by the initial cursor - handle offset
        pageX -= this._cursorHandleOffset;
        const x = Math.max(0, Math.min(1, (pageX - rect.left) / rect.width));

        const range = this._sliderMax - this._sliderMin;
        let value = (x * range) + this._sliderMin;
        value = parseFloat(value.toFixed(this.precision));

        this.value = value;
    }

    _onSlideEnd(pageX) {
        // when slide ends only move the handle if the cursor is no longer
        // on the handle
        if (!this._calculateCursorHandleOffset(pageX)) {
            this._onSlideMove(pageX);
        }

        this.class.remove(CLASS_SLIDER_ACTIVE);

        if (this._touchId === null) {
            window.removeEventListener('mousemove', this._domMouseMove);
            window.removeEventListener('mouseup', this._domMouseUp);
        } else {
            window.removeEventListener('touchmove', this._domTouchMove);
            window.removeEventListener('touchend', this._domTouchEnd);
        }

        if (this.binding) {
            this.binding.historyCombine = this._historyCombine;
            this.binding.historyPostfix = this._historyPostfix;

            this._historyCombine = false;
            this._historyPostfix = null;
        }

    }

    focus() {
        this._numericInput.focus();
    }

    blur() {
        this._domHandle.blur();
        this._numericInput.blur();
    }

    destroy() {
        if (this._destroyed) return;
        this._domSlider.removeEventListener('mousedown', this._domMouseDown);
        this._domSlider.removeEventListener('touchstart', this._domTouchStart);

        this._domHandle.removeEventListener('keydown', this._domKeyDown);

        this.dom.removeEventListener('mouseup', this._domMouseUp);
        this.dom.removeEventListener('mousemove', this._domMouseMove);
        this.dom.removeEventListener('touchmove', this._domTouchMove);
        this.dom.removeEventListener('touchend', this._domTouchEnd);
        super.destroy();
    }

    set sliderMin(value) {
        if (this._sliderMin === value) return;

        this._sliderMin = value;
        this._updateHandle(this.value);
    }

    get sliderMin() {
        return this._sliderMin;
    }

    set sliderMax(value) {
        if (this._sliderMax === value) return;

        this._sliderMax = value;
        this._updateHandle(this.value);
    }

    get sliderMax() {
        return this._sliderMax;
    }

    set value(value) {
        this._numericInput.value = value;
        if (this._numericInput.class.contains(pcuiClass.MULTIPLE_VALUES)) {
            this.class.add(pcuiClass.MULTIPLE_VALUES);
        } else {
            this.class.remove(pcuiClass.MULTIPLE_VALUES);
        }
    }

    get value() {
        return this._numericInput.value;
    }

    /* eslint accessor-pairs: 0 */
    set values(values) {
        this._numericInput.values = values;
        if (this._numericInput.class.contains(pcuiClass.MULTIPLE_VALUES)) {
            this.class.add(pcuiClass.MULTIPLE_VALUES);
        } else {
            this.class.remove(pcuiClass.MULTIPLE_VALUES);
        }
    }
}

utils.proxy(SliderInput, '_numericInput', PROXY_FIELDS);

Element.register('slider', SliderInput, { renderChanges: true });

export default SliderInput;
