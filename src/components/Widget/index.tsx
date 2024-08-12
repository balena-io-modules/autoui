import React from 'react';
import castArray from 'lodash/castArray';
import {
	getSchemaFormat,
	getSubSchemaFromRefScheme,
} from '../../AutoUI/schemaOps';
// import {
// 	JsonTypes,
// 	WidgetProps,
// 	getRendererWidget,
// 	getSchemaNormalizedValue,
// 	transformUiSchema,
// } from 'rendition';

import {
	getSchemaNormalizedValue,
	getWidget,
	JsonTypes,
	transformUiSchema,
	WidgetProps,
} from './utils';

// interface WidgetProps
// 	extends Pick<WidgetProps<object>, 'value' | 'extraContext' | 'uiSchema'> {
// 	schema: NonNullable<WidgetProps['schema']>;
// 	extraFormats: NonNullable<WidgetProps['extraFormats']>;
// }

export const Widget = ({
	value,
	extraContext,
	schema,
	extraFormats,
	uiSchema,
}: WidgetProps) => {
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

	const Widget = getWidget(processedValue, format, undefined, extraFormats);

	return (
		<Widget
			extraContext={extraContext}
			extraFormats={extraFormats}
			value={processedValue ?? null}
			schema={schema}
		/>
	);
};
