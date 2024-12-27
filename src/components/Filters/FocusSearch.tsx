import React from 'react';
import debounce from 'lodash/debounce';
import type { AutoUIModel } from '../../AutoUI';
import { getPropertyScheme } from '../../AutoUI';
import type { AutoUIContext } from '../../AutoUI/schemaOps';
import { useHistory } from '../../hooks/useHistory';
import { Material, Spinner, designTokens } from '@balena/ui-shared-components';
import { ajvFilter, createFullTextSearchFilter } from './SchemaSieve';
import { Typography } from '@mui/material';
import { convertToPineClientFilter } from '../../oData/jsonToOData';
import { DEFAULT_ITEMS_PER_PAGE } from '../../AutoUI/utils';

const { Box, styled } = Material;

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
	autouiContext: AutoUIContext<T>;
	model: AutoUIModel<T>;
	rowKey?: keyof T;
}

export const FocusSearch = <T extends { id: number; [key: string]: any }>({
	searchTerm,
	filtered,
	autouiContext,
	model,
	rowKey = 'id',
}: FocusSearchProps<T>) => {
	const history = useHistory();
	const [searchResults, setSearchResults] = React.useState<T[]>([]);
	const [isLoading, setIsLoading] = React.useState<boolean>(false);
	const inputSearch = autouiContext.sdk?.inputSearch;

	// Debounce function to limit the frequency of search term changes
	const debouncedSearch = React.useMemo(
		() =>
			debounce(async (searchFilter) => {
				setIsLoading(true);
				if (inputSearch && searchFilter) {
					// Keep the same structure we have on AutoUI/index.tsx internalOnChange
					const pineFilter = convertToPineClientFilter([], searchFilter);
					const oData = {
						$filter: pineFilter,
						// In case of need we can add an infinite scroll logic
						$top: DEFAULT_ITEMS_PER_PAGE,
						$skip: 0,
					};
					const results = await inputSearch({ oData });
					setSearchResults(results);
				} else if (searchFilter) {
					setSearchResults(ajvFilter(searchFilter, filtered) || []);
				} else {
					setSearchResults([]);
				}
				setIsLoading(false);
			}, 300),
		[inputSearch, filtered],
	);

	React.useEffect(() => {
		const filter = createFullTextSearchFilter(model.schema, searchTerm);
		void debouncedSearch(filter);
		return () => {
			debouncedSearch.cancel();
		};
	}, [model.schema, searchTerm, debouncedSearch]);

	const getEntityValue = (entity: T) => {
		const property = model.priorities?.primary[0];
		if (!property) {
			return null;
		}
		const schemaProperty =
			model.schema.properties?.[
				property as keyof typeof model.schema.properties
			];
		const refScheme = getPropertyScheme(schemaProperty ?? null);
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
			<Spinner show={isLoading}>
				{!searchResults?.length ? (
					<Box display="flex" justifyContent="space-around" py={2}>
						<em>no results</em>
					</Box>
				) : (
					<FocusContent>
						{searchResults.map((entity) => (
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
										} catch {
											if (
												typeof history === 'object' &&
												'push' in history &&
												typeof history.push === 'function'
											) {
												// react-router-dom v5 history object
												history.push(autouiContext.getBaseUrl(entity));
											} else if (typeof history === 'function') {
												// react-router-dom v6 navigate function
												history(autouiContext.getBaseUrl(entity));
											}
										}
									}
								}}
								hasGetBaseUrl={!!autouiContext.getBaseUrl}
							>
								<Box display="flex" flexDirection="row" alignItems="center">
									<Box
										display="flex"
										flexDirection="column"
										alignItems="center"
										p={1}
									>
										<Typography>{getEntityValue(entity)}</Typography>
									</Box>
								</Box>
							</FocusItem>
						))}
					</FocusContent>
				)}
			</Spinner>
		</Focus>
	);
};
