import React from 'react';
import { Material } from '@balena/ui-shared-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons/faSearch';
import { faTimes } from '@fortawesome/free-solid-svg-icons/faTimes';

const { TextField, InputAdornment, IconButton } = Material;

interface SearchProps extends Material.TextFieldProps<'standard'> {
	placeholder?: string;
	value: string;
	dark?: boolean;
	onEnter?: (event: React.KeyboardEvent) => void;
	onChange?: (
		event?: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>,
	) => void;
}

export const Search = ({
	placeholder,
	value,
	onEnter,
	onChange,
	InputProps,
	dark,
	...textFieldProps
}: SearchProps) => {
	const onKeyPress = React.useCallback(
		(event: React.KeyboardEvent) => {
			if (event.key === 'Enter') {
				onEnter?.(event);
			}
		},
		[onEnter],
	);

	return (
		<TextField
			variant="standard"
			fullWidth
			onKeyDown={onKeyPress}
			onChange={onChange}
			placeholder={placeholder}
			value={value}
			InputProps={{
				startAdornment: (
					<InputAdornment position="start">
						<FontAwesomeIcon
							icon={faSearch}
							style={{ color: dark ? 'white' : 'inherit' }} // TODO remove when we have implemented a dark theme
						/>
					</InputAdornment>
				),
				...(value.length > 0 && {
					endAdornment: (
						<InputAdornment position="end">
							<IconButton onClick={() => onChange?.(undefined)}>
								<FontAwesomeIcon
									icon={faTimes}
									style={{
										color: dark ? 'white' : 'inherit', // TODO remove when we have implemented a dark theme
									}}
								/>
							</IconButton>
						</InputAdornment>
					),
				}),
				// TODO remove when we have implemented a dark theme
				...(dark && {
					sx: {
						color: 'white',
						'&::before': {
							borderBottom: 'solid rgba(255, 255, 255, 0.6) 1px',
						},
						'&:hover:not(.Mui-disabled, .Mui-error)::before': {
							borderBottom: 'solid white 1px',
						},
					},
				}),
				...InputProps,
			}}
			{...textFieldProps}
		/>
	);
};
