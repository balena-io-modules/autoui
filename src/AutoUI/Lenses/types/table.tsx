import React from 'react';
import { faTable } from '@fortawesome/free-solid-svg-icons/faTable';
import { LensTemplate } from '..';
import { CollectionLensRendererProps } from '.';
import { Table, TableColumn } from 'rendition';
import { setToLocalStorage } from '../../utils';
import pick from 'lodash/pick';
import { useAnalyticsContext } from '@balena/ui-shared-components';

const TableColumnStateStoredProps = ['key', 'selected', 'type', 'tagKey'];

// TODO: Remove this workaround after the table refactor.
// This is a temporary hack to disable sorting on the tag column without modifying the Rendition library.
// Refactor the implementation to properly handle sorting once the table logic is updated.
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
			// TODO: Remove this workaround after the table refactor.
			// This is a temporary hack to disable sorting on the tag column without modifying the Rendition library.
			// Refactor the implementation to properly handle sorting once the table logic is updated.
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
						// TODO: Remove this workaround after the table refactor.
						// This is a temporary hack to disable sorting on the tag column without modifying the Rendition library.
						// Refactor the implementation to properly handle sorting once the table logic is updated.
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
