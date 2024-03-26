import React from 'react';
import { Heading } from 'rendition';
import { Material } from '@balena/ui-shared-components';
const { Box } = Material;

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
			<Heading color="white">{title}</Heading>
		</Box>
	);
};
