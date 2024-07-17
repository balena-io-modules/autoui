import { JSONSchema, TableSortOptions } from 'rendition';
import { AutoUIContext } from '../AutoUI/schemaOps';

export type PineFilterObject = Record<string, any>;

interface FilterMutation extends JSONSchema {
	$and?: any[];
	$or?: any[];
}

const maybePluralOp = ($op: string, filters: any[]): PineFilterObject => {
	const filtered = filters.filter((f) => f != null);
	if (filtered.length === 1) {
		return filtered[0];
	}
	return { [$op]: filtered };
};
const createAlias = (prop: string) =>
	prop
		.split('_')
		.filter((c) => c)
		.map((word) => word[0])
		.join('');

const comparisonOperatorMap = {
	$lt: ['exclusiveMaximum', 'formatExclusiveMaximum'],
	$le: ['maximum', 'formatMaximum'],
	$gt: ['exclusiveMinimum', 'formatExclusiveMinimum'],
	$ge: ['minimum', 'formatMinimum'],
} as const;

// TODO: When using the searchbar, for properties that are enums or oneOf, then we can prefilter (ignore case) the possible values (by labels for oneOf) and only pass those to the final json schema filter object
// { enum: device.dtmode.oneOf.filter(f => f.title.toLowerCase().includes(search.toLowerCase()).map(f => f.slug) }

// TODO: When ref-scheme or foreign-scheme are used, then we should treat the filter creation as if was a plain direct property and the filter modal should show the appropriate input based on the referenced leaf property schema.
// eg: if the leaf prop is a number, the modal should show =, >, <.$count

const handlePrimitiveFilter = (
	parentKeys: string[],
	value: JSONSchema & {
		// ajv extensions
		regexp?: { pattern?: string; flags?: string; description?: string };
		formatMinimum?: string;
		formatMaximum?: string;
		formatExclusiveMaximum?: string;
		formatExclusiveMinimum?: string;
	},
): PineFilterObject => {
	if (value.const !== undefined) {
		return wrapValue(parentKeys, value.const);
	}
	if (value.enum !== undefined) {
		return wrapValue(parentKeys, { $in: value.enum });
	}
	const regexp =
		value.regexp ??
		(value.pattern != null ? { pattern: value.pattern } : undefined);
	if (regexp != null) {
		if (regexp.pattern == null) {
			throw new Error(
				`Regex object defined but the pattern property was empty`,
			);
		}
		if (regexp.flags != null && regexp.flags !== 'i') {
			throw new Error(`Regex flag ${regexp.flags} is not supported`);
		}
		if (
			value.$comment === 'starts_with' ||
			value.$comment === 'not_starts_with'
		) {
			return {
				$startswith: [
					{ $: parentKeys.length === 1 ? parentKeys[0] : parentKeys },
					regexp.pattern.replace('^', ''),
				],
			};
		}

		if (value.$comment === 'ends_with' || value.$comment === 'not_ends_with') {
			return {
				$endswith: [
					{ $: parentKeys.length === 1 ? parentKeys[0] : parentKeys },
					regexp.pattern.replace(/\$(?=[^$]*$)/, ''),
				],
			};
		}
		if (regexp.flags === 'i') {
			return {
				$contains: [
					{
						$tolower: {
							$: parentKeys.length === 1 ? parentKeys[0] : parentKeys,
						},
					},
					regexp.pattern.toLowerCase(),
				],
			};
		}
		return wrapValue(parentKeys, { $contains: regexp.pattern });
	}

	const filters: any[] = [];
	for (const [$op, jsonSchemaProps] of Object.entries(comparisonOperatorMap)) {
		for (const jsonSchemaProp of jsonSchemaProps) {
			if (value[jsonSchemaProp] != null) {
				filters.push(wrapValue(parentKeys, { [$op]: value[jsonSchemaProp] }));
			}
		}
	}
	if (filters.length === 0) {
		throw new Error(
			`Cannot find a primitive filter able to handle ${JSON.stringify(
				value,
			)}, coming from keys: ${parentKeys}`,
		);
	}
	return maybePluralOp('$and', filters);
};

const wrapValue = (parentKeys: string[], value: any): PineFilterObject => {
	for (let i = parentKeys.length - 1; i >= 0; i--) {
		value = { [parentKeys[i]]: value };
	}
	return value;
};

