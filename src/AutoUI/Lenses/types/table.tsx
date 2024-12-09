import React from 'react';
import { faTable } from '@fortawesome/free-solid-svg-icons/faTable';
import type { LensTemplate } from '..';
import type { CollectionLensRendererProps } from '.';
import { DEFAULT_ITEMS_PER_PAGE, getFromLocalStorage } from '../../utils';
import { Table } from '../../../components/Table';
import type { AutoUIEntityPropertyDefinition } from '~/AutoUI';
import type {
	TableSortOptions,
	TagField,
} from '../../../components/Table/utils';
import {
	TAG_COLUMN_PREFIX,
	useColumns,
} from '../../../components/Table/useColumns';
import { useTagActions } from '../../../components/Table/useTagActions';
import { AddTagHandler } from '../../../components/Table/AddTagHandler';

import {
	designTokens,
	Material,
	Copy,
	useAnalyticsContext,
} from '@balena/ui-shared-components';
const { Box, styled, Tooltip, Typography } = Material;

const TagContainer = styled(Box)(() => ({
	border: `0.5px solid ${designTokens.color.border.accent.value}`,
	borderRadius: '3px',
	color: designTokens.color.text.value,
	backgroundColor: designTokens.color.bg.accent.value,
	position: 'relative',
	width: 'fit-content',
}));

export interface TagLabelProps {
	value: string;
}

export const TagLabel = ({ value }: TagLabelProps) => {
	return value ? (
		<Tooltip title={value}>
			<TagContainer>
				<Copy copy={value} variant="absolute">
					<Box display="flex" gap={1} mx={2} my={1}>
						<Typography
							variant="bodySm"
							noWrap
							fontWeight="bold"
							maxWidth="100px"
						>
							{value}
						</Typography>
					</Box>
				</Copy>
			</TagContainer>
		</Tooltip>
	) : (
		<i>no value</i>
	);
};

const tagKeyRender = (key: string) => {
	function renderFunction(tags?: Array<{ tag_key: string; value: string }>) {
		if (!tags?.length) {
			return null;
		}
		const tag = tags.find((t) => t.tag_key === key);
		return tag ? <TagLabel value={tag.value} /> : null;
	}

	return renderFunction;
};

const getResourceTags = <T extends object, P extends keyof T>(
	item: T,
	tagField: P,
) => (tagField in item ? (item[tagField] as TagField[]) : null);

const findTagOfTaggedResource = <T extends object>(
	taggedResource: T,
	tagField: keyof T,
	tagKey: string,
) =>
	getResourceTags(taggedResource, tagField)?.find(
		(tag) => tag.tag_key === tagKey,
	);

const sortData = <T extends object>(
	data: T[],
	columns: Array<AutoUIEntityPropertyDefinition<T>>,
	sort: TableSortOptions | null,
): T[] => {
	if (!sort?.field) {
		return data;
	}

	const column = columns.find((c) => c.key === sort.key);
	if (!column) {
		return data;
	}

	const sortedData = [...data];
	const sortDirectionMultiplier = sort.direction === 'desc' ? -1 : 1;

	const { sortable, key, title, field } = column;

	if ('sortable' in column && typeof sortable === 'function') {
		sortedData.sort((a, b) => sortDirectionMultiplier * sortable(a, b));
	} else if (key.startsWith(TAG_COLUMN_PREFIX)) {
		if (title) {
			sortedData.sort((a, b) => {
				const item1tag = findTagOfTaggedResource(a, field as keyof T, title);
				const item2tag = findTagOfTaggedResource(b, field as keyof T, title);

				if (!item1tag && !item2tag) {
					return 0;
				}
				if (!item1tag) {
					return sortDirectionMultiplier;
				}
				if (!item2tag) {
					return -sortDirectionMultiplier;
				}

				return (
					sortDirectionMultiplier *
					(item1tag.value || '').localeCompare(item2tag.value || '')
				);
			});
		}
	} else {
		sortedData.sort((a, b) => {
			const aValue = a[sort.field as keyof T];
			const bValue = b[sort.field as keyof T];

			if (aValue < bValue) {
				return -sortDirectionMultiplier;
			}
			if (aValue > bValue) {
				return sortDirectionMultiplier;
			}
			return 0;
		});
	}

	return sortedData;
};

