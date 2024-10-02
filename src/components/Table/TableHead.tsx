import * as React from 'react';
import { visuallyHidden } from '@mui/utils';
import { AutoUIEntityPropertyDefinition } from '../../AutoUI';
import { CheckedState, Order } from './utils';
import { Material } from '@balena/ui-shared-components';

const {
	Box,
	TableCell,
	TableHead: MaterialTableHead,
	TableRow,
	TableSortLabel,
	Checkbox,
} = Material;

interface TableHeadProps<T> {
	columns: Array<AutoUIEntityPropertyDefinition<T>>;
	numSelected?: number;
	checkedState?: CheckedState;
	onRequestSort: (
		event: React.MouseEvent<HTMLSpanElement, MouseEvent>,
		column: AutoUIEntityPropertyDefinition<T>,
	) => void;
	onSelectAllClick?: (
		selected: T[] | undefined,
		allChecked: CheckedState,
	) => void;
	order: Order;
	orderBy: string;
	rowCount: number;
}

export const TableHead = <T extends object>({
	columns,
	onSelectAllClick,
	order,
	orderBy,
	numSelected,
	checkedState,
	rowCount,
	onRequestSort,
}: TableHeadProps<T>) => {
	return (
		<MaterialTableHead>
			<TableRow>
				<TableCell padding="checkbox">
					<Checkbox
						color="primary"
						// some does not seems to work as expected
						indeterminate={checkedState === 'some'}
						checked={
							(rowCount > 0 && numSelected === rowCount) ||
							checkedState === 'all'
						}
						onChange={(_event, checked) => {
							onSelectAllClick?.(undefined, checked ? 'all' : 'none');
						}}
						inputProps={{
							'aria-label': 'select all',
						}}
					/>
				</TableCell>
				{columns.map((column) =>
					column.selected ? (
						<TableCell
							key={column.key}
							align="left"
							padding="none"
							sortDirection={orderBy === column.key ? order : false}
							sx={{ whiteSpace: 'nowrap' }}
						>
							<TableSortLabel
								active={orderBy === column.key}
								direction={orderBy === column.key ? order : 'asc'}
								onClick={(event) => onRequestSort(event, column)}
							>
								{column.label}
								{orderBy === column.key ? (
									<Box component="span" sx={visuallyHidden}>
										{order === 'desc'
											? 'sorted descending'
											: 'sorted ascending'}
									</Box>
								) : null}
							</TableSortLabel>
						</TableCell>
					) : null,
				)}
			</TableRow>
		</MaterialTableHead>
	);
};
