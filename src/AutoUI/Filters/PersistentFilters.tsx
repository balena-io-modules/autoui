import * as React from 'react';
import qs from 'qs';
import type { JSONSchema7 as JSONSchema } from 'json-schema';
import type { FiltersProps } from '../../components/Filters';
import { Filters } from '../../components/Filters';
import type { FilterDescription } from '../../components/Filters/SchemaSieve';
import {
	FULL_TEXT_SLUG,
	createFilter,
	createFullTextSearchFilter,
	parseFilterDescription,
} from '../../components/Filters/SchemaSieve';
import { isJSONSchema } from '../../AutoUI/schemaOps';
import { useAnalyticsContext } from '@balena/ui-shared-components';
import { NavigateFunction, useLocation } from 'react-router-dom';

export interface ListQueryStringFilterObject {
	n: string;
	o: string;
	v: string;
}

const isListQueryStringFilterRule = (
	rule: any,
): rule is ListQueryStringFilterObject =>
	rule != null &&
	typeof rule === 'object' &&
	// it has to have an associated field
	!!rule.n &&
	typeof rule.n === 'string' &&
	// it should at least have an operator
	((!!rule.o && typeof rule.o === 'string') ||
		// or a value
		(rule.v != null && rule.v !== ''));

const isQueryStringFilterRuleset = (
	rule: any,
): rule is ListQueryStringFilterObject[] =>
	Array.isArray(rule) &&
	!!rule?.length &&
	rule?.every(isListQueryStringFilterRule);

export function listFilterQuery(filters: JSONSchema[], stringify: true): string;
export function listFilterQuery(
	filters: JSONSchema[],
	stringify?: false,
): Array<ListQueryStringFilterObject[] | undefined>;
export function listFilterQuery(filters: JSONSchema[], stringify = true) {
	const queryStringFilters = filters.map((filter) => {
		const signatures =
			filter.title === FULL_TEXT_SLUG
				? [parseFilterDescription(filter)].filter(
						(f): f is FilterDescription => !!f,
				  )
				: filter.anyOf
						?.filter((f): f is JSONSchema => isJSONSchema(f))
						.map(
							(f) =>
								({
									...parseFilterDescription(f),
									operatorSlug: f.title,
								} as FilterDescription & { operatorSlug?: string }),
						)
						.filter((f) => !!f);

		return signatures?.map<ListQueryStringFilterObject>(
			({
				field,
				operator,
				operatorSlug,
				value,
			}: FilterDescription & { operatorSlug?: string }) => ({
				n: field,
				o: operatorSlug ?? operator,
				v: value,
			}),
		);
	});
	return stringify
		? qs.stringify(queryStringFilters, {
				strictNullHandling: true,
		  })
		: queryStringFilters;
}

