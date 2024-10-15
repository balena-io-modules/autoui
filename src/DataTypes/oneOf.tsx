import { isJSONSchema } from '../AutoUI/schemaOps';
import { FULL_TEXT_SLUG } from '../components/Filters/SchemaSieve';
import { CreateFilter, getDataTypeSchema } from './utils';
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
	propertySchema,
) => {
	if (operator === FULL_TEXT_SLUG) {
		const constValues =
			propertySchema?.oneOf
				?.filter(
					(o) =>
						isJSONSchema(o) &&
						o.title?.toLowerCase().includes(value.toLowerCase()),
				)
				.map((v: JSONSchema) => ({ const: v.const })) || null;

		if (!constValues?.length) {
			return {};
		}

		return {
			type: 'object',
			properties: {
				[field]:
					constValues.length > 1 ? { anyOf: constValues } : constValues[0],
			},
			required: [field],
		};
	}

	if (operator === 'is') {
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
	index: number,
	propertySchema: JSONSchema,
) => {
	const valueSchema: JSONSchema = {
		...propertySchema,
		title: 'Value',
		description: '',
	};
	return getDataTypeSchema(schemaField, index, operators(), valueSchema);
};
