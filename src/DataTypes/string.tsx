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
	// When parsing query parameters on page reload using 'qs', we need to ensure that string properties remain strings.
	// For example, a string like "16.7" might be automatically converted to a number (16.7).
	// This conversion can cause issues with functions like 'regexEscape', which expect string inputs.
	// https://github.com/balena-io-modules/autoui/blob/a39cfc07a943bcc5160d40f143bf7b5215a9bdd6/src/AutoUI/Filters/PersistentFilters.tsx#L96
	const stringValue = String(value);
	if (operator === 'is') {
		return {
			type: 'object',
			properties: {
				[field]: {
					type: 'string',
					const: stringValue,
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
						const: stringValue,
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
						pattern: regexEscape(stringValue),
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
							pattern: regexEscape(stringValue),
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
					pattern: stringValue,
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
						pattern: stringValue,
					},
				},
			},
		};
	}

	return {};
};

export const rendererSchema = (
	schemaField: JSONSchema,
	index: number,
	schema: JSONSchema,
) => {
	const valueSchema: JSONSchema = {
		type: 'string',
		title: 'Value',
		description: '',
		examples: schema.examples,
	};
	return getDataTypeSchema(schemaField, index, operators(), valueSchema);
};
