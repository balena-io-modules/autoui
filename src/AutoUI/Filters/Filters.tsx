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

interface FiltersProps<T> {
	schema: JSONSchema;
	filters: JSONSchema[];
	views: FiltersView[];
	autouiContext: AutoUIContext<T>;
	changeFilters: (filters: JSONSchema[]) => void;
	changeViews: (views: FiltersView[]) => void;
	renderMode?: FilterRenderMode | FilterRenderMode[];
	onSearch?: (searchTerm: string) => React.ReactElement | null;
}

export const Filters = <T extends AutoUIBaseResource<T>>({
	schema,
	filters,
	views,
	changeFilters,
	changeViews,
	autouiContext,
	renderMode,
	onSearch,
}: FiltersProps<T>) => {
	const history = useHistory();
	return (
		<>
			{!!history ? (
				<PersistentFilters
					compact={[true, true, false, false]}
					viewsRestorationKey={`${autouiContext.resource}__views`}
					history={history}
					schema={schema}
					filters={filters}
					views={views}
					onFiltersUpdate={changeFilters}
					onViewsUpdate={changeViews}
					renderMode={renderMode ?? ['add', 'search', 'views']}
					onSearch={onSearch}
				/>
			) : (
				<RenditionFilters
					compact={[true, true, false, false]}
					schema={schema}
					filters={filters}
					views={views}
					onFiltersUpdate={changeFilters}
					onViewsUpdate={changeViews}
					renderMode={renderMode ?? ['add', 'search', 'views']}
					onSearch={onSearch}
				/>
			)}
		</>
	);
};
