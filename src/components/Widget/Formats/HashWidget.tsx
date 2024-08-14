import React from 'react';
import { Code, Copy } from '@balena/ui-shared-components';
import { JsonTypes, truncateHash, widgetFactory } from '../utils';

export const HashWidget = widgetFactory('Hash', {}, [JsonTypes.string])(
	({ value }) => {
		return (
			<Copy copy={value}>
				<Code>{truncateHash(value)}</Code>
			</Copy>
		);
	},
);
