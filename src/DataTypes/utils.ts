import type { JSONSchema7 as JSONSchema } from 'json-schema';
import memoize from 'lodash/memoize';

const matchOperatorsRe = /[|\\{}()[\]^$+*?]/g;

export const regexEscape = (str: string) =>
	str.replace(matchOperatorsRe, '\\$&');

export type KeysOfUnion<T> = T extends T ? keyof T : never;

export type CreateFilter<TOperatorSlugs = string> = (
	field: string,
	operator: TOperatorSlugs,
	value: any,
	propertySchema?: JSONSchema & { enumNames?: string[] },
) => JSONSchema;

export const getDefaultDate = (): string => {
	const date = new Date();
	return date.toISOString().split('.')[0];
};

// Normalize a timestamp to a RFC3339 timestamp, which is required for JSON schema.
export const normalizeDateTime = memoize((timestamp: string | number) => {
	const d = new Date(timestamp);
	if (isNaN(d.getTime())) {
		return null;
	}
	return typeof timestamp === 'number'
		? d.getTime()
		: d.toISOString().split('.')[0] + 'Z'; // Remove miliseconds;
});

export const getDataTypeSchema = (
	schemaField: Partial<JSONSchema>,
	operators: Record<string, string>,
	valueSchema: Partial<JSONSchema>,
): JSONSchema => {
	const operatorsOneOf = Object.entries(operators).map(
		([operatorKey, operatorValue]) => ({
			title: operatorValue,
			const: operatorKey,
		}),
	);
	return {
		type: 'object',
		properties: {
			field: schemaField,
			operator: {
				$id: 'operator',
				title: 'Operator',
				type: 'string',
				oneOf: operatorsOneOf,
			},
			value: valueSchema,
		},
		required: ['field', 'operator', 'value'],
	};
};
