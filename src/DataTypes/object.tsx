import type { JSONSchema7 as JSONSchema } from 'json-schema';
import find from 'lodash/find';
import {
	CreateFilter,
	KeysOfUnion,
	getDataTypeSchema,
	regexEscape,
} from './utils';
import {
	FULL_TEXT_SLUG,
	createModelFilter,
	FormData,
} from '../components/Filters/SchemaSieve';
import { isJSONSchema, getRefSchema } from '../AutoUI/schemaOps';
import findKey from 'lodash/findKey';
import pick from 'lodash/pick';
import mapValues from 'lodash/mapValues';

const getKeyLabel = (schema: JSONSchema) => {
	const s = find(schema.properties!, { description: 'key' })! as JSONSchema;
	return s && s.title ? s.title : 'key';
};

const getValueLabel = (schema: JSONSchema) => {
	const s = find(schema.properties!, { description: 'value' })! as JSONSchema;
	return s && s.title ? s.title : 'value';
};

export const isKeyValueObj = (schema: JSONSchema) =>
	!!find(schema.properties!, { description: 'key' }) ||
	!!find(schema.properties!, { description: 'value' });

export const operators = (s: JSONSchema) => {
	return {
		is: 'is',
		is_not: 'is not',
		...(!isKeyValueObj(s)
			? {
					contains: 'contains',
					not_contains: 'does not contain',
				}
			: (() => {
					const keyLabel = getKeyLabel(s);
					const valueLabel = getValueLabel(s);
					return {
						key_contains: `${keyLabel} contains`,
						key_not_contains: `${keyLabel} does not contain`,
						key_is: `${keyLabel} is`,
						key_starts_with: `${keyLabel} starts with`,
						key_ends_with: `${keyLabel} ends with`,
						key_not_starts_with: `${keyLabel} does not starts with`,
						key_not_ends_with: `${keyLabel} does not ends with`,
						value_is: `${valueLabel} is`,
						value_contains: `${valueLabel} contains`,
						value_not_contains: `${valueLabel} does not contain`,
						value_starts_with: `${valueLabel} starts with`,
						value_ends_with: `${valueLabel} ends with`,
						value_not_starts_with: `${valueLabel} does not starts with`,
						value_not_ends_with: `${valueLabel} does not ends with`,
					};
				})()),
	};
};

const keySpecificOperators = [
	'key_is',
	'key_contains',
	'key_not_contains',
	'key_starts_with',
	'key_ends_with',
	'key_not_starts_with',
	'key_not_ends_with',
];

const valueSpecificOperators = [
	'value_is',
	'value_contains',
	'value_not_contains',
	'value_starts_with',
	'value_ends_with',
	'value_not_starts_with',
	'value_not_ends_with',
];

const getValueForOperation = (
	operator: string,
	schema: JSONSchema,
	value: string | object,
) => {
	// Determine if the operation is key-specific or value-specific
	const isKeyOperation = keySpecificOperators.includes(operator);
	const isValueOperation = valueSpecificOperators.includes(operator);

	// Find the schema key or value based on the operation type
	const schemaField = isKeyOperation
		? 'key'
		: isValueOperation
			? 'value'
			: null;
	const schemaProperty = schemaField
		? findKey(schema.properties!, { description: schemaField })
		: null;

	// Return the appropriate value format based on the operation type
	return schemaProperty
		? typeof value === 'string'
			? { type: 'string', [schemaProperty]: value }
			: pick(value, schemaProperty)
		: value;
};

const getTitleForOperation = (
	operator: OperatorSlug,
	schema: JSONSchema,
	value: string | object,
) => {
	if (typeof value !== 'object' || !schema.properties) {
		return schema.title;
	}

	// Combine key and value specific operators for easier checking
	const allSpecificOperators = [
		...keySpecificOperators,
		...valueSpecificOperators,
	];

	// Extract the first key from the value object
	const firstKeyOfValue = Object.keys(value)[0];

	// Proceed only if the operator is in the list of specific operators and the property exists
	if (
		allSpecificOperators.includes(operator) &&
		schema.properties[firstKeyOfValue]
	) {
		const property = schema.properties[firstKeyOfValue];

		// Ensure the property is an object and has a title
		if (typeof property === 'object' && property.title) {
			return property.title;
		}
	}

	// Default return if none of the conditions above are met
	return schema.title;
};

export type OperatorSlug =
	| KeysOfUnion<ReturnType<typeof operators>>
	| typeof FULL_TEXT_SLUG;

