import React from 'react';
import {
	AutoUIContext,
	AutoUIModel,
	AutoUIBaseResource,
	autoUIJsonSchemaPick,
} from '../schemaOps';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ActionData } from '../schemaOps';
import { getCreateDisabledReason } from '../utils';
import { faMagic } from '@fortawesome/free-solid-svg-icons/faMagic';
import { useTranslation } from '../../hooks/useTranslation';
import { Box, Button, Flex, Spinner } from 'rendition';
import { ActionContent, LOADING_DISABLED_REASON } from './ActionContent';

interface CreateProps<T extends AutoUIBaseResource<T>> {
	model: AutoUIModel<T>;
	autouiContext: AutoUIContext<T>;
	hasOngoingAction: boolean;
	onActionTriggered: (data: ActionData<T>) => void;
}

export const Create = <T extends AutoUIBaseResource<T>>({
	model,
	autouiContext,
	hasOngoingAction,
	onActionTriggered,
}: CreateProps<T>) => {
	const { t } = useTranslation();
	const { actions } = autouiContext;
	const createActions = actions?.filter((action) => action.type === 'create');
	const [disabledReasonsByAction, setDisabledReasonsByAction] = React.useState<
		Record<string, string | undefined | null>
	>(() => {
		return Object.fromEntries(
			(createActions ?? []).map((action) => [
				action.title,
				LOADING_DISABLED_REASON,
			]),
		);
	});

	if (!createActions || createActions.length < 1) {
		return null;
	}

	if (createActions.length > 1) {
		throw new Error('Only one create action per resource is allowed');
	}

	const [action] = createActions;

	const disabledReason =
		getCreateDisabledReason(model.permissions, hasOngoingAction, t) ??
		disabledReasonsByAction[action.title];

	return (
		<Box>
			<Button
				data-action={`create-${model.resource}`}
				onClick={() =>
					onActionTriggered({
						action,
						schema: autoUIJsonSchemaPick(
							model.schema,
							model.permissions.create,
						),
					})
				}
				icon={<FontAwesomeIcon icon={faMagic} />}
				tooltip={
					typeof disabledReason === 'string' ? disabledReason : undefined
				}
				disabled={!!disabledReason}
				primary
			>
				<ActionContent<T>
					getDisabledReason={action.isDisabled}
					affectedEntries={undefined}
					checkedState={undefined}
					onDisabledReady={(result) => {
						setDisabledReasonsByAction((disabledReasonsState) => ({
							...disabledReasonsState,
							[action.title]: result,
						}));
					}}
				>
					<Flex justifyContent="space-between">
						{action.title}
						<Spinner ml={2} show={disabledReason === LOADING_DISABLED_REASON} />
					</Flex>
				</ActionContent>
			</Button>
		</Box>
	);
};
