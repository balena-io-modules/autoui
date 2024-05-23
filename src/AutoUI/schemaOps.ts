import type {
	JSONSchema7 as JSONSchema,
	JSONSchema7Definition as JSONSchemaDefinition,
} from 'json-schema';
import get from 'lodash/get';
import pick from 'lodash/pick';
import { CheckedState, Dictionary, ResourceTagModelService } from 'rendition';
import { PineFilterObject } from '../oData/jsonToOData';
import { findInObject } from './utils';

type MaybePromise<T> = T | Promise<T>;

export interface AutoUIBaseResource<T> {
	id: number;
	__permissions: Permissions<T>;
}

export interface Permissions<T> {
	read: Array<keyof T>;
	create: Array<keyof T>;
	update: Array<keyof T>;
	delete: boolean;
}

export interface Priorities<T> {
	primary: Array<keyof T>;
	secondary: Array<keyof T>;
	tertiary: Array<keyof T>;
}

// This is a raw form that would not be exposed to the UI and would live either in the SDK or backend.
export interface AutoUIRawModel<T> {
	resource: string;
	schema: JSONSchema;
	permissions: Dictionary<Permissions<T>>;
	priorities?: Priorities<T>;
}
export interface AutoUIModel<T> {
	resource: string;
	schema: JSONSchema;
	permissions: Permissions<T>;
	priorities?: Priorities<T>;
}

export interface CustomSchemaDescription {
	'x-ref-scheme'?: string[];
	'x-foreign-key-scheme'?: string[];
	'x-filter-only'?: boolean | string[];
	'x-no-filter'?: boolean | string[];
	'x-no-sort'?: boolean | string[];
}

export type AutoUITagsSdk<T> = ResourceTagModelService &
	(
		| {}
		| {
				getAll: (itemsOrFilters: any) => T[] | Promise<T[]>;
				canAccess: (param: {
					checkedState?: CheckedState;
					selected?: T[];
				}) => Promise<boolean>;
		  }
	);

export interface AutoUIAction<T> {
	title: string;
	type: 'create' | 'update' | 'delete';
	section?: string;
	renderer?: (props: {
		schema: JSONSchema;
		affectedEntries: T[] | undefined;
		onDone: () => void;
		/** setSelected can be can be used for delete function on server side pagination */
		setSelected?: (
			selected: Array<Partial<T>> | undefined,
			allChecked?: CheckedState | undefined,
		) => void;
	}) => React.ReactNode;
	actionFn?: (props: {
		/** affectedEntries will be undefined if pagination is server side and checkedState is "all" */
		affectedEntries: T[] | undefined;
		/** checkState can be undefined only for entity case, since card does not have a selection event  */
		checkedState: CheckedState | undefined;
		/** setSelected can be can be used for delete function on server side pagination */
		setSelected?: (
			selected: Array<Partial<T>> | undefined,
			allChecked?: CheckedState | undefined,
		) => void;
	}) => void;
	isDisabled?: (props: {
		/** affectedEntries will be undefined if pagination is server side and checkedState is "all" */
		affectedEntries: T[] | undefined;
		/** checkState can be undefined only for entity case, since card does not have a selection event  */
		checkedState: CheckedState | undefined;
	}) => MaybePromise<string | null>;
	isDangerous?: boolean;
}

export interface AutoUIContext<T> {
	resource: string;
	getBaseUrl?: (entry: T) => string;
	onEntityClick?: (
		entity: T,
		event: React.MouseEvent<HTMLAnchorElement, MouseEvent>,
	) => void;
	idField: string;
	nameField?: string;
	tagField?: string;
	geolocation?: {
		latitudeField?: string;
		longitudeField?: string;
	};
	actions?: Array<AutoUIAction<T>>;
	customSort?: Dictionary<(a: T, b: T) => number> | Dictionary<string>;
	sdk?: {
		tags?: AutoUITagsSdk<T>;
	};
	internalPineFilter?: PineFilterObject | null;
	checkedState: CheckedState;
}

export interface ActionData<T> {
	action: AutoUIAction<T>;
	schema: JSONSchema;
	affectedEntries?: T[];
	checkedState?: CheckedState;
}

export const isJson = (str: string) => {
	try {
		JSON.parse(str);
	} catch (err) {
		return false;
	}
	return true;
};

// The implementation lacks handling of nested schemas and some edge cases, but is enough for now.
export const autoUIJsonSchemaPick = <T>(
	schema: JSONSchema,
	selectors: Array<keyof T>,
) => {
	const res: JSONSchema = {
		...schema,
		properties: pick(schema.properties ?? {}, selectors as string[]),
		required: [],
	};

	res.required = schema.required?.filter((requiredField) =>
		(selectors as string[]).includes(requiredField),
	);

	return res;
};

export const getFieldForFormat = (schema: JSONSchema, format: string) => {
	let propertyKeyWithFormat: string | undefined;

	Object.entries(schema.properties ?? {}).forEach(([key, val]: any) => {
		if (typeof val === 'object' && val.format === format) {
			propertyKeyWithFormat = key;
		}
	});

	return propertyKeyWithFormat;
};

export const getRefSchemePrefix = (schema: JSONSchema) => {
	return schema.items
		? 'items.properties.'
		: schema.properties
		? 'properties.'
		: '';
};

export const getRefSchemeTitle = (
	refScheme: string | undefined,
	schema: JSONSchema,
): string | undefined => {
	return refScheme
		? get(schema, `${getRefSchemePrefix(schema)}${refScheme}.title`)
		: schema.title;
};

