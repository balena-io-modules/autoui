import React, { useMemo, useState } from 'react';
import { AutoUIEntityPropertyDefinition } from '../../AutoUI';
import { Material } from '@balena/ui-shared-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons/faPlus';
import { AutoUIContext } from '~/AutoUI/schemaOps';
import uniq from 'lodash/uniq';
import { useRequest } from 'rendition';

const { Stack } = Material;

export function useTagActions<T>(
	autoUIContext: AutoUIContext<T>,
	columns: Array<AutoUIEntityPropertyDefinition<T>>,
	data: T,
) {
	const [showAddTagDialog, setShowAddTagDialog] = useState(false);
	const { data: tagKeys } = useRequest(
		async () => {
			if (!autoUIContext.sdk?.tags || !('getAll' in autoUIContext.sdk.tags)) {
				return;
			}
			const tags = (await autoUIContext.sdk.tags.getAll(data)).flatMap(
				(d: any) => d.device_tag,
			) as Array<{
				tag_key: string;
			}>;
			return uniq(tags.map((tag) => tag.tag_key));
		},
		[autoUIContext.sdk?.tags, data],
		{ polling: false },
	);

	const actions = useMemo(() => {
		if (!tagKeys?.length) {
			return [];
		}

		return [
			{
				onClick: () => {
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
	}, [columns, tagKeys]);

	return { actions, showAddTagDialog, setShowAddTagDialog, tagKeys };
}
