import { useState, useEffect } from 'react';

import type { AutoUIEntityPropertyDefinition } from '../../AutoUI';
import { getFromLocalStorage, setToLocalStorage } from '../../AutoUI/utils';
import type { TagField } from './utils';

export const TAG_COLUMN_PREFIX = 'tag_column_';
// Move columns logic inside a dedicated hook to make the refactor easier and move this logic without effort.
export function useColumns<T>(
	resourceName: string,
	defaultColumns: Array<AutoUIEntityPropertyDefinition<T>>,
	tagKeyRender: (
		key: string,
	) => (tags: TagField[] | undefined) => React.JSX.Element | null,
) {
	const [columns, setColumns] = useState(() => {
		const storedColumns = getFromLocalStorage<
			Array<AutoUIEntityPropertyDefinition<T>>
		>(`${resourceName}__columns`);
		if (storedColumns) {
			const storedColumnsMap = new Map(storedColumns.map((s) => [s.key, s]));

			const tagColumns = storedColumns.filter((c) =>
				c.key.startsWith(TAG_COLUMN_PREFIX),
			);

			const cols = [...defaultColumns, ...tagColumns].map((d) => {
				const storedColumn = storedColumnsMap.get(d.key);
				return {
					...d,
					render: d.key.startsWith(TAG_COLUMN_PREFIX)
						? tagKeyRender(d.title)
						: d.render,
					selected: storedColumn?.selected ?? d.selected,
				};
			});
			// Remove incorrectly saved column configurations and handle any structural changes.
			const safeFilteredCols = cols.filter(
				(c) => typeof c.render === 'function',
			);

			return safeFilteredCols;
		} else {
			return defaultColumns;
		}
	});
	useEffect(() => {
		setToLocalStorage(
			`${resourceName}__columns`,
			columns.map((c) => ({
				...c,
				label: typeof c.label === 'string' ? c.label : null,
			})),
		);
	}, [resourceName, columns]);

	return [columns, setColumns] as const;
}
