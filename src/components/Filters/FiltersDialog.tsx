import React from 'react';
import type { IChangeEvent } from '@balena/ui-shared-components';
import {
	DialogWithCloseButton,
	Material,
	RJSForm,
	SelectWidget,
	type ArrayFieldTemplateProps,
} from '@balena/ui-shared-components';
import { useTranslation } from '../../hooks/useTranslation';
import type {
	JSONSchema7 as JSONSchema,
	JSONSchema7Definition as JSONSchemaDefinition,
} from 'json-schema';
import { getDataModel, getPropertySchemaAndModel } from '../../DataTypes';
import {
	createFilter,
	createFullTextSearchFilter,
	getPropertySchema,
	type FormData,
} from './SchemaSieve';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons/faTimes';
import { faPlus } from '@fortawesome/free-solid-svg-icons/faPlus';
import { getRefSchema } from '../../AutoUI/schemaOps';
import { findInObject } from '../../AutoUI/utils';
import validator from '@rjsf/validator-ajv8';

const { Box, Button, IconButton, Typography, DialogContent } = Material;

const ArrayFieldTemplate: React.FC<ArrayFieldTemplateProps> = ({
	items,
	canAdd,
	onAddClick,
}) => {
	const { t } = useTranslation();
	return (
		<>
			{items?.map((element, index) => {
				return (
					<Box key={element.key}>
						{index > 0 && (
							<Typography
								sx={{
									width: 'calc(100% - 50px)',
									textAlign: 'center',
									fontWeight: 'bold',
								}}
							>
								{t('commons.or').toUpperCase()}
							</Typography>
						)}
						<Box
							sx={{
								display: 'flex',
								'& .form-group.field.field-object': {
									display: 'flex',
									flex: 1,
								},
								'& label': {
									display: 'none',
								},
								// This is necessary to remove the gap of Tags label. RJSF render nested objects  with multi label levels.
								'.MuiGrid-root > .form-group.field.field-object > .MuiFormControl-root > .MuiGrid-root.MuiGrid-container.MuiGrid-spacing-xs-2':
									{
										marginTop: '-8px!important',
									},
							}}
						>
							{element.children}
							<Box
								display="flex"
								width="50px"
								alignItems="center"
								justifyContent="center"
							>
								{index !== 0 && (
									<IconButton
										aria-label={t('actions.remove_filter')}
										onClick={element.onDropIndexClick(element.index)}
										sx={{ mt: 2 }}
									>
										<FontAwesomeIcon icon={faTimes} />
									</IconButton>
								)}
							</Box>
						</Box>
						<Box display="flex" my={2}>
							{canAdd && index === items.length - 1 && (
								<Button
									aria-label={t('aria_labels.add_filter_in_or')}
									variant="text"
									color="primary"
									onClick={onAddClick}
									startIcon={<FontAwesomeIcon icon={faPlus} />}
								>
									{t('actions.add_alternative')}
								</Button>
							)}
						</Box>
					</Box>
				);
			})}
		</>
	);
};

const widgets = {
	CheckboxWidget: SelectWidget,
};

const initialFormData = [
	{
		field: undefined,
		operator: undefined,
		value: undefined,
	},
];

const getDefaultValue = (
	data: FormData | undefined,
	propertySchema: JSONSchema | undefined,
) => {
	if (data?.value !== undefined) {
		return data.value;
	}
	if (!propertySchema) {
		return undefined;
	}
	const schemaEnum = findInObject(propertySchema, 'enum');
	const schemaOneOf = findInObject(propertySchema, 'oneOf');

	return schemaEnum?.[0] !== undefined
		? schemaEnum?.[0]
		: schemaOneOf?.[0]?.const;
};

const normalizeFormData = (
	data: FormData[] | FormData | undefined,
	schema: JSONSchema,
) => {
	if (!data || !Array.isArray(data)) {
		return data;
	}
	return data.map((d) => {
		if (!schema.properties) {
			return d;
		}
		const field = d?.field ?? Object.keys(schema.properties)[0];
		const propertySchema = getPropertySchema(field, schema);
		const prefix =
			propertySchema?.type === 'array' ? 'items.properties.' : 'properties.';
		const refSchema = propertySchema
			? getRefSchema(propertySchema, prefix)
			: propertySchema;
		const model = getDataModel(refSchema);
		const operator = model
			? (Object.keys(model.operators).find((o) => o === d?.operator) ??
				Object.keys(model.operators)[0])
			: undefined;

		return {
			field: d?.field ?? field,
			operator,
			value: getDefaultValue(d, propertySchema),
		};
	});
};

interface FiltersDialogProps {
	schema: JSONSchema;
	onClose: ((filter?: JSONSchema | null) => void) | undefined;
	data?: FormData[] | FormData;
}

