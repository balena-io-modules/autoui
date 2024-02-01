import React from 'react';
import type {
	JSONSchema7 as JSONSchema,
	JSONSchema7Definition as JSONSchemaDefinition,
} from 'json-schema';
import { PersistentFilters } from './PersistentFilters';
import { AutoUIContext, AutoUIBaseResource } from '../schemaOps';
import {
	FilterRenderMode,
	FiltersView,
	Filters as RenditionFilters,
	SchemaSieve as sieve,
} from 'rendition';
import { useHistory } from '../../hooks/useHistory';
import { getFromLocalStorage, setToLocalStorage } from '../utils';

interface FiltersProps<T> {
	schema: JSONSchema;
	filters: JSONSchema[];
	views: FiltersView[];
	autouiContext: AutoUIContext<T>;
	changeFilters: (filters: JSONSchema[]) => void;
	changeViews: (views: FiltersView[]) => void;
	renderMode?: FilterRenderMode | FilterRenderMode[];
	onSearch?: (searchTerm: string) => React.ReactElement | null;
	showSaveView?: boolean;
	persistFilters?: boolean;
}

const removeXNoFilterFromObj = (
	properties: JSONSchema['properties'],
	xNoFilter: string[] | boolean | undefined,
): JSONSchema['properties'] => {
	if (!properties || !Array.isArray(xNoFilter)) {
		return properties;
	}
	const xNoFilterSet = new Set(xNoFilter);
	return Object.fromEntries(
		Object.keys(properties)
			.filter((propKey) => !xNoFilterSet.has(propKey))
			.map((propKey) => [propKey, properties[propKey]]),
	);
};

const removeFieldsWithNoFilter = (schema: JSONSchema): JSONSchema => {
	const processProperties = (
		properties: JSONSchema['properties'] | undefined,
		prevXNoFilter?: string[] | boolean,
	): JSONSchema['properties'] | undefined => {
		if (!properties) {
			return undefined;
		}

		const newProperties: JSONSchema['properties'] = {};
		for (const [key, value] of Object.entries(properties)) {
			// if boolean keep boolean values as is
			if (typeof value === 'boolean') {
				newProperties[key] = value;
				continue;
			}
			// Extract x-no-filter if available
			const xNoFilter =
				sieve.parseDescriptionProperty<string[] | boolean | undefined>(
					value,
					'x-no-filter',
				) ?? prevXNoFilter;

			if (xNoFilter === true) {
				// Exclude property entirely if xNoFilter is true
				continue;
			}

			const newValue: JSONSchemaDefinition = { ...value };

			if ('properties' in value) {
				newValue.properties = processProperties(value.properties, xNoFilter);
			}

			// we are not considering the case where items is an array. Should be added if necessary
			if (
				value.items &&
				typeof value.items === 'object' &&
				!Array.isArray(value.items)
			) {
				if ('properties' in value.items) {
					newValue.items = {
						...value.items,
						properties: processProperties(value.items.properties, xNoFilter),
					};
				}
			}

			// Apply removal logic for specified properties if xNoFilter is an array
			if (Array.isArray(xNoFilter) && newValue.properties) {
				newValue.properties = removeXNoFilterFromObj(
					newValue.properties,
					xNoFilter,
				);
			}

			newProperties[key] = newValue;
		}

		return newProperties;
	};

	if (schema.properties) {
		schema = {
			...schema,
			properties: processProperties(schema.properties),
		};
	}
	return schema;
};

const DEFAULT_RENDER_MODE = (['add', 'search', 'views'] as const).slice();

export const Filters = <T extends AutoUIBaseResource<T>>({
	schema,
	filters,
	views,
	changeFilters,
	changeViews,
	autouiContext,
	renderMode,
	onSearch,
	showSaveView,
	persistFilters,
}: FiltersProps<T>) => {
	const history = useHistory();

	const filteredSchema = React.useMemo(
		() => removeFieldsWithNoFilter(schema),
		[schema],
	);

	// We store views in any case as views should persist in both cases PersistentFilters and RenditionFilters
	const viewsRestorationKey = `${autouiContext.resource}__views`;
	const storedViews = React.useMemo(
		() =>
			views.length
				? views
				: getFromLocalStorage<FiltersView[]>(viewsRestorationKey) ?? [],
		[viewsRestorationKey, views],
	);

	const viewsUpdate = (views: FiltersView[]) => {
		setToLocalStorage(viewsRestorationKey, views);
		changeViews?.(views);
	};

	return (
		<>
			{!!history && persistFilters ? (
				<PersistentFilters
					viewsRestorationKey={viewsRestorationKey}
					history={history}
					schema={filteredSchema}
					filters={filters}
					views={storedViews}
					onFiltersUpdate={changeFilters}
					onViewsUpdate={viewsUpdate}
					renderMode={renderMode ?? DEFAULT_RENDER_MODE}
					onSearch={onSearch}
					compact={[true, true, false]}
					showSaveView={showSaveView}
				/>
			) : (
				<RenditionFilters
					schema={filteredSchema}
					filters={filters}
					views={storedViews}
					onFiltersUpdate={changeFilters}
					onViewsUpdate={viewsUpdate}
					renderMode={renderMode ?? DEFAULT_RENDER_MODE}
					onSearch={onSearch}
					compact={[true, true, false]}
					showSaveView={showSaveView}
				/>
			)}
		</>
	);
};
