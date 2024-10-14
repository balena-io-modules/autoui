import React from 'react';
import { JsonTypes, widgetFactory } from '../utils';

export const TemperatureWidget = widgetFactory('Temperature', {}, [
	JsonTypes.number,
])(({ value }) => {
	return <>{value ? `~${value}°C` : '-'}</>;
});
