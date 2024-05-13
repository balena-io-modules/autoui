import React from 'react';
import {
	DropDownButton,
	Tooltip,
	Material,
	DropDownButtonProps,
} from '@balena/ui-shared-components';
import { faChartPie } from '@fortawesome/free-solid-svg-icons/faChartPie';
import { JSONSchema7 as JSONSchema } from 'json-schema';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons/faTrash';
import { useTranslation } from '../../hooks/useTranslation';
import { Typography } from '@mui/material';

const { Box, IconButton, useTheme, useMediaQuery } = Material;

interface FiltersView {
	id: string;
	eventName: string;
	name: string;
	filters: JSONSchema[];
}

export interface ViewsProps {
	views: FiltersView[] | undefined;
	setFilters: (filters: JSONSchema[]) => void;
	deleteView: (view: FiltersView) => any;
	dark?: boolean;
}

export const Views = ({ views, setFilters, deleteView, dark }: ViewsProps) => {
	const { t } = useTranslation();
	const theme = useTheme();
	const matches = useMediaQuery(theme.breakpoints.up('sm'));

	const memoizedViews = React.useMemo<
		DropDownButtonProps<FiltersView>['items'] | undefined
	>(() => {
		return views?.map((view) => {
			return {
				...view,
				eventName: `Open saved view`,
				children: (
					<Box
						display="flex"
						alignItems="center"
						justifyContent="space-between"
						minWidth="200px"
					>
						<Box display="flex" flexDirection="column">
							<Typography>{view.name}</Typography>
							<Typography color="grey">
								{view.filters.length}{' '}
								{view.filters.length === 1
									? t('labels.filter_one').toLowerCase()
									: t('labels.filter_other').toLowerCase()}
							</Typography>
						</Box>
						<IconButton
							aria-label={t('aria_labels.remove_view')}
							onClick={() => deleteView(view)}
						>
							<FontAwesomeIcon icon={faTrash} />
						</IconButton>
					</Box>
				),
				onClick: () => {
					const filters = view.filters;
					setFilters(filters);
				},
			};
		});
	}, [views]);

	return (
		<Tooltip
			title={!memoizedViews?.length ? t('labels.info_no_views') : undefined}
		>
			<DropDownButton<FiltersView>
				disabled={!memoizedViews?.length}
				items={memoizedViews ?? []}
				children={
					matches ? t('labels.views') : <FontAwesomeIcon icon={faChartPie} />
				}
				variant={!memoizedViews?.length && dark ? 'contained' : 'outlined'}
				color={!memoizedViews?.length && dark ? 'primary' : 'secondary'}
				startIcon={matches ? <FontAwesomeIcon icon={faChartPie} /> : null}
			/>
		</Tooltip>
	);
};