const handleFilterArray = (
	parentKeys: string[],
	filterObj: JSONSchema,
): PineFilterObject => {
	const filters: PineFilterObject[] = [];
	if (filterObj.minItems != null && filterObj.minItems > 1) {
		const field = parentKeys[parentKeys.length - 1];
		const parent$alias = parentKeys[parentKeys.length - 2]
			? createAlias(parentKeys[parentKeys.length - 2])
			: null;
		filters.push({
			$ge: [
				wrapValue([...(parent$alias != null ? [parent$alias!] : []), field], {
					$count: {},
				}),
				filterObj.minItems,
			],
		});
	}
	// Post-MVP: maxItems
	if (filterObj.contains) {
		const parentKey = parentKeys[parentKeys.length - 1];
		const $alias = createAlias(parentKey);
		const nestedFilters = convertToPineClientFilter(
			[$alias],
			filterObj.contains as JSONSchema,
		);
		if (nestedFilters) {
			filters.push({
				[parentKey]: {
					$any: { $alias, $expr: nestedFilters },
				},
			});
		}
	}

	if (filters.length === 0) {
		filters.push({ 1: 1 });
	}
	return maybePluralOp('$and', filters);
};

const handleOperators = (
	parentKeys: string[],
	filter: JSONSchema,
): PineFilterObject | undefined => {
	if (!filter.anyOf && !filter.allOf) {
		throw new Error('Calling handleOperators without anyOf and allOf');
	}
	const operator = filter.anyOf || filter.oneOf ? '$or' : '$and';
	const filters = filter.anyOf || filter.oneOf || filter.allOf;
	return convertToPineClientFilter(
		parentKeys,
		maybePluralOp(operator, filters!),
	);
};

export const convertToPineClientFilter = (
	parentKeys: string[],
	filter: FilterMutation | FilterMutation[],
): PineFilterObject | undefined => {
	if (!filter) {
		return;
	}

	if (Array.isArray(filter)) {
		return filter.length > 1
			? { $and: filter.map((f) => convertToPineClientFilter(parentKeys, f)) }
			: convertToPineClientFilter(parentKeys, filter[0]);
	}

	// TODO: Check if possible to remove and improve
	if (filter.$or || filter.$and) {
		const operator = filter.$or ? '$or' : '$and';
		const filters = filter.$or || filter.$and;
		return {
			[operator]: filters?.map((f: any) =>
				convertToPineClientFilter(parentKeys, f),
			),
		};
	}

	if (filter.anyOf || filter.oneOf || filter.allOf) {
		return handleOperators(parentKeys, filter);
	}

	if (filter.contains != null || filter.items != null) {
		return handleFilterArray(parentKeys, filter);
	}

	if (filter.properties != null) {
		const propFilters: any = Object.entries(filter.properties).map(
			([key, value]: [string, JSONSchema]) => {
				return convertToPineClientFilter([...parentKeys, key], value);
			},
		);

		return maybePluralOp('$and', propFilters);
	}

	// Tiny optimization
	if (typeof filter.not !== 'boolean' && filter.not?.const != null) {
		return wrapValue(parentKeys, { $ne: filter.not.const });
	}
	if (filter.not != null && typeof filter.not !== 'boolean') {
		// !properties && !contains && type = string | number | boolean
		return { $not: convertToPineClientFilter(parentKeys, filter.not) };
	}

	return handlePrimitiveFilter(parentKeys, filter);
};

export const orderbyBuilder = <T>(
	sortInfo: TableSortOptions<T> | null,
	customSort: AutoUIContext<T>['customSort'],
) => {
	if (!sortInfo) {
		return null;
	}

	const { field, reverse, refScheme } = sortInfo;
	if (!field) {
		return null;
	}
	const direction = !reverse ? 'asc' : 'desc';
	const customOrderByKey = customSort?.[field as string];
	if (typeof customOrderByKey === 'string') {
		return [`${customOrderByKey} ${direction}`, `id ${direction}`];
	} else if (customOrderByKey != null && typeof customOrderByKey !== 'string') {
		throw new Error(
			`Field ${field as string} error: custom sort for this field must be of type string, ${typeof customOrderByKey} is not accepted.`,
		);
	}
	let fieldPath = field as string;
	if (refScheme) {
		fieldPath += `/${refScheme.replace(/\[(.*?)\]/g, '').replace(/\./g, '/')}`;
	}
	return [`${fieldPath} ${direction}`, `id ${direction}`];
};
