import React from 'react';
import {
	AutoUIAction,
	AutoUIModel,
	AutoUIBaseResource,
	getFieldForFormat,
	AutoUIContext,
	AutoUIRawModel,
	autoUIJsonSchemaPick,
	ActionData,
	Priorities,
	AutoUITagsSdk,
} from './schemaOps';
import { LensSelection } from './Lenses/LensSelection';
import type { JSONSchema7 as JSONSchema } from 'json-schema';
import isEqual from 'lodash/isEqual';
import { Filters } from './Filters/Filters';
import { Tags } from './Actions/Tags';
import { Update } from './Actions/Update';
import { Create } from './Actions/Create';
import {
	autoUIAdaptRefScheme,
	autoUIAddToSchema,
	autoUIDefaultPermissions,
	autoUIGetModelForCollection,
	autoUIRunTransformers,
	getHeaderLink,
} from './models/helpers';
import {
	autoUIGetDisabledReason,
	getFromLocalStorage,
	getTagsDisabledReason,
	setToLocalStorage,
	getSelected,
	getSortingFunction,
} from './utils';
import { FocusSearch } from './Filters/FocusSearch';
import { CustomWidget } from './CustomWidget';
import {
	defaultFormats,
	Dictionary,
	FiltersView,
	Format,
	TableColumn,
	SchemaSieve as sieve,
	Link,
	Pagination,
	TableSortOptions,
	CheckedState,
} from 'rendition';
import { getLenses, LensTemplate } from './Lenses';
import { TFunction, useTranslation } from '../hooks/useTranslation';
import { useHistory } from '../hooks/useHistory';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleQuestion } from '@fortawesome/free-regular-svg-icons';
import {
	type PineFilterObject,
	convertToPineClientFilter,
	orderbyBuilder,
} from '../oData/jsonToOData';
import { CollectionLensRendererProps } from './Lenses/types';
import pickBy from 'lodash/pickBy';
import { NoRecordsFoundView } from './NoRecordsFoundView';
import { Material, Spinner } from '@balena/ui-shared-components';
const { Box, styled } = Material;

const DEFAULT_ITEMS_PER_PAGE = 50;

const HeaderGrid = styled(Box)(({ theme }) => ({
	display: 'flex',
	rowGap: theme.spacing(2),
	'> *': {
		'&:first-child': {
			marginRight: 1,
		},
		'&:not(:last-child):not(:first-child)': {
			marginRight: 1,
			marginLeft: 1,
		},
		'&:last-child': {
			marginLeft: 1,
		},
	},
}));

export interface NoDataInfo {
	title?: string | JSX.Element;
	subtitle?: string | JSX.Element;
	info?: string | JSX.Element;
	description?: string | JSX.Element;
	docsLink?: string;
	docsLabel?: string;
}

export interface AutoUIProps<T> extends Omit<Material.BoxProps, 'onChange'> {
	/** Model is the property that describe the data to display with a JSON structure */
	model: AutoUIModel<T>;
	/** Array of data or data entity to display */
	data: T[] | T | undefined;
	/** Formats are custom widgets to render in the table cell. The type of format to display is described in the model. */
	formats?: Format[];
	/** Actions is an array of actions applicable on the selected items */
	actions?: Array<AutoUIAction<T>>;
	/** The sdk is used to pass the method to handle tags when added removed or updated */
	sdk?: { tags: AutoUITagsSdk<T> };
	/** Dictionary of {[column_property]: customFunction} where the customFunction is the function to sort data on column header click */
	customSort?: Dictionary<(a: T, b: T) => number> | Dictionary<string>;
	// TODO: Ideally the base URL is autogenerated, but there are some issues with that currently (eg. instead of application we have apps in the URL)
	/** Redirect on entity click */
	getBaseUrl?: (entry: T) => string;
	/** Method to refresh the rendered data when something is changed */
	refresh?: () => void;
	/** Event emitted on entity click */
	onEntityClick?: (
		entry: T,
		event: React.MouseEvent<HTMLAnchorElement, MouseEvent>,
	) => void;
	// TODO: onChange should also be called when data in the table is sorted and when columns change
	/** Function that gets called when filters change */
	onChange?: (changes: {
		filters?: JSONSchema[];
		page: number;
		itemsPerPage?: number;
		oData?: {
			$top?: number;
			$skip?: number;
			$filter?: any;
			$orderby?: any;
		} | null;
	}) => void;
	/** Information from a server side pagination */
	pagination?: Pagination;
	/** All the lenses available for this AutoUI component. Any default lenses will automatically be added to this array. */
	customLenses?: LensTemplate[];
	/** Additional context for picking the right lens */
	lensContext?: object;
	/** Loading property to show the Spinner */
	loading?: boolean;
	rowKey?: keyof T;
	noDataInfo?: NoDataInfo;
	persistFilters?: boolean;
}

