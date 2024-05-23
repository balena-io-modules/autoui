import { isJson } from '../AutoUI/schemaOps';
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
	const val =
		typeof value === 'object'
			? value
			: isJson(value)
			? JSON.parse(value)
			: { const: value };

	// Ensures that when creating a full_text_search filter,
	// we check the title values within a oneOf array. If a match is found,
	// a filter is created with the corresponding const value.
	// For example:
	// filter => 'tes'
	// oneOf: [{title: 'Test', const: 'const_value'}, {title: 'Another', const: 'const_value_2'}]
	// Resulting filter => 'const_value'
	if (
		operator === FULL_TEXT_SLUG &&
		typeof value === 'string' &&
		propertySchema?.oneOf?.every(
			(o): o is Required<Pick<JSONSchema, 'title' | 'const'>> =>
				typeof o === 'object' &&
				typeof o.title === 'string' &&
				typeof o.const === 'string',
		)
	) {
		const transformedEnum = propertySchema.oneOf
			.filter((o) => o.title.toLowerCase().includes(value.toLowerCase()))
			.map((o) => o.const);

		return transformedEnum.length
			? {
					properties: {
						[field]: {
							enum: transformedEnum,
						},
					},
					required: [field],
			  }
			: {};
	}

	if (operator === 'is') {
		return {
			type: 'object',
			properties: {
				[field]: val,
			},
			required: [field],
		};
	}

	if (operator === 'is_not') {
		return {
			type: 'object',
			properties: {
				[field]: {
					type: 'object',
					not: val,
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
