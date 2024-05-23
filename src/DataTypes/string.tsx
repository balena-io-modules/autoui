import { CreateFilter, getDataTypeSchema, regexEscape } from './utils';
import { FULL_TEXT_SLUG } from '../components/Filters/SchemaSieve';
import { JSONSchema7 as JSONSchema } from 'json-schema';

// TODO: we should make it an object as soon as we will be able to remove custom Tags logic in DataTypes/object.tsx.
export const operators = () => ({
	contains: 'contains',
	not_contains: 'does not contain',
	is: 'is',
	is_not: 'is not',
	matches_re: 'matches RegEx',
	not_matches_re: 'does not match RegEx',
});

export type OperatorSlug =
	| keyof ReturnType<typeof operators>
	| typeof FULL_TEXT_SLUG;

export const createFilter: CreateFilter<OperatorSlug> = (
	field,
	operator,
	value,
) => {
	if (!value && ['is', 'contains', 'matches_re'].includes(operator)) {
		return {
			type: 'object',
			properties: {
				[field]: {
					type: 'string',
					anyOf: [{ const: '' }, { const: null }],
				},
			},
		};
	}

	if (
		!value &&
		['is_not', 'not_contains', 'not_matches_re'].includes(operator)
	) {
		return {
			type: 'object',
			properties: {
				[field]: {
					type: 'string',
					anyOf: [
						{
							not: {
								const: '',
							},
						},
						{
							not: {
								const: null,
							},
						},
					],
				},
			},
		};
	}

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

	if (operator === 'matches_re') {
		return {
			type: 'object',
			properties: {
				[field]: {
					type: 'string',
					pattern: value,
				},
			},
			required: [field],
		};
	}

	if (operator === 'not_matches_re') {
		return {
			type: 'object',
			properties: {
				[field]: {
					type: 'string',
					not: {
						pattern: value,
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
