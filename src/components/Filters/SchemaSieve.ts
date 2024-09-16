import {
	JSONSchema7 as JSONSchema,
	JSONSchema7Definition as JSONSchemaDefinition,
} from 'json-schema';
import {
	getAllOperators,
	getDataModel,
	isDateTimeFormat,
} from '../../DataTypes';
import Ajv from 'ajv';
import ajvKeywords from 'ajv-keywords';
import addFormats from 'ajv-formats';
import pickBy from 'lodash/pickBy';
import { enqueueSnackbar } from '@balena/ui-shared-components';

const ajv = new Ajv();
ajvKeywords(ajv as any, ['regexp']);
addFormats(ajv);

export interface FilterDescription {
	schema: JSONSchema;
	field: string;
	operator: string;
	value: string;
}

export const randomUUID = (length = 16) => {
	let text = '';
	const possible =
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < length; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
};

export const FULL_TEXT_SLUG = 'full_text_search';

export interface FormData {
	field: string | undefined;
	operator: string | undefined;
	value: string | undefined;
}

export function ajvFilter<T>(
	filters: JSONSchema | JSONSchema[],
	collection: T[],
): T[];
export function ajvFilter<T>(
	filters: JSONSchema | JSONSchema[],
	collection: Record<string, T>,
): Record<string, T>;
export function ajvFilter<T>(
	filters: JSONSchema | JSONSchema[],
	collection: T[] | Record<string, T>,
) {
	// Remove all schemas that may have been compiled already
	ajv.removeSchema(/^.*$/);
	const validators = Array.isArray(filters)
		? filters.map((s) => ajv.compile(s))
		: [ajv.compile(filters)];
	if (Array.isArray(collection)) {
		return collection.filter((m) => validators.every((v) => v(m)));
	}

	return pickBy(collection, (m) => validators.every((v) => v(m)));
}

// This is a duplicate of AutoUI models/helpers isJSONSchema function.
// Ideally Filters should not have any autoUI notions
const isJSONSchema = (
	value:
		| JSONSchema
		| JSONSchemaDefinition
		| JSONSchemaDefinition[]
		| undefined
		| null,
): value is JSONSchema => {
	return (
		typeof value === 'object' && value !== null && typeof value !== 'boolean'
	);
};

export const getPropertySchema = (key: string, schema: JSONSchema) => {
	if (!schema.properties) {
		return;
	}
	const propertySchema = schema.properties[key];
	return isJSONSchema(propertySchema) ? propertySchema : undefined;
};

export const createModelFilter = (
	propertySchema: JSONSchemaDefinition,
	{ field, operator, value }: FormData,
) => {
	const model = getDataModel(propertySchema);
	if (
		!propertySchema ||
		typeof propertySchema === 'boolean' ||
		!field ||
		!operator ||
		!model
	) {
		return;
	}
	return model.createFilter(field, operator, value, propertySchema);
};

export const createFilter = (
	schema: JSONSchema,
	formData: FormData[],
): JSONSchema | undefined => {
	const { properties } = schema;
	if (!properties) {
		return;
	}
	const anyOf: JSONSchema[] = formData
		.map(({ field, operator, value }) => {
			if (!field || !operator) {
				return {};
			}
			const propertySchema = properties[field] as JSONSchema;
			const operators = getAllOperators(propertySchema);
			const operatorLabel = operators[operator as keyof typeof operators];
			const filter = createModelFilter(propertySchema, {
				field,
				operator,
				value,
			});
			if (!filter || !Object.keys(filter).length) {
				return {};
			}
			return {
				$id: randomUUID(),
				title: operator,
				description: JSON.stringify({
					schema: propertySchema,
					field,
					operator: operatorLabel,
					value,
				}),
				type: 'object',
				...filter,
			};
		})
		.filter((f) => isJSONSchema(f) && f.properties);

	if (anyOf.length < 1) {
		enqueueSnackbar({
			key: 'filter-create',
			message:
				'An error occurred while creating the filter. If you need assistance, please contact our support team and provide the error details from your browser console.',
			variant: 'error',
			preventDuplicate: true,
		});
		console.error(`ERROR filter creation`, formData, schema);
		return;
	}

	return {
		$id: randomUUID(),
		anyOf,
	};
};

export const createFullTextSearchFilter = (
	schema: JSONSchema,
	term: string,
) => {
	if (!isJSONSchema(schema.properties)) {
		return;
	}
	const items: FormData[] = [];
	for (const [key, value] of Object.entries(schema.properties)) {
		if (
			isJSONSchema(value) &&
			(value.type?.includes('boolean') || isDateTimeFormat(value.format))
		) {
			continue;
		}
		items.push({
			field: key,
			operator: FULL_TEXT_SLUG,
			value: term,
		});
	}
	const filter = createFilter(schema, items);
	return filter
		? {
				$id: randomUUID(),
				title: FULL_TEXT_SLUG,
				description: JSON.stringify({
					field: 'Any field',
					operator: FULL_TEXT_SLUG,
					value: term,
				}),
				anyOf: [filter],
		  }
		: null;
};

export const convertSchemaToDefaultValue = (
	propertySchema: JSONSchema,
): any => {
	if (!isJSONSchema(propertySchema)) {
		return null;
	}
	switch (propertySchema.type) {
		case 'string':
			return '';
		case 'boolean':
			return false;
		case 'number':
			return 0;
		case 'array':
			if (isJSONSchema(propertySchema.items)) {
				return [convertSchemaToDefaultValue(propertySchema.items)];
			}
			return [];
		case 'object':
			if (
				propertySchema.properties &&
				typeof propertySchema.properties === 'object'
			) {
				const defaultObject: Record<string, any> = {};
				for (const [key, value] of Object.entries(propertySchema.properties)) {
					if (isJSONSchema(value)) {
						defaultObject[key] = convertSchemaToDefaultValue(value);
					}
				}
				return defaultObject;
			}
			return {};
		default:
			return null;
	}
};

export const parseFilterDescription = (
	filter: JSONSchema,
): FilterDescription | undefined => {
	if (!filter.description) {
		return;
	}
	try {
		return JSON.parse(filter.description);
	} catch {
		return;
	}
};
