import { faCheckCircle } from '@fortawesome/free-solid-svg-icons/faCheckCircle';
import { faTimesCircle } from '@fortawesome/free-solid-svg-icons/faTimesCircle';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';
import { JsonTypes, widgetFactory } from '../utils';
import { Material } from '@balena/ui-shared-components';
const { Box, Typography } = Material;

export const BooleanAsIconWidget = widgetFactory('BooleanAsIcon', {}, [
	JsonTypes.boolean,
	JsonTypes.null,
])(({ value }) => {
	const text = value ? 'true' : 'false';
	return (
		<Box alignItems="center" gap={2}>
			<FontAwesomeIcon icon={value ? faCheckCircle : faTimesCircle} />{' '}
			<Typography>{text}</Typography>
		</Box>
	);
});
