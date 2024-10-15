import isEqual from 'lodash/isEqual';
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

const notNullObj = { not: { const: null } };
const isNotNullObj = (value: unknown): boolean => isEqual(value, notNullObj);

const getFilter = (index: number, enums: JSONSchema['enum']) => {
	if (!enums) {
		return null;
	}
	const enumValue = enums[index];
	if (typeof enumValue === 'string') {
		return {
			type: 'string',
			regexp: {
				pattern: regexEscape(enumValue),
				flags: 'i',
			},
		};
	}
	if (typeof enumValue === 'object') {
		return isNotNullObj(enumValue)
			? enumValue
			: {
					const: enumValue,
			  };
	}
	return null;
};

const getValues = (
	value: string,
	propertySchema?: JSONSchema & { enumNames?: string[] },
) => {
	if (!propertySchema?.enum || !propertySchema.enumNames) {
		return null;
	}
	const enums = propertySchema.enum;
	const enumNamesIncludingValueIndexes: number[] = [];
	const lowerCaseValue = value.toLowerCase();
	propertySchema.enumNames.forEach((enumName, index) => {
		if (enumName.toLowerCase().includes(lowerCaseValue)) {
			enumNamesIncludingValueIndexes.push(index);
		}
	});

	const values = enums
		? enumNamesIncludingValueIndexes.map((i) => getFilter(i, enums))
		: [];
	return values.length > 1
		? {
				anyOf: values,
		  }
		: values[0] || null;
};

export const createFilter: CreateFilter<OperatorSlug> = (
	field,
	operator,
	value,
	propertySchema,
) => {
	if (operator === FULL_TEXT_SLUG && propertySchema?.enumNames) {
		const filter = getValues(value, propertySchema);
		if (!filter) {
			return {};
		}
		return {
			type: 'object',
			properties: {
				[field]: filter,
			},
			required: [field],
		};
	}

	if (operator === FULL_TEXT_SLUG && typeof value === 'string') {
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

	if (operator === 'is') {
		return {
			type: 'object',
			properties: {
				[field]: isNotNullObj(value)
					? value
					: {
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
				[field]: isNotNullObj(value)
					? { const: null }
					: {
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
