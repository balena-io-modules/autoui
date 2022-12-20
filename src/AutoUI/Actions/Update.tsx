import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
	AutoUIContext,
	AutoUIModel,
	AutoUIBaseResource,
	autoUIJsonSchemaPick,
} from '../schemaOps';
import { ActionData } from '../schemaOps';
import { autoUIGetDisabledReason } from '../utils';
import { faPenToSquare } from '@fortawesome/free-solid-svg-icons/faPenToSquare';
import groupBy from 'lodash/groupBy';
import map from 'lodash/map';
import { useTranslation } from '../../hooks/useTranslation';
import { Box, Button, DropDownButton, Flex, Spinner } from 'rendition';
import styled from 'styled-components';
import { ActionContent, LOADING_DISABLED_REASON } from './ActionContent';

const Wrapper = styled(Box)`
	align-self: flex-start;
	z-index: 10;
`;

interface UpdateProps<T extends AutoUIBaseResource<T>> {
	model: AutoUIModel<T>;
	autouiContext: AutoUIContext<T>;
	selected: T[];
	hasOngoingAction: boolean;
	onActionTriggered: (data: ActionData<T>) => void;
}

export const Update = <T extends AutoUIBaseResource<T>>({
	model,
	autouiContext,
	selected,
	hasOngoingAction,
	onActionTriggered,
}: UpdateProps<T>) => {
	const { t } = useTranslation();
	const { actions } = autouiContext;
	const updateActions = React.useMemo(
		() =>
			actions
				?.filter(
					(action) => action.type === 'update' || action.type === 'delete',
				)
				.sort((a) => (a.type === 'delete' ? 1 : -1))
				.sort((a) => (a.isDangerous ? 1 : a.type === 'delete' ? 0 : -1)),
		[actions],
	);

	const [disabledReasonsByAction, setDisabledReasonsByAction] = React.useState<
		Record<string, string | undefined | null>
	>(() => {
		return Object.fromEntries(
			(updateActions ?? []).map((action) => [
				action.title,
				LOADING_DISABLED_REASON,
			]),
		);
	});

	const groupedActions = React.useMemo(
		() => groupBy(updateActions, (action) => action.section),
		[updateActions],
	);

	const actionHandlers = React.useMemo(
		() =>
			map(groupedActions, (actions) =>
				actions.map((action) => {
					const disabledReason =
						autoUIGetDisabledReason(
							selected,
							hasOngoingAction,
							action.type as 'update' | 'delete',
							t,
						) ?? disabledReasonsByAction[action.title];

					return {
						content: (
							<ActionContent<T>
								getDisabledReason={action.isDisabled}
								affectedEntries={selected}
								onDisabledReady={(result) => {
									setDisabledReasonsByAction((disabledReasonsState) => ({
										...disabledReasonsState,
										[action.title]: result,
									}));
								}}
							>
								<Flex justifyContent="space-between">
									{action.title}
									<Spinner show={disabledReason === LOADING_DISABLED_REASON} />
								</Flex>
							</ActionContent>
						),
						onClick: () =>
							onActionTriggered({
								action,
								schema:
									action.type === 'delete'
										? {}
										: autoUIJsonSchemaPick(
												model.schema,
												model.permissions[action.type],
										  ),
								affectedEntries: selected,
							}),
						tooltip:
							typeof disabledReason === 'string' ? disabledReason : undefined,
						disabled: !!disabledReason,
						danger: action.isDangerous,
					};
				}),
			),
		[groupedActions, disabledReasonsByAction],
	);

	if (!updateActions || updateActions.length < 1) {
		return null;
	}

	if (updateActions.length === 1) {
		const action = updateActions[0];
		const disabledReason =
			autoUIGetDisabledReason(
				selected,
				hasOngoingAction,
				action.type as 'update' | 'delete',
				t,
			) ?? disabledReasonsByAction[action.title];
		return (
			<Box alignSelf="flex-start">
				<Button
					key={action.title}
					data-action={`${action.type}-${model.resource}`}
					onClick={() =>
						onActionTriggered({
							action,
							schema:
								action.type === 'delete'
									? {}
									: autoUIJsonSchemaPick(
											model.schema,
											model.permissions[action.type],
									  ),
							affectedEntries: selected,
						})
					}
					tooltip={
						typeof disabledReason === 'string' ? disabledReason : undefined
					}
					disabled={!!disabledReason}
					plain={updateActions.length > 1}
					danger={action.isDangerous}
					secondary
				>
					<ActionContent<T>
						getDisabledReason={action.isDisabled}
						affectedEntries={selected}
						onDisabledReady={(result) => {
							setDisabledReasonsByAction((disabledReasonsState) => ({
								...disabledReasonsState,
								[action.title]: result,
							}));
						}}
					>
						<Flex justifyContent="space-between">
							{action.title}
							<Spinner
								ml={2}
								show={disabledReason === LOADING_DISABLED_REASON}
							/>
						</Flex>
					</ActionContent>
				</Button>
			</Box>
		);
	}

	const disabledReason = autoUIGetDisabledReason(
		selected,
		hasOngoingAction,
		null,
		t,
	);

	return (
		<Wrapper>
			<DropDownButton
				joined
				alignRight
				secondary
				disabled={!!disabledReason}
				tooltip={disabledReason}
				icon={<FontAwesomeIcon icon={faPenToSquare} />}
				label={t('labels.modify')}
				items={actionHandlers}
			/>
		</Wrapper>
	);
};
