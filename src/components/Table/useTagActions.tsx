import React, { useMemo, useState } from 'react';
import { Material } from '@balena/ui-shared-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons/faPlus';
import type { AutoUIContext } from '~/AutoUI/schemaOps';
import uniq from 'lodash/uniq';
import { useRequest } from 'rendition';

const { Stack } = Material;

export function useTagActions<T extends object>(
	autoUIContext: AutoUIContext<T>,
	data: T,
) {
	const [showAddTagDialog, setShowAddTagDialog] = useState(false);
	const { data: tagKeys } = useRequest(
		async () => {
			if (!autoUIContext.sdk?.tags || !('getAll' in autoUIContext.sdk.tags)) {
				return;
			}
			const tags = (await autoUIContext.sdk.tags.getAll(data)).flatMap(
				(d: T) => {
					// TODO: check if there is any safer way to get the tag key
					const tagKey = Object.keys(d).find((key) => key.endsWith('_tag'));
					return tagKey ? d[tagKey as keyof T] : [];
				},
				// TODO: improve typing
			) as Array<{
				tag_key: string;
			}>;
			return uniq(tags.map((tag) => tag.tag_key));
		},
		[autoUIContext.sdk?.tags, data],
		{ polling: false },
	);

	const actions = useMemo(() => {
		if (!autoUIContext.tagField) {
			return [];
		}

		return [
			{
				disabled: !tagKeys?.length,
				onClick: () => {
					if (!tagKeys?.length) {
						return [];
					}
					setShowAddTagDialog(true);
				},
				children: (
					<Stack direction="row" gap={2} alignItems="center">
						<FontAwesomeIcon icon={faPlus} />
						Add tag column
					</Stack>
				),
			},
		];
	}, [tagKeys, autoUIContext.tagField]);

	return { actions, showAddTagDialog, setShowAddTagDialog, tagKeys };
}
