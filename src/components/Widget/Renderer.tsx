import * as React from 'react';
import castArray from 'lodash/castArray';
import forEach from 'lodash/forEach';
import uniqBy from 'lodash/uniqBy';
import keys from 'lodash/keys';
import pick from 'lodash/pick';
import toPath from 'lodash/toPath';
import isArray from 'lodash/isArray';
import ajv, { type Ajv, type ValidateFunction, type ErrorObject } from 'ajv';
import type { JSONSchema7 as JSONSchema } from 'json-schema';
import {
	JsonTypes,
	Value,
	UiSchema,
	Format,
	transformUiSchema,
	getBestSchemaMatch,
} from './utils';
import {
	defaultFormats,
	WidgetWrapperUiOptions,
	WidgetMeta,
	typeWidgets,
} from './Formats';
import { Material, Tooltip } from '@balena/ui-shared-components';
const { Stack, Typography } = Material;

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

// Convert these to lodash paths once here to avoid having to do it for every single render
const widgetWrapperUiOptionKeyPaths = keys(WidgetWrapperUiOptions).map(toPath);

export const getType = (value?: Value) => {
	if (value === undefined) {
		return 'default';
	}
	if (value === null) {
		return 'null';
	}
	return isArray(value) ? 'array' : typeof value;
};

export const getWidget = (
	value?: Value,
	format?: string,
	uiSchemaWidget?: UiSchema['ui:widget'],
	extraFormats?: Format[],
) => {
	const valueType = getType(value);

	const extraFormat = extraFormats?.find(
		(extraFormat) =>
			(extraFormat.name === format || extraFormat.name === uiSchemaWidget) &&
			extraFormat.widget?.supportedTypes?.includes(valueType),
	);

	return extraFormat?.widget ?? typeWidgets[valueType] ?? typeWidgets.default;
};

type Validation = {
	validator: Ajv;
	validate: ValidateFunction;
};

const buildValidation = (
	schema?: JSONSchema,
	extraFormats?: Format[],
): Validation => {
	const validator = new ajv();
	forEach(extraFormats, ({ name, format }) => {
		validator.addFormat(name, format);
	});
	return {
		validator,
		validate: validator.compile(schema || {}),
	};
};

interface RendererProps extends React.HTMLAttributes<HTMLElement> {
	nested?: boolean;
	/** If set, the `value` will be validated against the `schema` and any error will be displayed at the top of the rendered output. Useful for debugging. */
	validate?: boolean;
	valueKey?: string;
	/** The data that should be rendere */
	value?: Value;
	// User should always provide a schema but internal calls for materialized field will have this undefined.
	/** A json schema describing the shape of the data you would like to render. */
	schema: JSONSchema | undefined;
	/** A configuration object used to change the styling and layout of the rendered data. */
	uiSchema?: UiSchema;
	/** An optional array of formats to pass to the validator, and an optional custom widget for the format. See [addFormat](https://github.com/ajv-validator/ajv#api-addformat) for details of formatters. */
	extraFormats?: Format[];
	/** Extra context used by `json-e` when transforming the UI schema. */
	extraContext?: object;
}

export const Renderer = ({
	value,
	schema,
	uiSchema,
	valueKey,
	extraFormats,
	extraContext,
	validate,
	nested,
	...props
}: RendererProps) => {
	const processedSchema = React.useMemo(() => {
		return getBestSchemaMatch(schema, value);
	}, [schema, value]);

	const formats = React.useMemo(
		() =>
			uniqBy(
				[...(extraFormats ?? []), ...defaultFormats],
				(format) => format.name,
			),
		[extraFormats, defaultFormats],
	);

	const [validation, setValidation] = React.useState<Validation | null>(
		validate && !nested ? buildValidation(processedSchema, formats) : null,
	);
	const [validationErrors, setValidationErrors] = React.useState<
		ErrorObject[] | null | undefined
	>(null);

	React.useEffect(() => {
		if (!validate || nested) {
			setValidationErrors(null);
			return;
		}
		setValidation(buildValidation(processedSchema, formats));
	}, [validate, nested, formats, processedSchema]);

	React.useEffect(() => {
		if (!validate || nested) {
			return;
		}
		let v = validation;
		if (!v) {
			v = buildValidation(processedSchema, formats);
			setValidation(v);
		}
		v.validate(value);
		setValidationErrors(v.validate.errors);
	}, [validate, nested, validation, value, processedSchema]);

	// Setting the UI Schema explicitly to null (as opposed to it being
	// undefined) indicates you don't want to render anything.
	if (uiSchema === null) {
		return null;
	}

	const processedUiSchema = transformUiSchema({
		value,
		uiSchema,
		extraContext,
	});
	const processedValue = getValue(value, processedSchema, processedUiSchema);

	const types =
		processedSchema?.type != null ? castArray(processedSchema.type) : [];
	if (
		processedValue === undefined ||
		(processedValue === null && !types.includes(JsonTypes.null))
	) {
		return null;
	}
	//TODO: Check if we can remove or improve as this should be probably handled by the widget
	const wrapperProps = pick(
		processedUiSchema['ui:options'] ?? {},
		widgetWrapperUiOptionKeyPaths,
	);
	const Widget = getWidget(
		processedValue,
		processedSchema?.format,
		processedUiSchema['ui:widget'],
		formats,
	);

	return (
		<Stack
			minWidth={0}
			minHeight={0}
			alignItems="flex-start"
			mb={1}
			flexDirection="column"
			{...props}
			{...wrapperProps}
		>
			{/* TODO: double check this implementation */}
			{validationErrors || !processedSchema ? (
				<Tooltip title={validation?.validator.errorsText(validationErrors)}>
					<Typography color="error">Invalid data/schema</Typography>
				</Tooltip>
			) : (
				<>
					<WidgetMeta
						schema={processedSchema}
						uiSchema={processedUiSchema}
						valueKey={valueKey}
					/>
					<Widget
						extraContext={extraContext}
						extraFormats={formats}
						value={processedValue}
						schema={processedSchema}
						uiSchema={processedUiSchema}
					/>
				</>
			)}
		</Stack>
	);
};
