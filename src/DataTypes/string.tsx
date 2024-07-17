import { CreateFilter, getDataTypeSchema, regexEscape } from './utils';
import { FULL_TEXT_SLUG } from '../components/Filters/SchemaSieve';
import { JSONSchema7 as JSONSchema } from 'json-schema';

// TODO: we should make it an object as soon as we will be able to remove custom Tags logic in DataTypes/object.tsx.
export const operators = () => ({
	contains: 'contains',
	not_contains: 'does not contain',
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
	if (operator === 'is') {
		return {
			type: 'object',
			properties: {
				[field]: {
					type: 'string',
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
					type: 'string',
					not: {
						const: value,
					},
				},
			},
			required: [field],
		};
	}

	if (operator === 'contains' || operator === FULL_TEXT_SLUG) {
		return {
			type: 'object',
			properties: {
				[field]: {
					type: 'string',
					regexp: {
						pattern: regexEscape(value),
						flags: 'i',
					},
				},
			},
			required: [field],
		};
	}

	if (operator === 'not_contains') {
		return {
			type: 'object',
			properties: {
				[field]: {
					not: {
						type: 'string',
						regexp: {
							pattern: regexEscape(value),
							flags: 'i',
						},
					},
				},
			},
		};
	}

	return {};
};

export const rendererSchema = (schemaField: JSONSchema, schema: JSONSchema) => {
	const valueSchema: JSONSchema = {
		type: 'string',
		title: 'Value',
		examples: schema.examples,
	};
	return getDataTypeSchema(schemaField, operators(), valueSchema);
};
