import React from 'react';
import type { ResourceTagSubmitInfo, SubmitInfo } from 'rendition';
import { Spinner, TagManagementModal, useRequest } from 'rendition';
import type { JSONSchema7 as JSONSchema } from 'json-schema';
import { useTranslation } from '../../hooks/useTranslation';
import type { AutoUIContext, AutoUIBaseResource } from '../schemaOps';
import { parseDescriptionProperty } from '../schemaOps';
import { enqueueSnackbar, closeSnackbar } from '@balena/ui-shared-components';
import get from 'lodash/get';

interface TagsProps<T> {
	selected: T[] | undefined;
	autouiContext: AutoUIContext<T>;
	schema: JSONSchema;
	setIsBusyMessage: (message: string | undefined) => void;
	onDone: () => void;
	refresh?: () => void;
}

export const Tags = <T extends AutoUIBaseResource<T>>({
	selected,
	autouiContext,
	schema,
	setIsBusyMessage,
	refresh,
	onDone,
}: TagsProps<T>) => {
	const { t } = useTranslation();

	const { sdk, internalPineFilter, checkedState } = autouiContext;

	const getAllTags = sdk?.tags && 'getAll' in sdk.tags ? sdk.tags.getAll : null;

	// This will get nested property names based on the x-ref-scheme property.
	const getItemName = (item: T) => {
		const property = schema.properties?.[
			autouiContext.nameField!
		] as JSONSchema;
		const refScheme = parseDescriptionProperty(property, 'x-ref-scheme');

		if (refScheme != null && typeof refScheme === 'object') {
			const field = refScheme[0];
			const nameFieldItem = item[autouiContext.nameField as keyof T];
			return get(
				property.type === 'array'
					? (nameFieldItem as Array<T[keyof T]> | undefined)?.[0]
					: nameFieldItem,
				field,
			);
		}

		return item[autouiContext.nameField as keyof T];
	};

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
				titleField={getItemName ?? (autouiContext.nameField as keyof T)}
				tagField={autouiContext.tagField as keyof T}
				done={(tagSubmitInfo) => {
					void changeTags(tagSubmitInfo);
					onDone();
				}}
				cancel={() => {
					onDone();
				}}
			/>
		</Spinner>
	);
};
