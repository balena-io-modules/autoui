import { FULL_TEXT_SLUG } from '../components/Filters/SchemaSieve';
import { CreateFilter, getDataTypeSchema, regexEscape } from './utils';
import { JSONSchema7 as JSONSchema } from 'json-schema';

export const operators = () => ({
	is: 'is',
	is_not: 'is not',
});

export type OperatorSlug =
	| keyof ReturnType<typeof operators>
	| typeof FULL_TEXT_SLUG;

export const createFilter: CreateFilter<OperatorSlug> = (
	field,
	operator,
	value,
) => {
	if (operator === FULL_TEXT_SLUG && typeof value === 'string') {
		return {
			type: 'object',
			properties: {
				[field]: {
					type: 'string',
					// Note: An alternative could be to do: { enum: subSchema.enum.filter(x => x.toLowerCase().includes(value.toLowerCase())) }
					regexp: {
						pattern: regexEscape(value),
						flags: 'i',
					},
				},
			},
			required: [field],
		};
	}

	if (operator === 'is' || operator === FULL_TEXT_SLUG) {
		return {
			type: 'object',
			properties: {
				[field]: {
					const: value,
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
						const: value,
					},
				},
			},
		};
	}

	return {};
};

export const rendererSchema = (
	schemaField: JSONSchema,
	propertySchema: JSONSchema,
) => {
	const valueSchema: JSONSchema = {
		...propertySchema,
		title: 'Value',
	};
	return getDataTypeSchema(schemaField, operators(), valueSchema);
};
