import type { JSONSchema7 as JSONSchema } from 'json-schema';
import * as React from 'react';
import type { TagItem } from 'rendition';
import { Tag, type TagProps } from 'rendition';
import { convertFilterToHumanReadable } from './SchemaSieve';

export interface FilterDescriptionProps extends Omit<TagProps, 'value'> {
	filter: JSONSchema;
}

export const FilterDescription = ({
	filter,
	...props
}: FilterDescriptionProps) => {
	const tagProps = React.useMemo(
		() => convertFilterToHumanReadable(filter) as TagItem[],
		[filter],
	);

	return tagProps ? <Tag mt={2} multiple={tagProps} {...props} /> : null;
};
