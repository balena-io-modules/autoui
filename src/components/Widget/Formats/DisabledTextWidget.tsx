import React from 'react';
import { useTranslation } from '../../../hooks/useTranslation';
import { JsonTypes, widgetFactory } from '../utils';
import { Material } from '@balena/ui-shared-components';
const { Typography, Tooltip } = Material;

export const DisabledTextWidget = widgetFactory('DisabledText', {}, [
	JsonTypes.string,
	JsonTypes.number,
	JsonTypes.null,
])(({ value }) => {
	const { t } = useTranslation();
	const val =
		value != null && typeof value !== 'string' ? value.toString() : value;
	return (
		<Tooltip title={val}>
			<Typography display="block" color="text.secondary" maxWidth={300} noWrap>
				{val ?? t('info.not_defined')}
			</Typography>
		</Tooltip>
	);
});
