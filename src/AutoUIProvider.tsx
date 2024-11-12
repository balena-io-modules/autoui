import React from 'react';
import type { ContextProviderInterface } from './contexts/ContextProvider';
import { ContextProvider } from './contexts/ContextProvider';

export const AutoUIProvider = ({
	children,
	...otherProps
}: ContextProviderInterface & { children: React.ReactNode }) => {
	return (
		<ContextProvider.Provider value={otherProps}>
			{children}
		</ContextProvider.Provider>
	);
};
