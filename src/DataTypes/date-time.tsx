import { CreateFilter, getDataTypeSchema, normalizeDateTime } from './utils';
import { JSONSchema7 as JSONSchema } from 'json-schema';

export const operators = () => ({
	is: 'is',
	is_before: 'is before',
	is_after: 'is after',
});

export type OperatorSlug = keyof ReturnType<typeof operators> | 'is_not';

export const createFilter: CreateFilter<OperatorSlug> = (
	field,
	operator,
	value,
) => {
	const normalizedValue = value === null ? null : normalizeDateTime(value);

	// TODO: Double check that it works and if this can be improved
	const dataType = typeof normalizedValue as 'string' | 'number';

	if (operator === 'is') {
		return {
			type: 'object',
			properties: {
				[field]: {
					type: dataType ?? 'string',
					format: 'date-time',
					const: normalizedValue,
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
					type: dataType ?? 'string',
					format: 'date-time',
					not: {
						const: normalizedValue,
					},
				},
			},
			required: [field],
		};
	}

	if (operator === 'is_before') {
		const rule =
			dataType === 'number'
				? { exclusiveMaximum: normalizedValue as number }
				: { formatMaximum: normalizedValue };
		return {
			type: 'object',
			properties: {
				[field]: {
					type: dataType ?? 'string',
					format: 'date-time',
					...rule,
				},
			},
			required: [field],
		};
	}

	if (operator === 'is_after') {
		const rule =
			dataType === 'number'
				? { exclusiveMinimum: normalizedValue as number }
				: { formatMinimum: normalizedValue };
		return {
			type: 'object',
			properties: {
				[field]: {
					type: dataType ?? 'string',
					format: 'date-time',
					...rule,
				},
			},
			required: [field],
		};
	}

	return {};
};

export const rendererSchema = (schemaField: JSONSchema) => {
	const valueSchema: JSONSchema = {
		type: 'string',
		format: 'date-time',
		title: 'Value',
	};
	return getDataTypeSchema(schemaField, operators(), valueSchema);
};
