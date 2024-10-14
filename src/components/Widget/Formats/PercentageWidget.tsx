import React from 'react';
import { JsonTypes, widgetFactory } from '../utils';

export const PercentageWidget = widgetFactory('Percentage', {}, [
	JsonTypes.string,
	JsonTypes.number,
])(({ value }) => {
	return <>{value ? `${value}%` : '-'}</>;
});