export const loadRulesFromUrl = (
	searchLocation: string,
	schema: JSONSchema,
	navigate: NavigateFunction,
): JSONSchema[] => {
	const { properties } = schema;
	if (!searchLocation || !properties) {
		return [];
	}
	const parsed =
		qs.parse(searchLocation, {
			ignoreQueryPrefix: true,
			strictNullHandling: true,
			// The 'qs' library doesn't automatically parse values into their respective types (e.g., numbers, booleans).
			// It treats everything as a string by default, as explained in the documentation:
			// https://github.com/ljharb/qs#parsing-primitivescalar-values-numbers-booleans-null-etc
			// To handle this, we use a transformer to avoid scattering parsing logic across multiple filters.
			decoder: (
				str: string,
				defaultDecoder: qs.defaultDecoder,
				charset: string,
				type: 'key' | 'value',
			) => {
				if (type === 'value') {
					const num = Number(str);
					if (!isNaN(num)) {
						return num;
					}

					switch (str) {
						case 'true':
							return true;
						case 'false':
							return false;
						case 'null':
							return null;
						case 'undefined':
							return undefined;
					}
				}

				return defaultDecoder(str, defaultDecoder, charset);
			},
		}) || {};

	const rules = (Array.isArray(parsed) ? parsed : Object.values(parsed))
		.filter(isQueryStringFilterRuleset)
		.map(
			(r: ListQueryStringFilterObject[]) => {
				if (!Array.isArray(r)) {
					r = [r];
				}

				const signatures = r.map(
					({ n, o, v }: ListQueryStringFilterObject) => ({
						field: n,
						operator: o,
						value: v,
					}),
				);

				const isSignaturesInvalid = signatures.some((s) => {
					const fieldExist =
						Object.keys(properties).includes(s.field) ||
						s.operator === FULL_TEXT_SLUG;
					const operatorIsValid =
						s.operator != null &&
						typeof s.operator === 'string' &&
						s.operator?.split(' ').length === 1;
					return !fieldExist || !operatorIsValid;
				});

				// In case of invalid signatures, remove search params to avoid Errors.
				if (isSignaturesInvalid) {
					navigate({ search: '' }, { replace: true });
					return;
				}

				if (signatures[0].operator === FULL_TEXT_SLUG) {
					// TODO: listFilterQuery serializes the already escaped value and this
					// then re-escapes while de-serializing. Fix that loop, which can keep
					// escaping regex characters (eg \) indefinitely on each call/reload from the url.
					return createFullTextSearchFilter(
						schema,
						String(signatures[0].value),
					);
				}
				return createFilter(schema, signatures);
			},
			// TODO: createFilter should handle this case as well.
		)
		.filter((f): f is JSONSchema => !!f);

	return rules;
};

interface PersistentFiltersProps extends FiltersProps {
	navigate: NavigateFunction;
}

export const PersistentFilters = ({
	schema,
	views,
	filters,
	onViewsChange,
	onFiltersChange,
	navigate,
	onSearch,
	...otherProps
}: PersistentFiltersProps &
	Required<Pick<PersistentFiltersProps, 'renderMode'>>) => {
	const { state: analytics } = useAnalyticsContext();
	const { pathname, search } = useLocation();
	const storedFilters = React.useMemo(() => {
		return loadRulesFromUrl(search, schema, navigate);
	}, [search, schema, navigate]);

	const onFiltersUpdate = React.useCallback(
		(updatedFilters: JSONSchema[]) => {
			// Get filter query in two steps: first parse the filters, then stringify outside the function for performance
			const parsedFilters = listFilterQuery(updatedFilters, false);
			const filterQuery = qs.stringify(parsedFilters, {
				strictNullHandling: true,
			});

			navigate?.({
				pathname,
				search: filterQuery,
			});

			onFiltersChange?.(updatedFilters);

			if (filterQuery !== search.substring(1)) {
				analytics.webTracker?.track('Update table filters', {
					current_url: location.origin + location.pathname,
					// Need to reduce to a nested object instead of nested array for Amplitude to pick up on the property
					filters: Object.assign({}, parsedFilters),
				});
			}
		},
		[onFiltersChange, analytics.webTracker, navigate, search, pathname],
	);

	// When the component mounts, filters from the page URL,
	// then communicate them back to the parent component.
	React.useEffect(() => {
		// Make sure we only call onFiltersUpdate on mount once, even if
		// we are rendering each part of the Filter component separately.
		const normalizedRenderMode = new Set(
			Array.isArray(otherProps.renderMode)
				? otherProps.renderMode
				: [otherProps.renderMode],
		);

		if (normalizedRenderMode.has('all') || normalizedRenderMode.has('add')) {
			onFiltersUpdate?.(storedFilters);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
		<Filters
			schema={schema}
			filters={filters ?? storedFilters}
			views={views}
			onFiltersChange={onFiltersUpdate}
			onViewsChange={onViewsChange}
			{...otherProps}
			onSearch={onSearch}
		/>
	);
};
