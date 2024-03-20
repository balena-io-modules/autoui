import React from 'react';
import {
	ResourceTagSubmitInfo,
	Spinner,
	SubmitInfo,
	TagManagementModal,
	notifications,
	useRequest,
} from 'rendition';
import { useTranslation } from '../../hooks/useTranslation';
import { AutoUIContext, AutoUIBaseResource } from '../schemaOps';

interface TagsProps<T> {
	selected: T[] | undefined;
	autouiContext: AutoUIContext<T>;
	setIsBusyMessage: (message: string | undefined) => void;
	onDone: () => void;
	refresh?: () => void;
}

export const Tags = <T extends AutoUIBaseResource<T>>({
	selected,
	autouiContext,
	setIsBusyMessage,
	refresh,
	onDone,
}: TagsProps<T>) => {
	const { t } = useTranslation();

	const { sdk, internalPineFilter, checkedState } = autouiContext;

	const { data: items, isLoading } = useRequest(
		async () => {
			if (checkedState === 'all' && sdk?.tags && 'getAll' in sdk.tags) {
				return await sdk.tags.getAll(internalPineFilter);
			}
			return selected;
		},
		[internalPineFilter, checkedState, sdk],
		{ polling: false },
	);

	const changeTags = React.useCallback(
		async (tags: SubmitInfo<ResourceTagSubmitInfo, ResourceTagSubmitInfo>) => {
			if (!sdk?.tags) {
				return;
			}

			setIsBusyMessage(t(`loading.updating_tags`));
			notifications.addNotification({
				id: 'change-tags-loading',
				content: t(`loading.updating_tags`),
			});

			try {
				await sdk.tags.submit(tags);
				notifications.addNotification({
					id: 'change-tags',
					content: 'Tags updated successfully',
					type: 'success',
				});
				refresh?.();
			} catch (err) {
				notifications.addNotification({
					id: 'change-tags',
					content: err.message,
					type: 'danger',
				});
			} finally {
				notifications.removeNotification('change-tags-loading');
				setIsBusyMessage(undefined);
			}
		},
		[sdk?.tags, refresh, selected],
	);

	if (!autouiContext.tagField || !autouiContext.nameField || !items) {
		return null;
	}

	return (
		<Spinner show={isLoading} width="100%" height="100%">
			<TagManagementModal<T>
				items={items}
				itemType={autouiContext.resource}
				titleField={autouiContext.nameField as keyof T}
				tagField={autouiContext.tagField as keyof T}
				done={(tagSubmitInfo) => {
					changeTags(tagSubmitInfo);
					onDone();
				}}
				cancel={() => onDone()}
			/>
		</Spinner>
	);
};
