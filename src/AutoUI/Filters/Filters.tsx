import React from 'react';
import type { JSONSchema7 as JSONSchema } from 'json-schema';
import { PersistentFilters } from './PersistentFilters';
import { AutoUIContext, AutoUIBaseResource } from '../schemaOps';
import { FilterRenderMode } from 'rendition';
import { useHistory } from '../../hooks/useHistory';
import { getFromLocalStorage, setToLocalStorage } from '../utils';
import {
	Filters as FiltersComponent,
	FiltersView,
} from '../../components/Filters';
import {
	modifySchemaWithRefSchemes,
	removeFieldsWithNoFilter,
	removeRefSchemeSeparatorsFromFilters,
} from './utils';

export interface FiltersProps<T> {
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

	// This is the function that will rework the schema taking in consideration x-ref-scheme and x-foreign-key-scheme.
	const reworkedSchema = React.useMemo(
		() => modifySchemaWithRefSchemes(filteredSchema),
		[filteredSchema],
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

	const onFiltersChange = (filters: JSONSchema[]) => {
		const reworkedFilters = removeRefSchemeSeparatorsFromFilters(filters);
		changeFilters(reworkedFilters);
	};

	return (
		<>
			{!!history && persistFilters ? (
				<PersistentFilters
					viewsRestorationKey={viewsRestorationKey}
					history={history}
					schema={reworkedSchema}
					filters={filters}
					views={storedViews}
					onFiltersChange={onFiltersChange}
					onViewsChange={viewsUpdate}
					renderMode={renderMode ?? DEFAULT_RENDER_MODE}
					onSearch={onSearch}
					showSaveView={showSaveView}
				/>
			) : (
				<FiltersComponent
					schema={filteredSchema}
					filters={filters}
					views={storedViews}
					onFiltersChange={changeFilters}
					onViewsChange={viewsUpdate}
					renderMode={renderMode ?? DEFAULT_RENDER_MODE}
					onSearch={onSearch}
					showSaveView={showSaveView}
				/>
			)}
		</>
	);
};
