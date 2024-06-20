import type { JSONSchema7 as JSONSchema } from 'json-schema';
import * as React from 'react';
import { Tag, type TagProps, TagItem } from 'rendition';
import {
	FULL_TEXT_SLUG,
	parseFilterDescription,
	type FilterDescription as SieveFilterDescription,
} from './SchemaSieve';
import { isDateTimeFormat } from '../../DataTypes';
import { format as dateFormat } from 'date-fns';
import { isJSONSchema } from '../../AutoUI/schemaOps';
import isEqual from 'lodash/isEqual';

const transformToReadableValue = (
	parsedFilterDescription: SieveFilterDescription,
): string => {
	const { schema, value } = parsedFilterDescription;
	if (schema && isDateTimeFormat(schema.format)) {
		return dateFormat(value, 'PPPppp');
	}
	if (schema?.enum && 'enumNames' in schema) {
		const index = schema.enum.findIndex((a) => isEqual(a, value));
		return (schema.enumNames as string[])[index];
	}

	if (typeof value === 'object') {
		if (Object.keys(value).length > 1) {
			return Object.entries(value)
				.map(([key, value]) => {
					const property = schema.properties?.[key];
					return isJSONSchema(property)
						? `${property.title ?? key}: ${value}`
						: `${key}: ${value}`;
				})
				.join(', ');
		}
		return Object.values(value)[0] as string;
	}

	return String(value);
};

export interface FilterDescriptionProps extends Omit<TagProps, 'value'> {
	filter: JSONSchema;
}

export const FilterDescription = ({
	filter,
	...props
}: FilterDescriptionProps) => {
	const tagProps = React.useMemo(() => {
		if (filter.title === FULL_TEXT_SLUG) {
			const parsedFilterDescription = parseFilterDescription(filter);
			if (!parsedFilterDescription) {
				return;
			}
			return parsedFilterDescription
				? [
						{
							name: parsedFilterDescription.field,
							operator: 'contains',
							value: transformToReadableValue(parsedFilterDescription),
						},
				  ]
				: undefined;
		}

		return filter.anyOf
			?.map<TagItem | undefined>((f, index) => {
				if (!isJSONSchema(f)) {
					return;
				}
				const parsedFilterDescription = parseFilterDescription(f);
				if (!parsedFilterDescription) {
					return;
				}
				const value = transformToReadableValue(parsedFilterDescription);
				return {
					name:
						parsedFilterDescription?.schema?.title ??
						parsedFilterDescription.field,
					operator: parsedFilterDescription.operator,
					value,
					prefix: index > 0 ? 'or' : undefined,
				};
			})
			.filter((f): f is TagItem => Boolean(f));
	}, [filter]);

	return tagProps ? <Tag mt={2} multiple={tagProps} {...props} /> : null;
};
