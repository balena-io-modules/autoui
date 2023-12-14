import React from 'react';
import type { JSONSchema7 as JSONSchema } from 'json-schema';
import { PersistentFilters } from './PersistentFilters';
import { AutoUIContext, AutoUIBaseResource } from '../schemaOps';
import {
	FilterRenderMode,
	FiltersView,
	Filters as RenditionFilters,
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
					schema={schema}
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
					schema={schema}
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
