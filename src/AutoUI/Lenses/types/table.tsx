import React from 'react';
import { faTable } from '@fortawesome/free-solid-svg-icons/faTable';
import type { LensTemplate } from '..';
import type { CollectionLensRendererProps } from '.';
import type { TableColumn } from 'rendition';
import { Table } from 'rendition';
import { setToLocalStorage } from '../../utils';
import pick from 'lodash/pick';
import { useAnalyticsContext } from '@balena/ui-shared-components';

const TableColumnStateStoredProps = ['key', 'selected', 'type', 'tagKey'];

// Temporary workaround to disable sorting on the tag column without modifying Rendition
const removeTagSortingElement = () => {
	const elements = document.querySelectorAll('[data-field^="device_tag."]');

	elements.forEach((element) => {
		if (!element) {
			return;
		}
		const lastChild = element.lastChild as Element | null;
		if (lastChild?.tagName === 'svg') {
			lastChild.remove();
		}
	});
};

const TableRenderer = ({
	filtered,
	selected,
	properties,
	hasUpdateActions,
	changeSelected,
	data,
	autouiContext,
	onEntityClick,
	onPageChange,
	onSort,
	pagination,
	model,
	rowKey = 'id',
}: CollectionLensRendererProps<any>) => {
	React.useEffect(() => {
		if (pagination?.serverSide) {
			removeTagSortingElement();
		}
	}, [properties, pagination?.serverSide]);

	const { state: analytics } = useAnalyticsContext();
	const itemsPerPage = pagination?.itemsPerPage ?? 50;
	const totalItems = pagination?.serverSide
		? pagination.totalItems
		: data.length;

	return (
		<Table<any>
			rowKey={rowKey}
			data={filtered}
			checkedItems={selected}
			columns={properties}
			{...(hasUpdateActions && { onCheck: changeSelected })}
			usePager={totalItems > itemsPerPage}
			pagerPosition="bottom"
			itemsPerPage={itemsPerPage}
			getRowHref={autouiContext.getBaseUrl}
			onRowClick={onEntityClick}
			onPageChange={onPageChange}
			onSort={onSort}
			pagination={pagination}
			columnStateRestorationKey={`${autouiContext.resource}__columns`}
			sortingStateRestorationKey={`${autouiContext.resource}__sort`}
			tagField={autouiContext.tagField}
			enableCustomColumns
			saveColumnPreferences={(newCols) => {
				const columnStateRestorationKey = `${autouiContext.resource}__columns`;
				const savePayload = newCols.map((c) =>
					pick(c, TableColumnStateStoredProps),
				);

				setToLocalStorage(columnStateRestorationKey, savePayload);

				const columnsAnalyticsObject = Object.fromEntries(
					(newCols as Array<TableColumn<any>>).map((col) => [
						col.field,
						col.selected,
					]),
				);

				if (pagination?.serverSide) {
					removeTagSortingElement();
				}
				analytics.webTracker?.track('Update table column display', {
					current_url: location.origin + location.pathname,
					resource: model.resource,
					columns: columnsAnalyticsObject,
				});
			}}
		/>
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
