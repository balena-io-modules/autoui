import React from 'react';
import { ActionMethods, ACTION_SIDEBAR_WIDTH } from '.';
import { OpenApiJson } from './openApiJson';
import { getFromRef, pine } from './odata';
import { ISubmitEvent } from '@rjsf/core';
import { Form, notifications } from 'rendition';
import { Material } from '@balena/ui-shared-components';
import { useTranslation } from '../hooks/useTranslation';
import { faTimes } from '@fortawesome/free-solid-svg-icons/faTimes';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { JSONSchema7 as JSONSchema } from 'json-schema';

const { Button, Box, styled } = Material;

const replaceRefValues = (
	object: JSONSchema,
	openApiJson: OpenApiJson,
): JSONSchema => {
	if (object === null || typeof object !== 'object') {
		return object;
	}

	// Handle array just by handling their contents
	if (Array.isArray(object)) {
		return object.map((value) =>
			replaceRefValues(value, openApiJson),
		) as JSONSchema;
	}

	const build: any = {};
	for (const key in object) {
		if (object.hasOwnProperty(key)) {
			let value = object[key as keyof JSONSchema] as JSONSchema;

			// If this is an object, containing the $ref, evaluate it
			if (typeof value === 'object' && !!value['$ref']) {
				value = getFromRef(openApiJson, value['$ref']);
			}

			// If this is an object without $ref, recurse
			if (typeof value === 'object' && !value['$ref']) {
				value = replaceRefValues(value, openApiJson);
			}

			build[key] = value;
		}
	}
	return build as JSONSchema;
};

const ActionSidebarWrapper = styled(Box)(() => ({
	display: 'flex',
	borderLeft: '1px solid black',
	position: 'absolute',
	right: 0,
	top: 0,
	bottom: 0,
	zIndex: 9,
	width: `${ACTION_SIDEBAR_WIDTH}px`,
	background: 'white',
	overflow: 'scroll',
}));

export interface ActionSidebarProps {
	resourceName: string;
	openApiJson: OpenApiJson;
	action: ActionMethods;
	schema: JSONSchema;
	id?: string;
	onClose?: () => void;
}

export const ActionSidebar = ({
	resourceName,
	openApiJson,
	action,
	schema,
	id,
	onClose,
}: ActionSidebarProps) => {
	const { t } = useTranslation();
	const memoizedReferenceSchema = React.useMemo(() => {
		return replaceRefValues(schema, openApiJson);
	}, [schema, openApiJson]);

	const submit = async ({
		formData,
	}: ISubmitEvent<JSONSchema['properties']>) => {
		if (action === ActionMethods.POST) {
			try {
				await pine.post({
					resource: resourceName,
					...(id && !isNaN(parseInt(id, 10)) && { id }),
					body: formData,
				});
				notifications.addNotification({
					content: t('success.resource_added_successfully', {
						name: resourceName,
					}),
					type: 'danger',
				});
			} catch (err) {
				notifications.addNotification({
					content: err.message ?? err,
					type: 'danger',
				});
			}
		}
	};

	return (
		<ActionSidebarWrapper p={3} flexDirection="column">
			<Box display="flex" justifyContent="end">
				<Button
					variant="text"
					onClick={onClose}
					startIcon={<FontAwesomeIcon icon={faTimes} />}
				/>
			</Box>
			<Form my={2} schema={memoizedReferenceSchema} onFormSubmit={submit} />
		</ActionSidebarWrapper>
	);
};
