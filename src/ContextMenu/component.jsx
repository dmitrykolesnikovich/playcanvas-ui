
import React from 'react';
import Element from './index';
import BaseComponent from '../BaseComponent/index.jsx';

class ContextMenu extends BaseComponent {
    constructor(props) {
        super(props);
        this.elementClass = Element;
    }
    // componentDidMount() {
    //     // console.log(this.props.parent);
    // }
    onDivLoaded = (element) => {
        this.element = new Element({ ...this.props, dom: element });
    }
    render() {
        return <div ref={this.onDivLoaded} />
    }
}

ContextMenu.propTypes = {};
ContextMenu.ctor = Element;
ContextMenu.defaultProps = {};

export default ContextMenu;