export const isJSONSchema = (
	value:
		| JSONSchema
		| JSONSchemaDefinition
		| JSONSchemaDefinition[]
		| undefined
		| null,
): value is JSONSchema => {
	return (
		typeof value === 'object' &&
		value !== null &&
		typeof value !== 'boolean' &&
		Object.keys(value).length > 0
	);
};

export const parseDescription = (
	filter: JSONSchema,
): CustomSchemaDescription | null => {
	if (!filter.description) {
		return null;
	}
	try {
		return JSON.parse(filter.description);
	} catch {
		return null;
	}
};

export const parseDescriptionProperty = (
	schemaValue: JSONSchema,
	property: string,
): boolean | string[] | null | undefined => {
	const description = parseDescription(schemaValue);
	if (description && property in description) {
		const value = description[property as keyof typeof description];
		return value;
	}
	return null;
};

export const autoUIAddToSchema = (
	schema: JSONSchema,
	schemaProperty: string,
	property: string,
	value: any,
) => {
	return {
		...schema,
		properties: {
			...schema.properties,
			[schemaProperty]: {
				...(schema.properties?.[schemaProperty] as JSONSchema),
				[property]: value,
			},
		},
	};
};

export const getHeaderLink = (
	schemaValue: JSONSchema | JSONSchemaDefinition,
) => {
	if (typeof schemaValue === 'boolean' || !schemaValue.description) {
		return null;
	}
	try {
		const json = JSON.parse(schemaValue.description!);
		return json['x-header-link'];
	} catch (err) {
		return null;
	}
};

export const convertRefSchemeToSchemaPath = (refScheme: string | undefined) => {
	// TODO: This atm doesn't support ['my property']
	return refScheme
		?.split('.')
		.join('.properties.')
		.replace(/\[\d+\]/g, '.items');
};

export const getRefSchemaPrefix = (propertySchema: JSONSchema) => {
	return propertySchema.type === 'array' ? `items.properties.` : `properties.`;
};

export const generateSchemaFromRefScheme = (
	schema: JSONSchema,
	parentProperty: string,
	refScheme: string | undefined,
): JSONSchema => {
	const propertySchema =
		(schema.properties?.[parentProperty] as JSONSchema) ?? schema;
	if (!refScheme) {
		return propertySchema;
	}
	const convertedRefScheme = `${getRefSchemaPrefix(
		propertySchema,
	)}${convertRefSchemeToSchemaPath(refScheme)}`;
	const typePaths: string[][] = [];
	const ongoingIncrementalPath: string[] = [];
	convertedRefScheme.split('.').forEach((key) => {
		if (['properties', 'items'].includes(key)) {
			typePaths.push([...ongoingIncrementalPath, 'type']);
		}
		ongoingIncrementalPath.push(key);
	});
	if (ongoingIncrementalPath.length) {
		typePaths.push(ongoingIncrementalPath);
	}
	return {
		...propertySchema,
		description: JSON.stringify({ 'x-ref-scheme': [refScheme] }),
		title:
			(get(propertySchema, convertedRefScheme) as JSONSchema)?.title ??
			propertySchema.title,
		...pick(propertySchema, typePaths),
	};
};

export const getRefSchema = (schema: JSONSchema, refSchemePrefix: string) => {
	const refScheme = parseDescriptionProperty(schema, 'x-ref-scheme');
	return refScheme
		? get(schema, `${refSchemePrefix}${refScheme}`) ?? schema
		: schema;
};

export const getPropertyScheme = (
	schemaValue: JSONSchema | JSONSchemaDefinition,
) => {
	const json = isJSONSchema(schemaValue) ? parseDescription(schemaValue) : null;
	return json?.['x-foreign-key-scheme'] ?? json?.['x-ref-scheme'] ?? null;
};

export const getSubSchemaFromRefScheme = (
	schema: JSONSchema | JSONSchemaDefinition,
	refScheme?: string,
): JSONSchema => {
	const referenceScheme = refScheme || getPropertyScheme(schema)?.[0];
	const convertedRefScheme = convertRefSchemeToSchemaPath(referenceScheme);
	if (!convertedRefScheme) {
		return schema as JSONSchema;
	}
	const properties = findInObject(schema, 'properties');
	return get(properties, convertedRefScheme);
};

export const getSchemaFormat = (schema: JSONSchema) => {
	const property = getSubSchemaFromRefScheme(schema);
	const format = property.format ?? schema.format;
	return format;
};

export const getSchemaTitle = (
	jsonSchema: JSONSchema,
	propertyKey: string,
	refScheme?: string | undefined,
) => {
	if (!refScheme) {
		return jsonSchema?.title || propertyKey;
	}
	return (
		getSubSchemaFromRefScheme(jsonSchema, refScheme).title ??
		jsonSchema.title ??
		propertyKey
	);
};

export const autoUIAdaptRefScheme = (
	value: unknown,
	property: JSONSchemaDefinition,
) => {
	if (!property || value == null) {
		return null;
	}
	if (typeof property === 'boolean') {
		return value;
	}
	if (
		!property.description?.includes('x-ref-scheme') ||
		!isJson(property.description)
	) {
		return value;
	}
	const refScheme = getPropertyScheme(property);
	const transformed =
		(Array.isArray(value) && value.length <= 1 ? value[0] : value) ?? null;
	if (refScheme) {
		return get(transformed, refScheme[0]) ?? null;
	}
	return transformed;
};
