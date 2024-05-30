import React from 'react';
import { Material } from '@balena/ui-shared-components';
const { Box, Typography } = Material;

interface NavbarProps extends Material.BoxProps {
	title: string;
	logo?: string;
}

export const Navbar = ({ title, logo, ...boxProps }: NavbarProps) => {
	return (
		<Box
			display="flex"
			bgcolor="secondary.main"
			alignItems="center"
			{...boxProps}
		>
			{logo && <img src={logo} alt={title} height="50px" />}
			<Typography variant="title" color="white">
				{title}
			</Typography>
		</Box>
	);
};
