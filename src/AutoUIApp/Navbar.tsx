import React from 'react';
import { Flex, FlexProps, Heading } from 'rendition';

interface NavbarProps extends FlexProps {
	title: string;
	logo?: string;
}

export const Navbar = ({ title, logo, ...flexProps }: NavbarProps) => {
	return (
		<Flex bg="secondary.main" alignItems="center" {...flexProps}>
			{logo && <img src={logo} alt={title} height="50px" />}
			<Heading color="white">{title}</Heading>
		</Flex>
	);
};
