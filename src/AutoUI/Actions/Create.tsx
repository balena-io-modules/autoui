import React from 'react';
import type {
	AutoUIContext,
	AutoUIModel,
	AutoUIBaseResource,
} from '../schemaOps';
import { autoUIJsonSchemaPick } from '../schemaOps';
import type { ActionData } from '../schemaOps';
import { getCreateDisabledReason } from '../utils';
import { useTranslation } from '../../hooks/useTranslation';
import { Spinner } from 'rendition';
import { ActionContent, LOADING_DISABLED_REASON } from './ActionContent';
import { Material, Tooltip } from '@balena/ui-shared-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagic } from '@fortawesome/free-solid-svg-icons/faMagic';

const { Button, Box } = Material;

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
		<Box display="flex">
			<Tooltip
				title={typeof disabledReason === 'string' ? disabledReason : undefined}
			>
				<Button
					data-action={`create-${model.resource}`}
					variant="contained"
					onClick={() =>
						onActionTriggered({
							action,
							schema: autoUIJsonSchemaPick(
								model.schema,
								model.permissions.create,
							),
						})
					}
					startIcon={<FontAwesomeIcon icon={faMagic} />}
					disabled={!!disabledReason}
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
						<Box display="flex" justifyContent="space-between">
							{action.title}
							<Spinner
								ml={2}
								show={disabledReason === LOADING_DISABLED_REASON}
							/>
						</Box>
					</ActionContent>
				</Button>
			</Tooltip>
		</Box>
	);
};
