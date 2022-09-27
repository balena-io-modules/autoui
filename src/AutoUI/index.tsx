import React from 'react';
import {
	AutoUIAction,
	AutoUIModel,
	AutoUIBaseResource,
	getFieldForFormat,
	AutoUIRawModel,
	autoUIJsonSchemaPick,
	AutoUIContext,
	ActionData,
	Priorities,
} from './schemaOps';
import { getLenses, LensTemplate } from './Lenses';
import { LensSelection } from './Lenses/LensSelection';
import styled from 'styled-components';
import type { JSONSchema7 as JSONSchema } from 'json-schema';
import isEqual from 'lodash/isEqual';
import { NoRecordsFoundArrow } from './NoRecordsFoundArrow';
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
	getPropertyScheme,
	getSchemaTitle,
} from './models/helpers';
import { FocusSearch } from './Filters/FocusSearch';
import {
	getSelected,
	getSortingFunction,
	autoUIGetDisabledReason,
	getTagsDisabledReason,
	getFromLocalStorage,
	setToLocalStorage,
} from './utils';
import { CustomWidget } from './CustomWidget';
import {
	Box,
	BoxProps,
	FiltersView,
	Flex,
	Spinner,
	TableColumn,
} from 'rendition';
import { Format } from 'rendition/dist/components/Renderer/types';
import { ResourceTagModelService } from 'rendition/dist/components/TagManagementModal/tag-management-service';
import { Dictionary } from 'rendition/dist/common-types';
import { useTranslation } from '../hooks/useTranslation';
import { filter } from 'rendition/dist/components/Filters/SchemaSieve';
import { defaultFormats } from 'rendition/dist/components/Renderer/widgets';
import { useHistory } from '../hooks/useHistory';

const HeaderGrid = styled(Flex)`
	> * {
		&:first-child {
			margin-right: 4px;
		}
		&:not(:last-child):not(:first-child) {
			margin-left: 4px;
			margin-right: 4px;
		}
		&:last-child {
			margin-left: 4px;
		}
	}
`;

export interface AutoUIProps<T> extends Omit<BoxProps, 'onChange'> {
	/** Model is the property that describe the data to display with a JSON structure */
	model: AutoUIModel<T>;
	/** Array of data or data entity to display */
	data: T[] | T | undefined;
	/** Formats are custom widgets to render in the table cell. The type of format to display is described in the model. */
	formats?: Format[];
	/** Actions is an array of actions applicable on the selected items */
	actions?: Array<AutoUIAction<T>>;
	/** The sdk is used to pass the method to handle tags when added removed or updated */
	sdk?: {
		tags?: ResourceTagModelService;
	};
	/** Dictionary of {[column_property]: customFunction} where the customFunction is the function to sort data on column header click */
	customSort?: Dictionary<(a: T, b: T) => number>;
	// TODO: Ideally the base URL is autogenerated, but there are some issues with that currently (eg. instead of application we have apps in the URL)
	/** Redirect on entity click */
	getBaseUrl?: (entry: T) => string;
	/** Method to refresh the rendered data when something is changed */
	refresh?: () => void;
	/** Event emitted on entity click */
	onEntityClick?: (entry: T, event: React.MouseEvent) => void;
	// TODO: onChange should also be called when data in the table is sorted and when columns change
	/** Function that gets called when filters change */
	onChange?: (changes: { filters?: JSONSchema[] }) => void;
	/** All the lenses available for this AutoUI component. Any default lenses will automatically be added to this array. */
	customLenses?: LensTemplate[];
	/** Additional context for picking the right lens */
	lensContext?: object;
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
	customLenses,
	lensContext,
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
	const [views, setViews] = React.useState<FiltersView[]>([]);
	const [selected, $setSelected] = React.useState<T[]>([]);
	const [isBusyMessage, setIsBusyMessage] = React.useState<
		string | undefined
	>();
	const [actionData, setActionData] = React.useState<
		ActionData<T> | undefined
	>();

	const setSelected = React.useCallback(
		(items: T[]) => {
			$setSelected(items);
			if (!!actionData) {
				setActionData({ ...actionData, affectedEntries: items });
			}
		},
		[$setSelected, setActionData, actionData],
	);

	const showFilters = React.useMemo(
		() => Array.isArray(data) && !!(data?.length && data.length > 0),
		[data],
	);

	const filtered = React.useMemo(
		() => (Array.isArray(data) ? filter(filters, data) : []) as T[],
		[data, filters],
	);

	React.useEffect(() => {
		setSelected([]);
	}, [filters]);

