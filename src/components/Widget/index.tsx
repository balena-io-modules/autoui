import React from 'react';
import castArray from 'lodash/castArray';
import {
	getSchemaFormat,
	getSubSchemaFromRefScheme,
} from '../../AutoUI/schemaOps';
import type { Format, UiSchema, Value, WidgetProps } from './utils';
import { JsonTypes } from './utils';
import { typeWidgets } from './Formats';
import type { JSONSchema7 as JSONSchema } from 'json-schema';

const getValue = (value?: Value, schema?: JSONSchema, uiSchema?: UiSchema) => {
	const calculatedValue = uiSchema?.['ui:value'];
	// Fall back to schema's default value if value is undefined
	return calculatedValue !== undefined
		? calculatedValue
		: value !== undefined
			? value
			: schema?.default;
};

const getType = (value?: Value) => {
	if (value === undefined) {
		return 'default';
	}
	if (value === null) {
		return 'null';
	}
	return Array.isArray(value) ? 'array' : typeof value;
};

const getWidget = (
	value?: Value,
	format?: string,
	uiSchemaWidget?: UiSchema['ui:widget'],
	extraFormats?: Format[],
) => {
	const valueType = getType(value);

	const extraFormat = extraFormats?.find(
		(exf) =>
			(exf.name === format || exf.name === uiSchemaWidget) &&
			exf.widget?.supportedTypes?.includes(valueType),
	);

	return extraFormat?.widget ?? typeWidgets[valueType] ?? typeWidgets.default;
};

export const Widget = ({
	value,
	extraContext,
	schema = {},
	extraFormats,
	uiSchema,
}: WidgetProps) => {
	const format = getSchemaFormat(schema);
	if (!format) {
		return <>{value}</>;
	}

	const processedValue = getValue(value, schema, uiSchema);
	const subSchema = getSubSchemaFromRefScheme(schema);
	const types = subSchema?.type != null ? castArray(subSchema.type) : [];

	if (processedValue == null && !types.includes(JsonTypes.null)) {
		return null;
	}

	const WidgetComponent = getWidget(
		processedValue,
		format,
		undefined,
		extraFormats,
	);

	return (
		<WidgetComponent
			extraContext={extraContext}
			extraFormats={extraFormats}
			value={processedValue ?? null}
			schema={schema}
		/>
	);
};
