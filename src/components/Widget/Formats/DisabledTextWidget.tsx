import React from 'react';
import { useTranslation } from '../../../hooks/useTranslation';
import { JsonTypes, widgetFactory } from '../utils';
import { Material } from '@balena/ui-shared-components';
const { Typography } = Material;

export const DisabledTextWidget = widgetFactory('DisabledText', {}, [
	JsonTypes.string,
	JsonTypes.number,
	JsonTypes.null,
])(({ value }) => {
	const { t } = useTranslation();
	const val =
		value != null && typeof value !== 'string' ? value.toString() : value;
	return (
		<Typography color="text.secondary" noWrap>
			{val ?? t('info.not_defined')}
		</Typography>
	);
});
