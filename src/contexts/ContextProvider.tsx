import { History } from 'history';
import { createContext } from 'react';
import { Dictionary } from 'rendition';
import { TFunction } from '../hooks/useTranslation';
export interface ContextProviderInterface {
	history: History;
	t?: TFunction;
	externalTranslationMap?: Dictionary<string>;
}

export const ContextProvider = createContext<ContextProviderInterface>({
	history: {} as History,
});
