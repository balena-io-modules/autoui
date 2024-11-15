import type { CheckedState } from 'rendition';
import { useRequest } from 'rendition';
import type { AutoUIAction } from '../schemaOps';

export const LOADING_DISABLED_REASON = 'Loading';

interface ActionContentProps<T> {
	children: React.ReactElement;
	affectedEntries: T[] | undefined;
	checkedState?: CheckedState;
	getDisabledReason: AutoUIAction<T>['isDisabled'];
	onDisabledReady: (arg: string | null) => void;
}

// This component sole purpose is to have the useRequest being called exactly once per item,
// so that it satisfies React hooks assumption that the number of hook calls inside each component
// stays the same across renders.
export const ActionContent = <T extends object>({
	children,
	affectedEntries,
	checkedState,
	getDisabledReason,
	onDisabledReady,
}: ActionContentProps<T>) => {
	useRequest(
		async () => {
			const disabled =
				(await getDisabledReason?.({
					affectedEntries,
					checkedState,
				})) ?? null;
			onDisabledReady(disabled);
			return disabled;
		},
		[affectedEntries],
		{ polling: false },
	);
	return children;
};
