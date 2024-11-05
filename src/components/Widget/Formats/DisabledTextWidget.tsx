import React from 'react';
import { useTranslation } from '../../../hooks/useTranslation';
import { JsonTypes, widgetFactory } from '../utils';
import { Tooltip, Truncate } from '@balena/ui-shared-components';

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
			<Truncate color="text.secondary" lineCamp={1} maxWidth={300}>
				{val ?? t('info.not_defined')}
			</Truncate>
		</Tooltip>
	);
});
