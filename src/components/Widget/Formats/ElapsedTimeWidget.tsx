import React from 'react';
import {
	UiOption,
	JsonTypes,
	widgetFactory,
	formatTimestamp,
	timeSince,
} from '../utils';
import { Material, Tooltip } from '@balena/ui-shared-components';
const { Typography } = Material;

export const ElapsedTimeWidget = widgetFactory(
	'ElapsedTime',
	{
		dtFormat: UiOption.string,
	},
	[JsonTypes.string, JsonTypes.number],
)(({ value }) => {
	if (!value) {
		return null;
	}

	return (
		<Tooltip title={formatTimestamp(value)}>
			<Typography>{timeSince(value)}</Typography>
		</Tooltip>
	);
});
