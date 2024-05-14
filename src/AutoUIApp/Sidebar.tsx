import React from 'react';
import { NavLink } from 'react-router-dom';
import { useLocation } from 'react-router';
import { OpenApiJson } from './openApiJson';
import { designTokens, Material } from '@balena/ui-shared-components';
const { Box, styled, Typography, Tooltip } = Material;

const SidebarWrapper = styled(Box)(({ theme }) => ({
	display: 'flex',
	overflow: 'auto',
	background: theme.palette.secondary.main,
	flexDirection: 'column',
	flexWrap: 'nowrap',
}));

const MenuItem = styled(Box)<{ isCurrent: boolean }>(
	({ isCurrent, theme }) => ({
		display: 'flex',
		height: '48px',
		cursor: 'pointer',
		borderBottom: `1px solid
		${
			isCurrent
				? designTokens.color.border.value
				: designTokens.color.border.subtle.value
		}`,
		borderLeft: isCurrent
			? `2px solid ${designTokens.color.border.accent.value}`
			: 'none',
		background: isCurrent
			? designTokens.color.border.value
			: designTokens.color.border.subtle.value,

		'&:hover': {
			background: isCurrent ? theme.palette.divider : theme.palette.grey[900],
		},
	}),
);

interface SidebarProps {
	openApiJson: OpenApiJson;
	isCollapsed: boolean;
}

export const Sidebar = ({
	openApiJson,
	isCollapsed = false,
	...flexProps
}: SidebarProps & Material.BoxProps) => {
	const { pathname } = useLocation();
	const menuItems = React.useMemo(
		() =>
			Object.entries(openApiJson.components.schemas)
				.filter(
					([key, value]) =>
						!key.endsWith('-create') &&
						!key.endsWith('-update') &&
						!!value.title,
				) // add !findInObject(value, '$ref')
				.map(([key, value]) => ({
					resource: key.substring(key.indexOf('.') + 1),
					title: value.title?.split('_')?.join(' '),
				})),
		[openApiJson],
	);
	return (
		<SidebarWrapper {...flexProps}>
			{menuItems.map((item) => {
				const isCurrent = pathname
					.split('/')
					.some((i: string) => i === item.resource);

				return (
					<NavLink key={item.resource} to={`/${item.resource}`}>
						<MenuItem
							width="100%"
							isCurrent={isCurrent}
							px={3}
							py={2}
							flexDirection="row"
							alignItems="center"
						>
							<Tooltip title={item.title}>
								<Typography
									fontWeight="bold"
									lineHeight={1.33}
									color={(theme) =>
										isCurrent
											? theme.palette.text.primary
											: theme.palette.text.secondary
									}
									display={isCollapsed ? 'none' : undefined}
									noWrap
								>
									{item.title}
								</Typography>
							</Tooltip>
						</MenuItem>
					</NavLink>
				);
			})}
		</SidebarWrapper>
	);
};
