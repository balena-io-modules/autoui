import React from 'react';
import map from 'lodash/map';
import get from 'lodash/get';
import { UiOption } from './ui-options';
import { Renderer } from '../Renderer';
import { getArrayItems, JsonTypes, widgetFactory } from '../utils';
import { Material } from '@balena/ui-shared-components';

const { Stack } = Material;

const ArrayWidget = widgetFactory(
	'Array',
	{
		orientation: {
			...UiOption.string,
			enum: ['vertical', 'horizontal'],
		},
		truncate: UiOption.integer,
	},
	[JsonTypes.array],
)(({ value, schema, uiSchema, extraContext, extraFormats, ...rest }) => {
	const items = getArrayItems({
		value,
		schema,
		uiSchema,
		extraContext,
		extraFormats,
	});
	return (
		<Stack
			flexDirection={
				get(uiSchema, ['ui:options', 'orientation']) === 'horizontal'
					? 'row'
					: 'column'
			}
			flexWrap="wrap"
		>
			{map(items, (item, index) => {
				return <Renderer key={index} nested {...item} {...rest} />;
			})}
		</Stack>
	);
});

export default ArrayWidget;
