import React from 'react';
import reject from 'lodash/reject';
import styled from 'styled-components';
import { AutoUIModel } from '..';
import { Box, Checkbox, Flex, Txt, SchemaSieve as sieve } from 'rendition';
import { AutoUIContext } from '../schemaOps';
import { useHistory } from '../../hooks/useHistory';
import { stopEvent } from '../utils';

const Focus = styled(Box)`
	flex-basis: 100%;
	background-color: white;
	border: solid 1px ${(props) => props.theme.colors.quartenary.dark};
	max-height: 200px;
	position: absolute;
	width: 100%;
	z-index: 1;
	border-radius: 0 0 ${(props) => props.theme.global.drop.border.radius}
		${(props) => props.theme.global.drop.border.radius};
	overflow: hidden;
`;

const FocusContent = styled(Box)`
	max-height: 180px;
	overflow-y: auto;
	overflow-x: auto;
`;

const FocusItem = styled(Box)<{ hasGetBaseUrl: boolean }>`
	cursor: ${(props) => (props.hasGetBaseUrl ? 'pointer' : 'default')};
	&:hover {
		background: #dde1f0; // This is the background color Select uses for entities on hover. We do not have it in our theme
	}
`;

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

	const escapedSearchTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	
	const filteredFittingSearchTerms = React.useMemo(() => {
		const filter = sieve.createFullTextSearchFilter(model.schema, escapedSearchTerm);
		return sieve.filter(filter, filtered);
	}, [escapedSearchTerm, filtered]);

	const getEntityValue = (entity: T) => {
		const property = model.priorities?.primary[0]!;
		const schemaProperty = model.schema.properties?.[property];
		const refScheme = schemaProperty
			? sieve.getPropertyScheme(schemaProperty)
			: null;
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

	if (!filteredFittingSearchTerms.length) {
		return (
			<Focus>
				<Flex justifyContent="space-around" py={2}>
					<em>no results</em>
				</Flex>
			</Focus>
		);
	}

	return (
		<Focus>
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
						<Flex flexDirection="row">
							{hasUpdateActions && (
								<Flex flexDirection="column" ml={1} mr={3} alignItems="center">
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
										onClick={stopEvent}
									/>
								</Flex>
							)}
							<Flex
								flexDirection="column"
								alignItems="center"
								ml={!hasUpdateActions ? 1 : undefined}
							>
								<Txt>{getEntityValue(entity)}</Txt>
							</Flex>
						</Flex>
					</FocusItem>
				))}
			</FocusContent>
		</Focus>
	);
};
