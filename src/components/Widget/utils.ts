import type { JSONSchema7 as JSONSchema } from 'json-schema';
import Ajv from 'ajv';
import { UiSchema as rjsfUiSchema } from '@rjsf/core';
import pickBy from 'lodash/pickBy';
import merge from 'lodash/merge';
import isString from 'lodash/isString';
import jsone from 'json-e';
import ajvKeywords from 'ajv-keywords';
import { Overwrite } from '~/common';
import get from 'lodash/get';
import { format, formatDistance } from 'date-fns';
import keys from 'lodash/keys';
import difference from 'lodash/difference';
import has from 'lodash/has';

const DATE_FORMAT = 'MMM do yyyy';
const TIME_FORMAT = 'h:mm a';

export type UiOptions = {
	[key: string]: JSONSchema;
};

export type DefinedValue =
	| number
	| string
	| boolean
	| { [key: string]: any }
	| any[]
	| undefined;

export type Value = DefinedValue | null;

export interface UiSchema
	extends Pick<rjsfUiSchema, 'ui:options' | 'ui:order'> {
	'ui:widget'?: string;
	'ui:title'?: string;
	'ui:description'?: string;
	'ui:value'?: Value;
}

interface WidgetStaticProperties {
	uiOptions?: UiOptions;
	supportedTypes?: string[];
	displayName: string;
}

export interface WidgetProps<T extends object = object> {
	value: Value;
	schema: JSONSchema | undefined;
	extraFormats?: Format[];
	uiSchema?: UiSchema;
	extraContext?: T;
}

export interface Widget<T extends object = object, ExtraProps = {}>
	extends WidgetStaticProperties {
	(props: WidgetProps<T> & ExtraProps): JSX.Element | null;
}

export interface Format {
	name: string;
	format: string;
	widget?: Widget;
}

export const JsonTypes = {
	array: 'array',
	object: 'object',
	number: 'number',
	integer: 'integer',
	string: 'string',
	boolean: 'boolean',
	null: 'null',
} as const;

export interface JsonTypesTypeMap {
	array: unknown[];
	object: {};
	number: number;
	integer: number;
	string: string;
	boolean: boolean;
	null: null;
}

// Runs the UI schema through json-e if the value is
// not an object or an array.
export const transformUiSchema = ({
	value,
	uiSchema,
	extraContext,
}: {
	value?: Value;
	uiSchema: WidgetProps['uiSchema'];
	extraContext: WidgetProps['extraContext'];
}) => {
	if (uiSchema == null) {
		// If the input schema is empty then the output also will be, so we can
		// short-circuit here and avoid a lot of work
		return {};
	}
	// Ensure source is not null/undefined as jsone might call toString() on it
	const context = { source: value ?? '', ...extraContext };
	if (typeof value === 'object') {
		// For objects/arrays just transform the 'ui:' properties.
		// Sub-properties will be transformed recursively.
		const trimmedUiSchema = pickBy(uiSchema, (_, k) => k.startsWith('ui:'));
		const processedUiSchema = jsone(trimmedUiSchema, context);
		return merge({}, uiSchema, processedUiSchema);
	}
	return jsone(uiSchema, context);
};

export const getValue = (
	value?: Value,
	schema?: JSONSchema,
	uiSchema?: UiSchema,
) => {
	const calculatedValue = uiSchema?.['ui:value'];
	// Fall back to schema's default value if value is undefined
	return calculatedValue !== undefined
		? calculatedValue
		: value !== undefined
			? value
			: schema?.default;
};

export const getSchemaNormalizedValue = (
	value?: Value,
	schema?: JSONSchema,
	uiSchema?: UiSchema,
) => {
	const calculatedValue = uiSchema?.['ui:value'];
	// Fall back to schema's default value if value is undefined
	return calculatedValue !== undefined
		? calculatedValue
		: value !== undefined
			? value
			: schema?.default;
};

