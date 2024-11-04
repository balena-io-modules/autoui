import React from 'react';
import { Code, Copy, Tooltip } from '@balena/ui-shared-components';
import { JsonTypes, widgetFactory } from '../utils';

export const CodeWidget = widgetFactory('Code', {}, [JsonTypes.string])(({
	value,
}) => {
	return (
		<Copy copy={value}>
			<Tooltip title={value}>
				<Code noWrap>{value}</Code>
			</Tooltip>
		</Copy>
	);
});
