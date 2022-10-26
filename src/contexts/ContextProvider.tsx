import { History } from 'history';
import { createContext } from 'react';
import { TFunction } from '../hooks/useTranslation';
export interface ContextProviderInterface {
	history: History;
	t?: TFunction;
}

export const ContextProvider = createContext<ContextProviderInterface>({
	history: {} as History,
});
