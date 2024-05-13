import React from 'react';
import reject from 'lodash/reject';
import { AutoUIModel, getPropertyScheme } from '../../AutoUI';

import { AutoUIContext } from '../../AutoUI/schemaOps';
import { useHistory } from '../../hooks/useHistory';
import { Material, designTokens } from '@balena/ui-shared-components';
import { ajvFilter, createFullTextSearchFilter } from './SchemaSieve';
import { Typography } from '@mui/material';

const { Box, styled, Checkbox } = Material;

const Focus = styled(Box)(({ theme }) => ({
	flexBasis: '100%',
	backgroundColor: 'white',
	border: `solid 1px ${designTokens.color.border.subtle.value}`,
	maxHeight: '200px',
	position: 'absolute',
	width: '100%',
	zIndex: 1,
	borderRadius: '0 0 4px 4px',
	overflow: 'hidden',
	boxShadow: theme.shadows[8],
}));

const FocusContent = styled(Box)(() => ({
	maxHeight: '180px',
	overflowY: 'auto',
	overflowX: 'auto',
}));

const FocusItem = styled(Box)<{ hasGetBaseUrl: boolean }>(
	({ hasGetBaseUrl }) => ({
		cursor: hasGetBaseUrl ? 'pointer' : 'default',
		'&:hover': {
			background: designTokens.color.bg.value, // This is the background color MUI Select uses for entities on hover.
		},
	}),
);

interface FocusSearchProps<T extends { id: number; [key: string]: any }> {
	searchTerm: string;
	filtered: T[];
	selected: T[];
	setSelected: (selected: T[]) => void;
	autouiContext: AutoUIContext<T>;
	model: AutoUIModel<T>;
	hasUpdateActions?: boolean;
	rowKey?: keyof T;
}

export const FocusSearch = <T extends { id: number; [key: string]: any }>({
	searchTerm,
	filtered,
	selected,
	setSelected,
	autouiContext,
	model,
	hasUpdateActions,
	rowKey = 'id',
}: FocusSearchProps<T>) => {
	const history = useHistory();
	const filteredFittingSearchTerms = React.useMemo(() => {
		const filter = createFullTextSearchFilter(model.schema, searchTerm);
		return filter ? ajvFilter(filter, filtered) : null;
	}, [searchTerm, filtered]);

	const getEntityValue = (entity: T) => {
		const property = model.priorities?.primary[0]!;
		const schemaProperty = model.schema.properties?.[property];
		const refScheme = schemaProperty ? getPropertyScheme(schemaProperty) : null;
		if (!refScheme || typeof schemaProperty === 'boolean') {
			return entity[property];
		}
		const newEntity =
			schemaProperty?.type === 'array' ? entity[property][0] : entity[property];
		if (refScheme.length > 1) {
			return refScheme.map((reference) => newEntity?.[reference]).join(' ');
		}
		return newEntity?.[refScheme[0]] ?? entity[property];
	};

	return (
		<Focus sx={{ top: '30px' }}>
			{!filteredFittingSearchTerms?.length ? (
				<Box display="flex" justifyContent="space-around" py={2}>
					<em>no results</em>
				</Box>
			) : (
				<FocusContent>
					{filteredFittingSearchTerms.map((entity) => (
						<FocusItem
							px={1}
							py={2}
							key={entity[rowKey]}
							onClick={(e) => {
								e.preventDefault();
								if (autouiContext.getBaseUrl && history) {
									try {
										const url = new URL(autouiContext.getBaseUrl(entity));
										window.open(url.toString(), '_blank');
									} catch (err) {
										history.push?.(autouiContext.getBaseUrl(entity));
									}
								}
							}}
							hasGetBaseUrl={!!autouiContext.getBaseUrl}
						>
							<Box display="flex" flexDirection="row" alignItems="center">
								{hasUpdateActions && (
									<Box
										display="flex"
										flexDirection="column"
										mx={1}
										alignItems="center"
									>
										<Checkbox
											onChange={() => {
												const isChecked = !!selected.find(
													(s) => s[rowKey] === entity[rowKey],
												);
												const checkedItems = !isChecked
													? selected.concat(entity)
													: (reject(selected, {
															[rowKey]: entity[rowKey],
													  }) as unknown as Array<typeof entity>);
												setSelected(checkedItems);
											}}
											checked={
												!!selected.find((s) => s[rowKey] === entity[rowKey])
											}
											onClick={(event) => {
												event.stopPropagation();
											}}
										/>
									</Box>
								)}
								<Box
									display="flex"
									flexDirection="column"
									alignItems="center"
									ml={!hasUpdateActions ? 1 : undefined}
								>
									<Typography>{getEntityValue(entity)}</Typography>
								</Box>
							</Box>
						</FocusItem>
					))}
				</FocusContent>
			)}
		</Focus>
	);
};
