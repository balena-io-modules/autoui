import type { JSONSchema7 as JSONSchema } from 'json-schema';
import { UiSchema as rjsfUiSchema } from '@rjsf/core';
import type { Overwrite } from '../../common';
import get from 'lodash/get';
import { format, formatDistance } from 'date-fns';

const DATE_FORMAT = 'MMM do yyyy';
const TIME_FORMAT = 'h:mm a';

export type DefinedValue =
	| number
	| string
	| boolean
	| { [key: string]: any }
	| any[]
	| undefined;

export type Value = DefinedValue | null;

export interface UiSchema extends rjsfUiSchema {
	'ui:title'?: string;
	'ui:description'?: string;
	'ui:value'?: Value;
}

export interface Format {
	name: string;
	format: string;
	widget?: Widget;
}

export interface WidgetProps<T extends object = object> {
	value: Value;
	schema: JSONSchema | undefined;
	extraFormats?: Format[];
	uiSchema?: UiSchema;
	extraContext?: T;
}

export interface Widget<T extends object = object, ExtraProps = {}> {
	uiOptions?: UiOptions;
	supportedTypes?: string[];
	displayName: string;
	(props: WidgetProps<T> & ExtraProps): JSX.Element | null;
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

export type UiOptions = {
	[key: string]: JSONSchema;
};

// Convenience object for common UI option schemas
export const UiOption: UiOptions = {
	string: {
		type: 'string',
	},
	boolean: {
		type: 'boolean',
	},
	number: {
		type: 'number',
	},
	integer: {
		type: 'integer',
	},
	object: {
		type: 'object',
	},
};

// TODO: Replace the HOF with a plain function once TS supports optional generic types
// See: https://github.com/microsoft/TypeScript/issues/14400
// TODO: convert the fn args to an object once we bump TS
export const widgetFactory = <ST extends Array<keyof JsonTypesTypeMap>>(
	displayName: string,
	uiOptions: Widget['uiOptions'],
	supportedTypes: ST,
) => {
	return <
		T extends object,
		ExtraProps extends {} = {},
		V extends WidgetProps['value'] | null = JsonTypesTypeMap[ST[number]],
	>(
		widgetFn: (
			props: Overwrite<WidgetProps<T>, { value: V }> & ExtraProps,
		) => JSX.Element | null,
	): Widget<T, ExtraProps> => {
		const widget = widgetFn as Widget<T, ExtraProps>;
		Object.assign(widget, {
			displayName,
			uiOptions,
			supportedTypes,
		});
		return widget;
	};
};

export const formatTimestamp = (
	timestamp: string | number,
	uiSchema: UiSchema = {},
) => {
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
};

export const truncateHash = (str: string, maxLength = 7) => {
	if (!str || str.length < maxLength) {
		return str;
	}

	return str.substring(0, maxLength);
};

export const timeSince = (timestamp: string | number, suffix = true) =>
	formatDistance(new Date(timestamp), new Date(), { addSuffix: suffix });