export const AutoUI = <T extends AutoUIBaseResource<T>>({
	model: modelRaw,
	data,
	formats,
	actions,
	sdk,
	customSort,
	refresh,
	getBaseUrl,
	onEntityClick,
	onChange,
	pagination,
	customLenses,
	lensContext,
	loading,
	rowKey,
	noDataInfo,
	persistFilters = true,
	...boxProps
}: AutoUIProps<T>) => {
	const { t } = useTranslation();
	const history = useHistory();

	const modelRef = React.useRef(modelRaw);
	// This allows the component to work even if
	// consumers are passing a new model object every time.
	const model = React.useMemo(() => {
		if (isEqual(modelRaw, modelRef.current)) {
			return modelRef.current;
		}
		return modelRaw;
	}, [modelRaw]);

	const [filters, setFilters] = React.useState<JSONSchema[]>([]);
	const [sort, setSort] = React.useState<TableSortOptions<T> | null>(null);
	const [internalPagination, setInternalPagination] = React.useState<{
		page: number;
		itemsPerPage: number;
	}>({
		page: 0,
		itemsPerPage: pagination?.itemsPerPage ?? DEFAULT_ITEMS_PER_PAGE,
	});
	const [views, setViews] = React.useState<FiltersView[]>([]);
	const [selected, setSelected] = React.useState<T[] | undefined>([]);
	const [checkedState, setCheckedState] = React.useState<CheckedState>('none');
	const [internalPineFilter, setInternalPineFilter] = React.useState<
		PineFilterObject | null | undefined
	>();
	const [isBusyMessage, setIsBusyMessage] = React.useState<
		string | undefined
	>();
	const [actionData, setActionData] = React.useState<
		ActionData<T> | undefined
	>();

	const $setFilters = React.useCallback(
		(updatedFilters: JSONSchema[]) => {
			setFilters(updatedFilters);
			internalOnChange(
				updatedFilters,
				sort,
				internalPagination.page,
				internalPagination.itemsPerPage,
			);
		},
		[setFilters, onChange],
	);

	const $setSelected = React.useCallback<
		CollectionLensRendererProps<T>['changeSelected']
	>(
		(items, checkedState = undefined) => {
			setSelected(items);
			setCheckedState(checkedState ?? 'none');
			if (!!actionData) {
				setActionData({ ...actionData, affectedEntries: items, checkedState });
			}
		},
		[setSelected, setActionData, actionData],
	);
	const hideUtils = React.useMemo(
		() =>
			(!filters || filters.length === 0) &&
			Array.isArray(data) &&
			data.length === 0,
		[data, filters],
	);

	const filtered = React.useMemo(() => {
		if (pagination?.serverSide) {
			return (data ?? []) as T[];
		}
		return (Array.isArray(data) ? sieve.filter(filters, data) : []) as T[];
	}, [pagination?.serverSide, data, filters]);

	React.useEffect(() => {
		$setSelected([], 'none');
	}, [filters]);

	const onActionTriggered = React.useCallback((actionData: ActionData<T>) => {
		setActionData(actionData);
		if (actionData.action.actionFn) {
			actionData.action.actionFn({
				affectedEntries: actionData.affectedEntries,
				checkedState: checkedState || 'none',
				setSelected: $setSelected,
			});
		}
	}, []);

	const defaultLensSlug = getFromLocalStorage(`${model.resource}__view_lens`);

	const lenses = React.useMemo(
		() => getLenses(data, lensContext, customLenses),
		[data, lensContext, customLenses],
	);

	const [lens, setLens] = React.useState<LensTemplate>(lenses[0]);

	React.useEffect(() => {
		const foundLens =
			lenses.find((lens) => lens?.slug === defaultLensSlug) || lenses[0];
		if (lens?.slug === foundLens?.slug) {
			return;
		}
		setLens(foundLens);
	}, [lenses]);

	const lensRendererOnEntityClick = React.useCallback<
		NonNullable<typeof onEntityClick>
	>(
		(row, event) => {
			onEntityClick?.(row, event);

			if (event.isPropagationStopped() && event.isDefaultPrevented()) {
				return;
			}

			if (getBaseUrl && !event.ctrlKey && !event.metaKey && history) {
				event.preventDefault();
				try {
					const url = new URL(getBaseUrl(row));
					window.open(url.toString(), '_blank');
				} catch (err) {
					history.push?.(getBaseUrl(row));
				}
			}
		},
		[onEntityClick, getBaseUrl, history],
	);

	const autouiContext = React.useMemo((): AutoUIContext<T> => {
		const tagField = getFieldForFormat(model.schema, 'tag');
		const tagsAction: AutoUIAction<T> | null = !!sdk?.tags
			? {
					title: t('actions.manage_tags'),
					type: 'update',
					section: 'settings',
					renderer: ({ affectedEntries, onDone }) => {
						return (
							(!!affectedEntries || (sdk.tags && 'getAll' in sdk.tags)) && (
								<Tags
									selected={affectedEntries}
									autouiContext={autouiContext}
									onDone={onDone}
									setIsBusyMessage={setIsBusyMessage}
									refresh={refresh}
								/>
							)
						);
					},
					isDisabled: async ({ affectedEntries, checkedState }) =>
						await getTagsDisabledReason(
							affectedEntries,
							tagField as keyof T,
							checkedState,
							sdk.tags,
							t,
						),
			  }
			: null;

		return {
			resource: model.resource,
			idField: 'id',
			nameField: (model.priorities?.primary[0] as string) ?? 'id',
			tagField,
			getBaseUrl,
			onEntityClick,
			actions: !!tagsAction ? (actions || []).concat(tagsAction) : actions,
			customSort,
			sdk,
			internalPineFilter,
			checkedState,
		};
	}, [
		model,
		getBaseUrl,
		onEntityClick,
		actions,
		customSort,
		sdk,
		internalPineFilter,
		checkedState,
	]);

	const properties = React.useMemo(
		() =>
			getColumnsFromSchema<T>({
				t,
				schema: model.schema,
				idField: autouiContext.idField,
				tagField: autouiContext.tagField,
				isServerSide: pagination?.serverSide ?? false,
				customSort: autouiContext.customSort,
				priorities: model.priorities,
				formats,
			}),
		[
			model.schema,
			autouiContext.idField,
			autouiContext.tagField,
			autouiContext.customSort,
			model.priorities,
		],
	);

	const hasUpdateActions = React.useMemo(
		() =>
			!!actions?.filter((action) => action.type !== 'create')?.length ||
			!!sdk?.tags,
		[actions, sdk?.tags],
	);

	const internalOnChange = (
		updatedFilters: JSONSchema[],
		sortInfo: TableSortOptions<T> | null,
		page: number,
		itemsPerPage: number,
	) => {
		if (!onChange) {
			return;
		}
		const pineFilter = pagination?.serverSide
			? convertToPineClientFilter([], updatedFilters)
			: null;
		const oData = pagination?.serverSide
			? pickBy(
					{
						$filter: pineFilter,
						$orderby: orderbyBuilder(sortInfo, customSort),
						$top: itemsPerPage,
						$skip: page * itemsPerPage,
					},
					(v) => v != null,
			  )
			: null;
		setInternalPineFilter(pineFilter);
		onChange?.({
			filters: updatedFilters,
			page,
			itemsPerPage,
			oData,
		});
	};

	if (loading && data == null) {
		return (
			<Spinner
				label={t('loading.resource', {
					resource: t(`resource.${model.resource}_other`).toLowerCase(),
				})}
			/>
		);
	}

	return (
		<Box display="flex" flex={1} flexDirection="column" {...boxProps}>
			<Spinner label={isBusyMessage} show={!!isBusyMessage}>
				<Box display="flex" height="100%" flexDirection="column">
					{
						// We need to mount the Filters component so that it can load the filters
						// & pagination state from the url (or use defaults) and provide them to
						// the parent component (via $setFilters -> onChange) to use them for the
						// initial data fetching request.
						(data == null || Array.isArray(data)) && (
							<>
								{!hideUtils ? (
									<Box
										mb={3}
										display={
											// This hides the Filters component during the initial load but keeps them mounted so that
											// it can trigger onChange on mount to communicate to the parent component the pineOptions
											// that need to be used.
											data == null ? 'none' : undefined
										}
									>
										<HeaderGrid
											flexWrap="wrap"
											justifyContent="space-between"
											alignItems="center"
										>
											<Create
												model={model}
												autouiContext={autouiContext}
												hasOngoingAction={false}
												onActionTriggered={onActionTriggered}
											/>

											<Update
												model={model}
												selected={selected}
												autouiContext={autouiContext}
												hasOngoingAction={false}
												onActionTriggered={onActionTriggered}
												checkedState={checkedState}
											/>
											<Box
												order={[-1, -1, -1, 0]}
												flex={['1 0 100%', '1 0 100%', '1 0 100%', 'auto']}
											>
												<Filters
													renderMode={['add', 'search', 'views']}
													schema={model.schema}
													filters={filters}
													views={views}
													autouiContext={autouiContext}
													persistFilters={persistFilters}
													changeFilters={$setFilters}
													changeViews={setViews}
													// TODO: add a way to handle the focus search on server side pagination as well
													{...(!pagination?.serverSide && {
														onSearch: (term) => (
															<FocusSearch
																searchTerm={term}
																filtered={filtered}
																selected={selected ?? []}
																setSelected={$setSelected}
																autouiContext={autouiContext}
																model={model}
																hasUpdateActions={hasUpdateActions}
																rowKey={rowKey}
															/>
														),
													})}
												/>
											</Box>
											<LensSelection
												lenses={lenses}
												lens={lens}
												setLens={(lens) => {
													setLens(lens);
													setToLocalStorage(
														`${model.resource}__view_lens`,
														lens.slug,
													);
												}}
											/>
										</HeaderGrid>
										<Filters
											renderMode={'summary'}
											schema={model.schema}
											filters={filters}
											views={views}
											autouiContext={autouiContext}
											changeFilters={$setFilters}
											changeViews={setViews}
											persistFilters={persistFilters}
											showSaveView
										/>
									</Box>
								) : (
									!filters.length &&
									(!!autouiContext.actions?.filter(
										(action) => action.type === 'create',
									).length ? (
										<NoRecordsFoundView
											model={model}
											autouiContext={autouiContext}
											onActionTriggered={onActionTriggered}
											noDataInfo={noDataInfo}
										/>
									) : (
										t('no_data.no_resource_data', {
											resource: t(
												`resource.${model.resource}_other`,
											).toLowerCase(),
										})
									))
								)}
							</>
						)
					}
					{!Array.isArray(data) && (
						<HeaderGrid>
							<LensSelection
								lenses={lenses}
								lens={lens}
								setLens={(lens) => {
									setLens(lens);
									setToLocalStorage(`${model.resource}__view_lens`, lens.slug);
								}}
							/>
						</HeaderGrid>
					)}

					{lens &&
						data &&
						(!Array.isArray(data) ||
							filters.length > 0 ||
							(Array.isArray(data) && data.length > 0)) && (
							<lens.data.renderer
								flex={1}
								filtered={filtered}
								selected={selected}
								properties={properties}
								hasUpdateActions={hasUpdateActions}
								changeSelected={$setSelected}
								onSort={(sortInfo) => {
									setSort(sortInfo);
									internalOnChange(
										filters,
										sortInfo,
										internalPagination.page,
										internalPagination.itemsPerPage,
									);
								}}
								data={data}
								autouiContext={autouiContext}
								onEntityClick={
									!!onEntityClick || !!getBaseUrl
										? lensRendererOnEntityClick
										: undefined
								}
								model={model}
								onPageChange={(page, itemsPerPage) => {
									setInternalPagination({ page, itemsPerPage });
									internalOnChange(filters, sort, page, itemsPerPage);
								}}
								pagination={pagination}
								rowKey={rowKey}
							/>
						)}

					{actionData?.action?.renderer &&
						actionData.action.renderer({
							schema: actionData.schema,
							affectedEntries: actionData.affectedEntries,
							onDone: () => setActionData(undefined),
							setSelected: $setSelected,
						})}
				</Box>
			</Spinner>
		</Box>
	);
};

