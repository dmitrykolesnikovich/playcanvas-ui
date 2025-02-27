import Label from '../Label';
import Container from '../Container';
import TextInput from '../TextInput';
import * as pcuiClass from '../class';

const CLASS_ROOT = 'pcui-treeview-item';
const CLASS_ICON = CLASS_ROOT + '-icon';
const CLASS_TEXT = CLASS_ROOT + '-text';
const CLASS_SELECTED = CLASS_ROOT + '-selected';
const CLASS_OPEN = CLASS_ROOT + '-open';
const CLASS_CONTENTS = CLASS_ROOT + '-contents';
const CLASS_EMPTY = CLASS_ROOT + '-empty';
const CLASS_RENAME = CLASS_ROOT + '-rename';

/**
 * @event
 * @name TreeViewItem#select
 * @description Fired when we select the TreeViewItem.
 * @param {TreeViewItem} item - The item
 */

/**
 * @event
 * @name TreeViewItem#deselect
 * @description Fired when we deselect the TreeViewItem.
 * @param {TreeViewItem} item - The item
 */

/**
 * @event
 * @name TreeViewItem#open
 * @description Fired when we open a TreeViewItem
 * @param {TreeViewItem} item - The item
 */

/**
 * @event
 * @name TreeViewItem#close
 * @description Fired when we close the TreeViewItem.
 * @param {TreeViewItem} item - The item
 */

/**
 * @name TreeViewItem
 * @class
 * @classdesc Represents a Tree View Item to be added to a pcui.TreeView.
 * @mixes IFocusable
 * @property {boolean} selected Whether the item is selected.
 * @property {boolean} allowSelect=true Whether the item can be selected.
 * @property {boolean} open Whether the item is open meaning showing its children.
 * @property {boolean} parentsOpen Whether the parents of the item are open or closed.
 * @property {boolean} allowDrag=true Whether this tree item can be dragged. Only considered if the parent treeview has allowDrag true.
 * @property {boolean} allowDrop=true Whether dropping is allowed on the tree item.
 * @property {string} text The text shown by the TreeViewItem.
 * @property {string} icon The icon shown before the text in the TreeViewItem.
 * @property {number} The number of direct children.
 * @property {Label} textLabel Gets the internal label that shows the text.
 * @property {Label} iconLabel Gets the internal label that shows the icon.
 * @property {TreeView} treeView Gets / sets the parent TreeView.
 * @property {TreeViewItem} firstChild Gets the first child item.
 * @property {TreeViewItem} lastChild Gets the last child item.
 * @property {TreeViewItem} nextSibling Gets the first sibling item.
 * @property {TreeViewItem} previousSibling Gets the last sibling item.
 */
class TreeViewItem extends Container {
    /**
     * Creates a new TreeViewItem.
     *
     * @param {object} [args] - The arguments.
     */
    constructor(args) {
        if (!args) {
            args = {};
        }

        args.flex = true;

        super(args);

        this.class.add(CLASS_ROOT, CLASS_EMPTY);

        this._containerContents = new Container({
            class: CLASS_CONTENTS,
            flex: true,
            flexDirection: 'row',
            tabIndex: 0
        });
        this.append(this._containerContents);

        this._containerContents.dom.draggable = true;

        this._labelIcon = new Label({
            class: CLASS_ICON
        });
        this._containerContents.append(this._labelIcon);

        this.icon = args.icon || 'E360';

        this._labelText = new Label({
            class: CLASS_TEXT
        });
        this._containerContents.append(this._labelText);

        this.allowSelect = (args.allowSelect !== undefined ? args.allowSelect : true);
        this.allowDrop = (args.allowDrop !== undefined ? args.allowDrop : true);
        this.allowDrag = (args.allowDrag !== undefined ? args.allowDrag : true);
        if (args.text) {
            this.text = args.text;
        }

        if (args.selected) {
            this.selected = args.selected;
        }

        this._numChildren = 0;

        // used the the parent treeview
        this._treeOrder = -1;

        this._domEvtFocus = this._onContentFocus.bind(this);
        this._domEvtBlur = this._onContentBlur.bind(this);
        this._domEvtKeyDown = this._onContentKeyDown.bind(this);
        this._domEvtDragStart = this._onContentDragStart.bind(this);
        this._domEvtMouseDown = this._onContentMouseDown.bind(this);
        this._domEvtMouseUp = this._onContentMouseUp.bind(this);
        this._domEvtMouseOver = this._onContentMouseOver.bind(this);
        this._domEvtClick = this._onContentClick.bind(this);
        this._domEvtDblClick = this._onContentDblClick.bind(this);
        this._domEvtContextMenu = this._onContentContextMenu.bind(this);

        this._containerContents.dom.addEventListener('focus', this._domEvtFocus);
        this._containerContents.dom.addEventListener('blur', this._domEvtBlur);
        this._containerContents.dom.addEventListener('keydown', this._domEvtKeyDown);
        this._containerContents.dom.addEventListener('dragstart', this._domEvtDragStart);
        this._containerContents.dom.addEventListener('mousedown', this._domEvtMouseDown);
        this._containerContents.dom.addEventListener('mouseover', this._domEvtMouseOver);
        this._containerContents.dom.addEventListener('click', this._domEvtClick);
        this._containerContents.dom.addEventListener('dblclick', this._domEvtDblClick);
        this._containerContents.dom.addEventListener('contextmenu', this._domEvtContextMenu);
    }

