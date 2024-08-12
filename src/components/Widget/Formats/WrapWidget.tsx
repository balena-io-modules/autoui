import React from 'react';
import { JsonTypes, widgetFactory } from '../utils';
import { Material } from '@balena/ui-shared-components';
const { Typography } = Material;

export const WrapWidget = widgetFactory('Wrap', {}, [JsonTypes.string])(({
	value,
}) => {
	return (
		<Typography sx={{ maxWidth: '475px', whitespace: 'normal' }}>
			{value}
		</Typography>
	);
});
