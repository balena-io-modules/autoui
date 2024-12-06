import React from 'react';
import { designTokens, Material } from '@balena/ui-shared-components';
import type { AutoUIEntityPropertyDefinition } from '../../AutoUI';
import { TableActions } from './TableActions';

const { Stack, Typography } = Material;

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
		<Stack direction="row">
			{numSelected > 0 && (
				<Typography
					color="inherit"
					variant="bodySm"
					component="div"
					sx={(theme) => ({
						alignSelf: 'flex-end',
						px: theme.spacing(2),
						py: theme.spacing(1),
						borderRadius: '4px 4px 0 0',
						background: designTokens.color.bg.subtle.value,
						boxShadow: 'inset 0px -1px 1px rgba(0,0,0,0.05)',
					})}
				>
					<strong>{numSelected}</strong> selected
				</Typography>
			)}
			<TableActions
				columns={columns}
				actions={actions}
				onColumnPreferencesChange={onColumnPreferencesChange}
			/>
		</Stack>
	);
};
