import React from 'react';
import type {
	AutoUIContext,
	AutoUIModel,
	AutoUIBaseResource,
} from '../schemaOps';
import { autoUIJsonSchemaPick } from '../schemaOps';
import type { ActionData } from '../schemaOps';
import { autoUIGetDisabledReason } from '../utils';
import { useTranslation } from '../../hooks/useTranslation';
import type { CheckedState } from 'rendition';
import { ActionContent, LOADING_DISABLED_REASON } from './ActionContent';
import type { DropDownButtonProps } from '@balena/ui-shared-components';
import {
	DropDownButton,
	Material,
	Tooltip,
	Spinner,
} from '@balena/ui-shared-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPenToSquare } from '@fortawesome/free-solid-svg-icons/faPenToSquare';

const { Box, Button, useMediaQuery, useTheme } = Material;

interface UpdateProps<T extends AutoUIBaseResource<T>> {
	model: AutoUIModel<T>;
	autouiContext: AutoUIContext<T>;
	selected: T[] | undefined;
	checkedState: CheckedState | undefined;
	hasOngoingAction: boolean;
	onActionTriggered: (data: ActionData<T>) => void;
}

export const Update = <T extends AutoUIBaseResource<T>>({
	model,
	autouiContext,
	selected,
	hasOngoingAction,
	onActionTriggered,
	checkedState,
}: UpdateProps<T>) => {
	const { t } = useTranslation();
	const theme = useTheme();
	const isTablet = useMediaQuery(theme.breakpoints.down('md'));
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

	const actionHandlers = React.useMemo<
		DropDownButtonProps<{ section?: string }>['items']
	>(() => {
		if (!updateActions) {
			return [];
		}
		return updateActions.map((action) => {
			const disabledReason =
				autoUIGetDisabledReason(
					selected,
					checkedState,
					hasOngoingAction,
					action.type as 'update' | 'delete',
					t,
				) ?? disabledReasonsByAction[action.title];

			return {
				eventName: `${model.resource} ${action.title}`,
				children: (
					<ActionContent<T>
						getDisabledReason={action.isDisabled}
						affectedEntries={selected}
						checkedState={checkedState}
						onDisabledReady={(result) => {
							setDisabledReasonsByAction((disabledReasonsState) => ({
								...disabledReasonsState,
								[action.title]: result,
							}));
						}}
					>
						<Box
							display="flex"
							justifyContent="space-between"
							color={
								action.isDangerous && !disabledReasonsByAction[action.title]
									? 'error.main'
									: undefined
							}
						>
							{action.title}
							<Spinner show={disabledReason === LOADING_DISABLED_REASON} />
						</Box>
					</ActionContent>
				),
				onClick: () => {
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
					});
				},
				tooltip:
					typeof disabledReason === 'string'
						? {
								title: disabledReason,
								placement: isTablet ? 'top' : 'right',
							}
						: undefined,
				disabled: !!disabledReason,
				section: action.section,
			};
		});
	}, [updateActions, disabledReasonsByAction]);

	if (!updateActions || updateActions.length < 1) {
		return null;
	}

	if (updateActions.length === 1) {
		const action = updateActions[0];
		const disabledReason =
			autoUIGetDisabledReason(
				selected,
				checkedState,
				hasOngoingAction,
				action.type as 'update' | 'delete',
				t,
			) ?? disabledReasonsByAction[action.title];
		return (
			<Box alignSelf="flex-start">
				<Tooltip
					title={
						typeof disabledReason === 'string' ? disabledReason : undefined
					}
				>
					<Button
						key={action.title}
						data-action={`${action.type}-${model.resource}`}
						onClick={() => {
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
							});
						}}
						disabled={!!disabledReason}
						color={action.isDangerous ? 'error' : 'secondary'}
					>
						<ActionContent<T>
							getDisabledReason={action.isDisabled}
							affectedEntries={selected}
							checkedState={checkedState}
							onDisabledReady={(result) => {
								setDisabledReasonsByAction((disabledReasonsState) => ({
									...disabledReasonsState,
									[action.title]: result,
								}));
							}}
						>
							<Box display="flex" justifyContent="space-between">
								{action.title}
								<Spinner
									sx={{ ml: 2 }}
									show={disabledReason === LOADING_DISABLED_REASON}
								/>
							</Box>
						</ActionContent>
					</Button>
				</Tooltip>
			</Box>
		);
	}

	const actionDisabledReason = autoUIGetDisabledReason(
		selected,
		checkedState,
		hasOngoingAction,
		null,
		t,
	);

	return (
		<Tooltip title={actionDisabledReason}>
			<DropDownButton<{ section?: string }>
				items={actionHandlers}
				disabled={!!actionDisabledReason}
				startIcon={<FontAwesomeIcon icon={faPenToSquare} />}
				children={t('labels.modify')}
				color="secondary"
				groupByProp="section"
			/>
		</Tooltip>
	);
};
