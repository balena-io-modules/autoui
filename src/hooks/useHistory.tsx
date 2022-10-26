import React from 'react';
import { ContextProvider } from '../contexts/ContextProvider';

export const useHistory = () => {
	const { history } = React.useContext(ContextProvider);
	return history;
};