const TableRenderer = ({
	filtered,
	selected,
	properties,
	hasUpdateActions,
	checkedState,
	changeSelected,
	data,
	autouiContext,
	onEntityClick,
	onPageChange,
	onSort,
	pagination,
	model,
	sort,
	rowKey = 'id',
}: CollectionLensRendererProps<any>) => {
	const { state: analytics } = useAnalyticsContext();
	const [columns, setColumns] = useColumns(
		autouiContext.resource,
		properties,
		tagKeyRender,
	);

	const { actions, showAddTagDialog, setShowAddTagDialog, tagKeys } =
		useTagActions(autouiContext, data);

	const memoizedPagination = React.useMemo(
		() => ({
			itemsPerPage: pagination?.itemsPerPage ?? DEFAULT_ITEMS_PER_PAGE,
			currentPage: pagination?.currentPage ?? 0,
			totalItems: pagination?.totalItems,
			serverSide: !!pagination?.serverSide,
		}),
		[pagination],
	);

	const sortedData = React.useMemo(() => {
		if (pagination.serverSide) {
			return filtered;
		}
		return sortData(filtered, columns, sort);
	}, [pagination.serverSide, filtered, columns, sort]);

	const order = React.useMemo(() => {
		if (sort) {
			return sort;
		}
		const sortPreferences = getFromLocalStorage<TableSortOptions>(
			`${model.resource}__sort`,
		);

		const sortPref =
			sortPreferences ??
			({
				direction: 'asc',
				...columns[0],
			} as TableSortOptions);

		onSort?.(sortPref);

		return sortPref;
	}, [sort, model, columns, onSort]);

	const handleAddTagClose = (selectedTagColumns: string[] | undefined) => {
		if (!selectedTagColumns?.length) {
			setShowAddTagDialog(false);
			return;
		}
		const additionalColumns = selectedTagColumns.map((key) => {
			return {
				title: key,
				label: `Tag: ${key}`,
				key: `${TAG_COLUMN_PREFIX}${key}`,
				selected: true,
				type: 'predefined',
				field: autouiContext.tagField,
				sortable: pagination.serverSide ? false : true,
				priority: '',
				render: tagKeyRender(key),
			} as AutoUIEntityPropertyDefinition<any>;
		});
		setColumns(columns.concat(additionalColumns));
		setShowAddTagDialog(false);
	};

	return (
		<>
			<Table
				rowKey={rowKey}
				data={sortedData}
				checkedItems={selected}
				columns={columns}
				checkedState={checkedState}
				{...(hasUpdateActions && { onCheck: changeSelected })}
				onRowClick={onEntityClick}
				onPageChange={onPageChange}
				getRowHref={autouiContext.getBaseUrl}
				sort={order}
				onSort={onSort}
				pagination={memoizedPagination}
				onColumnPreferencesChange={(updatedPreferences) => {
					setColumns(updatedPreferences);
					const columnsAnalyticsObject = Object.fromEntries(
						updatedPreferences.map((col) => [col.field, col.selected]),
					);
					analytics.webTracker?.track('Update table column display', {
						current_url: location.origin + location.pathname,
						resource: model.resource,
						columns: columnsAnalyticsObject,
					});
				}}
				actions={actions ?? []}
			/>
			{showAddTagDialog && tagKeys?.length && (
				<AddTagHandler
					columns={columns}
					tagKeys={tagKeys}
					onClose={handleAddTagClose}
				/>
			)}
		</>
	);
};

export const table: LensTemplate = {
	slug: 'table',
	name: 'Default table lens',
	data: {
		label: 'Table',
		format: 'table',
		renderer: TableRenderer,
		icon: faTable,
		type: '*',
		filter: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					id: {
						type: 'number',
					},
				},
			},
		},
	},
};
