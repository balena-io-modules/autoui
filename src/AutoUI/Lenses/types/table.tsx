import React from 'react';
import { faTable } from '@fortawesome/free-solid-svg-icons/faTable';
import { LensTemplate } from '..';
import { CollectionLensRendererProps } from '.';
import {
	DEFAULT_ITEMS_PER_PAGE,
	getFromLocalStorage,
	setToLocalStorage,
} from '../../utils';
// import { useAnalyticsContext } from '@balena/ui-shared-components';
import { Table } from '../../../components/Table';
import { AutoUIEntityPropertyDefinition } from '~/AutoUI';
import { TableSortOptions } from '../../../components/Table/utils';
import { useColumns } from '../../../components/Table/useColumns';
import { useTagActions } from '../../../components/Table/useTagActions';
import { AddTagHandler } from '../../../components/Table/AddTagHandler';

import { designTokens, Material, Copy } from '@balena/ui-shared-components';
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
	return (
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
	);
};

const tagKeyRender =
	(key: string) =>
	(tags: Array<{ tag_key: string; value: string }> | undefined) => {
		if (!tags?.length) {
			return null;
		}
		const tag = tags?.find((t) => t.tag_key === key);
		return tag ? <TagLabel value={tag.tag_key} /> : null;
	};

const sortData = <T extends object>(
	data: T[],
	columns: Array<AutoUIEntityPropertyDefinition<T>>,
	sort: TableSortOptions | null,
) => {
	if (!sort || sort.field === null) {
		return data;
	}

	const column = columns.find((c) => c.field === sort.field);

	if (!column) {
		return data;
	}

	let collection;

	const columnAny = column || ({} as any);

	if ('sortable' in columnAny && typeof columnAny.sortable === 'function') {
		collection = data.slice().sort(columnAny.sortable);
	} else {
		collection = data.slice().sort((a, b) => {
			const aValue = a[sort.field as keyof T];
			const bValue = b[sort.field as keyof T];

			if (aValue < bValue) {
				return -1;
			}
			if (aValue > bValue) {
				return 1;
			}
			return 0;
		});
	}

	if (sort.direction === 'desc') {
		collection.reverse();
	}

	return collection;
};

export const table: LensTemplate = {
	slug: 'table',
	name: 'Default table lens',
	data: {
		label: 'Table',
		format: 'table',
		renderer: ({
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
			const [columns, setColumns] = useColumns(
				autouiContext.resource,
				properties,
				tagKeyRender,
			);

			const { actions, showAddTagDialog, setShowAddTagDialog, tagKeys } =
				useTagActions(autouiContext, columns, data);

			const memoizedPagination = React.useMemo(
				() => ({
					itemsPerPage: pagination?.itemsPerPage || DEFAULT_ITEMS_PER_PAGE,
					currentPage: pagination?.currentPage || 0,
					totalItems: pagination?.totalItems || data.length,
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

				return (
					sortPreferences ??
					({
						direction: 'asc',
						...columns[0],
					} as TableSortOptions)
				);
			}, [sort, model, columns]);

			// We want to save latest user settings only on destroy not on every change.
			React.useEffect(() => {
				return () => {
					setToLocalStorage(`${autouiContext.resource}__sort`, sort);
				};
			}, [sort]);

			const handleAddTagClose = (selectedTagColumns: string[] | undefined) => {
				if (!selectedTagColumns?.length) {
					setShowAddTagDialog(false);
					return;
				}
				const additionalColumns = selectedTagColumns.map((key) => {
					return {
						title: key,
						label: 'Tag:' + key,
						key: `tag_column_${key}`,
						selected: true,
						type: 'predefined',
						field: autouiContext.tagField,
						sortable: false,
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
						sort={order}
						onSort={onSort}
						pagination={memoizedPagination}
						onColumnPreferencesChange={setColumns}
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
		},
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
