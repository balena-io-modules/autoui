import { FULL_TEXT_SLUG } from '../components/Filters/SchemaSieve';
import { CreateFilter, getDataTypeSchema } from './utils';
import { JSONSchema7 as JSONSchema } from 'json-schema';

export const operators = () => ({
	is: 'is',
	is_not: 'is not',
	is_more_than: 'is more than',
	is_less_than: 'is less than',
});

export type OperatorSlug =
	| keyof ReturnType<typeof operators>
	| typeof FULL_TEXT_SLUG;

export const createFilter: CreateFilter<OperatorSlug> = (
	field,
	operator,
	value,
) => {
	const val =
		typeof value === 'number'
			? value
			: value !== '' && value != null
			? Number(value)
			: undefined;

	if (val == null || isNaN(val)) {
		return {};
	}

	if (operator === 'is' || operator === FULL_TEXT_SLUG) {
		return {
			type: 'object',
			properties: {
				[field]: {
					type: 'number',
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
					type: 'number',
					not: {
						const: val,
					},
				},
			},
			required: [field],
		};
	}

	if (operator === 'is_more_than') {
		return {
			type: 'object',
			properties: {
				[field]: {
					type: 'number',
					exclusiveMinimum: val,
				},
			},
			required: [field],
		};
	}

	if (operator === 'is_less_than') {
		return {
			type: 'object',
			properties: {
				[field]: {
					type: 'number',
					exclusiveMaximum: val,
				},
			},
			required: [field],
		};
	}

	return {};
};

export const rendererSchema = (schemaField: JSONSchema) => {
	const valueSchema: JSONSchema = {
		type: 'number',
		title: 'Value',
	};
	return getDataTypeSchema(schemaField, operators(), valueSchema);
};