export const createFilter: CreateFilter<OperatorSlug> = (
	field,
	operator,
	value,
	schema,
) => {
	if (!schema) {
		return {};
	}

	const isKeyValue = isKeyValueObj(schema);
	const internalValue = isKeyValue
		? getValueForOperation(operator, schema, value)
		: value;
	const propertyTitle = getTitleForOperation(operator, schema, internalValue);

	const isFilter = (v: any) => ({ const: v });

	const containsFilter = (v: any) => ({
		description: v,
		regexp: {
			pattern: regexEscape(v),
			flags: 'i',
		},
	});

	const startsWithFilter = (v: any) => ({
		pattern: `^${regexEscape(v)}`,
		$comment: 'starts_with',
	});
	const endsWithFilter = (v: any) => ({
		pattern: `${regexEscape(v)}$`,
		$comment: 'ends_with',
	});

	if (!isKeyValue) {
		return {
			type: 'object',
			properties: {
				[field]: getFilter(field, schema, internalValue, operator),
			},
			required: [field],
		};
	}

	// TODO: this case does not cover complex objects for FULL_TEXT_SLUG
	if (operator === FULL_TEXT_SLUG && schema.properties) {
		const schemaKey = findKey(schema.properties, { description: 'key' });
		const schemaValue = findKey(schema.properties, { description: 'value' });
		const properties: JSONSchema[] = [schemaKey, schemaValue].map(
			(key: string) => ({
				type: 'object',
				properties: {
					[key]: {
						type: 'string',
						pattern: regexEscape(internalValue),
					},
				},
				required: [key],
			}),
		);
		return {
			type: 'object',
			properties: {
				[field]: {
					type: 'array',
					contains: {
						type: 'object',
						title: propertyTitle,
						anyOf: properties,
					},
				},
			},
		};
	}

	if (operator === 'is') {
		return {
			type: 'object',
			properties: {
				[field]: {
					type: 'array',
					contains: {
						type: 'object',
						title: propertyTitle,
						properties: mapValues(internalValue, (v) => ({ const: v })),
					},
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
						contains: {
							type: 'object',
							title: propertyTitle,
							properties: mapValues(internalValue, (v) => ({ const: v })),
						},
					},
				},
			},
		};
	}

	if (operator === 'key_is' || operator === 'value_is') {
		return {
			type: 'object',
			properties: {
				[field]: {
					type: 'array',
					contains: {
						type: 'object',
						title: propertyTitle,
						properties: mapValues(internalValue, isFilter),
					},
				},
			},
			required: [field],
		};
	}

	if (operator === 'key_contains' || operator === 'value_contains') {
		return {
			type: 'object',
			properties: {
				[field]: {
					type: 'array',
					contains: {
						type: 'object',
						title: propertyTitle,
						properties:
							typeof value !== 'object'
								? containsFilter(internalValue)
								: mapValues(internalValue, containsFilter),
					},
				},
			},
			required: [field],
		};
	}

	if (operator === 'key_not_contains' || operator === 'value_not_contains') {
		return {
			type: 'object',
			properties: {
				[field]: {
					not: {
						contains: {
							type: 'object',
							title: propertyTitle,
							properties:
								typeof internalValue !== 'object'
									? containsFilter(internalValue)
									: mapValues(internalValue, containsFilter),
						},
					},
				},
			},
		};
	}

	if (
		operator === 'key_starts_with' ||
		operator === 'value_starts_with' ||
		operator === 'key_ends_with' ||
		operator === 'value_ends_with'
	) {
		const filterMethod = operator.includes('starts')
			? startsWithFilter
			: endsWithFilter;
		return {
			type: 'object',
			properties: {
				[field]: {
					type: 'array',
					contains: {
						type: 'object',
						title: propertyTitle,
						properties:
							typeof internalValue !== 'object'
								? filterMethod(internalValue)
								: mapValues(internalValue, filterMethod),
					},
				},
			},
			required: [field],
		};
	}

	if (
		operator === 'key_not_starts_with' ||
		operator === 'value_not_starts_with' ||
		operator === 'key_not_ends_with' ||
		operator === 'value_not_ends_with'
	) {
		const filterMethod = operator.includes('starts')
			? startsWithFilter
			: endsWithFilter;
		return {
			type: 'object',
			properties: {
				[field]: {
					not: {
						contains: {
							type: 'object',
							title: propertyTitle,
							properties:
								typeof internalValue !== 'object'
									? filterMethod(internalValue)
									: mapValues(internalValue, filterMethod),
						},
					},
				},
			},
		};
	}

	return {};
};

export const getFilter = (
	field: string,
	schema: JSONSchema,
	value: string,
	operator: string,
): JSONSchema => {
	if (!!schema?.properties && typeof schema.properties !== 'boolean') {
		const anyOf = Object.entries(schema.properties)
			.map(([propKey, propValue]: [string, JSONSchema]) => {
				const filter = createModelFilter(propValue, {
					field: propKey,
					operator,
					value,
				});
				return filter;
			})
			.filter(isJSONSchema);
		return {
			anyOf,
		};
	}
	const fieldFilter = createModelFilter(schema, { field, operator, value });

	if (!fieldFilter || typeof fieldFilter !== 'object') {
		return {};
	}

	return {
		contains: fieldFilter.properties?.[field],
	};
};

const reworkTagsProperties = (
	properties: JSONSchema['properties'],
	filterBy: 'key' | 'value' | null,
) => {
	if (!properties) {
		return properties;
	}
	return Object.fromEntries(
		Object.entries(properties)
			.filter(([, value]) =>
				filterBy && isJSONSchema(value)
					? value.description === filterBy
					: !!value,
			)
			.map(([key, value]: [string, JSONSchema]) => [
				key,
				{ ...value, description: '' },
			]),
	);
};

export const rendererSchema = (
	schemaField: JSONSchema,
	index: number,
	schema: JSONSchema,
	data: FormData,
) => {
	const refSchema = getRefSchema(schema, 'properties.');
	// This is a customization for Tags, we need to keep it until we can remove this custom tag logic.
	// Ideally objects should always render all properties and have as operators is/is_not/contains/not_contains
	const properties = reworkTagsProperties(
		refSchema.properties,
		data?.operator && data.operator.includes('key')
			? 'key'
			: data?.operator && data.operator.includes('value')
				? 'value'
				: null,
	);

	const valueSchema: JSONSchema = {
		...refSchema,
		type: 'object',
		title: '',
		description: '',
		properties,
	};
	return getDataTypeSchema(schemaField, index, operators(schema), valueSchema);
};
