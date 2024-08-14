import { History } from 'history';
import { createContext } from 'react';
import { TFunction } from '../hooks/useTranslation';
import type { Dictionary } from '../common';
export interface ContextProviderInterface {
	history: History;
	t?: TFunction;
	externalTranslationMap?: Dictionary<string>;
}

export const ContextProvider = createContext<ContextProviderInterface>({
	history: {} as History,
});
