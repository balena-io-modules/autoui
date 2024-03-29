import React from 'react';

export const useClickOutsideOrEsc = <T extends HTMLElement>(
	handler: () => void,
): React.RefObject<T> => {
	const domNodeRef = React.useRef<T>(null);

	React.useEffect(() => {
		const handleClickOutside = (event: MouseEvent | KeyboardEvent) => {
			if (!domNodeRef.current?.contains(event.target as Node)) {
				handler();
			}
		};

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				handler();
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		document.addEventListener('keydown', handleKeyDown);

		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
			document.removeEventListener('keydown', handleKeyDown);
		};
	}, [handler]);

	return domNodeRef;
};
