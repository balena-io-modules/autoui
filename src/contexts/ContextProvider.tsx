import type { History } from 'history';
import { createContext } from 'react';
import type { Dictionary } from 'rendition';
import type { TFunction } from '../hooks/useTranslation';
export interface ContextProviderInterface {
	history: History;
	t?: TFunction;
	externalTranslationMap?: Dictionary<string>;
}

export const ContextProvider = createContext<ContextProviderInterface>({
	history: {} as History,
});
