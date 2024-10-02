import React from 'react';
import { Material } from '@balena/ui-shared-components';
import { AutoUIEntityPropertyDefinition } from '../../AutoUI';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCog } from '@fortawesome/free-solid-svg-icons/faCog';

const {
	IconButton,
	Menu,
	MenuItem,
	Checkbox,
	FormGroup,
	FormControlLabel,
	Divider,
} = Material;

interface TableActionsProps<T> {
	columns: Array<AutoUIEntityPropertyDefinition<T>>;
	actions?: Material.MenuItemProps[];
	onColumnPreferencesChange?: (
		columns: Array<AutoUIEntityPropertyDefinition<T>>,
	) => void;
}

export const TableActions = <T extends object>({
	columns,
	actions,
	onColumnPreferencesChange,
}: TableActionsProps<T>) => {
	const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
	const open = Boolean(anchorEl);
	const handleClick = (event: React.MouseEvent<HTMLElement>) => {
		setAnchorEl(event.currentTarget);
	};
	const handleClose = () => {
		setAnchorEl(null);
	};
	const handleColumnSelection = React.useCallback(
		(column: AutoUIEntityPropertyDefinition<T>) => {
			if (!onColumnPreferencesChange) {
				return;
			}
			if (typeof column.label === 'string' && column.label.startsWith('Tag:')) {
				onColumnPreferencesChange(columns.filter((c) => c.key !== column.key));
				return;
			}
			const newColumns = columns.map((c) =>
				c.key === column.key ? { ...c, selected: !c.selected } : c,
			);
			onColumnPreferencesChange(newColumns);
		},
		[onColumnPreferencesChange, columns],
	);
	return (
		<>
			<IconButton
				aria-label="handle column settings"
				onClick={handleClick}
				sx={{ justifySelf: 'flex-end' }}
			>
				<FontAwesomeIcon icon={faCog} />
			</IconButton>
			<Menu
				id="long-menu"
				MenuListProps={{
					'aria-labelledby': 'long-button',
				}}
				anchorEl={anchorEl}
				open={open}
				onClose={handleClose}
			>
				<FormGroup>
					{columns.map((column) => (
						<MenuItem
							key={column.key}
							onClick={() => handleColumnSelection(column)}
						>
							<FormControlLabel
								control={<Checkbox checked={column.selected} />}
								label={column.label}
							/>
						</MenuItem>
					))}
				</FormGroup>
				{actions?.map((menuItemProps) => (
					<>
						<Divider />
						<MenuItem sx={{ py: 3 }} {...menuItemProps} />
					</>
				))}
			</Menu>
		</>
	);
};
