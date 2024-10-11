import * as React from 'react';
import { TableHead } from './TableHead';
import { TableToolbar } from './TableToolbar';
import { AutoUIEntityPropertyDefinition } from '../../AutoUI';
import { CheckedState, Pagination, TableSortOptions } from './utils';
import { DEFAULT_ITEMS_PER_PAGE } from '../../AutoUI/utils';
import { Material } from '@balena/ui-shared-components';
import { Divider } from 'rendition';

const {
	Box,
	Table: MaterialTable,
	TableBody,
	TableCell,
	TableContainer,
	TablePagination,
	TableRow,
	Paper,
	Checkbox,
	styled,
} = Material;

const StyledMaterialTable = styled(MaterialTable)(() => ({
	'& [data-table="table_cel__sticky"]': {
		position: 'sticky',
		left: 0,
		zIndex: 9,
		backgroundColor: 'inherit',
	},
	'& [data-table="table_cel__sticky_header"]': {
		position: 'sticky',
		left: 0,
		zIndex: 10,
	},
}));

interface TableProps<T> {
	rowKey: keyof T;
	data: T[];
	checkedItems?: T[];
	checkedState?: CheckedState;
	columns: Array<AutoUIEntityPropertyDefinition<T>>;
	pagination: Pagination;
	sort: TableSortOptions;
	actions?: Material.MenuItemProps[];
	onCheck?: (selected: T[] | undefined, allChecked?: CheckedState) => void;
	onSort?: (sort: TableSortOptions) => void;
	onRowClick?: (
		entity: T,
		event: React.MouseEvent<HTMLTableCellElement, MouseEvent>,
	) => void;
	onPageChange?: (page: number, itemsPerPage: number) => void;
	onColumnPreferencesChange?: (
		columns: Array<AutoUIEntityPropertyDefinition<T>>,
	) => void;
}

// const highlightedRowIdentifiers = memoizee(
// 	<T extends object>(highlightedRows: T[keyof T][]) => new Set(highlightedRows),
// 	{ max: 1 },
// );

// const disabledRowIdentifiers = memoizee(
// 	<T extends object>(disabledRows: T[keyof T][]) => new Set(disabledRows),
// 	{ max: 1 },
// );