export {
	autoUIRunTransformers,
	autoUIDefaultPermissions,
	autoUIGetModelForCollection,
	autoUIAddToSchema,
	AutoUIAction,
	AutoUIBaseResource,
	AutoUIRawModel,
	AutoUIModel,
	autoUIJsonSchemaPick,
	autoUIGetDisabledReason,
};

export type AutoUIEntityPropertyDefinition<T> = Required<
	Pick<
		TableColumn<T>,
		'title' | 'label' | 'field' | 'key' | 'selected' | 'sortable' | 'render'
	>
> & { type: string; priority: string };

const getTitleAndLabel = (
	t: TFunction,
	jsonSchema: JSONSchema,
	propertyKey: string,
	refScheme: string | undefined,
) => {
	const subSchema = sieve.getSubSchemaFromRefScheme(jsonSchema, refScheme);
	const title = subSchema?.title || jsonSchema.title || propertyKey;
	const headerLink = getHeaderLink(subSchema);
	let label: TableColumn<unknown>['label'] = title;

	if (headerLink?.href || headerLink?.tooltip) {
		label = (
			<>
				<Link
					mr={1}
					blank
					tooltip={t('info.click_to_read_more', { title })}
					color="info.main"
					{...headerLink}
				>
					<FontAwesomeIcon icon={faCircleQuestion} />
				</Link>
				{title}
			</>
		);
	}
	return {
		title,
		label,
	};
};

