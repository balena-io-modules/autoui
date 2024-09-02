import React from 'react';
import { faTable } from '@fortawesome/free-solid-svg-icons/faTable';
import { LensTemplate } from '..';
import { CollectionLensRendererProps } from '.';
import { Table, TableColumn } from 'rendition';
import { setToLocalStorage } from '../../utils';
import pick from 'lodash/pick';
import { useAnalyticsContext } from '@balena/ui-shared-components';

const TableColumnStateStoredProps = ['key', 'selected', 'type', 'tagKey'];

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
					itemsPerPage={pagination?.itemsPerPage ?? 50}
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
							// FIXME figure out why `newCols` output is different than the type from the callback signature
							(newCols as Array<TableColumn<any>>).map((col) => [
								col.field,
								col.selected,
							]),
						);

						analytics.webTracker?.track('Update table column display', {
							current_url: location.origin + location.pathname,
							resource: model.resource,
							columns: columnsAnalyticsObject,
						});
					}}
				/>
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
