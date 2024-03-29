import * as React from "react";
import filter from "lodash/filter";
import qs from "qs";
import {
  // Filters,
  FilterSignature,
  JSONSchema,
  SchemaSieve,
} from "rendition";
import { History } from "history";
import { Filters, FiltersProps } from "../../components/Filters";

export interface ListQueryStringFilterObject {
  t: FilterSignature["title"];
  n: FilterSignature["field"];
  o: FilterSignature["operator"];
  v: FilterSignature["value"];
  r: FilterSignature["refScheme"];
}

const isListQueryStringFilterRule = (
  rule: any
): rule is ListQueryStringFilterObject =>
  rule != null &&
  typeof rule === "object" &&
  // it has to have an associated field
  !!rule.n &&
  typeof rule.n === "string" &&
  // it should at least have an operator
  ((!!rule.o && typeof rule.o === "string") ||
    // or a value
    (rule.v != null && rule.v !== ""));

const isQueryStringFilterRuleset = (
  rule: any
): rule is ListQueryStringFilterObject[] =>
  Array.isArray(rule) &&
  !!rule?.length &&
  rule?.every(isListQueryStringFilterRule);

export const listFilterQuery = (filters: JSONSchema[]) => {
  const queryStringFilters = filters.map((filter) => {
    const signatures = SchemaSieve.getSignatures(filter);
    return signatures.map<ListQueryStringFilterObject>(
      ({ title, field, operator, value, refScheme }) => ({
        t: title,
        n: field,
        r: refScheme,
        o: operator,
        v: value,
      })
    );
  });
  return qs.stringify(queryStringFilters);
};

export const loadRulesFromUrl = (
  searchLocation: string,
  schema: JSONSchema
): JSONSchema[] => {
  if (!searchLocation) {
    return [];
  }
  const parsed = qs.parse(searchLocation, { ignoreQueryPrefix: true }) || {};
  const rules = filter(parsed, isQueryStringFilterRuleset).map(
    // @ts-expect-error
    (rules: ListQueryStringFilterObject[]) => {
      if (!Array.isArray(rules)) {
        rules = [rules];
      }

      const signatures = rules.map(
        ({ t, n, o, v, r }: ListQueryStringFilterObject) => ({
          title: t,
          field: n,
          refScheme: r,
          operator: o,
          value: v,
        })
      );
      // TODO: createFilter should handle this case as well.
      if (signatures[0].operator.slug === SchemaSieve.FULL_TEXT_SLUG) {
        // TODO: listFilterQuery serializes the already escaped value and this
        // then re-escapes while de-serializing. Fix that loop, which can keep
        // escaping regex characters (eg \) indefinitely on each call/reload from the url.
        return SchemaSieve.createFullTextSearchFilter(
          schema,
          signatures[0].value
        );
      }
      return SchemaSieve.createFilter(schema, signatures);
    }
  );

  return rules;
};

interface PersistentFiltersProps extends FiltersProps {
  viewsRestorationKey: string;
  history: History;
}

export const PersistentFilters = ({
  schema,
  views,
  filters,
  onViewsChange,
  onFiltersChange,
  viewsRestorationKey,
  history,
  onSearch,
  ...otherProps
}: PersistentFiltersProps &
  Required<Pick<PersistentFiltersProps, "renderMode">>) => {
  const locationSearch = history?.location?.search ?? "";
  const storedFilters = React.useMemo(() => {
    return loadRulesFromUrl(locationSearch, schema);
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
    [window.location.pathname, onFiltersChange]
  );

  // When the component mounts, filters from the page URL,
  // then communicate them back to the parent component.
  React.useEffect(() => {
    // Make sure we only call onFiltersUpdate on mount once, even if
    // we are rendering each part of the Filter component separately.
    const normalizedRenderMode = new Set(
      Array.isArray(otherProps.renderMode)
        ? otherProps.renderMode
        : [otherProps.renderMode]
    );
    if (normalizedRenderMode.has("all") || normalizedRenderMode.has("add")) {
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
