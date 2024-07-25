import type { JSONSchema7 as JSONSchema } from 'json-schema';
import {
	FULL_TEXT_SLUG,
	createModelFilter,
	type FormData,
} from '../components/Filters/SchemaSieve';
import { CreateFilter, getDataTypeSchema } from './utils';
import { getDataModel } from '.';
import { isJSONSchema, getRefSchema } from '../AutoUI/schemaOps';

export const operators = () => ({
	contains: 'contains',
	not_contains: 'does not contain',
});

export type OperatorSlug =
	| keyof ReturnType<typeof operators>
	| typeof FULL_TEXT_SLUG;

const isSchemaWithPrimitiveItems = (
	schema: JSONSchema,
): schema is JSONSchema & { items: JSONSchema } =>
	!!schema?.items &&
	typeof schema.items !== 'boolean' &&
	'type' in schema.items;

const isArrayOfObjectSchema = (schema: JSONSchema) => {
	return (
		!!schema?.items &&
		typeof schema.items !== 'boolean' &&
		'properties' in schema.items &&
		!!schema.items.properties
	);
};

const buildFilterForPropertySchema = (
	field: string,
	operator: OperatorSlug,
	value: string,
	schema: JSONSchema,
): JSONSchema => {
	const filter = getFilter(field, schema, value, operator);

	if (!Object.keys(filter).length) {
		return {};
	}
	return {
		type: 'object',
		properties: { [field]: { type: 'array', ...filter } },
		required: [field],
	};
};
const wrapFilter = (filter: JSONSchema): JSONSchema => {
	if (typeof filter.not === 'object') {
		return { not: { contains: filter.not } };
	}
	return { minItems: 1, type: 'array', contains: filter };
};

const determineOperator = (
	operator: OperatorSlug,
	schema: JSONSchema,
): OperatorSlug | 'is' | 'is_not' => {
	if (operator === 'not_contains') {
		return 'is_not';
	}
	if (
		operator === 'contains' ||
		(schema.type === 'string' && operator === FULL_TEXT_SLUG)
	) {
		return 'is';
	}
	return operator;
};

const getFilter = (
	field: string,
	schema: JSONSchema,
	value: string,
	operator: OperatorSlug,
): JSONSchema => {
	if (isArrayOfObjectSchema(schema)) {
		return buildArrayOfObjectFilter(schema, operator, value);
	}

	const hasPrimitiveItems = isSchemaWithPrimitiveItems(schema);
	const effectiveSchema = hasPrimitiveItems ? schema.items : schema;
	const effectiveOperator = determineOperator(operator, effectiveSchema);

	const filter = createModelFilter(effectiveSchema, {
		field,
		operator: effectiveOperator,
		value,
	});
	if (!filter || !Object.keys(filter).length) {
		return {};
	}

	const recursiveFilter = hasPrimitiveItems
		? filter.properties?.[field]
		: filter;

	return recursiveFilter &&
		isJSONSchema(recursiveFilter) &&
		Object.keys(recursiveFilter).length
		? wrapFilter(recursiveFilter)
		: {};
};

const buildArrayOfObjectFilter = (
	schema: JSONSchema,
	operator: OperatorSlug,
	value: string,
): JSONSchema => {
	if (!isJSONSchema(schema.items) || !isJSONSchema(schema.items.properties)) {
		return {};
	}

	const propertyFilters = Object.entries(schema.items.properties)
		.map(([key, propSchema]) =>
			createModelFilter(propSchema, { field: key, operator, value }),
		)
		.filter(isJSONSchema);

	if (!propertyFilters.length) {
		return {};
	}

	return {
		minItems: 1,
		type: 'array',
		contains:
			propertyFilters.length === 1
				? propertyFilters[0]
				: { anyOf: propertyFilters },
	};
};

export const createFilter: CreateFilter<OperatorSlug> = (
	field,
	operator,
	value,
	propertySchema,
) => {
	if (!propertySchema) {
		return {};
	}
	return buildFilterForPropertySchema(field, operator, value, propertySchema);
};

export const rendererSchema = (
	schemaField: JSONSchema,
	schema: JSONSchema,
	data: FormData,
) => {
	const refSchema = getRefSchema(schema, 'items.properties.');
	if (isArrayOfObjectSchema(refSchema) && isJSONSchema(refSchema.items)) {
		const model = getDataModel(refSchema.items);
		if (!model) {
			return;
		}

		return model.rendererSchema(schemaField, refSchema.items, data);
	}
	// we are not considering items as array, we don't need it atm
	const propertyItems = isJSONSchema(refSchema.items) ? refSchema.items : {};

	return getDataTypeSchema(schemaField, operators(), propertyItems);
};