export const getType = (value?: Value) => {
	if (value === undefined) {
		return 'default';
	}
	if (value === null) {
		return 'null';
	}
	return Array.isArray(value) ? 'array' : typeof value;
};

// TODO: Replace the HOF with a plain function once TS supports optional generic types
// See: https://github.com/microsoft/TypeScript/issues/14400
// TODO: convert the fn args to an object once we bump TS
export function widgetFactory<ST extends Array<keyof JsonTypesTypeMap>>(
	displayName: string,
	uiOptions: Widget['uiOptions'],
	supportedTypes: ST,
) {
	return function <
		T extends object,
		ExtraProps extends {} = {},
		V extends WidgetProps['value'] | null = JsonTypesTypeMap[ST[number]],
	>(
		widgetFn: (
			props: Overwrite<WidgetProps<T>, { value: V }> & ExtraProps,
		) => JSX.Element | null,
	): Widget<T, ExtraProps> {
		const widget = widgetFn as Widget<T, ExtraProps>;
		Object.assign(widget, {
			displayName,
			uiOptions,
			supportedTypes,
		});
		return widget;
	};
}

export const getArrayItems = ({
	value,
	schema,
	uiSchema,
	extraContext,
	extraFormats,
}: WidgetProps): WidgetProps[] => {
	if (!Array.isArray(value)) {
		throw new Error(`Value must be an array (not '${typeof value}')`);
	}
	const maxItems = schema.maxItems ?? value.length;
	const items = value.slice(0, maxItems).map((item) => {
		const itemSchema = get(schema, 'items', {}) as JSONSchema;
		const itemUiSchema = get(uiSchema, 'items', {}) as UiSchema;
		const processedUiSchema = transformUiSchema({
			value: item,
			uiSchema: itemUiSchema,
			extraContext,
		});
		return {
			value: item,
			schema: itemSchema,
			uiSchema: processedUiSchema,
			extraContext,
			extraFormats,
		};
	});
	if (maxItems < value.length) {
		items.push({
			value: `+ ${value.length - maxItems} more`,
			schema: {
				type: 'string',
			},
			uiSchema: {},
			extraContext,
			extraFormats,
		});
	}
	return items;
};

export function formatTimestamp(
	timestamp: string | number,
	uiSchema: UiSchema = {},
) {
	if (!timestamp) {
		return '';
	}
	const uiFormat =
		get(uiSchema, ['ui:options', 'dtFormat']) ||
		`${DATE_FORMAT}, ${TIME_FORMAT}`;
	if (typeof uiFormat !== 'string') {
		throw new Error(
			`dtFormat must be a string to specify instead of ${typeof uiFormat}')`,
		);
	}
	return format(new Date(timestamp), uiFormat);
}

// 'Materialized' properties are properties defined in the UI Schema but not in the value or schema.
// The property name must begin with 'ui:field:' (e.g. 'ui:field:myMaterializedProperty').
const getMaterializedPropertyNames = (uiSchema: WidgetProps['uiSchema']) => {
	return keys(uiSchema).filter((uiSchemaKey) =>
		uiSchemaKey.startsWith('ui:field:'),
	);
};

export function getObjectPropertyNames({
	value,
	schema,
	uiSchema,
}: WidgetProps): string[] {
	if (typeof value !== 'object') {
		throw new Error(
			`Cannot get object property names from a value of type '${typeof value}'`,
		);
	}
	const uiSchemaPropertyNames = getMaterializedPropertyNames(uiSchema);
	const schemaPropertyNames =
		get(uiSchema, ['ui:order'], keys(get(schema, 'properties'))) || [];
	const nonSchemaPropertyNames = difference(
		keys(value) || [],
		schemaPropertyNames,
	);
	const allObjectPropertyNames = [
		...uiSchemaPropertyNames,
		...schemaPropertyNames,
		...nonSchemaPropertyNames,
	];

	return get(uiSchema, 'ui:explicit', false)
		? allObjectPropertyNames.filter((propName) => has(uiSchema, propName))
		: allObjectPropertyNames;
}

