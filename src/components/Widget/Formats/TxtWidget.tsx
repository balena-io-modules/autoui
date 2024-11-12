import * as React from 'react';
import get from 'lodash/get';
import invokeMap from 'lodash/invokeMap';
import isArray from 'lodash/isArray';
import type { UiSchema, Value } from '../utils';
import { UiOption, JsonTypes, widgetFactory, formatTimestamp } from '../utils';
import { Truncate, Material } from '@balena/ui-shared-components';
const { Typography } = Material;

const getArrayValue = (value: Value[], uiSchema?: UiSchema): string | null => {
	// Trim array if the 'truncate' option was provided,
	// then comma-join the items into a single string.
	const maxItems = get(uiSchema, ['ui:options', 'truncate'], value.length);
	if (typeof maxItems !== 'number') {
		return '';
	}
	let arrayString = invokeMap(value.slice(0, maxItems), 'toString').join(', ');
	if (maxItems && maxItems < value.length) {
		arrayString += ` and ${value.length - maxItems} more...`;
	}
	return arrayString;
};

const DATE_TIME_FORMATS = ['date-time', 'date', 'time'];

const TxtWidget = widgetFactory(
	'Txt',
	{
		dtFormat: UiOption.string,
		align: {
			...UiOption.string,
			enum: ['inherit', 'left', 'center', 'right', 'justify'],
		},
		gutterBottom: UiOption.bolean,
		noWrap: UiOption.boolean,
		paragraph: UiOption.boolean,
		sx: UiOption.object,
		variant: UiOption.string,
	},
	[
		JsonTypes.string,
		JsonTypes.null,
		JsonTypes.integer,
		JsonTypes.number,
		JsonTypes.boolean,
		JsonTypes.array,
	],
)(({ value, schema, uiSchema, ...props }) => {
	let displayValue = isArray(value)
		? getArrayValue(value as Array<Exclude<typeof value, any[]>>, uiSchema)
		: value?.toString();
	if (DATE_TIME_FORMATS.includes(schema?.format ?? '')) {
		displayValue =
			displayValue != null ? formatTimestamp(displayValue, uiSchema) : '';
	}
	const lineCamp = get(uiSchema, ['ui:options', 'lineCamp']);
	return typeof lineCamp === 'number' ? (
		<Truncate {...props} lineCamp={lineCamp}>
			{displayValue ?? ''}
		</Truncate>
	) : (
		<Typography {...props}>{displayValue ?? ''}</Typography>
	);
});

export default TxtWidget;
