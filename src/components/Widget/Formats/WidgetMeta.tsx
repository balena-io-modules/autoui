import * as React from 'react';
import get from 'lodash/get';
import startCase from 'lodash/startCase';
import { Material, WidgetProps } from '@balena/ui-shared-components';
const { Box, Typography } = Material;

type WidgetMetaProps = {
	valueKey?: string;
	schema: WidgetProps['schema'];
	uiSchema: WidgetProps['uiSchema'];
};

// Renders the title and description for a widget (if set)
export default function WidgetMeta({
	valueKey,
	schema = {},
	uiSchema = {},
}: WidgetMetaProps) {
	const title = get(uiSchema, 'ui:title', schema.title || valueKey);
	const description = get(uiSchema, 'ui:description', schema.description);
	if (!title && !description) {
		return null;
	}
	return (
		<Box mr={2}>
			{title && (
				<Typography sx={{ fontWeight: 'bold' }}>{startCase(title)}</Typography>
			)}
			{description && (
				<Typography fontSize="85%" color="text.light">
					{description}
				</Typography>
			)}
		</Box>
	);
}
