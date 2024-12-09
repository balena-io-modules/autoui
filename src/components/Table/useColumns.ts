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
			const defaultColumnsMap = new Map(defaultColumns.map((s) => [s.key, s]));

			return storedColumns.map((d) => {
				const defaultColumn = defaultColumnsMap.get(d.key);
				const columnLabel = defaultColumn?.label ?? d.label;
				return {
					...(d.key.startsWith(TAG_COLUMN_PREFIX)
						? { render: tagKeyRender(d.title) }
						: defaultColumn),
					...d,
					label: columnLabel,
				};
			});
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
