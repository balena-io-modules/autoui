import { createContext } from 'react';
import type { Dictionary } from '../common';
import type { TFunction } from '../hooks/useTranslation';
export interface ContextProviderInterface {
	history: unknown;
	t?: TFunction;
	externalTranslationMap?: Dictionary<string>;
}

export const ContextProvider = createContext<ContextProviderInterface>({
	history: {},
});
