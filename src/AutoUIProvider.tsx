import React from 'react';
import { ContextProvider, ContextProviderInterface } from "./contexts/ContextProvider"

export const AutoUIProvider = ({ children, ...otherProps }: ContextProviderInterface & { children: React.ReactNode }) => {
  return <ContextProvider.Provider value={otherProps}>{children}</ContextProvider.Provider>
}