    _onAppendChild(element) {
        super._onAppendChild(element);

        if (!(element instanceof TreeViewItem)) return;

        this._numChildren++;
        if (this._parent !== this._treeView) this.classRemove(CLASS_EMPTY);

        if (this._treeView) {
            this._treeView._onAppendTreeViewItem(element);
        }
    }

    _onRemoveChild(element) {
        if (element instanceof TreeViewItem) {
            this._numChildren--;
            if (this._numChildren === 0) {
                this.classAdd(CLASS_EMPTY);
            }

            if (this._treeView) {
                this._treeView._onRemoveTreeViewItem(element);
            }
        }

        super._onRemoveChild(element);
    }

    _onContentKeyDown(evt) {
        if (evt.target.tagName.toLowerCase() === 'input') return;

        if (!this.allowSelect) return;

        if (this._treeView) {
            this._treeView._onChildKeyDown(evt, this);
        }
    }

    _onContentMouseDown(evt) {
        if (!this._treeView || !this._treeView.allowDrag || !this._allowDrag) return;

        this._treeView._updateModifierKeys(evt);
        evt.stopPropagation();
    }

    _onContentMouseUp(evt) {
        evt.stopPropagation();
        evt.preventDefault();

        window.removeEventListener('mouseup', this._domEvtMouseUp);
        if (this._treeView) {
            this._treeView._onChildDragEnd(evt, this);
        }
    }

    _onContentMouseOver(evt) {
        evt.stopPropagation();

        if (this._treeView) {
            this._treeView._onChildDragOver(evt, this);
        }

        // allow hover event
        super._onMouseOver(evt);
    }

    _onContentDragStart(evt) {
        evt.stopPropagation();
        evt.preventDefault();

        if (!this._treeView || !this._treeView.allowDrag) return;

        if (this.class.contains(CLASS_RENAME)) return;

        this._treeView._onChildDragStart(evt, this);

        window.addEventListener('mouseup', this._domEvtMouseUp);
    }

    _onContentClick(evt) {
        if (!this.allowSelect || evt.button !== 0) return;
        if (evt.target.tagName.toLowerCase() === 'input') return;

        evt.stopPropagation();

        const rect = this._containerContents.dom.getBoundingClientRect();
        if (this._numChildren > 0 && evt.clientX - rect.left < 0) {
            this.open = !this.open;
            if (evt.altKey) {
                // apply to all children as well
                this._dfs((node) => {
                    node.open = this.open;
                });
            }
            this.focus();
        } else if (this._treeView) {
            this._treeView._onChildClick(evt, this);
        }
    }

    _dfs(fn) {
        fn(this);
        let child = this.firstChild;
        while (child) {
            child._dfs(fn);
            child = child.nextSibling;
        }
    }

    _onContentDblClick(evt) {
        if (!this._treeView || !this._treeView.allowRenaming || evt.button !== 0) return;
        if (evt.target.tagName.toLowerCase() === 'input') return;

        evt.stopPropagation();
        const rect = this._containerContents.dom.getBoundingClientRect();
        if (this.numChildren && evt.clientX - rect.left < 0) {
            return;
        }

        if (this.allowSelect) {
            this._treeView.deselect();
            this._treeView._onChildClick(evt, this);
        }

        this.rename();
    }

    _onContentContextMenu(evt) {
        if (this._treeView && this._treeView._onContextMenu) {
            this._treeView._onContextMenu(evt, this);
        }
    }

    _onContentFocus(evt) {
        this.emit('focus');
    }

    _onContentBlur(evt) {
        this.emit('blur');
    }

    rename() {
        this.classAdd(CLASS_RENAME);

        // show text input to enter new text
        const textInput = new TextInput({
            renderChanges: false,
            value: this.text,
            class: pcuiClass.FONT_REGULAR
        });

        textInput.on('blur', () => {
            textInput.destroy();
        });

        textInput.on('destroy', () => {
            this.classRemove(CLASS_RENAME);
            this.focus();
        });

        textInput.on('change', (value) => {
            value = value.trim();
            if (value) {
                this.text = value;
                textInput.destroy();
            }
        });

        textInput.on('disable', () => {
            // make sure text input is editable even if this
            // tree item is disabled
            textInput.input.removeAttribute('readonly');
        });

        this._containerContents.append(textInput);

        textInput.focus(true);
    }

