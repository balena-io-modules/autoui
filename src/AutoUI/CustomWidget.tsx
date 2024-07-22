import React from 'react';
import castArray from 'lodash/castArray';
import { getSchemaFormat, getSubSchemaFromRefScheme } from './schemaOps';
import type { WidgetProps } from 'rendition';
import {
	JsonTypes,
	getRendererWidget,
	getSchemaNormalizedValue,
	transformUiSchema,
} from 'rendition';

interface CustomWidgetProps
	extends Pick<WidgetProps, 'value' | 'extraContext' | 'uiSchema'> {
	schema: NonNullable<WidgetProps['schema']>;
	extraFormats: NonNullable<WidgetProps['extraFormats']>;
}

export const CustomWidget = ({
	value,
	extraContext,
	schema,
	extraFormats,
	uiSchema,
}: CustomWidgetProps) => {
	const format = getSchemaFormat(schema);
	if (!format) {
		return <>{value}</>;
	}
	const processedUiSchema = transformUiSchema({
		value,
		uiSchema,
		extraContext,
	});

	const processedValue = getSchemaNormalizedValue(
		value,
		schema,
		processedUiSchema,
	);
	const subSchema = getSubSchemaFromRefScheme(schema);
	const types = subSchema?.type != null ? castArray(subSchema.type) : [];

	if (processedValue == null && !types.includes(JsonTypes.null)) {
		return null;
	}

	const Widget = getRendererWidget(
		processedValue,
		format,
		undefined,
		extraFormats,
	);

	return (
		<Widget
			extraContext={extraContext}
			extraFormats={extraFormats}
			value={processedValue ?? null}
			schema={schema}
		/>
	);
};
