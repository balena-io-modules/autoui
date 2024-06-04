import * as React from 'react';
import filter from 'lodash/filter';
import qs from 'qs';
import { JSONSchema } from 'rendition';
import { History } from 'history';
import { Filters, FiltersProps } from '../../components/Filters';
import {
	FULL_TEXT_SLUG,
	FilterDescription,
	createFilter,
	createFullTextSearchFilter,
	parseFilterDescription,
} from '../../components/Filters/SchemaSieve';
import { isJSONSchema } from '../../AutoUI/schemaOps';

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

export const listFilterQuery = (filters: JSONSchema[]) => {
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
	return qs.stringify(queryStringFilters);
};

export const loadRulesFromUrl = (
	searchLocation: string,
	schema: JSONSchema,
	history: History,
): JSONSchema[] => {
	const { properties } = schema;
	if (!searchLocation || !properties) {
		return [];
	}
	const parsed = qs.parse(searchLocation, { ignoreQueryPrefix: true }) || {};
	const rules = filter(parsed, isQueryStringFilterRuleset)
		.map(
			// @ts-expect-error
			(rules: ListQueryStringFilterObject[]) => {
				if (!Array.isArray(rules)) {
					rules = [rules];
				}

				const signatures = rules.map(
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
					history.replace({ search: '' });
					return;
				}

				if (signatures[0].operator === FULL_TEXT_SLUG) {
					// TODO: listFilterQuery serializes the already escaped value and this
					// then re-escapes while de-serializing. Fix that loop, which can keep
					// escaping regex characters (eg \) indefinitely on each call/reload from the url.
					return createFullTextSearchFilter(schema, signatures[0].value);
				}
				return createFilter(schema, signatures);
			},
			// TODO: createFilter should handle this case as well.
		)
		.filter((f): f is JSONSchema => !!f);

	return rules;
};

interface PersistentFiltersProps extends FiltersProps {
	history: History;
}

export const PersistentFilters = ({
	schema,
	views,
	filters,
	onViewsChange,
	onFiltersChange,
	history,
	onSearch,
	...otherProps
}: PersistentFiltersProps &
	Required<Pick<PersistentFiltersProps, 'renderMode'>>) => {
	const locationSearch = history?.location?.search ?? '';
	const storedFilters = React.useMemo(() => {
		return loadRulesFromUrl(locationSearch, schema, history);
	}, [locationSearch, schema]);

	const onFiltersUpdate = React.useCallback(
		(filters: JSONSchema[]) => {
			const { pathname } = window.location;
			history?.replace?.({
				pathname,
				search: listFilterQuery(filters),
			});

			onFiltersChange?.(filters);
		},
		[window.location.pathname, onFiltersChange],
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
