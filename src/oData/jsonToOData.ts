import { JSONSchema, TableSortOptions } from 'rendition';
import { AutoUIContext } from '../AutoUI/schemaOps';

export type PineFilterObject = Record<string, any>;

interface FilterMutation extends JSONSchema {
	$and?: any[];
	$or?: any[];
}

const maybePluralOp = (
	$op: string,
	filters: any[],
): PineFilterObject | undefined => {
	const filtered = filters.filter((f) => f != null);
	if (filtered.length === 0) {
		// No valid filters remain
		return undefined;
	}
	if (filtered.length === 1) {
		// Only one filter remains, return it directly
		return filtered[0];
	}
	// Multiple filters remain, wrap them in the operator
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
		regexp?: { pattern?: string; flags?: string };
		formatMinimum?: string;
		formatMaximum?: string;
		formatExclusiveMaximum?: string;
		formatExclusiveMinimum?: string;
	},
): PineFilterObject | undefined => {
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
				const filter = wrapValue(parentKeys, {
					[$op]: value[jsonSchemaProp],
				});
				if (filter != null) {
					filters.push(filter);
				}
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

const wrapValue = (
	parentKeys: string[],
	value: any,
): PineFilterObject | undefined => {
	// TODO: Remove me as soon as we have a fix for OData
	if (typeof value === 'number' && value % 1 !== 0) {
		// Skip processing decimal numbers by returning undefined
		return undefined;
	}
	for (let i = parentKeys.length - 1; i >= 0; i--) {
		value = { [parentKeys[i]]: value };
	}
	return value;
};

const handleFilterArray = (
	parentKeys: string[],
	filterObj: JSONSchema,
): PineFilterObject | undefined => {
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
	const filtersArray = filter.anyOf || filter.oneOf || filter.allOf;
	const filters = filtersArray
		?.map((f) => convertToPineClientFilter(parentKeys, f as JSONSchema))
		.filter((f) => f != null);
	return maybePluralOp(operator, filters!);
};

export const convertToPineClientFilter = (
	parentKeys: string[],
	filter: FilterMutation | FilterMutation[],
): PineFilterObject | undefined => {
	if (!filter) {
		return;
	}

	if (Array.isArray(filter)) {
		const filters = filter
			.map((f) => convertToPineClientFilter(parentKeys, f))
			.filter((f) => f != null);
		return filters.length > 1 ? maybePluralOp('$and', filters) : filters[0];
	}

	if (filter.$or || filter.$and) {
		const operator = filter.$or ? '$or' : '$and';
		const filtersArray = filter.$or || filter.$and;
		const filters = filtersArray
			?.map((f: any) => convertToPineClientFilter(parentKeys, f))
			.filter((f) => f != null);
		return maybePluralOp(operator, filters!);
	}

	if (filter.anyOf || filter.oneOf || filter.allOf) {
		return handleOperators(parentKeys, filter);
	}

	if (filter.contains != null || filter.items != null) {
		return handleFilterArray(parentKeys, filter);
	}

	if (filter.properties != null) {
		const propFilters: any = Object.entries(filter.properties)
			.map(([key, value]: [string, JSONSchema]) => {
				return convertToPineClientFilter([...parentKeys, key], value);
			})
			.filter((filter) => filter != null);
		return propFilters.length ? maybePluralOp('$and', propFilters) : undefined;
	}

	if (typeof filter.not !== 'boolean' && filter.not?.const != null) {
		return wrapValue(parentKeys, { $ne: filter.not.const });
	}
	if (filter.not != null && typeof filter.not !== 'boolean') {
		const notFilter = convertToPineClientFilter(parentKeys, filter.not);
		return notFilter != null ? { $not: notFilter } : undefined;
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
			`Field ${
				field as string
			} error: custom sort for this field must be of type string, ${typeof customOrderByKey} is not accepted.`,
		);
	}
	let fieldPath = field as string;
	if (refScheme) {
		fieldPath += `/${refScheme.replace(/\[(.*?)\]/g, '').replace(/\./g, '/')}`;
	}
	return [`${fieldPath} ${direction}`, `id ${direction}`];
};