const hasPropertyEnabled = (
	value: string[] | true | null,
	propertyKey: string,
) => {
	if (!value) {
		return false;
	}
	return Array.isArray(value) && value.some((v) => v === propertyKey)
		? true
		: typeof value === 'boolean'
		? true
		: false;
};

const getColumnsFromSchema = <T extends AutoUIBaseResource<T>>({
	t,
	schema,
	idField,
	tagField,
	isServerSide,
	customSort,
	priorities,
	formats,
}: {
	t: TFunction;
	schema: JSONSchema;
	idField: AutoUIContext<T>['idField'];
	tagField: AutoUIContext<T>['tagField'];
	isServerSide: boolean;
	customSort?: AutoUIContext<T>['customSort'];
	priorities?: Priorities<T>;
	formats?: Format[];
}): Array<AutoUIEntityPropertyDefinition<T>> =>
	Object.entries(schema.properties ?? {})
		.flatMap(([key, val]: [Extract<keyof T, string>, JSONSchema]) => {
			const refScheme = sieve.getPropertyScheme(val);
			if (!refScheme || refScheme.length <= 1 || typeof val !== 'object') {
				return [[key, val]];
			}
			const entityFilterOnly = sieve.parseDescriptionProperty<string[] | true>(
				val,
				'x-filter-only',
			);
			return refScheme.map((propKey: string) => {
				const referenceSchema = sieve.generateSchemaFromRefScheme(
					val,
					key,
					propKey,
				);
				const referenceSchemaFilterOnly = sieve.parseDescriptionProperty<
					string[] | true
				>(referenceSchema, 'x-filter-only');
				const xFilterOnly =
					hasPropertyEnabled(referenceSchemaFilterOnly, propKey) ||
					hasPropertyEnabled(entityFilterOnly, propKey);
				const xNoSort =
					hasPropertyEnabled(
						sieve.parseDescriptionProperty<string[] | true>(val, 'x-no-sort'),
						propKey,
					) ||
					hasPropertyEnabled(
						sieve.parseDescriptionProperty<string[] | true>(
							referenceSchema,
							'x-no-sort',
						),
						propKey,
					);
				const description = JSON.stringify({
					'x-ref-scheme': [propKey],
					...(xFilterOnly && { 'x-filter-only': 'true' }),
					...(xNoSort && { 'x-no-sort': 'true' }),
				});
				return [key, { ...val, description }];
			});
		})
		.filter(([key, val]: [Extract<keyof T, string>, JSONSchema]) => {
			const entryDescription = sieve.parseDescription(val);
			return (
				key !== tagField &&
				key !== idField &&
				(!entryDescription || !('x-filter-only' in entryDescription))
			);
		})
		.map(([key, val]: [Extract<keyof T, string>, JSONSchema], index) => {
			if (typeof val !== 'object') {
				return;
			}
			const xNoSort = sieve.parseDescriptionProperty(val, 'x-no-sort');
			const definedPriorities = priorities ?? ({} as Priorities<T>);
			const refScheme = sieve.getPropertyScheme(val);
			const priority = definedPriorities.primary.find(
				(prioritizedKey) => prioritizedKey === key,
			)
				? 'primary'
				: definedPriorities.secondary.find(
						(prioritizedKey) => prioritizedKey === key,
				  )
				? 'secondary'
				: 'tertiary';

			const widgetSchema = { ...val, title: undefined };

			const fieldCustomSort = customSort?.[key];
			if (fieldCustomSort != null) {
				if (isServerSide && typeof fieldCustomSort !== 'string') {
					// We are also checking this in `orderbyBuilder()` to make TS happy, but better throw upfront
					// when the model is invalid rather than only when the user issues a sorting based on
					// an incorrectly configured property.
					throw new Error(
						`Field ${key} error: custom sort for this field must be of type string, ${typeof fieldCustomSort} is not accepted.`,
					);
				} else if (!isServerSide && typeof fieldCustomSort !== 'function') {
					throw new Error(
						`Field ${key} error: custom sort for this field must be a function, ${typeof fieldCustomSort} is not accepted.`,
					);
				}
			}

			return {
				...getTitleAndLabel(t, val, key, refScheme?.[0]),
				field: key,
				// This is used for storing columns and views
				key: `${key}_${index}`,
				selected: getSelected(key as keyof T, priorities),
				priority,
				type: 'predefined',
				refScheme: refScheme?.[0],
				sortable: xNoSort
					? false
					: typeof fieldCustomSort === 'function'
					? fieldCustomSort
					: isServerSide
					? // This is a temporary solution to prevent clientside sorting for server side paginated tables
					  // This is a noop for .sort
					  // TODO: We should just avoid sorting in the Table component when isServerSide is true, look into this when rendition is gone
					  () => 0
					: getSortingFunction<T>(key, val),
				render: (fieldVal: string, entry: T) => {
					const calculatedField = autoUIAdaptRefScheme(fieldVal, val);
					return (
						<CustomWidget
							extraFormats={[
								...(formats ?? ([] as Format[])),
								...defaultFormats,
							]}
							schema={widgetSchema}
							value={calculatedField}
							extraContext={entry}
						/>
					);
				},
			};
		})
		.filter(
			(columnDef): columnDef is NonNullable<typeof columnDef> => !!columnDef,
		);
