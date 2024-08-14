import * as React from 'react';
import get from 'lodash/get';
import {
	JsonTypes,
	widgetFactory,
	WidgetProps,
	getObjectPropertyNames,
} from '../utils';
import { Renderer } from '../Renderer';
import { isJSONSchema } from '../../../AutoUI/schemaOps';

const ObjectWidget = widgetFactory('Object', undefined, [JsonTypes.object])(({
	value,
	schema,
	uiSchema,
	...rest
}) => {
	const propertyNames = getObjectPropertyNames({ value, schema, uiSchema });
	return (
		<React.Fragment>
			{propertyNames.map((key: string) => {
				const schemaKey = get(schema, ['properties', key]);
				if (!isJSONSchema(schemaKey)) {
					return null;
				}
				const subProps: WidgetProps = {
					value: get(value, key) ?? null,
					schema: schemaKey,
					uiSchema: get(uiSchema, key),
				};
				return (
					<Renderer key={key} nested valueKey={key} {...subProps} {...rest} />
				);
			})}
		</React.Fragment>
	);
});

export default ObjectWidget;
