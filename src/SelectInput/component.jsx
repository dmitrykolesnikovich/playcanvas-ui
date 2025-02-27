import Element from './index';
import BaseComponent from '../BaseComponent/index.jsx';

class SelectInput extends BaseComponent {
    constructor(props) {
        super(props);
        this.elementClass = Element;
    }

    render() {
        return super.render();
    }
}

SelectInput.propTypes = {};
SelectInput.ctor = Element;
SelectInput.defaultProps = {
    options: [
        {
            v: 'Foo',
            t: 'Foo'
        },
        {
            v: 'Bar',
            t: 'Bar'
        }
    ]
};

export default SelectInput;
