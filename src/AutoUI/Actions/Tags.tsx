import React from 'react';
import {
	ResourceTagSubmitInfo,
	Spinner,
	SubmitInfo,
	TagManagementModal,
	useRequest,
} from 'rendition';
import { useTranslation } from '../../hooks/useTranslation';
import { AutoUIContext, AutoUIBaseResource } from '../schemaOps';
import { enqueueSnackbar, closeSnackbar } from '@balena/ui-shared-components';

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

	const getAllTags = sdk?.tags && 'getAll' in sdk.tags ? sdk.tags.getAll : null;

	const { data: items, isLoading } = useRequest(
		async () => {
			if (
				// we are in server side pagination
				selected == null &&
				checkedState === 'all' &&
				getAllTags
			) {
				return await getAllTags(internalPineFilter);
			}
			return selected;
		},
		[internalPineFilter, checkedState, getAllTags, selected == null],
		{ polling: false },
	);

	const changeTags = React.useCallback(
		async (tags: SubmitInfo<ResourceTagSubmitInfo, ResourceTagSubmitInfo>) => {
			if (!sdk?.tags) {
				return;
			}

			setIsBusyMessage(t(`loading.updating_tags`));
			enqueueSnackbar({
				key: 'change-tags-loading',
				message: t(`loading.updating_tags`),
				preventDuplicate: true,
			});

			try {
				await sdk.tags.submit(tags);
				enqueueSnackbar({
					key: 'change-tags',
					message: t('success.tags_updated_successfully'),
					variant: 'success',
					preventDuplicate: true,
				});
				refresh?.();
			} catch (err) {
				enqueueSnackbar({
					key: 'change-tags',
					message: err.message,
					variant: 'error',
					preventDuplicate: true,
				});
			} finally {
				closeSnackbar('change-tags-loading');
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
