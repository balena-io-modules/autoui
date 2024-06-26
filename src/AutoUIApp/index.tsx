import React from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { Router, Switch, Route } from 'react-router-dom';
import { Content } from './Content';
import { createGlobalStyle } from 'styled-components';
import { OpenApiJson } from './openApiJson';
import { ActionSidebar, ActionSidebarProps } from './ActionSidebar';
import { Provider } from 'rendition';
import { useHistory } from '../hooks/useHistory';
import { Material } from '@balena/ui-shared-components';
import { useClickOutsideOrEsc } from '../hooks/useClickOutsideOrEsc';
const { Box } = Material;

const SIDEBAR_WIDTH = 166;
const NAVBAR_HEIGHT = 60;
export const ACTION_SIDEBAR_WIDTH = 340;

const GlobalStyle = createGlobalStyle`
	html,
	body {
		height: 100%;
		margin: 0;
		padding: 0;
	}
`;

// tslint:disable-next-line no-namespace
declare global {
	interface Window {
		REACT_APP_API_HOST: string;
		REACT_APP_TITLE: string;
	}
}

export enum ActionMethods {
	POST = 'post',
	PATCH = 'patch',
	DELETE = 'delete',
}

export interface AutoUIAppProps {
	openApiJson: OpenApiJson;
	title: string;
	logo?: string;
}

export const AutoUIApp = ({ openApiJson, title, logo }: AutoUIAppProps) => {
	const actionSidebarWrapper = useClickOutsideOrEsc<HTMLDivElement>(() =>
		setActionSidebar(null),
	);
	const history = useHistory();
	const [actionSidebar, setActionSidebar] = React.useState<Omit<
		ActionSidebarProps,
		'openApiJson'
	> | null>();

	return (
		<Provider>
			<Router history={history}>
				<GlobalStyle />
				<Navbar height={NAVBAR_HEIGHT} title={title} logo={logo} />
				<Box sx={{ display: 'flex', position: 'relative' }}>
					<Sidebar
						width={`${SIDEBAR_WIDTH}px`}
						height={`calc(100vh - ${NAVBAR_HEIGHT}px)`}
						openApiJson={openApiJson}
						isCollapsed={false}
					/>
					<Box
						width={`calc(100vw - ${
							actionSidebar
								? SIDEBAR_WIDTH + ACTION_SIDEBAR_WIDTH
								: SIDEBAR_WIDTH
						}px)`}
						height={`calc(100vh - ${NAVBAR_HEIGHT}px)`}
						px={2}
						py={1}
						style={{ overflow: 'auto' }}
					>
						<Switch>
							{Object.keys(openApiJson.paths).map((path) => (
								<Route
									key={path}
									path={path}
									render={() => (
										<Content
											openApiJson={openApiJson}
											openActionSidebar={setActionSidebar}
										/>
									)}
								/>
							))}
						</Switch>
					</Box>
					{actionSidebar && (
						<Box display="flex" ref={actionSidebarWrapper}>
							<ActionSidebar
								{...actionSidebar}
								openApiJson={openApiJson}
								onClose={() => setActionSidebar(null)}
							/>
						</Box>
					)}
				</Box>
			</Router>
		</Provider>
	);
};
