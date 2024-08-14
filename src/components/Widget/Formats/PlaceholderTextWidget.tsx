import React from 'react';
import { JsonTypes, widgetFactory } from '../utils';
import { Truncate, Material } from '@balena/ui-shared-components';
const { Stack } = Material;

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
		<Stack>
			<Truncate
				sx={{ maxWidth: '300px' }}
				{...(!value && { color: 'gray.main' })}
				lineCamp={1}
			>
				{val}
			</Truncate>
		</Stack>
	);
});