	const onActionTriggered = React.useCallback((actionData: ActionData<T>) => {
		setActionData(actionData);
		if (actionData.action.actionFn) {
			actionData.action.actionFn({
				affectedEntries: actionData.affectedEntries || [],
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
				renderer: ({ affectedEntries, onDone }) =>
					!!affectedEntries && (
						<Tags
							selected={affectedEntries}
							autouiContext={autouiContext}
							onDone={onDone}
							setIsBusyMessage={setIsBusyMessage}
							refresh={refresh}
						/>
					),
				isDisabled: ({ affectedEntries }) =>
					!!affectedEntries &&
					getTagsDisabledReason(affectedEntries, tagField as keyof T, t),
			}
			: null;

		return {
			resource: model.resource,
			idField: 'id',
			nameField: model.priorities?.primary[0] ?? 'id',
			tagField,
			getBaseUrl,
			onEntityClick,
			actions: !!tagsAction ? (actions || []).concat(tagsAction) : actions,
			customSort,
			sdk,
		};
	}, [model, getBaseUrl, onEntityClick, actions, customSort, sdk]);

	const properties = React.useMemo(
		() =>
			getColumnsFromSchema<T>({
				schema: model.schema,
				idField: autouiContext.idField,
				tagField: autouiContext.tagField,
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
	return (
		<Flex flex={1} flexDirection="column" {...boxProps}>
			<Spinner
				flex={1}
				label={
					isBusyMessage ??
					t('loading.resource', {
						resource: t(`resource.${model.resource}_plural`).toLowerCase(),
					})
				}
				show={data == null || !!isBusyMessage}
			>
				<Flex height="100%" flexDirection="column">
					{Array.isArray(data) && (
						<>
							<Box mb={3}>
								<HeaderGrid
									flexWrap="wrap"
									justifyContent="space-between"
									alignItems="baseline"
								>
									<Create
										model={model}
										autouiContext={autouiContext}
										hasOngoingAction={false}
										onActionTriggered={onActionTriggered}
									/>
									{data.length > 0 && (
										<Update
											model={model}
											selected={selected}
											autouiContext={autouiContext}
											hasOngoingAction={false}
											onActionTriggered={onActionTriggered}
										/>
									)}
									{showFilters && (
										<Box
											order={[-1, -1, -1, 0]}
											flex={['1 0 100%', '1 0 100%', '1 0 100%', 'auto']}
											alignSelf="flex-start"
											mb={2}
										>
											<Filters
												renderMode={['add', 'search', 'views']}
												schema={model.schema}
												filters={filters}
												views={views}
												autouiContext={autouiContext}
												changeFilters={(updatedFilters) => {
													setFilters(updatedFilters);
													if (onChange) {
														onChange({
															filters: updatedFilters,
														});
													}
												}}
												changeViews={setViews}
												onSearch={(term) => (
													<FocusSearch
														searchTerm={term}
														filtered={filtered}
														selected={selected}
														setSelected={setSelected}
														autouiContext={autouiContext}
														model={model}
														hasUpdateActions={hasUpdateActions}
													/>
												)}
											/>
										</Box>
									)}
									{data.length > 0 && (
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
									)}
								</HeaderGrid>
								{filters.length > 0 && (
									<Filters
										renderMode={'summary'}
										schema={model.schema}
										filters={filters}
										views={views}
										autouiContext={autouiContext}
										changeFilters={setFilters}
										changeViews={setViews}
									/>
								)}
							</Box>
							{data.length === 0 && (
								<NoRecordsFoundArrow>
									{t(`no_data.no_resource_data`, {
										resource: t(`resource.item_plural`).toLowerCase(),
									})}
									<br />
									{t('questions.how_about_adding_one')}
								</NoRecordsFoundArrow>
							)}
						</>
					)}
					{!Array.isArray(data) && (
						<HeaderGrid>
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
					)}

					{lens &&
						data &&
						(!Array.isArray(data) ||
							(Array.isArray(data) && data.length > 0)) && (
							<lens.data.renderer
								flex={1}
								filtered={filtered}
								selected={selected}
								properties={properties}
								hasUpdateActions={hasUpdateActions}
								changeSelected={setSelected}
								data={data}
								autouiContext={autouiContext}
								onEntityClick={
									!!onEntityClick || !!getBaseUrl
										? lensRendererOnEntityClick
										: undefined
								}
								model={model}
							/>
						)}

					{actionData?.action?.renderer &&
						actionData.action.renderer({
							schema: actionData.schema,
							affectedEntries: actionData.affectedEntries,
							onDone: () => setActionData(undefined),
						})}
				</Flex>
			</Spinner>
		</Flex>
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
		'title' | 'field' | 'key' | 'selected' | 'sortable' | 'render'
	>
> & { type: string; priority: string };

export const getColumnsFromSchema = <T extends AutoUIBaseResource<T>>({
	schema,
	idField,
	tagField,
	customSort,
	priorities,
	formats,
}: {
	schema: JSONSchema;
	idField: AutoUIContext<T>['idField'];
	tagField: AutoUIContext<T>['tagField'];
	customSort?: AutoUIContext<T>['customSort'];
	priorities?: Priorities<T>;
	formats?: Format[];
}): Array<AutoUIEntityPropertyDefinition<T>> =>
	Object.entries(schema.properties ?? {})
		// The tables treats tags differently, handle it better
		.filter((entry): entry is [keyof T, typeof entry[1]] => {
			return entry[0] !== tagField && entry[0] !== idField;
		})
		.flatMap(([key, val]) => {
			const refScheme = getPropertyScheme(val);
			if (!refScheme || refScheme.length <= 1 || typeof val !== 'object') {
				return [[key, val]];
			}
			return refScheme.map((propKey: string) => {
				const description = JSON.stringify({ 'x-ref-scheme': [propKey] });
				return [key, { ...val, description }];
			});
		})
		.map(([key, val], index) => {
			if (typeof val !== 'object') {
				return;
			}

			const definedPriorities = priorities ?? ({} as Priorities<T>);
			const refScheme = getPropertyScheme(val);
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
			return {
				title: getSchemaTitle(val, key, refScheme?.[0]),
				field: key,
				// This is used for storing columns and views
				key: `${key}_${index}`,
				selected: getSelected(key as keyof T, priorities),
				priority,
				type: 'predefined',
				sortable: customSort?.[key] ?? getSortingFunction<any>(key, val),
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
