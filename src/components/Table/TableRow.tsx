import * as React from 'react';
import type { AutoUIEntityPropertyDefinition } from '../../AutoUI';
import type { CheckedState } from './utils';
import { Material } from '@balena/ui-shared-components';
import { TableCell, type TableCellProps } from './TableCell';

const {
	TableRow: MaterialTableRow,
	TableCell: MaterialTableCell,
	Checkbox,
} = Material;

export interface TableRowProps<T> {
	row: T;
	rowKey: keyof T;
	rowIndex: number;
	handleToggleCheck?: (row: T) => (
		event: React.MouseEvent<HTMLButtonElement, MouseEvent> & {
			target: {
				checked: boolean;
			};
		},
	) => void;
	checkedState: CheckedState | undefined;
	checked: boolean;
	labelId: string;
	columns: Array<AutoUIEntityPropertyDefinition<T>>;
	href: string | undefined;
	onRowClick: TableCellProps<T>['onRowClick'];
	url: URL | null;
}

export const TableRow = <T extends object>({
	row,
	rowKey,
	handleToggleCheck,
	checkedState,
	checked,
	labelId,
	columns,
	href,
	onRowClick,
	url,
}: TableRowProps<T>) => {
	return (
		<MaterialTableRow
			role="checkbox"
			data-display="table-row"
			aria-checked={checked}
			tabIndex={-1}
			selected={checked || checkedState === 'all'}
		>
			{handleToggleCheck && (
				<MaterialTableCell
					data-display="table-cell"
					data-table="table_cell__sticky"
					padding="checkbox"
					sx={{
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
				</MaterialTableCell>
			)}
			{columns.map((c: any, columnIndex: number) => {
				return c.selected ? (
					<TableCell
						key={`${row[rowKey]}_${columnIndex}`}
						href={href}
						onRowClick={onRowClick}
						row={row}
						rowKey={rowKey}
						column={c}
						url={url}
					/>
				) : null;
			})}
		</MaterialTableRow>
	);
};
