import React from 'react';
import { useTranslation } from '../../../hooks/useTranslation';
import { JsonTypes, widgetFactory } from '../utils';
import { Truncate } from '@balena/ui-shared-components';

export const DisabledTextWidget = widgetFactory('DisabledText', {}, [
	JsonTypes.string,
	JsonTypes.number,
	JsonTypes.null,
])(({ value }) => {
	const { t } = useTranslation();
	const val =
		value != null && typeof value !== 'string' ? value.toString() : value;
	return (
		//TODO: check which color do we use for disabled text
		<Truncate sx={{ maxWidth: '350px' }} color="#b3b6b9" lineCamp={1}>
			{val ?? t('info.not_defined')}
		</Truncate>
	);
});
