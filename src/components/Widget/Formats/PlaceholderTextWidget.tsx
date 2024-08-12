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
				truncate
				title={val}
				{...(!value && { color: 'gray.main' })}
			>
				{val}
			</Truncate>
		</Stack>
	);
});
