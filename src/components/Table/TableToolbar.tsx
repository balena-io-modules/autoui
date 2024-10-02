import React from 'react';
import { Material } from '@balena/ui-shared-components';
import { alpha } from '@mui/material/styles';
import { AutoUIEntityPropertyDefinition } from '../../AutoUI';
import { TableActions } from './TableActions';

const { Toolbar, Typography } = Material;

interface TableToolbarProps<T> {
	numSelected?: number;
	columns: Array<AutoUIEntityPropertyDefinition<T>>;
	actions?: Material.MenuItemProps[];
	onColumnPreferencesChange?: (
		columns: Array<AutoUIEntityPropertyDefinition<T>>,
	) => void;
}

export const TableToolbar = <T extends object>({
	numSelected = 0,
	columns,
	actions,
	onColumnPreferencesChange,
}: TableToolbarProps<T>) => {
	return (
		<Toolbar
			sx={{
				pl: 2,
				pr: 1,
				height: '40px',
				display: 'flex',
				...(numSelected > 0 && {
					bgcolor: (theme) =>
						alpha(
							theme.palette.primary.main,
							theme.palette.action.activatedOpacity,
						),
				}),
			}}
		>
			<Typography
				sx={{ flex: '1 1 100%' }}
				color="inherit"
				variant="subtitle1"
				component="div"
			>
				{numSelected > 0 ? `${numSelected} selected` : 'No selection'}
			</Typography>
			<TableActions
				columns={columns}
				actions={actions}
				onColumnPreferencesChange={onColumnPreferencesChange}
			/>
		</Toolbar>
	);
};