    focus() {
        this._containerContents.dom.focus();
    }

    blur() {
        this._containerContents.dom.blur();
    }

    destroy() {
        if (this._destroyed) return;

        this._containerContents.dom.removeEventListener('focus', this._domEvtFocus);
        this._containerContents.dom.removeEventListener('blur', this._domEvtBlur);
        this._containerContents.dom.removeEventListener('keydown', this._domEvtKeyDown);
        this._containerContents.dom.removeEventListener('mousedown', this._domEvtMouseDown);
        this._containerContents.dom.removeEventListener('dragstart', this._domEvtDragStart);
        this._containerContents.dom.removeEventListener('mouseover', this._domEvtMouseOver);
        this._containerContents.dom.removeEventListener('click', this._domEvtClick);
        this._containerContents.dom.removeEventListener('dblclick', this._domEvtDblClick);
        this._containerContents.dom.removeEventListener('contextmenu', this._domEvtContextMenu);

        window.removeEventListener('mouseup', this._domEvtMouseUp);

        super.destroy();
    }

    set selected(value) {
        if (value === this.selected) {
            if (value) {
                this.focus();
            }

            return;
        }

        if (value) {
            this._containerContents.classAdd(CLASS_SELECTED);
            this.emit('select', this);
            if (this._treeView) {
                this._treeView._onChildSelected(this);
            }

            this.focus();
        } else {
            this._containerContents.classRemove(CLASS_SELECTED);
            this.blur();
            this.emit('deselect', this);
            if (this._treeView) {
                this._treeView._onChildDeselected(this);
            }
        }
    }

    get selected() {
        return this._containerContents.class.contains(CLASS_SELECTED);
    }

    set text(value) {
        if (this._labelText.value !== value) {
            this._labelText.value = value;
            if (this._treeView) {
                this._treeView._onChildRename(this, value);
            }
        }
    }

    get text() {
        return this._labelText.value;
    }

    get textLabel() {
        return this._labelText;
    }

    get iconLabel() {
        return this._labelIcon;
    }

    set open(value) {
        if (this.open === value) return;
        if (value) {
            if (!this.numChildren) return;

            this.classAdd(CLASS_OPEN);
            this.emit('open', this);
        } else {
            this.classRemove(CLASS_OPEN);
            this.emit('close', this);
        }
    }

    get open() {
        return this.class.contains(CLASS_OPEN) || this.parent === this._treeView;
    }

    set parentsOpen(value) {
        let parent = this.parent;
        while (parent && parent instanceof TreeViewItem) {
            parent.open = value;
            parent = parent.parent;
        }
    }

    get parentsOpen() {
        let parent = this.parent;
        while (parent && parent instanceof TreeViewItem) {
            if (!parent.open) return false;
            parent = parent.parent;
        }

        return true;
    }

    set allowDrop(value) {
        this._allowDrop = value;
    }

    get allowDrop() {
        return this._allowDrop;
    }

    set allowDrag(value) {
        this._allowDrag = value;
    }

    get allowDrag() {
        return this._allowDrag;
    }

    set allowSelect(value) {
        this._allowSelect = value;
    }

    get allowSelect() {
        return this._allowSelect;
    }

    set treeView(value) {
        this._treeView = value;
    }

    get treeView() {
        return this._treeView;
    }

    get numChildren() {
        return this._numChildren;
    }

    get firstChild() {
        if (this._numChildren) {
            for (let i = 0; i < this.dom.childNodes.length; i++) {
                if (this.dom.childNodes[i].ui instanceof TreeViewItem) {
                    return this.dom.childNodes[i].ui;
                }
            }
        }

        return null;
    }

    get lastChild() {
        if (this._numChildren) {
            for (let i = this.dom.childNodes.length - 1; i >= 0; i--) {
                if (this.dom.childNodes[i].ui instanceof TreeViewItem) {
                    return this.dom.childNodes[i].ui;
                }
            }
        }

        return null;
    }

    get nextSibling() {
        let sibling = this.dom.nextSibling;
        while (sibling && !(sibling.ui instanceof TreeViewItem)) {
            sibling = sibling.nextSibling;
        }

        return sibling && sibling.ui;
    }

    get previousSibling() {
        let sibling = this.dom.previousSibling;
        while (sibling && !(sibling.ui instanceof TreeViewItem)) {
            sibling = sibling.previousSibling;
        }

        return sibling && sibling.ui;
    }

    set icon(value) {
        if (this._icon === value || !value.match(/^E[0-9]{0,4}$/)) return;
        this._icon = value;
        if (value) {
            // set data-icon attribute but first convert the value to a code point
            this._labelIcon.dom.setAttribute('data-icon', String.fromCodePoint(parseInt(value, 16)));
        } else {
            this._labelIcon.dom.removeAttribute('data-icon');
        }
    }

    get icon() {
        return this._icon;
    }
}

export default TreeViewItem;
