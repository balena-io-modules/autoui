import React from 'react';
import { useLocation } from 'react-router';
import type { AutoUIModel, AutoUIBaseResource } from '../AutoUI/schemaOps';
import type { OpenApiJson } from './openApiJson';
import {
	getAllNaturalPropertiesKeys,
	getSelectableOptions,
	getSchemaFromLocation,
	pine,
	getFromRef,
} from './odata';
import type { AutoUIAction } from '../AutoUI';
import { AutoUI, autoUIRunTransformers } from '../AutoUI';
import { findInObject } from '../AutoUI/utils';
import isEmpty from 'lodash/isEmpty';
import { ActionMethods } from '.';
import type { ActionSidebarProps } from './ActionSidebar';
import { useRequest } from 'rendition';
import { useHistory } from '../hooks/useHistory';
import type { JSONSchema7 as JSONSchema } from 'json-schema';

interface ContentProps {
	openApiJson: OpenApiJson;
	openActionSidebar: (info: Omit<ActionSidebarProps, 'openApiJson'>) => void;
}

const updateSchema = (schema: JSONSchema) => {
	if (!schema.properties) {
		return schema;
	}
	// Add readable "title" on all properties
	const newSchema = {
		...schema,
		properties: Object.entries(schema.properties).reduce(
			(acc, [key, value]) =>
				typeof value === 'object'
					? { ...acc, [key]: { ...value, title: key.split('_').join(' ') } }
					: { ...acc, [key]: value },
			{},
		),
	};
	return newSchema;
};

const generateModel = (
	schema: JSONSchema,
	resourceName: string,
	naturalPropertiesKeys: string[],
) => {
	const [firstPropertyKey, ...otherPropertyKeys] = naturalPropertiesKeys;
	return {
		resource: resourceName,
		schema: updateSchema(schema),
		permissions: {
			read: [firstPropertyKey, ...otherPropertyKeys],
			create: [firstPropertyKey],
			update: [],
			delete: false,
		},
		priorities: {
			primary: [firstPropertyKey],
			secondary: [...otherPropertyKeys],
			tertiary: [],
		},
	} as AutoUIModel<AutoUIBaseResource<unknown>>;
};

export const Content = ({ openApiJson, openActionSidebar }: ContentProps) => {
	const { pathname } = useLocation();
	const history = useHistory();
	const resourceName = pathname.replace(/^([^]*).*$/, '$1');
	const id = pathname.substring(pathname.lastIndexOf('/') + 1);
	const endsWithValidId = !isNaN(parseInt(id, 10));
	const schema = getSchemaFromLocation(openApiJson, resourceName);
	const naturalPropertiesKeys = getAllNaturalPropertiesKeys(schema?.properties);
	const correspondingPath = !endsWithValidId
		? openApiJson.paths[`/${resourceName}`]
		: openApiJson.paths[`/${resourceName}({id})`];

	const [data] = useRequest<
		() => Promise<unknown>,
		AutoUIBaseResource<unknown> | Array<AutoUIBaseResource<unknown>>
	>(
		async () =>
			await pine.get({
				resource: resourceName,
				...(endsWithValidId && { id }),
				options: {
					$select: [...getSelectableOptions(correspondingPath)],
				},
			}),
		[openApiJson, pathname],
		{ polling: false },
	);

	const model = React.useMemo(() => {
		if (!schema) {
			return null;
		}
		return generateModel(schema, resourceName, naturalPropertiesKeys);
	}, [schema, resourceName, naturalPropertiesKeys]);

	const memoizedData = React.useMemo(
		() =>
			autoUIRunTransformers(
				data,
				{
					// we have to remove the contract until we find a way to render complex objects;
					contract: () => null,
					__permissions: () => model?.permissions,
				},
				{},
			),
		[data, model],
	);

	const memoizedActions: Array<AutoUIAction<unknown>> | undefined =
		React.useMemo(() => {
			if (!correspondingPath) {
				return undefined;
			}
			return Object.entries(correspondingPath)
				.filter(([pathkey]) =>
					[
						ActionMethods.POST,
						ActionMethods.PATCH,
						ActionMethods.DELETE,
					].includes(pathkey as ActionMethods),
				)
				.map(([pathKey, pathDescription]) => {
					const requestSchemaRef = findInObject(
						pathDescription.requestBody,
						'$ref',
					);
					const requestSchema = requestSchemaRef
						? getFromRef(openApiJson, requestSchemaRef)
						: id;
					if (pathKey === ActionMethods.POST) {
						return {
							title: `Add ${resourceName}`,
							type: 'create',
							actionFn: () => {
								openActionSidebar({
									action: ActionMethods.POST,
									schema: requestSchema,
									resourceName,
									id,
								});
							},
						};
					}
					if (pathKey === ActionMethods.PATCH) {
						return {
							title: `Update ${resourceName}`,
							type: 'update',
						};
					}
					// Since we filter by pathKey only POST, PATCH and DELETE methods, we can assume that this will be the DELETE case
					return {
						title: `Delete ${resourceName}`,
						type: 'delete',
					};
				});
		}, [correspondingPath, id, openActionSidebar, openApiJson, resourceName]);

	if (!model) {
		return <>Could not generate a model</>;
	}

	if (!memoizedData || isEmpty(memoizedData)) {
		return <>No data</>;
	}

	return (
		<AutoUI
			model={model}
			actions={memoizedActions}
			data={memoizedData}
			{...(!endsWithValidId && {
				onEntityClick: (entity) => {
					if (
						history != null &&
						typeof history === 'object' &&
						'push' in history &&
						typeof history.push === 'function'
					) {
						// react-router-dom v5 history object
						history.push(`${pathname}/${entity.id}`);
					} else if (typeof history === 'function') {
						// react-router-dom v6 navigate function
						history(`${pathname}/${entity.id}`);
					}
				},
			})}
		/>
	);
};