export const FiltersDialog = ({
	schema,
	data = initialFormData,
	onClose,
}: FiltersDialogProps) => {
	const { t } = useTranslation();
	const [formData, setFormData] = React.useState<
		FormData[] | FormData | undefined
	>(normalizeFormData(data, schema));
	// This ensures that validation errors only appear after the user first submit, providing a better user experience.
	// See react-jsonschema-form issue #512 for more details: https://github.com/rjsf-team/react-jsonschema-form/issues/512
	const [isFirstValidation, setIsFirstValidation] = React.useState(true);

	const handleChange = React.useCallback(
		({ formData: fData }: IChangeEvent<FormData[]>) => {
			if (Array.isArray(formData) && formData.length !== fData.length) {
				setIsFirstValidation(true);
			}
			// Unfortunately we cannot detect which field is changing so we need to set a previous state
			// github.com/rjsf-team/react-jsonschema-form/issues/718
			const newFormData = Array.isArray(formData)
				? fData.map((d, i) => {
						if (
							formData?.[i]?.field &&
							formData[i]?.operator &&
							(d.field !== formData[i].field ||
								d.operator !== formData[i].operator)
						) {
							setIsFirstValidation(true);
							return { ...d, value: undefined };
						}
						return d;
					})
				: fData;

			setFormData(normalizeFormData(newFormData, schema));
		},
		[setFormData, formData, schema],
	);

	const handleSubmit = ({
		formData: submittedFormData,
	}: IChangeEvent<FormData[] | FormData>) => {
		setIsFirstValidation(false);
		if (!onClose) {
			return;
		}
		const filters = Array.isArray(submittedFormData)
			? createFilter(schema, submittedFormData)
			: submittedFormData.value
				? createFullTextSearchFilter(schema, submittedFormData.value)
				: null;
		onClose(filters);
	};

	const internalSchemaAndUiSchema = React.useMemo(() => {
		const { properties } = schema;
		if (!properties) {
			return undefined;
		}

		if (!Array.isArray(formData)) {
			return {
				schema: {
					type: 'object',
					properties: {
						field: {
							title: '',
							type: 'string',
						},
						operator: {
							title: '',
							type: 'string',
						},
						value: {
							title: '',
							type: 'string',
						},
					},
				},
				uiSchema: {
					'ui:grid': {
						field: { xs: 4, sm: 4 },
						operator: { xs: 4, sm: 4 },
						value: { xs: 4, sm: 4 },
					},
					field: {
						'ui:readonly': true,
					},
					operator: {
						'ui:readonly': true,
					},
				},
			};
		}

		const oneOf = Object.entries(properties)
			/* since properties is of type JSONSchemaDefinition = JSONSchema | boolean,
			 * we need to remove all possible boolean values
			 */
			.filter(
				([_k, v]: [string, JSONSchemaDefinition]) => typeof v !== 'boolean',
			)
			.map(([key, property]: [string, JSONSchema]) => ({
				title: property.title,
				const: key,
			}));

		const uiSchema = {
			'ui:ArrayFieldTemplate': ArrayFieldTemplate,
			items: {
				'ui:grid': {
					field: { xs: 4, sm: 4 },
					operator: { xs: 4, sm: 4 },
					value: { xs: 4, sm: 4 },
				},
				value: {},
			},
		};

		return {
			schema: {
				type: 'array',
				minItems: 1,
				items: formData.map((fd, index) => {
					const schemaField: JSONSchema = {
						$id: `filter-dialog-item-${index}`,
						title: 'Field',
						type: 'string',
						oneOf,
					};
					const { propertySchema, model } = getPropertySchemaAndModel(
						fd?.field ?? oneOf[0].const,
						schema,
					);
					if (!model) {
						return {};
					}
					const rendererSchema =
						model.rendererSchema(schemaField, index, propertySchema, fd) ?? {};
					// This if statement is needed to display objects in a nice way.
					// Would be nice to find a better way and keep schema and uiSchema separated
					if (propertySchema?.type === 'object') {
						if (!propertySchema.properties) {
							return rendererSchema;
						}
						uiSchema.items.value = Object.fromEntries(
							Object.entries(propertySchema.properties).map(
								([key, value]: [string, JSONSchema]) => [
									key,
									{
										'ui:title': '',
										'ui:placeholder': value.title + '*',
									},
								],
							),
						);
					}
					return rendererSchema;
				}),
				additionalItems: {
					$id: 'filter-dialog-additional-item-0',
					field: formData?.[0].field,
					operator: formData?.[0].operator,
					value: undefined,
				},
			},
			uiSchema,
		};
	}, [formData, schema]);

	if (!internalSchemaAndUiSchema) {
		return null;
	}

	return (
		<DialogWithCloseButton
			fullWidth
			title={t('labels.filter_by')}
			onClose={() => {
				setFormData(initialFormData);
				onClose?.();
			}}
			open
		>
			<DialogContent>
				<RJSForm
					fullWidth
					onChange={handleChange}
					onSubmit={handleSubmit}
					{...internalSchemaAndUiSchema}
					formData={formData}
					widgets={widgets}
					validator={validator}
					liveValidate={!isFirstValidation}
					submitButtonProps={{
						sx: {
							mt: 2,
							float: 'right',
						},
						onClick: () => {
							setIsFirstValidation(false);
						},
					}}
				/>
			</DialogContent>
		</DialogWithCloseButton>
	);
};
