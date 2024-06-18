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
import { findInObject } from '../../AutoUI/utils';

const transformToRidableValue = (
	parsedFilterDescription: SieveFilterDescription,
): string => {
	const { schema, value } = parsedFilterDescription;
	const oneOf = findInObject(schema, 'oneOf') as JSONSchema['oneOf'];
	if (oneOf) {
		const findObj = oneOf.find(
			(o) => typeof o === 'object' && 'const' in o && o.const === value,
		);
		if (isJSONSchema(findObj) && findObj.title) {
			return findObj.title;
		}
	}

	if (schema && isDateTimeFormat(schema.format) && value != null) {
		return dateFormat(value, 'PPPppp');
	}

	if (value != null && typeof value === 'object') {
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
		const val = Object.values(value)[0];
		return typeof val === 'string' ? val : JSON.stringify(val);
	}

	if (!value) {
		return 'not defined';
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
							value: transformToRidableValue(parsedFilterDescription),
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
				const value = transformToRidableValue(parsedFilterDescription);
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
