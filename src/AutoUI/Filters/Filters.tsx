import React from 'react';
import type { JSONSchema7 as JSONSchema } from 'json-schema';
import { PersistentFilters } from './PersistentFilters';
import { useNavigate } from '../../hooks/useNavigate';
import type { FiltersView } from '../../components/Filters';
import {
	type FilterRenderMode,
	Filters as FiltersComponent,
} from '../../components/Filters';
import {
	modifySchemaWithRefSchemes,
	removeFieldsWithNoFilter,
	removeRefSchemeSeparatorsFromFilters,
} from './utils';

export interface FiltersProps {
	schema: JSONSchema;
	filters: JSONSchema[];
	views: FiltersView[];
	changeFilters: (filters: JSONSchema[]) => void;
	changeViews: (views: FiltersView[]) => void;
	viewsRestorationKey?: string;
	renderMode?: FilterRenderMode | FilterRenderMode[];
	onSearch?: (searchTerm: string) => React.ReactElement | null;
	persistFilters?: boolean;
}

const DEFAULT_RENDER_MODE = (['add', 'search', 'views'] as const).slice();

export const Filters = ({
	schema,
	filters,
	views,
	changeFilters,
	changeViews,
	viewsRestorationKey,
	renderMode,
	onSearch,
	persistFilters,
}: FiltersProps) => {
	const navigate = useNavigate();

	const filteredSchema = React.useMemo(
		() => removeFieldsWithNoFilter(schema),
		[schema],
	);

	// This is the function that will rework the schema taking in consideration x-ref-scheme and x-foreign-key-scheme.
	const reworkedSchema = React.useMemo(
		() => modifySchemaWithRefSchemes(filteredSchema),
		[filteredSchema],
	);

	const onFiltersChange = (updatedFilters: JSONSchema[]) => {
		const reworkedFilters =
			removeRefSchemeSeparatorsFromFilters(updatedFilters);
		changeFilters(reworkedFilters);
	};

	return (
		<>
			{!!navigate && persistFilters ? (
				<PersistentFilters
					viewsRestorationKey={viewsRestorationKey}
					navigate={navigate}
					schema={reworkedSchema}
					filters={filters}
					views={views}
					onFiltersChange={onFiltersChange}
					onViewsChange={changeViews}
					renderMode={renderMode ?? DEFAULT_RENDER_MODE}
					onSearch={onSearch}
				/>
			) : (
				<FiltersComponent
					viewsRestorationKey={viewsRestorationKey}
					schema={filteredSchema}
					filters={filters}
					views={views}
					onFiltersChange={changeFilters}
					onViewsChange={changeViews}
					renderMode={renderMode ?? DEFAULT_RENDER_MODE}
					onSearch={onSearch}
				/>
			)}
		</>
	);
};
