import { createContext } from 'react';
import type { History } from 'history';
import { TFunction } from '../hooks/useTranslation';

export interface ContextProviderInterface {
	history?: History;
	t?: TFunction;
}

export const ContextProvider = createContext<ContextProviderInterface>({});
