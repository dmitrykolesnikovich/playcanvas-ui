import React from 'react';

import Component from './component';
import { action } from '@storybook/addon-actions';
import { getDocsForClass, getStorybookDocs } from '../../.storybook/utils/docscript'

var name = 'BooleanInput';
var config = {
    title: `Input/${name}`,
    docs: getDocsForClass(name)
};

export default {
    title: config.title,
    component: Component,
    parameters: {
        docs: {
            description: {
                component: config.docs.description
            }
        }
    },
    argTypes: getStorybookDocs(config.docs)
};

export const Main = (args) => <Component onChange={action('toggle')} {...args} />;