export const truncateHash = (str: string, maxLength = 7) => {
	if (!str || str.length < maxLength) {
		return str;
	}

	return str.substring(0, maxLength);
};

export const timeSince = (timestamp: string | number, suffix = true) =>
	formatDistance(new Date(timestamp), new Date(), { addSuffix: suffix });

// SKEMA METHODS: removing the use of skema and just get what needed
const JSON_SCHEMA_SCHEMA = {
	$schema: 'http://json-schema.org/draft-07/schema#',
	$id: 'jellyfish-meta-schema',
	title: 'Core schema meta-schema',
	definitions: {
		schemaArray: {
			type: 'array',
			minItems: 1,
			items: {
				$ref: '#',
			},
		},
		nonNegativeInteger: {
			type: 'integer',
			minimum: 0,
		},
		nonNegativeIntegerDefault0: {
			allOf: [
				{
					$ref: '#/definitions/nonNegativeInteger',
				},
				{
					default: 0,
				},
			],
		},
		simpleTypes: {
			enum: [
				'array',
				'boolean',
				'integer',
				'null',
				'number',
				'object',
				'string',
			],
		},
		stringArray: {
			type: 'array',
			items: {
				type: 'string',
			},
			uniqueItems: true,
			default: [],
		},
	},
	type: ['object', 'boolean'],
	properties: {
		$id: {
			type: 'string',
			format: 'uri-reference',
		},
		$schema: {
			type: 'string',
			format: 'uri',
		},
		$ref: {
			type: 'string',
			format: 'uri-reference',
		},
		$comment: {
			type: 'string',
		},
		title: {
			type: 'string',
		},
		description: {
			type: 'string',
		},
		default: true,
		readOnly: {
			type: 'boolean',
			default: false,
		},
		examples: {
			type: 'array',
			items: true,
		},
		multipleOf: {
			type: 'number',
			exclusiveMinimum: 0,
		},
		maximum: {
			type: 'number',
		},
		exclusiveMaximum: {
			type: 'number',
		},
		minimum: {
			type: 'number',
		},
		exclusiveMinimum: {
			type: 'number',
		},
		maxLength: {
			$ref: '#/definitions/nonNegativeInteger',
		},
		minLength: {
			$ref: '#/definitions/nonNegativeIntegerDefault0',
		},
		pattern: {
			type: 'string',
			format: 'regex',
		},
		additionalItems: {
			$ref: '#',
		},
		items: {
			anyOf: [
				{
					$ref: '#',
				},
				{
					$ref: '#/definitions/schemaArray',
				},
			],
			default: true,
		},
		maxItems: {
			$ref: '#/definitions/nonNegativeInteger',
		},
		minItems: {
			$ref: '#/definitions/nonNegativeIntegerDefault0',
		},
		uniqueItems: {
			type: 'boolean',
			default: false,
		},
		contains: {
			$ref: '#',
		},
		maxProperties: {
			$ref: '#/definitions/nonNegativeInteger',
		},
		minProperties: {
			$ref: '#/definitions/nonNegativeIntegerDefault0',
		},
		required: {
			$ref: '#/definitions/stringArray',
		},
		additionalProperties: {
			$ref: '#',
		},
		definitions: {
			type: 'object',
			additionalProperties: {
				$ref: '#',
			},
			default: {},
		},
		properties: {
			type: 'object',
			additionalProperties: {
				$ref: '#',
			},
			default: {},
		},
		patternProperties: {
			type: 'object',
			additionalProperties: {
				$ref: '#',
			},
			propertyNames: {
				format: 'regex',
			},
			default: {},
		},
		dependencies: {
			type: 'object',
			additionalProperties: {
				anyOf: [
					{
						$ref: '#',
					},
					{
						$ref: '#/definitions/stringArray',
					},
				],
			},
		},
		propertyNames: {
			$ref: '#',
		},
		const: true,
		enum: {
			type: 'array',
			items: true,
			minItems: 1,
			uniqueItems: true,
		},
		type: {
			anyOf: [
				{
					$ref: '#/definitions/simpleTypes',
				},
				{
					type: 'array',
					items: {
						$ref: '#/definitions/simpleTypes',
					},
					minItems: 1,
					uniqueItems: true,
				},
			],
		},
		format: {
			type: 'string',
		},
		contentMediaType: {
			type: 'string',
		},
		contentEncoding: {
			type: 'string',
		},
		if: {
			$ref: '#',
		},
		then: {
			$ref: '#',
		},
		else: {
			$ref: '#',
		},
		allOf: {
			$ref: '#/definitions/schemaArray',
		},
		anyOf: {
			$ref: '#/definitions/schemaArray',
		},
		oneOf: {
			$ref: '#/definitions/schemaArray',
		},
		not: {
			$ref: '#',
		},
	},
	default: true,
};

