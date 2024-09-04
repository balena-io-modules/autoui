import { useState, useEffect } from 'react';

import { AutoUIEntityPropertyDefinition } from '../../AutoUI';
import { getFromLocalStorage, setToLocalStorage } from '../../AutoUI/utils';

// Move columns logic inside a dedicated hook to make the refactor easier and move this logic without effort.
export function useColumns<T>(
	resourceName: string,
	defaultColumns: Array<AutoUIEntityPropertyDefinition<T>>,
	tagKeyRender: any,
) {
	const [columns, setColumns] = useState(() => {
		const storedColumns = getFromLocalStorage<
			Array<AutoUIEntityPropertyDefinition<T>>
		>(`${resourceName}__columns`);

		if (storedColumns) {
			const defaultColumnsMap = new Map(defaultColumns.map((s) => [s.key, s]));

			return storedColumns.map((d) => {
				const defaultColumn = defaultColumnsMap.get(d.key);
				return {
					...d,
					...(defaultColumn ?? { render: tagKeyRender(d.title) }),
				};
			});
		} else {
			return defaultColumns;
		}
	});

	useEffect(() => {
		setToLocalStorage(`${resourceName}__columns`, columns);
	}, [resourceName, columns]);

	return [columns, setColumns] as const;
}
