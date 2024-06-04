import React from 'react';
import { designTokens, Material } from '@balena/ui-shared-components';
import { useTranslation } from '../../hooks/useTranslation';
import { Search } from './Search';
import { Views } from './Views';
import { FiltersDialog } from './FiltersDialog';
import {
	type FormData,
	createFullTextSearchFilter,
	randomUUID,
	FULL_TEXT_SLUG,
	parseFilterDescription,
} from './SchemaSieve';
import { Summary } from './Summary';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilter } from '@fortawesome/free-solid-svg-icons/faFilter';
import { useClickOutsideOrEsc } from '../../hooks/useClickOutsideOrEsc';
import type { JSONSchema7 as JSONSchema } from 'json-schema';
import { isJSONSchema } from '../../AutoUI/schemaOps';
import { getPropertySchemaAndModel } from '../../DataTypes';

const { Box, Button, useTheme, useMediaQuery } = Material;

export interface FiltersView {
	id: string;
	eventName: string;
	name: string;
	filters: JSONSchema[];
}

type FilterRenderMode = 'all' | 'add' | 'search' | 'views' | 'summary';

export interface FiltersProps {
	schema: JSONSchema;
	dark?: boolean;
	filters?: JSONSchema[];
	views?: FiltersView[];
	onFiltersChange?: (filters: JSONSchema[]) => void;
	onViewsChange?: (views: FiltersView[]) => void;
	renderMode?: FilterRenderMode | FilterRenderMode[];
	onSearch?: (searchTerm: string) => React.ReactElement | null;
	showSaveView?: boolean;
}

// TODO remove when we have implemented a dark theme
const darkStyles: Material.SxProps = {
	color: designTokens.color.text.value,
	backgroundColor: 'white',
	border: 'none',
	'&:hover': {
		backgroundColor: 'white',
	},
};

export const Filters = ({
	schema,
	dark,
	filters,
	views,
	onFiltersChange,
	onViewsChange,
	renderMode,
	onSearch,
	showSaveView,
}: FiltersProps) => {
	const { t } = useTranslation();
	const theme = useTheme();
	const matches = useMediaQuery(theme.breakpoints.up('sm'));
	const [showFilterDialog, setShowFilterDialog] = React.useState(false);
	const [showSearchDropDown, setShowSearchDropDown] = React.useState(false);
	const [searchString, setSearchString] = React.useState<string>('');
	const [editFilter, setEditFilter] = React.useState<JSONSchema>();
	const searchBarRef = useClickOutsideOrEsc<HTMLDivElement>(() =>
		setShowSearchDropDown(false),
	);

	const formData = React.useMemo(() => {
		if (!editFilter) {
			return;
		}
		if (editFilter.title === FULL_TEXT_SLUG) {
			const description = parseFilterDescription(editFilter);
			if (!description) {
				return;
			}
			return {
				field: description.field,
				operator: 'contains',
				value: description.value,
			};
		}
		return editFilter.anyOf
			?.map((f) => {
				if (!isJSONSchema(f)) {
					return;
				}
				const description = parseFilterDescription(f);
				if (!description) {
					return;
				}
				const { model } = getPropertySchemaAndModel(description?.field, schema);

				// We need to recalculate the operator, as it is provided as a value in the description instead of as a key.
				// TODO: The operator should be passed as an object in the description, not as a value.
				const operator = model
					? Object.entries(model.operators).find(
							([key, value]) =>
								value === description.operator || key === description.operator,
					  )?.[0] ?? description.operator
					: description.operator;
				return {
					field: description.field,
					operator,
					value: description.value,
				};
			})
			.filter((f) => !!f) as FormData[];
	}, [editFilter]);

	const handleFilterChange = React.useCallback(
		(filter: JSONSchema | null | undefined) => {
			if (!filter) {
				return;
			}
			let existingFilters = filters;
			if (editFilter && filters) {
				existingFilters = filters.filter((f) => f.$id !== editFilter.$id);
			}
			onFiltersChange?.([...(existingFilters ?? []), filter]);
		},
		[filters, onFiltersChange, editFilter],
	);

	const handleDeleteFilter = React.useCallback(
		(filter: JSONSchema) =>
			onFiltersChange?.(filters?.filter((f) => f.$id !== filter.$id) ?? []),
		[filters, onFiltersChange],
	);

	const handleSaveView = React.useCallback(
		(name: string) => {
			const view: FiltersView = {
				id: randomUUID(),
				name,
				eventName: `Saving filters view ${name}`,
				filters: filters ?? [],
			};
			const newViews = [...(views ?? []), view];
			onViewsChange?.(newViews);
		},
		[filters, views, onViewsChange],
	);

	const handleDeleteView = React.useCallback(
		(view: FiltersView) =>
			onViewsChange?.(views?.filter((v) => v.id !== view.id) ?? []),
		[views, onViewsChange],
	);

	return (
		<>
			<Box display="flex" alignItems="center" gap={2}>
				{(!renderMode || renderMode.includes('search')) && (
					<Box
						ref={searchBarRef}
						sx={{
							display: 'flex',
							flex: 1,
							position: 'relative',
							alignSelf: 'center',
							zIndex: 10,
						}}
					>
						<Search
							id="balena__filters_search_bar"
							dark={dark}
							onChange={(e) => {
								if (!e) {
									setSearchString('');
									setShowSearchDropDown(false);
									return;
								}
								setShowSearchDropDown(e.target.value !== '');
								setSearchString(e.target.value);
							}}
							onEnter={(event) => {
								event.preventDefault();
								event.stopPropagation();
								if (!searchString) {
									return;
								}
								const filter = createFullTextSearchFilter(schema, searchString);
								handleFilterChange(filter);
								setSearchString('');
							}}
							value={searchString}
						/>
						{searchString && showSearchDropDown && onSearch?.(searchString)}
					</Box>
				)}
				{(!renderMode || renderMode.includes('add')) && (
					<Button
						variant={dark ? 'light' : 'outlined'}
						onClick={() => setShowFilterDialog(true)}
						startIcon={matches ? <FontAwesomeIcon icon={faFilter} /> : null}
						sx={{
							whiteSpace: 'nowrap',
							...(dark && darkStyles),
						}}
					>
						{matches ? (
							t('actions.add_filter')
						) : (
							<FontAwesomeIcon icon={faFilter} />
						)}
					</Button>
				)}
				{(!renderMode || renderMode.includes('views')) && (
					<Views
						views={views}
						setFilters={(filters) => onFiltersChange?.(filters)}
						deleteView={handleDeleteView}
						dark={dark}
					/>
				)}
			</Box>
			{(!renderMode || renderMode.includes('summary')) && !!filters?.length && (
				<Summary
					onEdit={(filter) => {
						setEditFilter(filter);
					}}
					onDelete={handleDeleteFilter}
					onClearFilters={() => {
						onFiltersChange?.([]);
					}}
					showSaveView={showSaveView}
					onSaveView={({ name }) => handleSaveView(name)}
					filters={filters}
					dark={dark}
				/>
			)}
			{(showFilterDialog || formData) && (
				<FiltersDialog
					onClose={(filter) => {
						handleFilterChange(filter);
						setShowFilterDialog(false);
						setEditFilter(undefined);
					}}
					schema={schema}
					data={formData}
				/>
			)}
		</>
	);
};