export const Table = <T extends {}>({
	rowKey,
	data,
	checkedItems = [],
	checkedState,
	columns,
	pagination,
	sort,
	actions,
	onCheck,
	onSort,
	onRowClick,
	onPageChange,
	onColumnPreferencesChange,
}: TableProps<T>) => {
	const lastSelected = React.useRef<T>();

	const numSelected = React.useMemo(() => {
		if (checkedState === 'none') {
			return 0;
		}
		if (checkedState === 'all') {
			return checkedItems?.length || pagination?.totalItems;
		}
		return checkedItems?.length;
	}, [checkedState, checkedItems, pagination?.itemsPerPage]);

	const checkedRowsMap = React.useMemo(() => {
		if (!rowKey) {
			return new Map();
		}
		return new Map((checkedItems ?? []).map((x) => [x[rowKey], x]));
	}, [checkedItems, rowKey]);

	const isChecked = React.useCallback(
		(item: T) => {
			const identifier = item[rowKey];
			return checkedRowsMap.has(identifier);
		},
		[checkedRowsMap, rowKey],
	);

	const visibleRows = React.useMemo(
		() =>
			data.length > pagination.itemsPerPage
				? data.slice(
						pagination.currentPage * pagination.itemsPerPage,
						pagination.currentPage * pagination.itemsPerPage +
							pagination.itemsPerPage,
					)
				: data,
		[data, pagination.currentPage, pagination.itemsPerPage],
	);

	const visibleRowsMap = React.useMemo(() => {
		return visibleRows
			? new Map<T[keyof T], T>(visibleRows.map((row) => [row[rowKey], row]))
			: null;
	}, [visibleRows]);

	const handleOnSort = React.useCallback(
		(
			_event: React.MouseEvent<HTMLSpanElement, MouseEvent>,
			column: AutoUIEntityPropertyDefinition<T>,
		) => {
			if (!sort) {
				return;
			}
			const isAsc = sort.key === column.key && sort.direction === 'asc';
			const newOrder = isAsc ? 'desc' : 'asc';
			onSort?.({
				direction: newOrder,
				...column,
			});
		},
		[sort.field, sort.direction, onSort],
	);

	const handleToggleCheck = React.useCallback(
		(row: T) => {
			return (
				event: React.MouseEvent<HTMLButtonElement, MouseEvent> & {
					target: { checked: boolean };
				},
			) => {
				if (!visibleRowsMap) {
					return;
				}
				const lastSelectedRow = lastSelected.current;
				const isDifferentRowSelected =
					lastSelectedRow && lastSelectedRow[rowKey] !== row[rowKey];
				const isShiftClick =
					event.shiftKey &&
					isDifferentRowSelected &&
					visibleRowsMap.has(lastSelectedRow[rowKey]);
				// handle multiple selection
				if (isShiftClick) {
					let isInSelection = false;
					for (const [key, value] of visibleRowsMap) {
						if (row[rowKey] === key || lastSelectedRow[rowKey] === key) {
							isInSelection = !isInSelection;
						}
						if (
							(isInSelection || row[rowKey] === key) &&
							event.target.checked
						) {
							checkedRowsMap.set(key, value);
						} else if (!event.target.checked) {
							checkedRowsMap.delete(key);
						}
					}
					lastSelected.current = undefined;
				} else {
					// handle single selection
					if (event.target.checked) {
						checkedRowsMap.set(row[rowKey], row);
					} else {
						checkedRowsMap.delete(row[rowKey]);
					}
					lastSelected.current = row;
				}

				const filteredArray = Array.from(checkedRowsMap.values());
				onCheck?.(filteredArray, filteredArray.length > 0 ? 'some' : 'none');
			};
		},
		[visibleRowsMap, onCheck],
	);

	return (
		<Box sx={{ width: '100%' }}>
			<Paper sx={{ width: '100%', mb: 2 }}>
				<TableToolbar
					numSelected={numSelected}
					columns={columns}
					actions={actions}
					onColumnPreferencesChange={onColumnPreferencesChange}
				/>
				<TableContainer sx={{ maxHeight: '60vh' }}>
					<StyledMaterialTable stickyHeader>
						<TableHead
							columns={columns}
							numSelected={numSelected}
							checkedState={checkedState}
							order={sort.direction}
							orderBy={sort.key}
							onSelectAllClick={onCheck}
							onRequestSort={handleOnSort}
							rowCount={pagination.totalItems}
						/>
						<TableBody>
							{visibleRows.map((row, index) => {
								const labelId = `enhanced-table-checkbox-${index}`;
								const checked = isChecked(row);

								return (
									<TableRow
										hover
										role="checkbox"
										aria-checked={false}
										tabIndex={-1}
										key={row[rowKey] as string}
										selected={false}
										sx={{
											cursor: 'pointer',
											background:
												index % 2 === 0
													? '#f3f5f7!important'
													: '#fff!important',
											'&:hover': {
												background: '#e6f2fc!important',
											},
										}}
									>
										<TableCell
											data-table="table_cel__sticky"
											padding="checkbox"
											sx={{
												backgroundColor: 'inherit',
												whiteSpace: 'nowrap',
											}}
										>
											<Checkbox
												color="primary"
												onClick={handleToggleCheck(row)}
												checked={checkedState === 'all' || checked}
												inputProps={{
													'aria-labelledby': labelId,
												}}
											/>
										</TableCell>
										{columns.map((c) => {
											return c.selected ? (
												<TableCell
													component="th"
													id={labelId}
													scope="row"
													padding="none"
													sx={{ whiteSpace: 'nowrap' }}
													onClick={(event) => {
														onRowClick?.(row, event);
													}}
												>
													{c.render(row[c.field], row)}
												</TableCell>
											) : null;
										})}
									</TableRow>
								);
							})}
						</TableBody>
					</StyledMaterialTable>
				</TableContainer>
				<Divider m={0} />
				<TablePagination
					rowsPerPageOptions={[5, 10, 25, DEFAULT_ITEMS_PER_PAGE, 100]}
					component="div"
					count={pagination.totalItems}
					rowsPerPage={pagination.itemsPerPage}
					page={pagination.currentPage}
					showFirstButton
					showLastButton
					onPageChange={(_event, page) => {
						onPageChange?.(page, pagination.itemsPerPage);
					}}
					onRowsPerPageChange={(event) => {
						onPageChange?.(pagination.currentPage, Number(event.target.value));
					}}
				/>
			</Paper>
		</Box>
	);
};
