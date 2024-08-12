import React from 'react';
import { JsonTypes, widgetFactory } from '../utils';
import { Material } from '@balena/ui-shared-components';
const { Typography } = Material;

export const PlaceholderTextWidget = widgetFactory('PlaceholderText', {}, [
	JsonTypes.string,
	JsonTypes.number,
	JsonTypes.null,
])(({ value }) => {
	const val =
		value === null || value === ''
			? 'Empty'
			: typeof value !== 'string'
			? value.toString()
			: value;
	return (
		<Typography
			noWrap
			sx={{ maxWidth: '300px' }}
			{...(!value && { color: 'gray.main' })}
		>
			{val}
		</Typography>
	);
});
