import type { NavigateFunction } from 'react-router-dom';
import { createContext } from 'react';
import type { Dictionary } from '../common';
import type { TFunction } from '../hooks/useTranslation';
export interface ContextProviderInterface {
	navigate?: NavigateFunction;
	t?: TFunction;
	externalTranslationMap?: Dictionary<string>;
}

export const ContextProvider = createContext<ContextProviderInterface>({
	navigate: undefined,
});