// Adds extra keywords to an AJV instance using the `ajv-keywords` package.
// This method mutates the AJV instance.
const configureAjv = (ajv: Ajv) => {
	const keywords = [
		// 'formatMaximum',
		// 'formatMinimum',
		// The regexp keyword is used by Filters to do case insensitive pattern
		// matching via the AJV package.
		// See https://github.com/epoberezkin/ajv-keywords#regexp
		'regexp',
	];

	keywords.forEach((keyword) => {
		// TODO: remove any as soon as we remove rendition
		ajvKeywords(ajv as any, [keyword]);
	});

	ajv.addFormat('markdown', isString);
	ajv.addFormat('mermaid', isString);
};

export const schemaMatch = (() => {
	const ajv = new Ajv({
		allErrors: true,
		// Don't keep references to all used
		// schemas in order to not leak memory.
		addUsedSchema: false,
	});

	ajv.addSchema(JSON_SCHEMA_SCHEMA, 'schema');

	configureAjv(ajv);

	return (schema: JSONSchema, object: any, options: any = {}) => {
		if (!schema) {
			return {
				valid: false,
				errors: ['no schema'],
				score: 0,
			};
		}

		if (!ajv.validate('schema', schema) || !schema.type) {
			return {
				valid: false,
				errors: ['invalid schema'],
				score: 0,
			};
		}

		const valid = options.schemaOnly ? true : ajv.validate(schema, object);

		return {
			valid,
			errors: valid ? [] : ajv.errorsText().split(', '),
			score: valid ? exports.scoreMatch(schema, object) : 0,
		};
	};
})();

// If the schema defines an anyOf array, return the schema option
// that best matches the value; otherwise just return the original schema.
// Internally uses skhema.match to score the schema options
// against the value.
export const getBestSchemaMatch = (
	schema: JSONSchema | undefined,
	value: any,
) => {
	if (!schema?.anyOf) {
		return schema;
	}
	const mostRelevantSchema = schema.anyOf.reduce(
		(mostRelevantSchema, anyOfItem: JSONSchema) => {
			const match = schemaMatch(anyOfItem as JSONSchema, value);
			if (match.valid && match.score > mostRelevantSchema.score) {
				return {
					schema: anyOfItem,
					score: match.score,
				};
			}
			return mostRelevantSchema;
		},
		{
			schema,
			score: 0,
		},
	);

	return mostRelevantSchema.schema;
};

export const hashCode = function (text: string, max: number): number {
	let hash = 0;
	for (let index = 0; index < text.length; index++) {
		// tslint:disable-next-line no-bitwise
		hash = text.charCodeAt(index) + ((hash << 5) - hash);
	}

	// tslint:disable-next-line no-bitwise
	return (hash >> (text.length * 8)) & max;
};
