import React from 'react';
import { ContextProvider } from '../contexts/ContextProvider';
import type { NavigateFunction } from 'react-router-dom';

export const useNavigate = (): NavigateFunction | undefined => {
	const { navigate } = React.useContext(ContextProvider);
	return navigate;
};
