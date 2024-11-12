import type { CreateFilter } from './utils';
import { getDataTypeSchema } from './utils';
import type { JSONSchema7 as JSONSchema } from 'json-schema';

export const operators = () => ({
	is: 'is',
});

export type OperatorSlug = keyof ReturnType<typeof operators> | 'is_not';

export const createFilter: CreateFilter<OperatorSlug> = (
	field,
	operator,
	value,
) => {
	const val =
		typeof value === 'string' ? value.toLowerCase() === 'true' : value;

	if (operator === 'is') {
		return {
			type: 'object',
			properties: {
				[field]: {
					const: val,
				},
			},
			required: [field],
		};
	}
	if (operator === 'is_not') {
		return {
			type: 'object',
			properties: {
				[field]: {
					not: {
						const: val,
					},
				},
			},
			required: [field],
		};
	}
	return {};
};

export const uiSchema = () => ({
	'ui:widget': 'select',
});

export const rendererSchema = (schemaField: JSONSchema, index: number) => {
	const valueSchema: JSONSchema = {
		type: 'boolean',
		title: 'Value',
		description: '',
	};
	return getDataTypeSchema(schemaField, index, operators(), valueSchema);
};
